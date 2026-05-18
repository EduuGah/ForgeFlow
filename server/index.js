import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import dns from 'node:dns'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import crypto from 'crypto'
import {
    AUTH_COOKIE_NAME,
    CSRF_COOKIE_NAME,
    clearAuthCookie,
    createCsrfToken,
    getTokenFromRequest,
    setAuthCookie,
    setCsrfCookie,
    usesCookieAuth,
} from './utils/authCookie.js'
import { csrfProtection } from './utils/csrfProtection.js'
import { securityHeaders } from './utils/securityHeaders.js'
import {
    authRateLimit,
    generalRateLimit,
    sensitiveRateLimit,
} from './utils/rateLimit.js'
import { requireRecentPassword } from './utils/sensitiveSecurity.js'
import { globalErrorHandler, notFoundHandler } from './utils/errorHandling.js'
import {
    normalizeActiveWorkoutPayload,
    normalizeBackupPayload,
    validateWorkoutHistoryPayload,
} from './utils/workoutValidation.js'


dotenv.config()

// Ajuda quando o Windows/rede dá erro com mongodb+srv
dns.setServers(['1.1.1.1', '8.8.8.8'])

const app = express()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ]

        if (!allowedMimeTypes.includes(file.mimetype)) {
            const error = new Error('Formato de imagem inválido. Use JPG, PNG ou WEBP.')
            error.statusCode = 400
            return callback(error)
        }

        callback(null, true)
    },
})

const {
    PORT = 3001,
    FRONTEND_URL,
    BACKEND_URL,
    MONGODB_URI,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    JWT_SECRET,
    SESSION_SECRET,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
} = process.env

function requiredEnv(name, value) {
    if (!value || value.includes('COLE_')) {
        throw new Error(`Variável ${name} não configurada no arquivo .env`)
    }
}

function getDateKeyFromDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function getUniqueWorkoutDaysFromHistory(history = []) {
    const daysMap = new Map()

    history.forEach((session) => {
        const rawDate = session.finishedAt || session.createdAt

        if (!rawDate) return

        const date = new Date(rawDate)

        if (Number.isNaN(date.getTime())) return

        const key = getDateKeyFromDate(date)

        daysMap.set(key, date)
    })

    return Array.from(daysMap.values()).sort((a, b) => b - a)
}

function getDaysDiff(dateA, dateB) {
    const start = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate())
    const end = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate())

    return Math.round((start - end) / 86400000)
}

function calculateCurrentStreak(history = []) {
    const workoutDays = getUniqueWorkoutDaysFromHistory(history)

    if (workoutDays.length === 0) return 0

    const today = new Date()
    const firstDay = workoutDays[0]
    const diffFromToday = getDaysDiff(today, firstDay)

    if (diffFromToday > 1) return 0

    let streak = 1
    let previousDay = firstDay

    for (let index = 1; index < workoutDays.length; index += 1) {
        const currentDay = workoutDays[index]
        const diff = getDaysDiff(previousDay, currentDay)

        if (diff === 1) {
            streak += 1
            previousDay = currentDay
        } else if (diff > 1) {
            break
        }
    }

    return streak
}

function calculateBestStreak(history = []) {
    const workoutDays = getUniqueWorkoutDaysFromHistory(history)
        .slice()
        .sort((a, b) => a - b)

    if (workoutDays.length === 0) return 0

    let bestStreak = 1
    let currentStreak = 1

    for (let index = 1; index < workoutDays.length; index += 1) {
        const previousDay = workoutDays[index - 1]
        const currentDay = workoutDays[index]
        const diff = getDaysDiff(currentDay, previousDay)

        if (diff === 1) {
            currentStreak += 1
        } else if (diff > 1) {
            currentStreak = 1
        }

        if (currentStreak > bestStreak) {
            bestStreak = currentStreak
        }
    }

    return bestStreak
}

function countWorkoutsInLastDays(history = [], days = 7) {
    const now = new Date()
    const limit = new Date()

    limit.setDate(now.getDate() - days)

    return history.filter((session) => {
        const rawDate = session.finishedAt || session.createdAt

        if (!rawDate) return false

        const date = new Date(rawDate)

        return date >= limit && date <= now
    }).length
}


requiredEnv('FRONTEND_URL', FRONTEND_URL)
requiredEnv('BACKEND_URL', BACKEND_URL)
requiredEnv('MONGODB_URI', MONGODB_URI)
requiredEnv('GOOGLE_CLIENT_ID', GOOGLE_CLIENT_ID)
requiredEnv('GOOGLE_CLIENT_SECRET', GOOGLE_CLIENT_SECRET)
requiredEnv('JWT_SECRET', JWT_SECRET)
requiredEnv('SESSION_SECRET', SESSION_SECRET)
requiredEnv('CLOUDINARY_CLOUD_NAME', CLOUDINARY_CLOUD_NAME)
requiredEnv('CLOUDINARY_API_KEY', CLOUDINARY_API_KEY)
requiredEnv('CLOUDINARY_API_SECRET', CLOUDINARY_API_SECRET)

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
})

const normalizedFrontendUrl = FRONTEND_URL.replace(/\/$/, '')
const normalizedBackendUrl = BACKEND_URL.replace(/\/$/, '')



app.use(securityHeaders)
app.use(generalRateLimit)
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

const allowedCorsOrigins = [
    normalizedFrontendUrl,
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
]
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ''))

function getAllowedCorsOrigin(origin, callback) {
    if (!origin) {
        return callback(null, true)
    }

    const normalizedOrigin = origin.replace(/\/$/, '')

    if (allowedCorsOrigins.includes(normalizedOrigin)) {
        return callback(null, true)
    }

    return callback(null, false)
}

app.use(
    cors({
        origin: getAllowedCorsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-CSRF-Token',
            'X-ForgeFlow-Password',
        ],
    })
)


app.use(csrfProtection)

app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60,
        },
    })
)

app.use(passport.initialize())
app.use(passport.session())

await mongoose.connect(MONGODB_URI)

console.log('MongoDB conectado com sucesso.')

const settingsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },

        data: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true,
    }
)

const AppSettings = mongoose.model('AppSettings', settingsSchema)

const userSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        name: {
            type: String,
            default: '',
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        passwordHash: {
            type: String,
            default: '',
        },

        avatarUrl: {
            type: String,
            default: '',
        },

        provider: {
            type: String,
            enum: ['google', 'credentials', 'both'],
            default: 'credentials',
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },

        blockedAt: {
            type: Date,
            default: null,
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },

        lastAdminActionAt: {
            type: Date,
            default: null,
        },

        resetPasswordTokenHash: {
            type: String,
            default: '',
        },

        resetPasswordExpiresAt: {
            type: Date,
            default: null,
        },

        profile: {
            gender: {
                type: String,
                default: '',
            },

            birthDate: {
                type: String,
                default: '',
            },

            height: {
                type: Number,
                default: null,
            },

            currentWeight: {
                type: Number,
                default: null,
            },

            mainGoal: {
                type: String,
                default: '',
            },

            trainingLevel: {
                type: String,
                default: '',
            },

            trainingFrequency: {
                type: Number,
                default: null,
            },

            preferredUnit: {
                type: String,
                default: 'kg',
            },

            preferredSplit: {
                type: String,
                default: '',
            },

            notes: {
                type: String,
                default: '',
            },
        },

        profileCompleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

const exerciseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
        },

        originalName: String,
        muscleGroup: String,
        targetMuscle: String,
        secondaryMuscles: [String],
        equipment: String,
        difficulty: String,
        movementPattern: String,
        description: String,

        mediaUrl: String,
        gifUrl: String,
        uploadedFileName: String,

        media: {
            gif: String,
            image: String,
        },

        instructions: [String],
        execution: [String],
        tips: [String],
        variations: [String],
        commonMistakes: [String],

        isFavorite: {
            type: Boolean,
            default: false,
        },

        source: {
            type: String,
            default: 'User',
        },
    },
    {
        timestamps: true,
    }
)

const workoutSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: '',
        },

        folderName: {
            type: String,
            default: '',
        },

        folderId: {
            type: String,
            default: null,
        },

        color: {
            type: String,
            default: '',
        },

        isFavorite: {
            type: Boolean,
            default: false,
        },

        exercises: {
            type: Array,
            default: [],
        },

        estimatedDuration: {
            type: Number,
            default: null,
        },

        lastStartedAt: {
            type: Date,
            default: null,
        },

        lastFinishedAt: {
            type: Date,
            default: null,
        },

        totalTimesStarted: {
            type: Number,
            default: 0,
        },

        totalTimesFinished: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
)

const DEFAULT_WORKOUT_TEMPLATES = [
    {
        name: 'Push - Peito, Ombros e Tríceps',
        description: 'Modelo base para treino de empurrar, focado em peito, ombros e tríceps.',
        category: 'Push Pull Legs',
        goal: 'Hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 60,
        source: 'ForgeFlow',
        exercises: [],
    },
    {
        name: 'Pull - Costas e Bíceps',
        description: 'Modelo base para treino de puxar, focado em costas, bíceps e posteriores de ombro.',
        category: 'Push Pull Legs',
        goal: 'Hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 60,
        source: 'ForgeFlow',
        exercises: [],
    },
    {
        name: 'Legs - Pernas completo',
        description: 'Modelo base para treino de pernas, com foco em quadríceps, posterior, glúteos e panturrilhas.',
        category: 'Push Pull Legs',
        goal: 'Hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 70,
        source: 'ForgeFlow',
        exercises: [],
    },
    {
        name: 'Upper - Superiores',
        description: 'Modelo de treino para membros superiores em uma divisão Upper/Lower.',
        category: 'Upper Lower',
        goal: 'Força e hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 65,
        source: 'ForgeFlow',
        exercises: [],
    },
    {
        name: 'Lower - Inferiores',
        description: 'Modelo de treino para membros inferiores em uma divisão Upper/Lower.',
        category: 'Upper Lower',
        goal: 'Força e hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 65,
        source: 'ForgeFlow',
        exercises: [],
    },
    {
        name: 'Full Body - Corpo inteiro',
        description: 'Modelo simples para treinar o corpo inteiro em uma única sessão.',
        category: 'Full Body',
        goal: 'Condicionamento geral',
        difficulty: 'Iniciante',
        estimatedDuration: 50,
        source: 'ForgeFlow',
        exercises: [],
    },
]


function normalizeTemplateGroupName(group) {
    if (!group) return ''

    const normalized = String(group).trim().toLowerCase()

    const aliases = {
        peito: 'peito',
        peitoral: 'peito',
        chest: 'peito',

        costas: 'costas',
        dorsal: 'costas',
        back: 'costas',

        ombro: 'ombros',
        ombros: 'ombros',
        deltoide: 'ombros',
        deltoides: 'ombros',
        shoulder: 'ombros',
        shoulders: 'ombros',

        biceps: 'bíceps',
        bíceps: 'bíceps',

        triceps: 'tríceps',
        tríceps: 'tríceps',

        quadriceps: 'quadríceps',
        quadríceps: 'quadríceps',
        pernas: 'quadríceps',
        quads: 'quadríceps',

        posterior: 'posterior de coxa',
        posteriores: 'posterior de coxa',
        hamstrings: 'posterior de coxa',
        'posterior de coxa': 'posterior de coxa',

        gluteos: 'glúteos',
        glúteos: 'glúteos',
        glutes: 'glúteos',

        panturrilha: 'panturrilhas',
        panturrilhas: 'panturrilhas',
        calves: 'panturrilhas',

        abdomen: 'abdômen',
        abdômen: 'abdômen',
        abs: 'abdômen',
        core: 'abdômen',

        lombar: 'lombar',
        cardio: 'cardio',
        'corpo inteiro': 'corpo inteiro',
        fullbody: 'corpo inteiro',
        'full body': 'corpo inteiro',
    }

    return aliases[normalized] || normalized
}

function getExerciseGroupForTemplate(exercise) {
    return normalizeTemplateGroupName(
        exercise.muscleGroup ||
        exercise.normalizedGroup ||
        exercise.group ||
        exercise.targetMuscle
    )
}

function createTemplateExerciseItem(exercise, setDescriptions = ['12 Rep', '10-12 Rep', '8-10 Rep']) {
    const plainExercise = typeof exercise.toObject === 'function'
        ? exercise.toObject()
        : exercise

    return {
        id: new mongoose.Types.ObjectId().toString(),
        exercise: {
            ...plainExercise,
            id: exercise._id?.toString() || exercise.id,
        },
        sets: setDescriptions.map((description) => ({
            id: new mongoose.Types.ObjectId().toString(),
            description,
            type: 'working',
        })),
        note: '',
        restTimer: 'Desligado',
    }
}

function pickExercisesByGroups(exercises = [], groups = [], limit = 6) {
    const normalizedGroups = groups.map(normalizeTemplateGroupName)

    const selected = []
    const usedIds = new Set()

    for (const group of normalizedGroups) {
        const found = exercises.find((exercise) => {
            const exerciseId = exercise._id?.toString() || exercise.id

            return (
                !usedIds.has(exerciseId) &&
                getExerciseGroupForTemplate(exercise) === group
            )
        })

        if (found) {
            const exerciseId = found._id?.toString() || found.id

            usedIds.add(exerciseId)
            selected.push(found)
        }
    }

    if (selected.length >= limit) {
        return selected.slice(0, limit)
    }

    for (const exercise of exercises) {
        const exerciseId = exercise._id?.toString() || exercise.id

        if (usedIds.has(exerciseId)) continue

        const group = getExerciseGroupForTemplate(exercise)

        if (normalizedGroups.includes(group)) {
            usedIds.add(exerciseId)
            selected.push(exercise)
        }

        if (selected.length >= limit) break
    }

    return selected
}

function buildDefaultTemplateExercises(templateName, exercises = []) {
    const lowerName = String(templateName).toLowerCase()

    if (lowerName.includes('push')) {
        return pickExercisesByGroups(
            exercises,
            ['Peito', 'Peito', 'Ombros', 'Ombros', 'Tríceps', 'Tríceps'],
            6
        ).map((exercise) =>
            createTemplateExerciseItem(exercise, ['12 Rep', '10-12 Rep', '8-10 Rep'])
        )
    }

    if (lowerName.includes('pull')) {
        return pickExercisesByGroups(
            exercises,
            ['Costas', 'Costas', 'Costas', 'Bíceps', 'Bíceps', 'Ombros'],
            6
        ).map((exercise) =>
            createTemplateExerciseItem(exercise, ['12 Rep', '10-12 Rep', '8-10 Rep'])
        )
    }

    if (lowerName.includes('legs')) {
        return pickExercisesByGroups(
            exercises,
            ['Quadríceps', 'Quadríceps', 'Posterior de coxa', 'Glúteos', 'Panturrilhas'],
            5
        ).map((exercise) =>
            createTemplateExerciseItem(exercise, ['12 Rep', '10-12 Rep', '8-10 Rep'])
        )
    }

    if (lowerName.includes('upper')) {
        return pickExercisesByGroups(
            exercises,
            ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'],
            5
        ).map((exercise) =>
            createTemplateExerciseItem(exercise, ['12 Rep', '10-12 Rep', '8-10 Rep'])
        )
    }

    if (lowerName.includes('lower')) {
        return pickExercisesByGroups(
            exercises,
            ['Quadríceps', 'Posterior de coxa', 'Glúteos', 'Panturrilhas', 'Abdômen'],
            5
        ).map((exercise) =>
            createTemplateExerciseItem(exercise, ['12 Rep', '10-12 Rep', '8-10 Rep'])
        )
    }

    if (lowerName.includes('full body') || lowerName.includes('corpo inteiro')) {
        return pickExercisesByGroups(
            exercises,
            ['Peito', 'Costas', 'Quadríceps', 'Ombros', 'Abdômen'],
            5
        ).map((exercise) =>
            createTemplateExerciseItem(exercise, ['12 Rep', '10 Rep', '8 Rep'])
        )
    }

    return []
}

const workoutTemplateSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: '',
        },

        category: {
            type: String,
            default: 'Personalizado',
        },

        goal: {
            type: String,
            default: '',
        },

        difficulty: {
            type: String,
            default: '',
        },

        estimatedDuration: {
            type: Number,
            default: null,
        },

        exercises: {
            type: Array,
            default: [],
        },

        isFavorite: {
            type: Boolean,
            default: false,
        },

        source: {
            type: String,
            default: 'User',
        },
    },
    {
        timestamps: true,
    }
)

const bodyWeightSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        weight: {
            type: Number,
            required: true,
        },

        date: {
            type: Date,
            default: Date.now,
            index: true,
        },

        note: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
)


const progressPhotoSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        imageUrl: {
            type: String,
            required: true,
        },

        publicId: {
            type: String,
            required: true,
        },

        date: {
            type: Date,
            default: Date.now,
            index: true,
        },

        angle: {
            type: String,
            enum: ['front', 'side', 'back', 'other'],
            default: 'front',
        },

        weight: {
            type: Number,
            default: null,
        },

        note: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
)


const goalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: '',
        },

        type: {
            type: String,
            enum: [
                'weekly_workouts',
                'monthly_workouts',
                'body_weight',
                'exercise_pr_weight',
                'monthly_volume',
                'progress_photos',
                'custom',
            ],
            default: 'custom',
            index: true,
        },

        targetValue: {
            type: Number,
            required: true,
        },

        currentValue: {
            type: Number,
            default: 0,
        },

        baselineValue: {
            type: Number,
            default: 0,
        },

        baselineAt: {
            type: Date,
            default: null,
        },

        baselinePeriodKey: {
            type: String,
            default: '',
        },

        unit: {
            type: String,
            default: '',
        },

        exerciseName: {
            type: String,
            default: '',
        },

        direction: {
            type: String,
            enum: ['increase', 'decrease', 'reach'],
            default: 'increase',
        },

        period: {
            type: String,
            enum: ['none', 'weekly', 'monthly'],
            default: 'none',
        },

        deadline: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: ['active', 'completed', 'archived'],
            default: 'active',
            index: true,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        color: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
)


const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            default: '',
        },

        type: {
            type: String,
            enum: [
                'info',
                'success',
                'warning',
                'danger',
                'goal',
                'workout',
                'weight',
                'photo',
                'recovery',
            ],
            default: 'info',
            index: true,
        },

        status: {
            type: String,
            enum: ['unread', 'read', 'archived'],
            default: 'unread',
            index: true,
        },

        actionUrl: {
            type: String,
            default: '',
        },

        source: {
            type: String,
            default: 'system',
        },

        dedupeKey: {
            type: String,
            default: '',
            index: true,
        },

        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
)

const workoutHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        workoutId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workout',
            default: null,
        },

        workoutName: {
            type: String,
            required: true,
            trim: true,
        },

        exercises: {
            type: Array,
            default: [],
        },

        durationSeconds: {
            type: Number,
            default: 0,
        },

        startedAt: {
            type: Date,
            default: null,
        },

        finishedAt: {
            type: Date,
            default: Date.now,
        },

        totalVolume: {
            type: Number,
            default: 0,
        },

        totalSets: {
            type: Number,
            default: 0,
        },

        totalReps: {
            type: Number,
            default: 0,
        },

        prs: {
            type: Array,
            default: [],
        },

        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
)


const activeWorkoutSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },

        session: {
            type: Object,
            required: true,
            default: {},
        },
    },
    {
        timestamps: true,
    }
)


const loginEventSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        email: {
            type: String,
            default: '',
            index: true,
        },

        provider: {
            type: String,
            enum: ['credentials', 'google', 'unknown'],
            default: 'unknown',
            index: true,
        },

        ip: {
            type: String,
            default: '',
        },

        userAgent: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
)

const adminLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },

        action: {
            type: String,
            required: true,
            index: true,
        },

        message: {
            type: String,
            default: '',
        },

        metadata: {
            type: Object,
            default: {},
        },

        ip: {
            type: String,
            default: '',
        },

        userAgent: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
)

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)
const Workout = mongoose.model('Workout', workoutSchema)
const WorkoutTemplate = mongoose.model('WorkoutTemplate', workoutTemplateSchema)
const WorkoutHistory = mongoose.model('WorkoutHistory', workoutHistorySchema)
const BodyWeight = mongoose.model('BodyWeight', bodyWeightSchema)
const ProgressPhoto = mongoose.model('ProgressPhoto', progressPhotoSchema)
const Goal = mongoose.model('Goal', goalSchema)
const Notification = mongoose.model('Notification', notificationSchema)
const ActiveWorkoutSession = mongoose.model('ActiveWorkoutSession', activeWorkoutSessionSchema)
const AdminLog = mongoose.model('AdminLog', adminLogSchema)
const LoginEvent = mongoose.model('LoginEvent', loginEventSchema)



async function ensureMongoIndexes() {
    try {
        await Promise.allSettled([
            WorkoutHistory.collection.createIndex({ userId: 1, finishedAt: -1 }),
            WorkoutHistory.collection.createIndex({ finishedAt: -1 }),
            WorkoutHistory.collection.createIndex({ userId: 1, totalVolume: -1 }),
            LoginEvent.collection.createIndex({ createdAt: -1 }),
            LoginEvent.collection.createIndex({ userId: 1, createdAt: -1 }),
            Workout.collection.createIndex({ userId: 1, updatedAt: -1 }),
            ActiveWorkoutSession.collection.createIndex({ userId: 1, updatedAt: -1 }),
            User.collection.createIndex({ role: 1, createdAt: -1 }),
            User.collection.createIndex({ isBlocked: 1 }),
            User.collection.createIndex({ lastLoginAt: -1 }),
        ])
    } catch (error) {
        console.warn('[MongoIndexes] Falha ao garantir índices:', error)
    }
}

ensureMongoIndexes()


function createPasswordResetToken() {
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    return {
        rawToken,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    }
}

function buildResetPasswordUrl(rawToken) {
    return `${normalizedFrontendUrl}/reset-password/${rawToken}`
}

async function sendPasswordResetEmail(to, resetUrl) {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.MAIL_FROM || 'ForgeFlow <onboarding@resend.dev>'

    if (!apiKey) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[ForgeFlow] Link de reset gerado sem provedor de e-mail:', resetUrl)
        }

        return {
            sent: false,
            reason: 'email_provider_not_configured',
        }
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to,
            subject: 'Redefinir senha do ForgeFlow',
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
                    <h2>Redefinir senha do ForgeFlow</h2>
                    <p>Recebemos uma solicitação para redefinir sua senha.</p>
                    <p>Este link expira em 30 minutos:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p>Se você não pediu isso, ignore este e-mail.</p>
                </div>
            `,
        }),
    })

    if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        return {
            sent: false,
            reason: 'email_send_failed',
            error: body,
        }
    }

    return {
        sent: true,
        reason: 'sent',
    }
}


function createToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || 'user',
        },
        JWT_SECRET,
        {
            expiresIn: '1d',
        }
    )
}

function buildUserResponse(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        role: user.role || 'user',
        isBlocked: Boolean(user.isBlocked),
        lastLoginAt: user.lastLoginAt,
        hasPassword: Boolean(user.passwordHash),
        profile: user.profile,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}

function buildProfileCompletion(profile) {
    return Boolean(
        profile?.height &&
        profile?.currentWeight &&
        profile?.mainGoal &&
        profile?.trainingLevel
    )
}

function parseDecimal(value) {
    if (value === null || value === undefined || value === '') return null

    const normalized = String(value)
        .trim()
        .replace(',', '.')

    const number = Number(normalized)

    return Number.isFinite(number) ? number : null
}


function uploadBufferToCloudinary(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    reject(error)
                    return
                }

                resolve(result)
            }
        )

        stream.end(buffer)
    })
}

function cleanMongoFields(item = {}) {
    const {
        _id,
        id,
        userId,
        createdAt,
        updatedAt,
        __v,
        ...rest
    } = item

    return rest
}

function cleanArrayForImport(items = [], userId) {
    if (!Array.isArray(items)) return []

    return items.map((item) => ({
        ...cleanMongoFields(item),
        userId,
    }))
}

function escapeCsv(value) {
    if (value === null || value === undefined) return ''

    const text = String(value).replace(/"/g, '""')

    return `"${text}"`
}

function getHistoryRows(history = []) {
    const rows = []

    history.forEach((session) => {
        const exercises = Array.isArray(session.exercises)
            ? session.exercises
            : []

        exercises.forEach((item) => {
            const exercise = item.exercise || {}
            const sets = Array.isArray(item.sets) ? item.sets : []

            sets.forEach((set, index) => {
                const weight = Number(set.weight || set.load || 0)
                const reps = Number(set.reps || 0)
                const volume = weight * reps

                rows.push({
                    date: session.finishedAt || session.createdAt,
                    workoutName: session.workoutName,
                    exerciseName: exercise.name || '',
                    muscleGroup: exercise.muscleGroup || '',
                    equipment: exercise.equipment || '',
                    setNumber: index + 1,
                    setType: set.type || 'working',
                    completed: Boolean(set.completed || set.isCompleted || set.done),
                    weight,
                    reps,
                    volume,
                    durationSeconds: session.durationSeconds || 0,
                    notes: session.notes || '',
                })
            })
        })
    })

    return rows
}

async function authMiddleware(req, res, next) {
    const token = getTokenFromRequest(req)

    if (!token) {
        return res.status(401).json({
            message: 'Você precisa estar logado.',
        })
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET)

        if (req.user?.userId) {
            const currentUser = await User.findById(req.user.userId)
                .select('role isBlocked')
                .lean()

            if (!currentUser) {
                return res.status(401).json({
                    message: 'Usuário não encontrado.',
                })
            }

            if (currentUser.isBlocked) {
                return res.status(403).json({
                    message: 'Esta conta está bloqueada.',
                })
            }

            req.user.role = currentUser.role || req.user.role || 'user'
        }

        next()
    } catch {
        return res.status(401).json({
            message: 'Token inválido ou expirado.',
        })
    }
}


// ==============================
// Admin avançado
// ==============================

function sanitizeUser(user) {
    if (!user) return null

    return {
        id: String(user._id || user.id),
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        provider: user.provider || 'credentials',
        profileCompleted: Boolean(user.profileCompleted),
        isBlocked: Boolean(user.isBlocked),
        blockedAt: user.blockedAt || null,
        lastLoginAt: user.lastLoginAt || null,
        lastAdminActionAt: user.lastAdminActionAt || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}

function sanitizeAdminLog(log) {
    if (!log) return null

    return {
        id: String(log._id || log.id),
        adminId: log.adminId ? String(log.adminId) : '',
        targetUserId: log.targetUserId ? String(log.targetUserId) : '',
        action: log.action || '',
        message: log.message || '',
        metadata: log.metadata || {},
        ip: log.ip || '',
        userAgent: log.userAgent || '',
        createdAt: log.createdAt,
    }
}

async function writeLoginEvent(req, user, provider = 'unknown') {
    try {
        if (!user?._id) return

        await LoginEvent.create({
            userId: user._id,
            email: user.email || '',
            provider,
            ip: req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '',
            userAgent: req?.headers?.['user-agent'] || '',
        })
    } catch (error) {
        console.error('[LoginEvent] Falha ao registrar acesso:', error)
    }
}

async function writeAdminLog(req, { targetUserId = null, action, message = '', metadata = {} }) {
    try {
        await AdminLog.create({
            adminId: req.user.userId,
            targetUserId,
            action,
            message,
            metadata,
            ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
            userAgent: req.headers['user-agent'] || '',
        })

        if (targetUserId) {
            await User.findByIdAndUpdate(targetUserId, {
                lastAdminActionAt: new Date(),
            })
        }
    } catch (error) {
        console.error('[AdminLog] Falha ao registrar log:', error)
    }
}

async function requireAdmin(req, res, next) {
    try {
        let role = req.user?.role
        let isBlocked = req.user?.isBlocked

        if (req.user?.userId) {
            const currentUser = await User.findById(req.user.userId)
                .select('role isBlocked')
                .lean()

            role = currentUser?.role || role || 'user'
            isBlocked = Boolean(currentUser?.isBlocked)

            req.user.role = role
            req.user.isBlocked = isBlocked
        }

        if (isBlocked) {
            return res.status(403).json({
                message: 'Esta conta está bloqueada.',
            })
        }

        if (role === 'admin') {
            return next()
        }

        return res.status(403).json({
            message: 'Acesso restrito a administradores.',
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao validar permissão de admin.',
        })
    }
}

app.get('/admin/users', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const {
            q = '',
            role = 'all',
            status = 'all',
            provider = 'all',
            limit = 25,
            page = 1,
        } = req.query

        const filter = {}
        const search = String(q || '').trim()

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ]
        }

        if (['admin', 'user'].includes(role)) {
            filter.role = role
        }

        if (status === 'blocked') {
            filter.isBlocked = true
        }

        if (status === 'active') {
            filter.isBlocked = { $ne: true }
        }

        if (['google', 'credentials', 'both'].includes(provider)) {
            filter.provider = provider
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 25, 5), 50)
        const safePage = Math.max(Number(page) || 1, 1)
        const skip = (safePage - 1) * safeLimit

        const [total, users] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .select('name email role provider profileCompleted isBlocked blockedAt lastLoginAt lastAdminActionAt createdAt updatedAt')
                .lean(),
        ])

        const totalPages = Math.max(Math.ceil(total / safeLimit), 1)

        return res.json({
            users: users.map(sanitizeUser),
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages,
                hasNextPage: safePage < totalPages,
                hasPreviousPage: safePage > 1,
            },
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao listar usuários.',
        })
    }
})

app.get('/admin/users/:userId', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params

        const user = await User.findById(userId)
            .select('name email role provider profileCompleted isBlocked blockedAt lastLoginAt lastAdminActionAt createdAt updatedAt profile')
            .lean()

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado.',
            })
        }

        const [activeWorkout, workoutCount, historyCount, recentHistory, recentLogs] = await Promise.all([
            ActiveWorkoutSession.findOne({ userId }).lean(),
            Workout.countDocuments({ userId }),
            WorkoutHistory.countDocuments({ userId }),
            WorkoutHistory.find({ userId })
                .sort({ finishedAt: -1, createdAt: -1 })
                .limit(5)
                .select('workoutName durationSeconds totalVolume totalSets totalReps prs startedAt finishedAt createdAt exercises')
                .lean(),
            AdminLog.find({ targetUserId: userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ])

        const historySummary = recentHistory.map((item) => ({
            id: String(item._id || item.id),
            workoutName: item.workoutName,
            durationSeconds: item.durationSeconds || 0,
            totalVolume: item.totalVolume || 0,
            totalSets: item.totalSets || 0,
            totalReps: item.totalReps || 0,
            prsCount: Array.isArray(item.prs) ? item.prs.length : 0,
            exercisesCount: Array.isArray(item.exercises) ? item.exercises.length : 0,
            startedAt: item.startedAt,
            finishedAt: item.finishedAt,
            createdAt: item.createdAt,
        }))

        return res.json({
            user: {
                ...sanitizeUser(user),
                profile: user.profile || {},
            },
            activeWorkout: activeWorkout?.session || null,
            activeWorkoutUpdatedAt: activeWorkout?.updatedAt || null,
            historySummary,
            logs: recentLogs.map(sanitizeAdminLog),
            counts: {
                workouts: workoutCount,
                history: historyCount,
            },
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao carregar usuário.',
        })
    }
})

app.patch('/admin/users/:userId/role', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params
        const nextRole = String(req.body?.role || '').trim()

        if (!['user', 'admin'].includes(nextRole)) {
            return res.status(400).json({
                message: 'Role inválida.',
            })
        }

        if (String(req.user.userId) === String(userId) && nextRole !== 'admin') {
            return res.status(400).json({
                message: 'Você não pode remover seu próprio acesso admin.',
            })
        }

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado.',
            })
        }

        const previousRole = user.role || 'user'
        user.role = nextRole
        await user.save()

        await writeAdminLog(req, {
            targetUserId: userId,
            action: 'user_role_updated',
            message: `Role alterada de ${previousRole} para ${nextRole}.`,
            metadata: {
                previousRole,
                nextRole,
            },
        })

        return res.json({
            user: sanitizeUser(user),
            message: 'Permissão atualizada.',
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao atualizar permissão.',
        })
    }
})

app.patch('/admin/users/:userId/block', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params
        const blocked = Boolean(req.body?.blocked)

        if (String(req.user.userId) === String(userId) && blocked) {
            return res.status(400).json({
                message: 'Você não pode bloquear sua própria conta.',
            })
        }

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado.',
            })
        }

        user.isBlocked = blocked
        user.blockedAt = blocked ? new Date() : null
        await user.save()

        await writeAdminLog(req, {
            targetUserId: userId,
            action: blocked ? 'user_blocked' : 'user_unblocked',
            message: blocked ? 'Usuário bloqueado.' : 'Usuário desbloqueado.',
            metadata: {
                blocked,
            },
        })

        return res.json({
            user: sanitizeUser(user),
            message: blocked ? 'Usuário bloqueado.' : 'Usuário desbloqueado.',
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao alterar bloqueio do usuário.',
        })
    }
})

app.post('/admin/users/:userId/reset-password', authMiddleware, requireAdmin, sensitiveRateLimit, async (req, res) => {
    try {
        const { userId } = req.params
        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado.',
            })
        }

        const resetToken = createPasswordResetToken()
        user.resetPasswordTokenHash = resetToken.tokenHash
        user.resetPasswordExpiresAt = resetToken.expiresAt
        await user.save()

        const resetUrl = buildResetPasswordUrl(resetToken.rawToken)
        const emailResult = await sendPasswordResetEmail(user.email, resetUrl)

        await writeAdminLog(req, {
            targetUserId: userId,
            action: 'password_reset_link_created',
            message: 'Link temporário de redefinição de senha gerado pelo admin.',
            metadata: {
                emailSent: emailResult.sent,
                emailReason: emailResult.reason,
            },
        })

        return res.json({
            message: emailResult.sent
                ? 'Link de redefinição enviado ao usuário.'
                : 'Link de redefinição gerado. Configure o provedor de e-mail para envio automático.',
            emailSent: emailResult.sent,
            emailReason: emailResult.reason,
            ...(process.env.NODE_ENV !== 'production' || req.body?.debugReturnLink
                ? { resetUrl }
                : {}),
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao gerar link de redefinição de senha.',
        })
    }
})

app.delete('/admin/users/:userId/active-workout', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params

        await ActiveWorkoutSession.findOneAndDelete({ userId })

        await writeAdminLog(req, {
            targetUserId: userId,
            action: 'active_workout_cleared',
            message: 'Treino ativo travado removido pelo admin.',
        })

        return res.json({
            message: 'Treino ativo removido, se existia.',
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao limpar treino ativo do usuário.',
        })
    }
})


function getDateOnly(value) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return null
    }

    return date.toISOString().slice(0, 10)
}

function createEmptyDateMap(days = 14) {
    const map = new Map()
    const now = new Date()

    for (let index = days - 1; index >= 0; index -= 1) {
        const date = new Date(now)
        date.setDate(now.getDate() - index)

        map.set(date.toISOString().slice(0, 10), 0)
    }

    return map
}

function mapAggregationToSeries(aggregation = [], days = 14) {
    const map = createEmptyDateMap(days)

    aggregation.forEach((item) => {
        if (!item?._id) return
        map.set(item._id, item.count || 0)
    })

    return Array.from(map.entries()).map(([date, count]) => ({
        date,
        count,
    }))
}


app.delete('/admin/analytics/orphan-history', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const userIds = await User.distinct('_id')
        const result = await WorkoutHistory.deleteMany({
            userId: { $nin: userIds },
        })

        await writeAdminLog(req, {
            action: 'orphan_history_deleted',
            message: `Históricos órfãos removidos: ${result.deletedCount || 0}.`,
            metadata: {
                deletedCount: result.deletedCount || 0,
            },
        })

        return res.json({
            message: 'Históricos órfãos removidos.',
            deletedCount: result.deletedCount || 0,
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao remover históricos órfãos.',
        })
    }
})



app.get('/admin/rankings', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 365)
        const since = new Date()
        since.setDate(since.getDate() - days + 1)
        since.setHours(0, 0, 0, 0)

        const staleActiveSince = new Date(Date.now() - 1000 * 60 * 60 * 24)
        const inactiveSince = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)

        const [
            mostWorkouts,
            highestVolume,
            mostSets,
            mostReps,
            mostLogins,
            usersWithoutWorkout,
            inactiveUsers,
            activeWorkouts,
            staleActiveWorkouts,
        ] = await Promise.all([
            WorkoutHistory.aggregate([
                { $match: { finishedAt: { $gte: since } } },
                {
                    $group: {
                        _id: '$userId',
                        value: { $sum: 1 },
                        totalVolume: { $sum: { $ifNull: ['$totalVolume', 0] } },
                        totalSets: { $sum: { $ifNull: ['$totalSets', 0] } },
                    },
                },
                { $sort: { value: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
                {
                    $project: {
                        userId: '$_id',
                        value: 1,
                        totalVolume: 1,
                        totalSets: 1,
                        name: '$user.name',
                        email: '$user.email',
                        lastLoginAt: '$user.lastLoginAt',
                    },
                },
            ]),
            WorkoutHistory.aggregate([
                { $match: { finishedAt: { $gte: since } } },
                {
                    $group: {
                        _id: '$userId',
                        value: { $sum: { $ifNull: ['$totalVolume', 0] } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { value: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
                {
                    $project: {
                        userId: '$_id',
                        value: 1,
                        count: 1,
                        name: '$user.name',
                        email: '$user.email',
                        lastLoginAt: '$user.lastLoginAt',
                    },
                },
            ]),
            WorkoutHistory.aggregate([
                { $match: { finishedAt: { $gte: since } } },
                {
                    $group: {
                        _id: '$userId',
                        value: { $sum: { $ifNull: ['$totalSets', 0] } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { value: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
                {
                    $project: {
                        userId: '$_id',
                        value: 1,
                        count: 1,
                        name: '$user.name',
                        email: '$user.email',
                        lastLoginAt: '$user.lastLoginAt',
                    },
                },
            ]),
            WorkoutHistory.aggregate([
                { $match: { finishedAt: { $gte: since } } },
                {
                    $group: {
                        _id: '$userId',
                        value: { $sum: { $ifNull: ['$totalReps', 0] } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { value: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
                {
                    $project: {
                        userId: '$_id',
                        value: 1,
                        count: 1,
                        name: '$user.name',
                        email: '$user.email',
                        lastLoginAt: '$user.lastLoginAt',
                    },
                },
            ]),
            LoginEvent.aggregate([
                { $match: { createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: '$userId',
                        value: { $sum: 1 },
                        email: { $last: '$email' },
                        lastAccessAt: { $max: '$createdAt' },
                    },
                },
                { $sort: { value: -1, lastAccessAt: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        userId: '$_id',
                        value: 1,
                        name: '$user.name',
                        email: { $ifNull: ['$user.email', '$email'] },
                        lastAccessAt: 1,
                    },
                },
            ]),
            User.aggregate([
                {
                    $lookup: {
                        from: 'workouthistories',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'history',
                    },
                },
                { $match: { history: { $size: 0 } } },
                { $sort: { createdAt: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        userId: '$_id',
                        name: 1,
                        email: 1,
                        createdAt: 1,
                        lastLoginAt: 1,
                    },
                },
            ]),
            User.find({
                $or: [
                    { lastLoginAt: { $exists: false } },
                    { lastLoginAt: null },
                    { lastLoginAt: { $lt: inactiveSince } },
                ],
            })
                .sort({ lastLoginAt: 1, createdAt: -1 })
                .limit(10)
                .select('name email createdAt lastLoginAt')
                .lean(),
            ActiveWorkoutSession.find({})
                .sort({ updatedAt: -1 })
                .limit(15)
                .lean(),
            ActiveWorkoutSession.find({ updatedAt: { $lt: staleActiveSince } })
                .sort({ updatedAt: 1 })
                .limit(15)
                .lean(),
        ])

        async function hydrateActiveWorkoutSessions(items = []) {
            const userIds = items.map((item) => item.userId).filter(Boolean)
            const users = await User.find({ _id: { $in: userIds } })
                .select('name email lastLoginAt')
                .lean()

            const userMap = new Map(users.map((item) => [String(item._id), item]))

            return items.map((item) => {
                const mappedUser = userMap.get(String(item.userId))
                const session = item.session || {}

                return {
                    id: String(item._id),
                    userId: String(item.userId),
                    name: mappedUser?.name || 'Usuário',
                    email: mappedUser?.email || '',
                    workoutName: session.workoutName || session.name || 'Treino ativo',
                    exerciseCount: Array.isArray(session.exercises) ? session.exercises.length : 0,
                    startedAt: session.startedAt || null,
                    updatedAt: item.updatedAt,
                    lastLoginAt: mappedUser?.lastLoginAt || null,
                }
            })
        }

        return res.json({
            period: {
                days,
                since,
                inactiveSince,
                staleActiveSince,
            },
            mostWorkouts,
            highestVolume,
            mostSets,
            mostReps,
            mostLogins,
            usersWithoutWorkout,
            inactiveUsers: inactiveUsers.map((item) => ({
                userId: String(item._id),
                name: item.name,
                email: item.email,
                createdAt: item.createdAt,
                lastLoginAt: item.lastLoginAt,
            })),
            activeWorkouts: await hydrateActiveWorkoutSessions(activeWorkouts),
            staleActiveWorkouts: await hydrateActiveWorkoutSessions(staleActiveWorkouts),
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao carregar rankings administrativos.',
        })
    }
})


app.get('/admin/analytics', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const days = Math.min(Math.max(Number(req.query.days) || 14, 7), 90)
        const since = new Date()
        since.setDate(since.getDate() - days + 1)
        since.setHours(0, 0, 0, 0)

        const [
            totalUsers,
            totalAdmins,
            blockedUsers,
            activeWorkoutSessions,
            totalWorkouts,
            totalHistory,
            totalExercises,
            totalGoals,
            totalNotifications,
            loginEvents,
            newUsersByDay,
            workoutsByDay,
            historyByDay,
            loginEventsByDay,
            historyTotals,
            recentUsers,
            recentLogins,
            topWorkoutUsers,
            orphanHistoryCount,
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ isBlocked: true }),
            ActiveWorkoutSession.countDocuments({}),
            Workout.countDocuments({}),
            WorkoutHistory.countDocuments({}),
            Exercise.countDocuments({}),
            Goal.countDocuments({}),
            Notification.countDocuments({}),
            LoginEvent.countDocuments({ createdAt: { $gte: since } }),
            User.aggregate([
                { $match: { createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Workout.aggregate([
                { $match: { createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            WorkoutHistory.aggregate([
                { $match: { finishedAt: { $gte: since } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$finishedAt' } },
                        count: { $sum: 1 },
                        totalSets: { $sum: { $ifNull: ['$totalSets', 0] } },
                        totalVolume: { $sum: { $ifNull: ['$totalVolume', 0] } },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            LoginEvent.aggregate([
                { $match: { createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            WorkoutHistory.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSets: { $sum: { $ifNull: ['$totalSets', 0] } },
                        totalReps: { $sum: { $ifNull: ['$totalReps', 0] } },
                        totalVolume: { $sum: { $ifNull: ['$totalVolume', 0] } },
                        totalDurationSeconds: { $sum: { $ifNull: ['$durationSeconds', 0] } },
                    },
                },
            ]),
            User.find({})
                .sort({ createdAt: -1 })
                .limit(8)
                .select('name email role provider isBlocked createdAt lastLoginAt')
                .lean(),
            LoginEvent.find({})
                .sort({ createdAt: -1 })
                .limit(10)
                .select('email provider createdAt userAgent')
                .lean(),
            WorkoutHistory.aggregate([
                {
                    $group: {
                        _id: '$userId',
                        count: { $sum: 1 },
                        totalVolume: { $sum: { $ifNull: ['$totalVolume', 0] } },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
                { $match: { 'user._id': { $exists: true } } },
                {
                    $project: {
                        userId: '$_id',
                        count: 1,
                        totalVolume: 1,
                        name: '$user.name',
                        email: '$user.email',
                    },
                },
            ]),
            WorkoutHistory.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $match: { user: { $size: 0 } } },
                { $count: 'count' },
            ]),
        ])

        const totals = historyTotals?.[0] || {}
        const loginSeries = mapAggregationToSeries(loginEventsByDay, days)
        const newUserSeries = mapAggregationToSeries(newUsersByDay, days)
        const workoutSeries = mapAggregationToSeries(workoutsByDay, days)

        const historyMap = createEmptyDateMap(days)
        historyByDay.forEach((item) => {
            if (!item?._id) return
            historyMap.set(item._id, {
                date: item._id,
                count: item.count || 0,
                totalSets: item.totalSets || 0,
                totalVolume: item.totalVolume || 0,
            })
        })

        const historySeries = Array.from(historyMap.entries()).map(([date, value]) => {
            if (typeof value === 'number') {
                return {
                    date,
                    count: value,
                    totalSets: 0,
                    totalVolume: 0,
                }
            }

            return value
        })

        return res.json({
            period: {
                days,
                since: since.toISOString(),
                until: new Date().toISOString(),
            },
            cards: {
                totalUsers,
                totalAdmins,
                blockedUsers,
                activeWorkoutSessions,
                totalWorkouts,
                totalHistory,
                totalExercises,
                totalGoals,
                totalNotifications,
                loginEvents,
                totalSets: totals.totalSets || 0,
                totalReps: totals.totalReps || 0,
                totalVolume: totals.totalVolume || 0,
                totalDurationSeconds: totals.totalDurationSeconds || 0,
                orphanHistoryCount: orphanHistoryCount?.[0]?.count || 0,
            },
            series: {
                logins: loginSeries,
                newUsers: newUserSeries,
                workouts: workoutSeries,
                history: historySeries,
            },
            recentUsers: recentUsers.map(sanitizeUser),
            recentLogins: recentLogins.map((item) => ({
                id: String(item._id || item.id),
                email: item.email,
                provider: item.provider,
                createdAt: item.createdAt,
                userAgent: item.userAgent || '',
            })),
            topWorkoutUsers: topWorkoutUsers.map((item) => ({
                userId: item.userId ? String(item.userId) : '',
                name: item.name || 'Usuário removido',
                email: item.email || '',
                count: item.count || 0,
                totalVolume: item.totalVolume || 0,
            })),
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao carregar analytics admin.',
        })
    }
})


app.get('/admin/stats', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const [
            totalUsers,
            totalAdmins,
            blockedUsers,
            activeWorkoutSessions,
            totalWorkouts,
            totalHistory,
            recentUsers,
            recentLogs,
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ isBlocked: true }),
            ActiveWorkoutSession.countDocuments({}),
            Workout.countDocuments({}),
            WorkoutHistory.countDocuments({}),
            User.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email role provider isBlocked createdAt lastLoginAt')
                .lean(),
            AdminLog.find({})
                .sort({ createdAt: -1 })
                .limit(8)
                .lean(),
        ])

        return res.json({
            cards: {
                totalUsers,
                totalAdmins,
                blockedUsers,
                activeWorkoutSessions,
                totalWorkouts,
                totalHistory,
            },
            recentUsers: recentUsers.map(sanitizeUser),
            recentLogs: recentLogs.map(sanitizeAdminLog),
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao carregar estatísticas admin.',
        })
    }
})

app.get('/admin/logs', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { targetUserId = '', limit = 50 } = req.query
        const filter = {}

        if (targetUserId) {
            filter.targetUserId = targetUserId
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)

        const logs = await AdminLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(safeLimit)
            .lean()

        return res.json({
            logs: logs.map(sanitizeAdminLog),
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao carregar logs admin.',
        })
    }
})


function normalizeActiveWorkoutSessionPayload(payload) {
    if (!payload) return null

    const session = payload.session || payload.activeSession || payload

    if (!session || typeof session !== 'object') return null

    if (!Array.isArray(session.exercises)) return null

    return {
        ...session,
        id: session.id || session._id || new mongoose.Types.ObjectId().toString(),
        workoutName: session.workoutName || session.name || 'Treino em andamento',
        exercises: session.exercises,
    }
}

async function getActiveWorkoutSession(req, res) {
    try {
        const record = await ActiveWorkoutSession.findOne({
            userId: req.user.userId,
        }).lean()

        res.json({
            session: record?.session || null,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar treino ativo.',
        })
    }
}

async function saveActiveWorkoutSession(req, res) {
    try {
        const session = normalizeActiveWorkoutSessionPayload(req.body)

        if (!session) {
            await ActiveWorkoutSession.findOneAndDelete({
                userId: req.user.userId,
            })

            return res.json({
                session: null,
            })
        }

        const normalizedSession = normalizeActiveWorkoutPayload(session)

        const record = await ActiveWorkoutSession.findOneAndUpdate(
            {
                userId: req.user.userId,
            },
            {
                userId: req.user.userId,
                session: normalizedSession,
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        )

        res.json({
            session: record.session,
            updatedAt: record.updatedAt,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao salvar treino ativo.',
        })
    }
}

async function finishActiveWorkoutSession(req, res) {
    try {
        const activeRecord = await ActiveWorkoutSession.findOne({
            userId: req.user.userId,
        }).lean()

        const bodySession = normalizeActiveWorkoutSessionPayload(req.body)
        const activeSession = bodySession || activeRecord?.session

        if (!activeSession) {
            return res.status(400).json({
                message: 'Nenhum treino ativo encontrado para finalizar.',
            })
        }

        const validation = validateWorkoutHistoryPayload({
            ...activeSession,
            ...req.body,
            exercises: Array.isArray(req.body.exercises) && req.body.exercises.length > 0
                ? req.body.exercises
                : activeSession.exercises || [],
            workoutName: req.body.workoutName || req.body.name || activeSession.workoutName || activeSession.name,
        })

        if (!validation.valid) {
            return res.status(400).json({
                message: validation.message,
            })
        }

        const {
            workoutId = activeSession.workoutId || null,
            workoutName: finalWorkoutName,
            exercises: finalExercises,
            durationSeconds,
            startedAt,
            finishedAt,
            notes,
        } = validation.value

        const backendPrResult = await buildWorkoutBackendPrResult(req.user.userId, finalExercises)
        const summary = calculateWorkoutHistorySummary(backendPrResult.exercises)

        const historyItem = await WorkoutHistory.create({
            userId: req.user.userId,
            workoutId: workoutId || null,
            workoutName: finalWorkoutName.trim(),
            exercises: backendPrResult.exercises,
            durationSeconds,
            startedAt,
            finishedAt,
            totalVolume: summary.totalVolume,
            totalSets: summary.totalSets,
            totalReps: summary.totalReps,
            prs: backendPrResult.prs,
            notes,
        })

        if (workoutId) {
            await Workout.findOneAndUpdate(
                {
                    _id: workoutId,
                    userId: req.user.userId,
                },
                {
                    $set: {
                        lastFinishedAt: new Date(),
                    },
                    $inc: {
                        totalTimesFinished: 1,
                    },
                }
            )
        }

        await ActiveWorkoutSession.findOneAndDelete({
            userId: req.user.userId,
        })

        res.status(201).json({
            ok: true,
            historyItem,
            session: null,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao finalizar treino ativo.',
        })
    }
}

async function clearActiveWorkoutSession(req, res) {
    try {
        await ActiveWorkoutSession.findOneAndDelete({
            userId: req.user.userId,
        })

        res.json({
            ok: true,
            session: null,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao limpar treino ativo.',
        })
    }
}

passport.serializeUser((user, done) => {
    done(null, user._id.toString())
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id)
        done(null, user)
    } catch (error) {
        done(error)
    }
})

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: `${normalizedBackendUrl}/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value?.toLowerCase().trim()

                if (!email) {
                    return done(new Error('Conta Google sem e-mail.'))
                }

                let user = await User.findOne({
                    email,
                })

                if (user) {
                    if (user.isBlocked) {
                        return done(new Error('Esta conta está bloqueada. Entre em contato com o suporte.'))
                    }

                    user.googleId = profile.id
                    user.name = user.name || profile.displayName
                    user.avatarUrl = profile.photos?.[0]?.value || user.avatarUrl
                    user.provider = user.passwordHash ? 'both' : 'google'
                    user.lastLoginAt = new Date()

                    user = await user.save()
                } else {
                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email,
                        avatarUrl: profile.photos?.[0]?.value || '',
                        provider: 'google',
                        profileCompleted: false,
                        lastLoginAt: new Date(),
                    })
                }

                return done(null, user)
            } catch (error) {
                return done(error)
            }
        }
    )
)

app.get('/settings', authMiddleware, async (req, res) => {
    const settings = await AppSettings.findOne({
        userId: req.user.userId,
    })

    res.json(settings?.data || {})
})

const allowedSettingsKeys = [
    'themeMode',
    'accentColor',
    'compactMobile',
    'defaultSetModel',
    'defaultRestTimer',
    'workoutsVisibleLimit',
    'collapseSeriesByDefault',
    'collapseWorkoutsByDefault',
    'autoSaveWorkout',
    'autoOpenCalendar',
    'autoStartRestTimer',
    'showPRDuringWorkout',
    'showLastWorkoutComparison',
    'confirmBeforeFinishWorkout',
    'confirmBeforeCancelWorkout',
]

function sanitizeSettings(input) {
    const output = {}

    for (const key of allowedSettingsKeys) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            output[key] = input[key]
        }
    }

    return output
}

app.put('/settings', authMiddleware, async (req, res) => {
    const safeSettings = sanitizeSettings(req.body)

    const settings = await AppSettings.findOneAndUpdate(
        {
            userId: req.user.userId,
        },
        {
            userId: req.user.userId,
            data: safeSettings,
        },
        {
            new: true,
            upsert: true,
        }
    )

    res.json(settings.data)
})


app.get('/active-workout', authMiddleware, getActiveWorkoutSession)
app.put('/active-workout', authMiddleware, saveActiveWorkoutSession)
app.post('/active-workout/finish', authMiddleware, finishActiveWorkoutSession)
app.delete('/active-workout', authMiddleware, clearActiveWorkoutSession)

// Aliases mantidos para compatibilidade com versões anteriores do frontend.
app.get('/active-session', authMiddleware, getActiveWorkoutSession)
app.put('/active-session', authMiddleware, saveActiveWorkoutSession)
app.delete('/active-session', authMiddleware, clearActiveWorkoutSession)

app.get('/workout-session/active', authMiddleware, getActiveWorkoutSession)
app.put('/workout-session/active', authMiddleware, saveActiveWorkoutSession)
app.delete('/workout-session/active', authMiddleware, clearActiveWorkoutSession)

app.get('/health', (req, res) => {
    res.json({
        ok: true,
        message: 'ForgeFlow API online.',
        mongoState: mongoose.connection.readyState,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    })
})

app.get(
    '/auth/google',
    authRateLimit,
    passport.authenticate('google', {
        scope: ['profile', 'email'],
    })
)

app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${normalizedFrontendUrl}/login?error=google`,
        session: false,
    }),
    async (req, res) => {
        await writeLoginEvent(req, req.user, 'google')
        const token = createToken(req.user)
        setAuthCookie(res, token)

        res.redirect(`${normalizedFrontendUrl}/auth/callback?token=${token}&mode=hybrid`)
    }
)


app.post('/auth/forgot-password', sensitiveRateLimit, async (req, res) => {
    try {
        const { email } = req.body
        const normalizedEmail = String(email || '').toLowerCase().trim()

        if (!normalizedEmail) {
            return res.status(200).json({
                message: 'Se existir uma conta com este e-mail, enviaremos um link de recuperação.',
            })
        }

        const user = await User.findOne({ email: normalizedEmail })

        if (!user || !user.passwordHash) {
            return res.status(200).json({
                message: 'Se existir uma conta com este e-mail, enviaremos um link de recuperação.',
            })
        }

        const resetToken = createPasswordResetToken()

        user.resetPasswordTokenHash = resetToken.tokenHash
        user.resetPasswordExpiresAt = resetToken.expiresAt

        await user.save()

        const resetUrl = buildResetPasswordUrl(resetToken.rawToken)
        const emailResult = await sendPasswordResetEmail(user.email, resetUrl)

        return res.status(200).json({
            message: 'Se existir uma conta com este e-mail, enviaremos um link de recuperação.',
            emailSent: emailResult.sent,
            emailReason: emailResult.reason,
            ...(process.env.NODE_ENV !== 'production' && !emailResult.sent ? { resetUrl } : {}),
        })
    } catch (error) {
        console.error(error)

        return res.status(200).json({
            message: 'Se existir uma conta com este e-mail, enviaremos um link de recuperação.',
        })
    }
})

app.post('/auth/reset-password/:token', sensitiveRateLimit, async (req, res) => {
    try {
        const { token } = req.params
        const { password, confirmPassword } = req.body

        if (!password?.trim() || !confirmPassword?.trim()) {
            return res.status(400).json({
                message: 'Preencha e confirme a nova senha.',
            })
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: 'As senhas não conferem.',
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'A senha precisa ter pelo menos 6 caracteres.',
            })
        }

        const tokenHash = crypto.createHash('sha256').update(String(token || '')).digest('hex')

        const user = await User.findOne({
            resetPasswordTokenHash: tokenHash,
            resetPasswordExpiresAt: { $gt: new Date() },
        })

        if (!user) {
            return res.status(400).json({
                message: 'Link inválido ou expirado.',
            })
        }

        user.passwordHash = await bcrypt.hash(password, 10)
        user.provider = user.googleId ? 'both' : 'credentials'
        user.resetPasswordTokenHash = ''
        user.resetPasswordExpiresAt = null

        await user.save()

        return res.json({
            message: 'Senha redefinida com sucesso.',
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao redefinir senha.',
        })
    }
})


app.post('/auth/register', authRateLimit, async (req, res) => {
    const {
        name,
        email,
        password,
        gender,
        birthDate,
        height,
        currentWeight,
        mainGoal,
        trainingLevel,
        trainingFrequency,
        preferredUnit = 'kg',
        preferredSplit,
        notes,
    } = req.body

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
        return res.status(400).json({
            message: 'Preencha nome, e-mail e senha.',
        })
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: 'A senha precisa ter pelo menos 6 caracteres.',
        })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await User.findOne({
        email: normalizedEmail,
    })

    if (existingUser?.passwordHash) {
        return res.status(409).json({
            message: 'Já existe uma conta com esse e-mail.',
        })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const profile = {
        gender: gender || '',
        birthDate: birthDate || '',
        height: parseDecimal(height),
        currentWeight: parseDecimal(currentWeight),
        trainingFrequency: parseDecimal(trainingFrequency),
        mainGoal: mainGoal || '',
        trainingLevel: trainingLevel || '',
        preferredUnit,
        preferredSplit: preferredSplit || '',
        notes: notes || '',
    }

    const profileCompleted = buildProfileCompletion(profile)

    let user

    if (existingUser) {
        existingUser.name = existingUser.name || name.trim()
        existingUser.passwordHash = passwordHash
        existingUser.provider = existingUser.googleId ? 'both' : 'credentials'
        existingUser.profile = {
            ...existingUser.profile,
            ...profile,
        }
        existingUser.profileCompleted = profileCompleted

        user = await existingUser.save()
    } else {
        user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            provider: 'credentials',
            profile,
            profileCompleted,
        })
    }

    user.lastLoginAt = new Date()
    await user.save()
    await writeLoginEvent(req, user, 'credentials')

    const token = createToken(user)

    const csrfToken = setAuthCookie(res, token)

    res.status(201).json({
        token,
        authMode: 'hybrid',
        csrfToken,
        user: buildUserResponse(user),
    })
})

app.post('/auth/login', authRateLimit, async (req, res) => {
    const { email, password } = req.body

    if (!email?.trim() || !password?.trim()) {
        return res.status(400).json({
            message: 'Preencha e-mail e senha.',
        })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await User.findOne({
        email: normalizedEmail,
    })

    if (!user) {
        return res.status(401).json({
            message: 'E-mail ou senha inválidos.',
        })
    }

    if (user.isBlocked) {
        return res.status(403).json({
            message: 'Esta conta está bloqueada. Entre em contato com o suporte.',
        })
    }

    if (!user.passwordHash) {
        return res.status(400).json({
            message:
                'Essa conta foi criada com Google. Entre com Google e crie uma senha nas configurações para usar login tradicional.',
        })
    }
    const passwordIsValid = await bcrypt.compare(password, user.passwordHash)

    if (!passwordIsValid) {
        return res.status(401).json({
            message: 'E-mail ou senha inválidos.',
        })
    }

    user.lastLoginAt = new Date()
    await user.save()
    await writeLoginEvent(req, user, 'credentials')

    const token = createToken(user)

    const csrfToken = setAuthCookie(res, token)

    res.json({
        token,
        authMode: 'hybrid',
        csrfToken,
        user: buildUserResponse(user),
    })
})



app.get('/auth/csrf', (req, res) => {
    const csrfToken = req.cookies?.[CSRF_COOKIE_NAME] || createCsrfToken()

    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
        setCsrfCookie(res, csrfToken)
    }

    return res.json({
        csrfToken,
    })
})

app.get('/auth/session', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId)

    if (!user) {
        return res.status(404).json({
            message: 'Usuário não encontrado.',
        })
    }

    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
        setCsrfCookie(res, createCsrfToken())
    }

    const csrfToken = req.cookies?.[CSRF_COOKIE_NAME] || createCsrfToken()

    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
        setCsrfCookie(res, csrfToken)
    }

    return res.json({
        ...buildUserResponse(user),
        csrfToken,
    })
})

app.post('/auth/logout', async (req, res) => {
    clearAuthCookie(res)

    return res.json({
        message: 'Logout realizado.',
    })
})


app.get('/me', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId)

    if (!user) {
        return res.status(404).json({
            message: 'Usuário não encontrado.',
        })
    }

    res.json(buildUserResponse(user))
})

app.delete('/me', authMiddleware, sensitiveRateLimit, async (req, res) => {
    try {
        const { password, confirmText } = req.body || {}
        const user = await User.findById(req.user.userId)

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado.',
            })
        }

        if (user.passwordHash) {
            if (!password?.trim()) {
                return res.status(400).json({
                    message: 'Informe sua senha para excluir a conta.',
                })
            }

            const passwordIsValid = await bcrypt.compare(password, user.passwordHash)

            if (!passwordIsValid) {
                return res.status(401).json({
                    message: 'Senha inválida.',
                })
            }
        }

        if (String(confirmText || '').trim().toUpperCase() !== 'EXCLUIR') {
            return res.status(400).json({
                message: 'Digite EXCLUIR para confirmar.',
            })
        }

        const userId = user._id

        const deletionResults = await Promise.allSettled([
            Workout.deleteMany({ userId }),
            WorkoutTemplate.deleteMany({ userId }),
            WorkoutHistory.deleteMany({ userId }),
            Exercise.deleteMany({ userId }),
            BodyWeight.deleteMany({ userId }),
            ProgressPhoto.deleteMany({ userId }),
            Goal.deleteMany({ userId }),
            Notification.deleteMany({ userId }),
            ActiveWorkoutSession.deleteMany({ userId }),
            AppSettings.deleteMany({ userId }),
            LoginEvent.deleteMany({ userId }),
            AdminLog.deleteMany({ targetUserId: userId }),
        ])

        await User.findByIdAndDelete(userId)
        clearAuthCookie(res)

        return res.json({
            message: 'Conta e dados associados removidos.',
            deleted: deletionResults.map((result) =>
                result.status === 'fulfilled' ? result.value?.deletedCount || 0 : 0
            ),
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao excluir conta.',
        })
    }
})


app.post('/auth/set-password', authMiddleware, async (req, res) => {
    const { currentPassword, password, confirmPassword } = req.body

    if (!password?.trim() || !confirmPassword?.trim()) {
        return res.status(400).json({
            message: 'Informe a nova senha e a confirmação.',
        })
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            message: 'As senhas não conferem.',
        })
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: 'A senha precisa ter pelo menos 6 caracteres.',
        })
    }

    const user = await User.findById(req.user.userId)

    if (!user) {
        return res.status(404).json({
            message: 'Usuário não encontrado.',
        })
    }

    const alreadyHasPassword = Boolean(user.passwordHash)

    if (alreadyHasPassword) {
        if (!currentPassword?.trim()) {
            return res.status(400).json({
                message: 'Informe sua senha atual para alterar a senha.',
            })
        }

        const currentPasswordIsValid = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        )

        if (!currentPasswordIsValid) {
            return res.status(401).json({
                message: 'Senha atual inválida.',
            })
        }
    }

    user.passwordHash = await bcrypt.hash(password, 10)
    user.provider = user.googleId ? 'both' : 'credentials'

    await user.save()

    res.json({
        message: alreadyHasPassword
            ? 'Senha alterada com sucesso.'
            : 'Senha criada com sucesso.',
        user: buildUserResponse(user),
    })
})

function sanitizeText(value, maxLength = 120) {
    if (typeof value !== 'string') return ''

    return value
        .trim()
        .replace(/[<>]/g, '')
        .slice(0, maxLength)
}

function validateAvatarUrl(value) {
    if (value === undefined) {
        return {
            valid: true,
            value: undefined,
        }
    }

    if (value === null || value === '') {
        return {
            valid: true,
            value: '',
        }
    }

    if (typeof value !== 'string') {
        return {
            valid: false,
            message: 'Foto de perfil inválida.',
        }
    }

    const trimmed = value.trim()

    if (trimmed.length > 500) {
        return {
            valid: false,
            message: 'A URL da foto de perfil é muito grande.',
        }
    }

    if (trimmed.startsWith('data:') || trimmed.includes('base64,')) {
        return {
            valid: false,
            message: 'Imagem em Base64 não é permitida como foto de perfil.',
        }
    }

    try {
        const url = new URL(trimmed)

        const allowedProtocols = ['http:', 'https:']

        if (!allowedProtocols.includes(url.protocol)) {
            return {
                valid: false,
                message: 'A foto de perfil precisa ser uma URL HTTP ou HTTPS.',
            }
        }

        return {
            valid: true,
            value: trimmed,
        }
    } catch {
        return {
            valid: false,
            message: 'URL da foto de perfil inválida.',
        }
    }
}

app.put('/me/profile', authMiddleware, async (req, res) => {
    const {
        name,
        avatarUrl,
        gender,
        birthDate,
        height,
        currentWeight,
        mainGoal,
        trainingLevel,
        trainingFrequency,
        preferredUnit = 'kg',
        preferredSplit,
        notes,
    } = req.body

    const avatarValidation = validateAvatarUrl(avatarUrl)

    if (!avatarValidation.valid) {
        return res.status(400).json({
            message: avatarValidation.message,
        })
    }

    const safeName = sanitizeText(name, 80)

    const profile = {
        gender: sanitizeText(gender, 30),
        birthDate: sanitizeText(birthDate, 20),
        height: parseDecimal(height),
        currentWeight: parseDecimal(currentWeight),
        trainingFrequency: parseDecimal(trainingFrequency),
        mainGoal: sanitizeText(mainGoal, 80),
        trainingLevel: sanitizeText(trainingLevel, 60),
        preferredUnit: preferredUnit === 'lb' ? 'lb' : 'kg',
        preferredSplit: sanitizeText(preferredSplit, 80),
        notes: sanitizeText(notes, 500),
    }

    const profileCompleted = buildProfileCompletion(profile)

    const updateData = {
        ...(safeName ? { name: safeName } : {}),
        profile,
        profileCompleted,
    }

    if (avatarValidation.value !== undefined) {
        updateData.avatarUrl = avatarValidation.value
    }

    const user = await User.findByIdAndUpdate(
        req.user.userId,
        updateData,
        {
            new: true,
        }
    )

    if (!user) {
        return res.status(404).json({
            message: 'Usuário não encontrado.',
        })
    }

    res.json(buildUserResponse(user))
})

function isCompletedWorkoutSet(set = {}) {
    return (
        set.completed === true ||
        set.isCompleted === true ||
        set.done === true
    )
}

function isWarmupWorkoutSet(set = {}) {
    return (
        set.type === 'warmup' ||
        set.isWarmup === true ||
        set.warmup === true
    )
}

function getSetWeight(set = {}) {
    const value = Number(set.weight ?? set.load ?? set.carga ?? 0)
    return Number.isFinite(value) && value > 0 ? value : 0
}

function getSetReps(set = {}) {
    const value = Number(set.reps ?? set.repetitions ?? 0)
    return Number.isFinite(value) && value > 0 ? value : 0
}

function getSetVolume(set = {}) {
    return getSetWeight(set) * getSetReps(set)
}

function getExerciseNameFromHistoryExercise(item = {}) {
    return String(
        item.exercise?.name ||
        item.exerciseName ||
        item.name ||
        item.title ||
        ''
    ).trim()
}

function normalizeExerciseKey(value = '') {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

function calculateWorkoutHistorySummary(exercises = []) {
    let totalVolume = 0
    let totalSets = 0
    let totalReps = 0

    for (const item of exercises) {
        const sets = Array.isArray(item.sets) ? item.sets : []

        for (const set of sets) {
            if (!isCompletedWorkoutSet(set)) continue

            const weight = getSetWeight(set)
            const reps = getSetReps(set)

            totalSets += 1
            totalReps += reps
            totalVolume += weight * reps
        }
    }

    return {
        totalVolume,
        totalSets,
        totalReps,
    }
}

function buildPreviousExerciseRecords(historyItems = []) {
    const records = new Map()

    for (const historyItem of historyItems) {
        const exercises = Array.isArray(historyItem.exercises)
            ? historyItem.exercises
            : []

        for (const exerciseItem of exercises) {
            const exerciseName = getExerciseNameFromHistoryExercise(exerciseItem)
            const exerciseKey = normalizeExerciseKey(exerciseName)

            if (!exerciseKey) continue

            const current = records.get(exerciseKey) || {
                exerciseName,
                bestWeight: 0,
                bestVolume: 0,
            }

            const sets = Array.isArray(exerciseItem.sets)
                ? exerciseItem.sets
                : []

            for (const set of sets) {
                if (!isCompletedWorkoutSet(set) || isWarmupWorkoutSet(set)) continue

                const weight = getSetWeight(set)
                const reps = getSetReps(set)
                const volume = weight * reps

                if (weight > current.bestWeight) {
                    current.bestWeight = weight
                }

                if (volume > current.bestVolume) {
                    current.bestVolume = volume
                }
            }

            records.set(exerciseKey, current)
        }
    }

    return records
}

async function buildWorkoutBackendPrResult(userId, exercises = []) {
    const previousHistory = await WorkoutHistory.find({ userId })
        .sort({ finishedAt: -1, createdAt: -1 })
        .select('exercises finishedAt createdAt')
        .lean()

    const previousRecords = buildPreviousExerciseRecords(previousHistory)
    const prs = []

    const normalizedExercises = exercises.map((exerciseItem) => {
        const exerciseName = getExerciseNameFromHistoryExercise(exerciseItem)
        const exerciseKey = normalizeExerciseKey(exerciseName)
        const previousRecord = previousRecords.get(exerciseKey)

        let bestWeightSetId = null
        let bestWeight = previousRecord?.bestWeight || 0
        let bestVolumeSetId = null
        let bestVolume = previousRecord?.bestVolume || 0

        const sets = Array.isArray(exerciseItem.sets)
            ? exerciseItem.sets.map((set, index) => {
                const weight = getSetWeight(set)
                const reps = getSetReps(set)
                const volume = weight * reps
                const isValidForPr =
                    isCompletedWorkoutSet(set) &&
                    !isWarmupWorkoutSet(set) &&
                    weight > 0 &&
                    reps > 0

                const setId = set.id || set._id || `${exerciseKey || 'set'}-${index}`

                if (
                    isValidForPr &&
                    previousRecord?.bestWeight > 0 &&
                    weight > bestWeight
                ) {
                    bestWeight = weight
                    bestWeightSetId = setId
                }

                if (
                    isValidForPr &&
                    previousRecord?.bestVolume > 0 &&
                    volume > bestVolume
                ) {
                    bestVolume = volume
                    bestVolumeSetId = setId
                }

                return {
                    ...set,
                    id: set.id || setId,
                    volume,
                    isPR: false,
                    isWeightPR: false,
                    isVolumePR: false,
                }
            })
            : []

        const nextSets = sets.map((set) => {
            const isWeightPR = Boolean(bestWeightSetId && set.id === bestWeightSetId)
            const isVolumePR = Boolean(bestVolumeSetId && set.id === bestVolumeSetId)

            return {
                ...set,
                isWeightPR,
                isVolumePR,
                isPR: isWeightPR || isVolumePR,
            }
        })

        if (bestWeightSetId) {
            prs.push({
                type: 'weight',
                exerciseName,
                setId: bestWeightSetId,
                previousValue: previousRecord.bestWeight,
                value: bestWeight,
                unit: 'kg',
            })
        }

        if (bestVolumeSetId) {
            prs.push({
                type: 'volume',
                exerciseName,
                setId: bestVolumeSetId,
                previousValue: previousRecord.bestVolume,
                value: bestVolume,
                unit: 'kg',
            })
        }

        return {
            ...exerciseItem,
            exerciseName: exerciseItem.exerciseName || exerciseName,
            sets: nextSets,
        }
    })

    return {
        exercises: normalizedExercises,
        prs,
    }
}

function normalizeWorkoutHistoryForResponse(historyItem) {
    if (!historyItem) return historyItem

    const payload = typeof historyItem.toObject === 'function'
        ? historyItem.toObject()
        : { ...historyItem }

    const summary = calculateWorkoutHistorySummary(payload.exercises || [])

    return {
        ...payload,
        id: String(payload._id || payload.id || ''),
        totalVolume: Number(payload.totalVolume || 0) || summary.totalVolume,
        totalSets: Number(payload.totalSets || 0) || summary.totalSets,
        totalReps: Number(payload.totalReps || 0) || summary.totalReps,
        prs: Array.isArray(payload.prs) ? payload.prs : [],
    }
}




function getStartOfWeek(date = new Date()) {
    const current = new Date(date)
    const day = current.getDay()
    const diff = current.getDate() - day

    current.setDate(diff)
    current.setHours(0, 0, 0, 0)

    return current
}

function getStartOfMonth(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

function calculateGoalPercent(currentValue, targetValue, direction = 'increase') {
    const current = Number(currentValue) || 0
    const target = Number(targetValue) || 0

    if (target <= 0) return 0

    if (direction === 'decrease') {
        if (current <= target) return 100

        return Math.max(0, Math.min(100, Math.round((target / current) * 100)))
    }

    return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
}

function getLatestBodyWeight(bodyWeight = []) {
    if (!Array.isArray(bodyWeight) || bodyWeight.length === 0) return null

    const sorted = bodyWeight
        .slice()
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))

    return sorted[0]?.weight || null
}

function getMonthlyVolumeFromHistory(history = []) {
    const startOfMonth = getStartOfMonth(new Date())

    return history.reduce((total, session) => {
        const rawDate = session.finishedAt || session.createdAt

        if (!rawDate) return total

        const date = new Date(rawDate)

        if (date < startOfMonth) return total

        if (session.totalVolume) {
            return total + Number(session.totalVolume || 0)
        }

        const summary = calculateWorkoutHistorySummary(session.exercises || [])

        return total + Number(summary.totalVolume || 0)
    }, 0)
}

function getWeeklyWorkoutCount(history = []) {
    const startOfWeek = getStartOfWeek(new Date())

    return history.filter((session) => {
        const rawDate = session.finishedAt || session.createdAt

        if (!rawDate) return false

        return new Date(rawDate) >= startOfWeek
    }).length
}

function getMonthlyWorkoutCount(history = []) {
    const startOfMonth = getStartOfMonth(new Date())

    return history.filter((session) => {
        const rawDate = session.finishedAt || session.createdAt

        if (!rawDate) return false

        return new Date(rawDate) >= startOfMonth
    }).length
}

function getMonthlyProgressPhotoCount(progressPhotos = []) {
    const startOfMonth = getStartOfMonth(new Date())

    return progressPhotos.filter((photo) => {
        const rawDate = photo.date || photo.createdAt

        if (!rawDate) return false

        return new Date(rawDate) >= startOfMonth
    }).length
}

function getExerciseBestWeight(history = [], exerciseName = '') {
    if (!exerciseName) return 0

    let bestWeight = 0

    history.forEach((session) => {
        const exercises = Array.isArray(session.exercises) ? session.exercises : []

        exercises.forEach((item) => {
            const currentName =
                item.exercise?.name ||
                item.name ||
                item.exerciseName ||
                ''

            if (currentName !== exerciseName) return

            const sets = Array.isArray(item.sets) ? item.sets : []

            sets.forEach((set) => {
                const hasCompletionFlag =
                    set.completed !== undefined ||
                    set.isCompleted !== undefined ||
                    set.done !== undefined

                const isCompleted = hasCompletionFlag
                    ? set.completed === true || set.isCompleted === true || set.done === true
                    : true

                if (!isCompleted || set.type === 'warmup') return

                const weight = Number(set.weight || set.load || 0)

                if (weight > bestWeight) {
                    bestWeight = weight
                }
            })
        })
    })

    return bestWeight
}

function getGoalPeriodKey(goal, date = new Date()) {
    if (goal.period === 'monthly') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    if (goal.period === 'weekly') {
        const startOfYear = new Date(date.getFullYear(), 0, 1)
        const week = Math.ceil((((date - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7)

        return `${date.getFullYear()}-W${week}`
    }

    return 'once'
}

function shouldUseGoalBaseline(goal) {
    return [
        'weekly_workouts',
        'monthly_workouts',
        'monthly_volume',
        'progress_photos',
    ].includes(goal.type)
}

async function calculateGoalRawValue(goal, userId) {
    const type = goal.type

    if (type === 'custom') {
        return Number(goal.currentValue || 0)
    }

    if (type === 'weekly_workouts') {
        const history = await WorkoutHistory.find({ userId })

        return getWeeklyWorkoutCount(history)
    }

    if (type === 'monthly_workouts') {
        const history = await WorkoutHistory.find({ userId })

        return getMonthlyWorkoutCount(history)
    }

    if (type === 'body_weight') {
        const bodyWeight = await BodyWeight.find({ userId }).sort({
            date: -1,
            createdAt: -1,
        })

        return getLatestBodyWeight(bodyWeight) || 0
    }

    if (type === 'exercise_pr_weight') {
        const history = await WorkoutHistory.find({ userId })

        return getExerciseBestWeight(history, goal.exerciseName)
    }

    if (type === 'monthly_volume') {
        const history = await WorkoutHistory.find({ userId })

        return getMonthlyVolumeFromHistory(history)
    }

    if (type === 'progress_photos') {
        const progressPhotos = await ProgressPhoto.find({ userId })

        return getMonthlyProgressPhotoCount(progressPhotos)
    }

    return Number(goal.currentValue || 0)
}

async function calculateGoalCurrentValue(goal, userId) {
    const rawValue = await calculateGoalRawValue(goal, userId)

    if (!shouldUseGoalBaseline(goal)) {
        return rawValue
    }

    const currentPeriodKey = getGoalPeriodKey(goal, new Date())
    const baselinePeriodKey = goal.baselinePeriodKey || ''
    const baselineValue = Number(goal.baselineValue || 0)

    if (baselinePeriodKey && baselinePeriodKey !== currentPeriodKey) {
        return rawValue
    }

    return Math.max(0, rawValue - baselineValue)
}

async function enrichGoalWithProgress(goal, userId) {
    const currentValue = await calculateGoalCurrentValue(goal, userId)
    const progressPercent = calculateGoalPercent(
        currentValue,
        goal.targetValue,
        goal.direction
    )

    const isCompleted = progressPercent >= 100

    return {
        ...goal.toObject(),
        id: goal._id,
        currentValue,
        progressPercent,
        isCompleted,
    }
}


async function createNotificationIfNotExists({
    userId,
    title,
    message = '',
    type = 'info',
    actionUrl = '',
    source = 'system',
    dedupeKey = '',
}) {
    if (dedupeKey) {
        const existingNotification = await Notification.findOne({
            userId,
            dedupeKey,
            status: {
                $ne: 'archived',
            },
        })

        if (existingNotification) {
            return {
                notification: existingNotification,
                created: false,
            }
        }
    }

    const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        actionUrl,
        source,
        dedupeKey,
    })

    return {
        notification,
        created: true,
    }
}


async function archiveResolvedNotifications(userId, dedupeKeys = []) {
    const keys = dedupeKeys.filter(Boolean)

    if (keys.length === 0) return 0

    const result = await Notification.updateMany(
        {
            userId,
            dedupeKey: {
                $in: keys,
            },
            status: {
                $ne: 'archived',
            },
        },
        {
            status: 'archived',
            readAt: new Date(),
        }
    )

    return result.modifiedCount || 0
}

app.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const {
            status = '',
            limit = 30,
        } = req.query

        const query = {
            userId: req.user.userId,
        }

        if (status) {
            query.status = status
        }

        const notifications = await Notification.find(query)
            .sort({
                createdAt: -1,
            })
            .limit(Number(limit) || 30)

        const unreadCount = await Notification.countDocuments({
            userId: req.user.userId,
            status: 'unread',
        })

        res.json({
            notifications,
            unreadCount,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar notificações.',
        })
    }
})

app.post('/notifications/generate', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId
        const createdNotifications = []

        const [
            goals,
            history,
            bodyWeight,
            progressPhotos,
        ] = await Promise.all([
            Goal.find({ userId, status: 'active' }),
            WorkoutHistory.find({ userId }).sort({
                finishedAt: -1,
                createdAt: -1,
            }),
            BodyWeight.find({ userId }).sort({
                date: -1,
                createdAt: -1,
            }),
            ProgressPhoto.find({ userId }).sort({
                date: -1,
                createdAt: -1,
            }),
        ])

        const now = new Date()
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const resolvedDedupeKeys = []

        for (const goal of goals) {
            const enrichedGoal = await enrichGoalWithProgress(goal, userId)
            const progressPercent = Number(enrichedGoal?.progressPercent || 0)
            const roundedProgress = Math.max(0, Math.min(100, Math.round(progressPercent)))
            const goalPeriodKey = goal.period === 'monthly'
                ? currentMonthKey
                : goal.period === 'weekly'
                    ? `${now.getFullYear()}-W${Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)}`
                    : 'once'

            const goalMilestones = [
                {
                    threshold: 50,
                    title: 'Você chegou em 50% da meta',
                    message: `Metade do caminho concluída: você atingiu ${roundedProgress}% da meta "${goal.title}".`,
                    type: 'goal',
                },
                {
                    threshold: 75,
                    title: 'Meta em ritmo forte',
                    message: `Você já passou de 75% da meta "${goal.title}". Progresso atual: ${roundedProgress}%.`,
                    type: 'goal',
                },
                {
                    threshold: 90,
                    title: 'Reta final da meta',
                    message: `Falta pouco! Você chegou em ${roundedProgress}% da meta "${goal.title}".`,
                    type: 'goal',
                },
            ]

            for (const milestone of goalMilestones) {
                const dedupeKey = `goal-milestone-${goal._id}-${milestone.threshold}-${goalPeriodKey}`

                if (progressPercent < milestone.threshold || progressPercent >= 100) {
                    resolvedDedupeKeys.push(dedupeKey)
                }

                if (progressPercent >= milestone.threshold && progressPercent < 100) {
                    const result = await createNotificationIfNotExists({
                        userId,
                        title: milestone.title,
                        message: milestone.message,
                        type: milestone.type,
                        actionUrl: '/goals',
                        dedupeKey,
                    })

                    if (result.created) {
                        createdNotifications.push(result.notification)
                    }
                }
            }

            if (progressPercent < 100) {
                resolvedDedupeKeys.push(`goal-completed-${goal._id}`)
            }

            if (progressPercent >= 100) {
                const result = await createNotificationIfNotExists({
                    userId,
                    title: 'Meta alcançada',
                    message: `Você alcançou 100% da meta "${goal.title}". Parabéns!`,
                    type: 'success',
                    actionUrl: '/goals',
                    dedupeKey: `goal-completed-${goal._id}`,
                })

                if (result.created) {
                    createdNotifications.push(result.notification)
                }
            }
        }

        const lastWorkout = history[0]
        const lastWorkoutDate = lastWorkout?.finishedAt || lastWorkout?.createdAt

        if (lastWorkoutDate) {
            const diffDays = Math.floor((now - new Date(lastWorkoutDate)) / 1000 / 60 / 60 / 24)

            if (diffDays >= 3) {
                const result = await createNotificationIfNotExists({
                    userId,
                    title: 'Você está há alguns dias sem treinar',
                    message: `Seu último treino foi há ${diffDays} dias. Que tal retomar hoje?`,
                    type: 'workout',
                    actionUrl: '/workouts',
                    dedupeKey: `no-workout-${currentMonthKey}`,
                })

                if (result.created) {
                    createdNotifications.push(result.notification)
                }
            } else {
                resolvedDedupeKeys.push(`no-workout-${currentMonthKey}`)
            }

            resolvedDedupeKeys.push('first-workout')
        } else {
            const result = await createNotificationIfNotExists({
                userId,
                title: 'Comece seu primeiro treino',
                message: 'Crie ou inicie um treino para começar a gerar seu histórico.',
                type: 'workout',
                actionUrl: '/workouts',
                dedupeKey: 'first-workout',
            })

            if (result.created) {
                createdNotifications.push(result.notification)
            }
        }

        const lastWeight = bodyWeight[0]
        const lastWeightDate = lastWeight?.date || lastWeight?.createdAt

        if (lastWeightDate) {
            const diffDays = Math.floor((now - new Date(lastWeightDate)) / 1000 / 60 / 60 / 24)

            if (diffDays >= 7) {
                const result = await createNotificationIfNotExists({
                    userId,
                    title: 'Hora de atualizar seu peso',
                    message: `Seu último peso foi registrado há ${diffDays} dias.`,
                    type: 'weight',
                    actionUrl: '/profile',
                    dedupeKey: `weight-missing-${currentMonthKey}`,
                })

                if (result.created) {
                    createdNotifications.push(result.notification)
                }
            } else {
                resolvedDedupeKeys.push(`weight-missing-${currentMonthKey}`)
            }

            resolvedDedupeKeys.push('first-weight')
        } else {
            const result = await createNotificationIfNotExists({
                userId,
                title: 'Registre seu peso corporal',
                message: 'Adicionar seu peso ajuda a acompanhar sua evolução.',
                type: 'weight',
                actionUrl: '/profile',
                dedupeKey: 'first-weight',
            })

            if (result.created) {
                createdNotifications.push(result.notification)
            }
        }

        const hasPhotoThisMonth = progressPhotos.some((photo) => {
            const rawDate = photo.date || photo.createdAt

            if (!rawDate) return false

            const date = new Date(rawDate)

            return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
        })

        if (!hasPhotoThisMonth) {
            const result = await createNotificationIfNotExists({
                userId,
                title: 'Foto de evolução pendente',
                message: 'Você ainda não registrou uma foto de evolução neste mês.',
                type: 'photo',
                actionUrl: '/progress-photos',
                dedupeKey: `photo-missing-${currentMonthKey}`,
            })

            if (result.created) {
                createdNotifications.push(result.notification)
            }
        } else {
            resolvedDedupeKeys.push(`photo-missing-${currentMonthKey}`)
        }

        await archiveResolvedNotifications(userId, resolvedDedupeKeys)

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(30)

        const unreadCount = await Notification.countDocuments({
            userId,
            status: 'unread',
        })

        res.json({
            created: createdNotifications.length,
            createdNotifications,
            notifications,
            unreadCount,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao gerar notificações.',
        })
    }
})

app.patch('/notifications/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            {
                userId: req.user.userId,
                status: 'unread',
            },
            {
                status: 'read',
                readAt: new Date(),
            }
        )

        res.json({
            ok: true,
            message: 'Todas as notificações foram marcadas como lidas.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao marcar notificações como lidas.',
        })
    }
})

app.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            {
                status: 'read',
                readAt: new Date(),
            },
            {
                new: true,
            }
        )

        if (!notification) {
            return res.status(404).json({
                message: 'Notificação não encontrada.',
            })
        }

        res.json(notification)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao marcar notificação como lida.',
        })
    }
})

app.patch('/notifications/:id/archive', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            {
                status: 'archived',
            },
            {
                new: true,
            }
        )

        if (!notification) {
            return res.status(404).json({
                message: 'Notificação não encontrada.',
            })
        }

        res.json(notification)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao arquivar notificação.',
        })
    }
})

app.delete('/notifications/:id', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!notification) {
            return res.status(404).json({
                message: 'Notificação não encontrada.',
            })
        }

        res.json({
            ok: true,
            message: 'Notificação removida.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao remover notificação.',
        })
    }
})

app.get('/goals', authMiddleware, async (req, res) => {
    try {
        const goals = await Goal.find({
            userId: req.user.userId,
        }).sort({
            status: 1,
            deadline: 1,
            updatedAt: -1,
        })

        const enrichedGoals = await Promise.all(
            goals.map((goal) => enrichGoalWithProgress(goal, req.user.userId))
        )

        res.json(enrichedGoals)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar metas.',
        })
    }
})

app.post('/goals', authMiddleware, async (req, res) => {
    try {
        const {
            title,
            description = '',
            type = 'custom',
            targetValue,
            currentValue = 0,
            unit = '',
            exerciseName = '',
            direction = 'increase',
            period = 'none',
            deadline = null,
            color = '',
        } = req.body

        if (!title?.trim()) {
            return res.status(400).json({
                message: 'Informe o título da meta.',
            })
        }

        const parsedTarget = Number(targetValue)

        if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
            return res.status(400).json({
                message: 'Informe um valor alvo válido.',
            })
        }

        const goalDraft = {
            type,
            period,
            exerciseName,
            currentValue: Number(currentValue) || 0,
        }

        const baselineValue = shouldUseGoalBaseline(goalDraft)
            ? await calculateGoalRawValue(goalDraft, req.user.userId)
            : 0

        const goal = await Goal.create({
            userId: req.user.userId,
            title: title.trim(),
            description,
            type,
            targetValue: parsedTarget,
            currentValue: Number(currentValue) || 0,
            baselineValue,
            baselineAt: shouldUseGoalBaseline(goalDraft) ? new Date() : null,
            baselinePeriodKey: shouldUseGoalBaseline(goalDraft)
                ? getGoalPeriodKey(goalDraft, new Date())
                : '',
            unit,
            exerciseName,
            direction,
            period,
            deadline: deadline || null,
            color,
        })

        const enrichedGoal = await enrichGoalWithProgress(goal, req.user.userId)

        res.status(201).json(enrichedGoal)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao criar meta.',
        })
    }
})

app.put('/goals/:id', authMiddleware, async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            targetValue,
            currentValue,
            unit,
            exerciseName,
            direction,
            period,
            deadline,
            status,
            color,
            resetProgressBaseline = false,
        } = req.body

        const updateData = {}

        if (title !== undefined) {
            if (!title?.trim()) {
                return res.status(400).json({
                    message: 'Informe o título da meta.',
                })
            }

            updateData.title = title.trim()
        }

        if (description !== undefined) updateData.description = description
        if (type !== undefined) updateData.type = type
        if (unit !== undefined) updateData.unit = unit
        if (exerciseName !== undefined) updateData.exerciseName = exerciseName
        if (direction !== undefined) updateData.direction = direction
        if (period !== undefined) updateData.period = period
        if (deadline !== undefined) updateData.deadline = deadline || null
        if (status !== undefined) updateData.status = status
        if (color !== undefined) updateData.color = color

        if (targetValue !== undefined) {
            const parsedTarget = Number(targetValue)

            if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
                return res.status(400).json({
                    message: 'Informe um valor alvo válido.',
                })
            }

            updateData.targetValue = parsedTarget
        }

        if (currentValue !== undefined) {
            updateData.currentValue = Number(currentValue) || 0
        }

        if (resetProgressBaseline || type !== undefined || period !== undefined || exerciseName !== undefined) {
            const previousGoal = await Goal.findOne({
                _id: req.params.id,
                userId: req.user.userId,
            })

            if (previousGoal) {
                const baselineDraft = {
                    ...previousGoal.toObject(),
                    ...updateData,
                }

                if (shouldUseGoalBaseline(baselineDraft)) {
                    updateData.baselineValue = await calculateGoalRawValue(baselineDraft, req.user.userId)
                    updateData.baselineAt = new Date()
                    updateData.baselinePeriodKey = getGoalPeriodKey(baselineDraft, new Date())
                } else {
                    updateData.baselineValue = 0
                    updateData.baselineAt = null
                    updateData.baselinePeriodKey = ''
                }
            }
        }

        const goal = await Goal.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            updateData,
            {
                new: true,
            }
        )

        if (!goal) {
            return res.status(404).json({
                message: 'Meta não encontrada.',
            })
        }

        const enrichedGoal = await enrichGoalWithProgress(goal, req.user.userId)

        res.json(enrichedGoal)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao atualizar meta.',
        })
    }
})

app.patch('/goals/:id/complete', authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            {
                status: 'completed',
                completedAt: new Date(),
            },
            {
                new: true,
            }
        )

        if (!goal) {
            return res.status(404).json({
                message: 'Meta não encontrada.',
            })
        }

        const enrichedGoal = await enrichGoalWithProgress(goal, req.user.userId)
        const notificationResult = await createNotificationIfNotExists({
            userId: req.user.userId,
            title: 'Meta concluída',
            message: `Você marcou a meta "${goal.title}" como concluída. Boa!`,
            type: 'success',
            actionUrl: '/goals',
            dedupeKey: `goal-manual-completed-${goal._id}`,
        })

        res.json({
            ...enrichedGoal,
            createdNotification: notificationResult.created
                ? notificationResult.notification
                : null,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao concluir meta.',
        })
    }
})

app.patch('/goals/:id/archive', authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            {
                status: 'archived',
            },
            {
                new: true,
            }
        )

        if (!goal) {
            return res.status(404).json({
                message: 'Meta não encontrada.',
            })
        }

        const enrichedGoal = await enrichGoalWithProgress(goal, req.user.userId)

        res.json(enrichedGoal)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao arquivar meta.',
        })
    }
})

app.delete('/goals/:id', authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!goal) {
            return res.status(404).json({
                message: 'Meta não encontrada.',
            })
        }

        res.json({
            ok: true,
            message: 'Meta removida com sucesso.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao remover meta.',
        })
    }
})

app.patch('/workouts/:id/favorite', authMiddleware, async (req, res) => {
    try {
        const workout = await Workout.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!workout) {
            return res.status(404).json({
                message: 'Treino não encontrado.',
            })
        }

        workout.isFavorite = !workout.isFavorite

        await workout.save()

        res.json(workout)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao atualizar favorito.',
        })
    }
})

app.get('/workouts', authMiddleware, async (req, res) => {
    try {
        const workouts = await Workout.find({
            userId: req.user.userId,
        }).sort({
            updatedAt: -1,
        })

        res.json(workouts)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar treinos.',
        })
    }
})

app.post('/workouts', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            description = '',
            folderName = '',
            folderId = null,
            color = '',
            exercises = [],
            estimatedDuration = null,
        } = req.body

        if (!name?.trim()) {
            return res.status(400).json({
                message: 'Informe o nome do treino.',
            })
        }

        const workout = await Workout.create({
            userId: req.user.userId,
            name: name.trim(),
            description,
            folderName,
            folderId,
            color,
            exercises,
            estimatedDuration,
        })

        res.status(201).json(workout)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao criar treino.',
        })
    }
})

app.put('/workouts/:id', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            description,
            folderName,
            folderId,
            color,
            exercises,
            estimatedDuration,
            isFavorite,
        } = req.body

        const updateData = {}

        if (name !== undefined) {
            if (!name?.trim()) {
                return res.status(400).json({
                    message: 'Informe o nome do treino.',
                })
            }

            updateData.name = name.trim()
        }

        if (description !== undefined) updateData.description = description
        if (folderId !== undefined) updateData.folderId = folderId
        if (folderName !== undefined) updateData.folderName = folderName
        if (color !== undefined) updateData.color = color
        if (exercises !== undefined) updateData.exercises = exercises
        if (estimatedDuration !== undefined) {
            updateData.estimatedDuration = estimatedDuration
        }
        if (isFavorite !== undefined) {
            updateData.isFavorite = Boolean(isFavorite)
        }

        const workout = await Workout.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            updateData,
            {
                new: true,
            }
        )

        if (!workout) {
            return res.status(404).json({
                message: 'Treino não encontrado.',
            })
        }

        res.json(workout)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao atualizar treino.',
        })
    }
})

app.delete('/workouts/:id', authMiddleware, async (req, res) => {
    try {
        const workout = await Workout.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!workout) {
            return res.status(404).json({
                message: 'Treino não encontrado.',
            })
        }

        res.json({
            ok: true,
            message: 'Treino removido com sucesso.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao remover treino.',
        })
    }
})

app.post('/workouts/:id/start', authMiddleware, async (req, res) => {
    try {
        const workout = await Workout.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            {
                $set: {
                    lastStartedAt: new Date(),
                },
                $inc: {
                    totalTimesStarted: 1,
                },
            },
            {
                new: true,
            }
        )

        if (!workout) {
            return res.status(404).json({
                message: 'Treino não encontrado.',
            })
        }

        res.json(workout)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao iniciar treino.',
        })
    }
})

app.get('/workout-history', authMiddleware, async (req, res) => {
    try {
        const history = await WorkoutHistory.find({
            userId: req.user.userId,
        }).sort({
            finishedAt: -1,
            createdAt: -1,
        })

        res.json(history.map(normalizeWorkoutHistoryForResponse))
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar histórico de treinos.',
        })
    }
})

app.get('/workout-history/:id', authMiddleware, async (req, res) => {
    try {
        const historyItem = await WorkoutHistory.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!historyItem) {
            return res.status(404).json({
                message: 'Treino do histórico não encontrado.',
            })
        }

        res.json(normalizeWorkoutHistoryForResponse(historyItem))
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar treino do histórico.',
        })
    }
})

app.post('/workout-history', authMiddleware, async (req, res) => {
    try {
        const validation = validateWorkoutHistoryPayload(req.body)

        if (!validation.valid) {
            return res.status(400).json({
                message: validation.message,
            })
        }

        const {
            workoutId = null,
            workoutName: finalWorkoutName,
            exercises,
            durationSeconds,
            startedAt,
            finishedAt,
            notes,
        } = validation.value

        const backendPrResult = await buildWorkoutBackendPrResult(req.user.userId, exercises)
        const summary = calculateWorkoutHistorySummary(backendPrResult.exercises)

        const historyItem = await WorkoutHistory.create({
            userId: req.user.userId,
            workoutId: workoutId || null,
            workoutName: finalWorkoutName.trim(),
            exercises: backendPrResult.exercises,
            durationSeconds,
            startedAt,
            finishedAt,
            totalVolume: summary.totalVolume,
            totalSets: summary.totalSets,
            totalReps: summary.totalReps,
            prs: backendPrResult.prs,
            notes,
        })

        if (workoutId) {
            await Workout.findOneAndUpdate(
                {
                    _id: workoutId,
                    userId: req.user.userId,
                },
                {
                    $set: {
                        lastFinishedAt: new Date(),
                    },
                    $inc: {
                        totalTimesFinished: 1,
                    },
                }
            )
        }

        await ActiveWorkoutSession.findOneAndDelete({
            userId: req.user.userId,
        })

        res.status(201).json(historyItem)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao salvar treino no histórico.',
        })
    }
})

app.delete('/workout-history/:id', authMiddleware, async (req, res) => {
    try {
        const historyItem = await WorkoutHistory.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!historyItem) {
            return res.status(404).json({
                message: 'Treino do histórico não encontrado.',
            })
        }

        res.json({
            ok: true,
            message: 'Treino removido do histórico.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao remover treino do histórico.',
        })
    }
})

app.delete('/workout-history', authMiddleware, async (req, res) => {
    try {
        await WorkoutHistory.deleteMany({
            userId: req.user.userId,
        })

        res.json({
            ok: true,
            message: 'Histórico limpo com sucesso.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao limpar histórico.',
        })
    }
})

app.get('/body-weight', authMiddleware, async (req, res) => {
    try {
        const records = await BodyWeight.find({
            userId: req.user.userId,
        }).sort({
            date: 1,
            createdAt: 1,
        })

        res.json(records)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar registros de peso.',
        })
    }
})

app.post('/body-weight', authMiddleware, async (req, res) => {
    try {
        const { weight, date, note = '' } = req.body

        const parsedWeight = Number(String(weight).replace(',', '.'))

        if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
            return res.status(400).json({
                message: 'Informe um peso válido.',
            })
        }

        const record = await BodyWeight.create({
            userId: req.user.userId,
            weight: parsedWeight,
            date: date || new Date(),
            note: String(note || '').trim().slice(0, 300),
        })

        const user = await User.findById(req.user.userId)

        if (user) {
            user.profile.currentWeight = parsedWeight
            user.profileCompleted = buildProfileCompletion(user.profile)
            await user.save()
        }

        res.status(201).json(record)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao salvar peso corporal.',
        })
    }
})

app.put('/body-weight/:id', authMiddleware, async (req, res) => {
    try {
        const { weight, date, note = '' } = req.body

        const parsedWeight = Number(String(weight).replace(',', '.'))

        if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
            return res.status(400).json({
                message: 'Informe um peso válido.',
            })
        }

        const record = await BodyWeight.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            {
                weight: parsedWeight,
                date: date || new Date(),
                note: String(note || '').trim().slice(0, 300),
            },
            {
                new: true,
            }
        )

        if (!record) {
            return res.status(404).json({
                message: 'Registro de peso não encontrado.',
            })
        }

        res.json(record)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao atualizar peso corporal.',
        })
    }
})

app.delete('/body-weight/:id', authMiddleware, async (req, res) => {
    try {
        const record = await BodyWeight.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!record) {
            return res.status(404).json({
                message: 'Registro de peso não encontrado.',
            })
        }

        res.json({
            ok: true,
            message: 'Registro de peso removido.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao remover peso corporal.',
        })
    }
})

const MAIN_MUSCLE_GROUPS = [
    'Peito',
    'Costas',
    'Ombros',
    'Bíceps',
    'Tríceps',
    'Antebraço',
    'Abdômen',
    'Lombar',
    'Glúteos',
    'Quadríceps',
    'Posterior de coxa',
    'Panturrilhas',
    'Adutores',
    'Abdutores',
    'Cardio',
    'Mobilidade',
    'Alongamento',
    'Corpo inteiro',
]

function normalizeRecoveryMuscleGroup(group) {
    if (!group) return null

    const normalized = String(group).trim()

    const aliases = {
        Peitoral: 'Peito',
        Chest: 'Peito',

        Dorsal: 'Costas',
        Costas: 'Costas',
        Back: 'Costas',
        Trapézio: 'Costas',
        Trapezio: 'Costas',

        Ombro: 'Ombros',
        Ombros: 'Ombros',
        Shoulder: 'Ombros',
        Shoulders: 'Ombros',
        Deltoide: 'Ombros',
        Deltoides: 'Ombros',

        Biceps: 'Bíceps',
        Bíceps: 'Bíceps',

        Triceps: 'Tríceps',
        Tríceps: 'Tríceps',

        Abdomen: 'Abdômen',
        Abdômen: 'Abdômen',
        Abs: 'Abdômen',
        Core: 'Abdômen',
        Oblíquos: 'Abdômen',
        Obliquos: 'Abdômen',

        Lombar: 'Lombar',
        LowerBack: 'Lombar',
        'Lower Back': 'Lombar',

        Gluteos: 'Glúteos',
        Glúteos: 'Glúteos',
        Glutes: 'Glúteos',

        Quadriceps: 'Quadríceps',
        Quadríceps: 'Quadríceps',
        Quads: 'Quadríceps',
        Pernas: 'Quadríceps',

        Posterior: 'Posterior de coxa',
        Hamstrings: 'Posterior de coxa',
        'Posterior de Coxa': 'Posterior de coxa',
        'Posterior de coxa': 'Posterior de coxa',

        Panturrilha: 'Panturrilhas',
        Panturrilhas: 'Panturrilhas',
        Calves: 'Panturrilhas',

        Adutor: 'Adutores',
        Adutores: 'Adutores',

        Abdutor: 'Abdutores',
        Abdutores: 'Abdutores',

        Cardio: 'Cardio',
        Mobilidade: 'Mobilidade',
        Alongamento: 'Alongamento',
        'Corpo Inteiro': 'Corpo inteiro',
        'Corpo inteiro': 'Corpo inteiro',
        FullBody: 'Corpo inteiro',
        'Full Body': 'Corpo inteiro',
    }

    return aliases[normalized] || normalized
}

function getExerciseMainMuscleGroup(item) {
    const exercise = item.exercise || {}

    return normalizeRecoveryMuscleGroup(
        exercise.muscleGroup ||
        exercise.normalizedGroup ||
        exercise.group
    )
}

function getMuscleRecoveryStatus(lastTrainedAt) {
    if (!lastTrainedAt) {
        return {
            status: 'Sem dados',
            level: 'unknown',
            recoveryPercent: 100,
            message: 'Ainda não há histórico suficiente.',
        }
    }

    const now = new Date()
    const lastDate = new Date(lastTrainedAt)

    if (Number.isNaN(lastDate.getTime())) {
        return {
            status: 'Sem dados',
            level: 'unknown',
            recoveryPercent: 100,
            message: 'Data de treino inválida.',
        }
    }

    const diffHours = Math.floor((now - lastDate) / 1000 / 60 / 60)

    if (diffHours < 24) {
        return {
            status: 'Recuperando',
            level: 'low',
            recoveryPercent: 35,
            message: 'Treinado há menos de 24h.',
        }
    }

    if (diffHours < 48) {
        return {
            status: 'Parcial',
            level: 'medium',
            recoveryPercent: 65,
            message: 'Ainda pode estar em recuperação.',
        }
    }

    if (diffHours < 72) {
        return {
            status: 'Quase pronto',
            level: 'good',
            recoveryPercent: 85,
            message: 'Provavelmente já está quase recuperado.',
        }
    }

    return {
        status: 'Recuperado',
        level: 'ready',
        recoveryPercent: 100,
        message: 'Boa janela para treinar novamente.',
    }
}

function getWeekKey(dateInput) {
    const date = new Date(dateInput)

    if (Number.isNaN(date.getTime())) return 'Sem semana'

    const year = date.getFullYear()
    const firstDayOfYear = new Date(year, 0, 1)
    const pastDaysOfYear = Math.floor((date - firstDayOfYear) / 86400000)
    const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)

    return `${year}-S${String(week).padStart(2, '0')}`
}

function getMonthKey(dateInput) {
    const date = new Date(dateInput)

    if (Number.isNaN(date.getTime())) return 'Sem mês'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')

    return `${year}-${month}`
}

function getProgressExerciseName(item) {
    return (
        item?.exercise?.name ||
        item?.name ||
        item?.exerciseName ||
        'Sem nome'
    )
}

function getProgressMuscleGroup(item) {
    return (
        item?.exercise?.muscleGroup ||
        item?.exercise?.normalizedGroup ||
        item?.muscleGroup ||
        'Sem grupo'
    )
}

function getValidProgressSets(item) {
    const sets = Array.isArray(item?.sets) ? item.sets : []

    return sets.filter((set) => {
        const isWarmup = set.type === 'warmup'
        const hasCompletionFlag =
            set.completed !== undefined ||
            set.isCompleted !== undefined ||
            set.done !== undefined

        const isCompleted = hasCompletionFlag
            ? set.completed === true || set.isCompleted === true || set.done === true
            : true

        const weight = Number(set.weight || set.load || 0)
        const reps = Number(set.reps || 0)

        return !isWarmup && isCompleted && weight > 0 && reps > 0
    })
}

function getSetVolumeValue(set) {
    const weight = Number(set.weight || set.load || 0)
    const reps = Number(set.reps || 0)

    return weight * reps
}

function summarizeProgressHistorySession(session) {
    const exercises = Array.isArray(session.exercises)
        ? session.exercises
        : []

    let totalVolume = 0
    let totalSets = 0
    let totalReps = 0

    exercises.forEach((item) => {
        const sets = getValidProgressSets(item)

        sets.forEach((set) => {
            const reps = Number(set.reps || 0)

            totalSets += 1
            totalReps += reps
            totalVolume += getSetVolumeValue(set)
        })
    })

    return {
        totalVolume,
        totalSets,
        totalReps,
    }
}

function buildBodyWeightProgress(bodyWeight = []) {
    return bodyWeight
        .filter((item) => item.weight && item.date)
        .map((item) => ({
            id: item._id || item.id,
            date: item.date,
            label: new Date(item.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
            }),
            weight: Number(item.weight) || 0,
            note: item.note || '',
        }))
}

function buildWeeklyTrainingProgress(history = []) {
    const weekMap = new Map()

    history.forEach((session) => {
        const date = session.finishedAt || session.createdAt

        if (!date) return

        const key = getWeekKey(date)
        const summary = summarizeProgressHistorySession(session)

        const current = weekMap.get(key) || {
            week: key,
            workouts: 0,
            volume: 0,
            sets: 0,
            reps: 0,
            durationSeconds: 0,
        }

        weekMap.set(key, {
            ...current,
            workouts: current.workouts + 1,
            volume: current.volume + summary.totalVolume,
            sets: current.sets + summary.totalSets,
            reps: current.reps + summary.totalReps,
            durationSeconds:
                current.durationSeconds + Number(session.durationSeconds || session.duration || 0),
        })
    })

    return Array.from(weekMap.values())
        .sort((a, b) => a.week.localeCompare(b.week))
        .map((item) => ({
            ...item,
            averageDurationSeconds:
                item.workouts > 0
                    ? Math.round(item.durationSeconds / item.workouts)
                    : 0,
        }))
}

function buildMonthlyTrainingProgress(history = []) {
    const monthMap = new Map()

    history.forEach((session) => {
        const date = session.finishedAt || session.createdAt

        if (!date) return

        const key = getMonthKey(date)
        const summary = summarizeProgressHistorySession(session)

        const current = monthMap.get(key) || {
            month: key,
            workouts: 0,
            volume: 0,
            sets: 0,
            reps: 0,
            durationSeconds: 0,
        }

        monthMap.set(key, {
            ...current,
            workouts: current.workouts + 1,
            volume: current.volume + summary.totalVolume,
            sets: current.sets + summary.totalSets,
            reps: current.reps + summary.totalReps,
            durationSeconds:
                current.durationSeconds + Number(session.durationSeconds || session.duration || 0),
        })
    })

    return Array.from(monthMap.values())
        .sort((a, b) => a.month.localeCompare(b.month))
        .map((item) => ({
            ...item,
            averageDurationSeconds:
                item.workouts > 0
                    ? Math.round(item.durationSeconds / item.workouts)
                    : 0,
        }))
}

function buildMuscleGroupProgress(history = []) {
    const groupMap = new Map()

    history.forEach((session) => {
        const exercises = Array.isArray(session.exercises)
            ? session.exercises
            : []

        exercises.forEach((item) => {
            const group = getProgressMuscleGroup(item)
            const sets = getValidProgressSets(item)
            const volume = sets.reduce((total, set) => total + getSetVolumeValue(set), 0)

            const current = groupMap.get(group) || {
                muscleGroup: group,
                sets: 0,
                volume: 0,
                sessions: 0,
            }

            groupMap.set(group, {
                ...current,
                sets: current.sets + sets.length,
                volume: current.volume + volume,
                sessions: current.sessions + 1,
            })
        })
    })

    return Array.from(groupMap.values())
        .sort((a, b) => b.volume - a.volume)
}

function buildExercisePrProgress(history = []) {
    const prMap = new Map()

    history.forEach((session) => {
        const date = session.finishedAt || session.createdAt
        const workoutName = session.workoutName || 'Treino'
        const exercises = Array.isArray(session.exercises)
            ? session.exercises
            : []

        exercises.forEach((item) => {
            const exerciseName = getProgressExerciseName(item)
            const muscleGroup = getProgressMuscleGroup(item)
            const sets = getValidProgressSets(item)

            sets.forEach((set) => {
                const weight = Number(set.weight || set.load || 0)
                const reps = Number(set.reps || 0)
                const volume = weight * reps

                const current = prMap.get(exerciseName) || {
                    exerciseName,
                    muscleGroup,
                    bestWeight: 0,
                    bestWeightReps: 0,
                    bestWeightDate: null,
                    bestWeightWorkoutName: '',
                    bestVolume: 0,
                    bestVolumeWeight: 0,
                    bestVolumeReps: 0,
                    bestVolumeDate: null,
                    bestVolumeWorkoutName: '',
                }

                if (
                    weight > current.bestWeight ||
                    (weight === current.bestWeight && reps > current.bestWeightReps)
                ) {
                    current.bestWeight = weight
                    current.bestWeightReps = reps
                    current.bestWeightDate = date
                    current.bestWeightWorkoutName = workoutName
                }

                if (volume > current.bestVolume) {
                    current.bestVolume = volume
                    current.bestVolumeWeight = weight
                    current.bestVolumeReps = reps
                    current.bestVolumeDate = date
                    current.bestVolumeWorkoutName = workoutName
                }

                prMap.set(exerciseName, current)
            })
        })
    })

    return Array.from(prMap.values())
        .sort((a, b) => b.bestWeight - a.bestWeight)
}

function buildExerciseTimeline(history = [], exerciseName = '') {
    if (!exerciseName) return []

    const timeline = []

    history.forEach((session) => {
        const date = session.finishedAt || session.createdAt
        const workoutName = session.workoutName || 'Treino'
        const exercises = Array.isArray(session.exercises)
            ? session.exercises
            : []

        exercises.forEach((item) => {
            const currentName = getProgressExerciseName(item)

            if (currentName !== exerciseName) return

            const sets = getValidProgressSets(item)

            if (sets.length === 0) return

            const bestSet = sets.reduce((best, current) => {
                const bestWeight = Number(best.weight || best.load || 0)
                const bestReps = Number(best.reps || 0)
                const currentWeight = Number(current.weight || current.load || 0)
                const currentReps = Number(current.reps || 0)

                if (currentWeight > bestWeight) return current

                if (currentWeight === bestWeight && currentReps > bestReps) {
                    return current
                }

                return best
            }, sets[0])

            const totalVolume = sets.reduce((total, set) => total + getSetVolumeValue(set), 0)

            timeline.push({
                date,
                label: new Date(date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                }),
                workoutName,
                bestWeight: Number(bestSet.weight || bestSet.load || 0),
                bestReps: Number(bestSet.reps || 0),
                volume: totalVolume,
                sets: sets.length,
            })
        })
    })

    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date))
}

app.get('/stats/progress', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId
        const exerciseName = req.query.exerciseName || ''

        const [
            user,
            workouts,
            history,
            bodyWeight,
            progressPhotos,
            goals,
        ] = await Promise.all([
            User.findById(userId),
            Workout.find({ userId }).sort({ updatedAt: -1 }),
            WorkoutHistory.find({ userId }).sort({
                finishedAt: 1,
                createdAt: 1,
            }),
            BodyWeight.find({ userId }).sort({
                date: 1,
                createdAt: 1,
            }),
            ProgressPhoto.find({ userId }).sort({
                date: -1,
                createdAt: -1,
            }).limit(8),
        ])

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado.',
            })
        }

        const totalWorkouts = history.length
        const sessionSummaries = history.map((session) => summarizeProgressHistorySession(session))

        const totalVolume = sessionSummaries.reduce((total, item) => total + item.totalVolume, 0)
        const totalSets = sessionSummaries.reduce((total, item) => total + item.totalSets, 0)
        const totalReps = sessionSummaries.reduce((total, item) => total + item.totalReps, 0)

        const totalDurationSeconds = history.reduce((total, session) => {
            return total + Number(session.durationSeconds || session.duration || 0)
        }, 0)

        const weightProgress = buildBodyWeightProgress(bodyWeight)
        const firstWeight = weightProgress[0]?.weight || null
        const currentWeight =
            weightProgress[weightProgress.length - 1]?.weight ||
            user.profile?.currentWeight ||
            null

        const weightChange =
            firstWeight && currentWeight
                ? Number((currentWeight - firstWeight).toFixed(2))
                : 0

        const weeklyProgress = buildWeeklyTrainingProgress(history)
        const monthlyProgress = buildMonthlyTrainingProgress(history)
        const muscleGroups = buildMuscleGroupProgress(history)
        const exercisePrs = buildExercisePrProgress(history)
        const selectedExerciseTimeline = buildExerciseTimeline(history, exerciseName)

        const bestWeek = weeklyProgress
            .slice()
            .sort((a, b) => b.volume - a.volume)[0] || null

        const mostTrainedMuscle = muscleGroups[0] || null

        const bestWeightPr = exercisePrs
            .slice()
            .sort((a, b) => b.bestWeight - a.bestWeight)[0] || null

        const bestVolumePr = exercisePrs
            .slice()
            .sort((a, b) => b.bestVolume - a.bestVolume)[0] || null

        res.json({
            summary: {
                totalSavedWorkouts: workouts.length,
                totalFinishedWorkouts: totalWorkouts,
                totalVolume,
                totalSets,
                totalReps,
                totalDurationSeconds,
                averageVolumePerWorkout:
                    totalWorkouts > 0
                        ? Math.round(totalVolume / totalWorkouts)
                        : 0,
                averageDurationSeconds:
                    totalWorkouts > 0
                        ? Math.round(totalDurationSeconds / totalWorkouts)
                        : 0,
                firstWeight,
                currentWeight,
                weightChange,
                progressPhotoCount: progressPhotos.length,
            },

            insights: {
                bestWeek,
                mostTrainedMuscle,
                bestWeightPr,
                bestVolumePr,
            },

            charts: {
                bodyWeight: weightProgress,
                weeklyProgress,
                monthlyProgress,
                muscleGroups,
                exercisePrs,
                selectedExerciseTimeline,
            },

            recent: {
                workouts: history.slice(-8).reverse(),
                progressPhotos,
                goals,
            },
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao carregar estatísticas de evolução.',
        })
    }
})


app.get('/stats/muscle-recovery', authMiddleware, async (req, res) => {
    try {
        const history = await WorkoutHistory.find({
            userId: req.user.userId,
        })
            .sort({
                finishedAt: -1,
                createdAt: -1,
            })
            .limit(100)

        const muscleMap = new Map()

        MAIN_MUSCLE_GROUPS.forEach((group) => {
            muscleMap.set(group, {
                muscleGroup: group,
                lastTrainedAt: null,
                totalSessions: 0,
                totalSets: 0,
                totalVolume: 0,
            })
        })

        history.forEach((session) => {
            const trainedAt = session.finishedAt || session.createdAt

            if (!trainedAt) return

            const sessionDate = new Date(trainedAt)

            if (Number.isNaN(sessionDate.getTime())) return

            const groupsInThisSession = new Set()

            session.exercises?.forEach((item) => {
                const group = getExerciseMainMuscleGroup(item)

                if (!group) return

                if (!muscleMap.has(group)) {
                    muscleMap.set(group, {
                        muscleGroup: group,
                        lastTrainedAt: null,
                        totalSessions: 0,
                        totalSets: 0,
                        totalVolume: 0,
                    })
                }

                const current = muscleMap.get(group)

                const sets = Array.isArray(item.sets) ? item.sets : []

                const validSets = sets.filter((set) => {
                    const isWarmup = set.type === 'warmup'
                    const isCompleted =
                        set.completed === true ||
                        set.isCompleted === true ||
                        set.done === true

                    return !isWarmup && isCompleted
                })

                const fallbackSets = validSets.length > 0
                    ? validSets
                    : sets.filter((set) => set.type !== 'warmup')

                const volume = fallbackSets.reduce((total, set) => {
                    const weight = Number(set.weight || set.load || 0)
                    const reps = Number(set.reps || 0)

                    return total + weight * reps
                }, 0)

                const currentDate = current.lastTrainedAt
                    ? new Date(current.lastTrainedAt)
                    : null

                muscleMap.set(group, {
                    ...current,
                    lastTrainedAt:
                        !currentDate || sessionDate > currentDate
                            ? trainedAt
                            : current.lastTrainedAt,
                    totalSets: current.totalSets + fallbackSets.length,
                    totalVolume: current.totalVolume + volume,
                })

                groupsInThisSession.add(group)
            })

            groupsInThisSession.forEach((group) => {
                const current = muscleMap.get(group)

                muscleMap.set(group, {
                    ...current,
                    totalSessions: current.totalSessions + 1,
                })
            })
        })

        const recovery = Array.from(muscleMap.values())
            .map((item) => {
                const recoveryStatus = getMuscleRecoveryStatus(item.lastTrainedAt)

                return {
                    ...item,
                    ...recoveryStatus,
                }
            })
            .sort((a, b) => {
                if (a.level === 'unknown' && b.level !== 'unknown') return 1
                if (a.level !== 'unknown' && b.level === 'unknown') return -1

                return a.recoveryPercent - b.recoveryPercent
            })

        res.json({
            recovery,
            generatedAt: new Date(),
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao calcular recuperação muscular.',
        })
    }
})

app.get('/stats/consistency', authMiddleware, async (req, res) => {
    try {
        const history = await WorkoutHistory.find({
            userId: req.user.userId,
        }).sort({
            finishedAt: -1,
            createdAt: -1,
        })

        const currentStreak = calculateCurrentStreak(history)
        const bestStreak = calculateBestStreak(history)

        const workoutsLast7Days = countWorkoutsInLastDays(history, 7)
        const workoutsLast30Days = countWorkoutsInLastDays(history, 30)

        const uniqueWorkoutDays = getUniqueWorkoutDaysFromHistory(history)

        const lastWorkoutDate = uniqueWorkoutDays[0] || null

        res.json({
            currentStreak,
            bestStreak,
            workoutsLast7Days,
            workoutsLast30Days,
            totalWorkoutDays: uniqueWorkoutDays.length,
            lastWorkoutDate,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar estatísticas de consistência.',
        })
    }
})

app.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId

        const [workouts, history, exercises, bodyWeight, goals] = await Promise.all([
            Workout.find({ userId }).sort({ updatedAt: -1 }).limit(20),
            WorkoutHistory.find({ userId }).sort({ finishedAt: -1, createdAt: -1 }).limit(50),
            Exercise.find({ userId }).sort({ isFavorite: -1, updatedAt: -1 }).limit(100),
            BodyWeight.find({ userId }).sort({ date: 1, createdAt: 1 }).limit(100),
            Goal.find({ userId, status: { $ne: 'archived' } }).sort({ deadline: 1, updatedAt: -1 }).limit(5),
        ])

        const consistency = {
            currentStreak: calculateCurrentStreak(history),
            bestStreak: calculateBestStreak(history),
            workoutsLast7Days: countWorkoutsInLastDays(history, 7),
            workoutsLast30Days: countWorkoutsInLastDays(history, 30),
            totalWorkoutDays: getUniqueWorkoutDaysFromHistory(history).length,
            lastWorkoutDate: getUniqueWorkoutDaysFromHistory(history)[0] || null,
        }

        res.json({
            workouts,
            history,
            exercises,
            bodyWeight,
            goals,
            consistency,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao carregar dashboard.',
        })
    }
})



async function verifyUserPasswordForSensitiveAction(req, res, next) {
    try {
        const password = String(req.headers['x-forgeflow-password'] || req.body?.password || '')
        const user = await User.findById(req.user.userId)

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado.',
            })
        }

        const requirement = requireRecentPassword(user, password)

        if (!requirement.ok) {
            return res.status(401).json({
                message: requirement.message,
                reason: 'reauth_required',
            })
        }

        const passwordIsValid = await bcrypt.compare(password, user.passwordHash)

        if (!passwordIsValid) {
            return res.status(401).json({
                message: 'Senha inválida.',
                reason: 'reauth_failed',
            })
        }

        req.currentUser = user
        return next()
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao confirmar senha.',
        })
    }
}


app.get('/export-data', authMiddleware, verifyUserPasswordForSensitiveAction, async (req, res) => {
    try {
        const userId = req.user.userId

        const [
            user,
            settings,
            exercises,
            workouts,
            workoutHistory,
            bodyWeight,
            workoutTemplates,
            progressPhotos,
            goals,
            notifications,
        ] = await Promise.all([
            User.findById(userId),
            AppSettings.findOne({ userId }),
            Exercise.find({ userId }).sort({ createdAt: 1 }),
            Workout.find({ userId }).sort({ createdAt: 1 }),
            WorkoutHistory.find({ userId }).sort({ finishedAt: 1, createdAt: 1 }),
            BodyWeight.find({ userId }).sort({ date: 1, createdAt: 1 }),
            WorkoutTemplate.find({ userId }).sort({ createdAt: 1 }),
            ProgressPhoto.find({ userId }).sort({ date: 1, createdAt: 1 }),
            Goal.find({ userId }).sort({ createdAt: 1 }),
            Notification.find({ userId }).sort({ createdAt: 1 }),
        ])

        if (!user) {
            return res.status(404).json({
                message: 'Usuário não encontrado.',
            })
        }

        const backup = {
            app: 'ForgeFlow',
            version: 1,
            exportedAt: new Date().toISOString(),
            user: {
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                profile: user.profile,
                profileCompleted: user.profileCompleted,
            },
            settings: settings?.data || {},
            data: {
                exercises,
                workouts,
                workoutHistory,
                bodyWeight,
                workoutTemplates,
                progressPhotos,
                goals,
                notifications,
            },
        }

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="forgeflow-backup-${new Date()
                .toISOString()
                .slice(0, 10)}.json"`
        )

        res.json(backup)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao exportar dados.',
        })
    }
})

app.post('/import-data', authMiddleware, async (req, res) => {
    try {
        const { backup, mode = 'merge' } = req.body

        const backupValidation = normalizeBackupPayload(backup)

        if (!backupValidation.valid) {
            return res.status(400).json({
                message: backupValidation.message,
            })
        }

        const safeBackup = backupValidation.value
        const userId = req.user.userId

        const {
            exercises = [],
            workouts = [],
            workoutHistory = [],
            bodyWeight = [],
            workoutTemplates = [],
            progressPhotos = [],
            goals = [],
            notifications = [],
        } = safeBackup.data

        const imported = {
            exercises: 0,
            workouts: 0,
            workoutHistory: 0,
            bodyWeight: 0,
            workoutTemplates: 0,
            progressPhotos: 0,
            goals: 0,
            notifications: 0,
        }

        if (mode === 'replace') {
            await Promise.all([
                Exercise.deleteMany({ userId }),
                Workout.deleteMany({ userId }),
                WorkoutHistory.deleteMany({ userId }),
                BodyWeight.deleteMany({ userId }),
                WorkoutTemplate.deleteMany({ userId }),
                ProgressPhoto.deleteMany({ userId }),
                Goal.deleteMany({ userId }),
                Notification.deleteMany({ userId }),
            ])
        }

        const exercisesToCreate = cleanArrayForImport(exercises, userId)
        const workoutsToCreate = cleanArrayForImport(workouts, userId)
        const historyToCreate = cleanArrayForImport(workoutHistory, userId)
        const bodyWeightToCreate = cleanArrayForImport(bodyWeight, userId)
        const templatesToCreate = cleanArrayForImport(workoutTemplates, userId)
        const progressPhotosToCreate = cleanArrayForImport(progressPhotos, userId)
        const goalsToCreate = cleanArrayForImport(goals, userId)
        const notificationsToCreate = cleanArrayForImport(notifications, userId)

        if (exercisesToCreate.length > 0) {
            const created = await Exercise.insertMany(exercisesToCreate, {
                ordered: true,
            })

            imported.exercises = created.length
        }

        if (workoutsToCreate.length > 0) {
            const created = await Workout.insertMany(workoutsToCreate, {
                ordered: true,
            })

            imported.workouts = created.length
        }

        if (historyToCreate.length > 0) {
            const created = await WorkoutHistory.insertMany(historyToCreate, {
                ordered: true,
            })

            imported.workoutHistory = created.length
        }

        if (bodyWeightToCreate.length > 0) {
            const created = await BodyWeight.insertMany(bodyWeightToCreate, {
                ordered: true,
            })

            imported.bodyWeight = created.length
        }

        if (templatesToCreate.length > 0) {
            const created = await WorkoutTemplate.insertMany(templatesToCreate, {
                ordered: true,
            })

            imported.workoutTemplates = created.length
        }

        if (progressPhotosToCreate.length > 0) {
            const created = await ProgressPhoto.insertMany(progressPhotosToCreate, {
                ordered: true,
            })

            imported.progressPhotos = created.length
        }

        if (goalsToCreate.length > 0) {
            const created = await Goal.insertMany(goalsToCreate, {
                ordered: true,
            })

            imported.goals = created.length
        }

        if (notificationsToCreate.length > 0) {
            const created = await Notification.insertMany(notificationsToCreate, {
                ordered: true,
            })

            imported.notifications = created.length
        }

        if (safeBackup.user?.profile) {
            const user = await User.findById(userId)

            if (user) {
                user.profile = {
                    ...user.profile,
                    ...safeBackup.user.profile,
                }

                user.profileCompleted = buildProfileCompletion(user.profile)

                if (safeBackup.user.name) {
                    user.name = safeBackup.user.name
                }

                if (safeBackup.user.avatarUrl) {
                    user.avatarUrl = safeBackup.user.avatarUrl
                }

                await user.save()
            }
        }

        if (safeBackup.settings) {
            await AppSettings.findOneAndUpdate(
                { userId },
                {
                    userId,
                    data: safeBackup.settings,
                },
                {
                    new: true,
                    upsert: true,
                }
            )
        }

        res.json({
            ok: true,
            mode,
            imported,
            message: 'Backup importado com sucesso.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao importar backup.',
        })
    }
})

app.get('/export/workout-history.csv', authMiddleware, verifyUserPasswordForSensitiveAction, async (req, res) => {
    try {
        const history = await WorkoutHistory.find({
            userId: req.user.userId,
        }).sort({
            finishedAt: 1,
            createdAt: 1,
        })

        const rows = getHistoryRows(history)

        const headers = [
            'Data',
            'Treino',
            'Exercício',
            'Grupo muscular',
            'Equipamento',
            'Série',
            'Tipo',
            'Concluída',
            'Peso',
            'Reps',
            'Volume',
            'Duração segundos',
            'Notas',
        ]

        const csvLines = [
            headers.map(escapeCsv).join(';'),
            ...rows.map((row) =>
                [
                    row.date ? new Date(row.date).toLocaleDateString('pt-BR') : '',
                    row.workoutName,
                    row.exerciseName,
                    row.muscleGroup,
                    row.equipment,
                    row.setNumber,
                    row.setType,
                    row.completed ? 'Sim' : 'Não',
                    row.weight,
                    row.reps,
                    row.volume,
                    row.durationSeconds,
                    row.notes,
                ]
                    .map(escapeCsv)
                    .join(';')
            ),
        ]

        const csv = `\uFEFF${csvLines.join('\n')}`

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="forgeflow-historico-${new Date()
                .toISOString()
                .slice(0, 10)}.csv"`
        )

        res.send(csv)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao exportar histórico em CSV.',
        })
    }
})

app.get('/export/report.pdf', authMiddleware, async (req, res) => {
    try {
        let PDFDocument

        try {
            const pdfkit = await import('pdfkit')
            PDFDocument = pdfkit.default
        } catch {
            return res.status(500).json({
                message: 'Para exportar PDF, instale a dependência pdfkit no backend: npm install pdfkit',
            })
        }

        const userId = req.user.userId

        const [user, workouts, history, bodyWeight] = await Promise.all([
            User.findById(userId),
            Workout.find({ userId }),
            WorkoutHistory.find({ userId }).sort({
                finishedAt: -1,
                createdAt: -1,
            }),
            BodyWeight.find({ userId }).sort({
                date: 1,
                createdAt: 1,
            }),
        ])

        const totalWorkouts = history.length
        const totalVolume = history.reduce((total, session) => total + Number(session.totalVolume || 0), 0)
        const totalSets = history.reduce((total, session) => total + Number(session.totalSets || 0), 0)
        const totalDuration = history.reduce((total, session) => total + Number(session.durationSeconds || 0), 0)

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
        })

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="forgeflow-relatorio-${new Date()
                .toISOString()
                .slice(0, 10)}.pdf"`
        )

        doc.pipe(res)

        doc
            .fontSize(22)
            .text('ForgeFlow - Relatório de Evolução', {
                align: 'center',
            })

        doc.moveDown()

        doc
            .fontSize(12)
            .text(`Usuário: ${user?.name || 'Usuário'}`)
            .text(`E-mail: ${user?.email || ''}`)
            .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`)

        doc.moveDown()
        doc.fontSize(16).text('Resumo geral')
        doc.moveDown(0.5)

        doc
            .fontSize(12)
            .text(`Treinos salvos: ${workouts.length}`)
            .text(`Treinos finalizados: ${totalWorkouts}`)
            .text(`Volume total: ${totalVolume.toLocaleString('pt-BR')} kg`)
            .text(`Séries concluídas: ${totalSets}`)
            .text(`Tempo total: ${Math.round(totalDuration / 60)} min`)

        if (bodyWeight.length > 0) {
            const first = bodyWeight[0]
            const last = bodyWeight[bodyWeight.length - 1]

            doc.moveDown()
            doc.fontSize(16).text('Peso corporal')
            doc.moveDown(0.5)
            doc
                .fontSize(12)
                .text(`Primeiro registro: ${Number(first.weight || 0).toLocaleString('pt-BR')} kg`)
                .text(`Último registro: ${Number(last.weight || 0).toLocaleString('pt-BR')} kg`)
        }

        doc.moveDown()
        doc.fontSize(16).text('Últimos treinos')
        doc.moveDown(0.5)

        history.slice(0, 10).forEach((session) => {
            const date = session.finishedAt || session.createdAt

            doc
                .fontSize(11)
                .text(
                    `${date ? new Date(date).toLocaleDateString('pt-BR') : '-'} - ${session.workoutName || 'Treino'} | Volume: ${Number(session.totalVolume || 0).toLocaleString('pt-BR')} kg | Séries: ${session.totalSets || 0}`
                )
        })

        doc.end()
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao exportar relatório em PDF.',
        })
    }
})

app.get('/workout-templates', authMiddleware, async (req, res) => {
    try {
        const templates = await WorkoutTemplate.find({
            userId: req.user.userId,
        }).sort({
            isFavorite: -1,
            updatedAt: -1,
            createdAt: -1,
        })

        res.json(templates)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar templates de treino.',
        })
    }
})

app.post('/workout-templates', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            description = '',
            category = 'Personalizado',
            goal = '',
            difficulty = '',
            estimatedDuration = null,
            exercises = [],
            isFavorite = false,
            source = 'User',
        } = req.body

        if (!name?.trim()) {
            return res.status(400).json({
                message: 'Informe o nome do template.',
            })
        }

        const template = await WorkoutTemplate.create({
            userId: req.user.userId,
            name: name.trim(),
            description,
            category,
            goal,
            difficulty,
            estimatedDuration,
            exercises,
            isFavorite: Boolean(isFavorite),
            source,
        })

        res.status(201).json(template)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao criar template de treino.',
        })
    }
})

app.post('/workout-templates/seed-defaults', authMiddleware, async (req, res) => {
    try {
        const existingTemplates = await WorkoutTemplate.find({
            userId: req.user.userId,
            source: 'ForgeFlow',
        })

        const userExercises = await Exercise.find({
            userId: req.user.userId,
        }).sort({
            isFavorite: -1,
            updatedAt: -1,
            createdAt: -1,
        })

        if (existingTemplates.length > 0) {
            const updatedTemplates = []

            for (const defaultTemplate of DEFAULT_WORKOUT_TEMPLATES) {
                const existingTemplate = existingTemplates.find((template) => {
                    return String(template.name || '').toLowerCase().split(' ')[0] ===
                        String(defaultTemplate.name || '').toLowerCase().split(' ')[0]
                })

                if (!existingTemplate) continue

                existingTemplate.name = defaultTemplate.name
                existingTemplate.description = defaultTemplate.description
                existingTemplate.category = defaultTemplate.category
                existingTemplate.goal = defaultTemplate.goal
                existingTemplate.difficulty = defaultTemplate.difficulty
                existingTemplate.estimatedDuration = defaultTemplate.estimatedDuration
                existingTemplate.source = 'ForgeFlow'
                existingTemplate.exercises = buildDefaultTemplateExercises(defaultTemplate.name, userExercises)

                await existingTemplate.save()
                updatedTemplates.push(existingTemplate)
            }

            return res.json({
                created: 0,
                updated: updatedTemplates.length,
                templates: updatedTemplates.length > 0 ? updatedTemplates : existingTemplates,
                message: 'Templates padrão já existiam e foram atualizados.',
            })
        }

        const templatesToCreate = DEFAULT_WORKOUT_TEMPLATES.map((template) => ({
            ...template,
            userId: req.user.userId,
            exercises: buildDefaultTemplateExercises(template.name, userExercises),
        }))

        const createdTemplates = await WorkoutTemplate.insertMany(templatesToCreate)

        res.status(201).json({
            created: createdTemplates.length,
            templates: createdTemplates,
            message: 'Templates padrão criados com sucesso.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao criar templates padrão.',
        })
    }
})


app.post('/workout-templates/fill-defaults', authMiddleware, async (req, res) => {
    try {
        const userExercises = await Exercise.find({
            userId: req.user.userId,
        }).sort({
            isFavorite: -1,
            updatedAt: -1,
            createdAt: -1,
        })

        const existingTemplates = await WorkoutTemplate.find({
            userId: req.user.userId,
            source: 'ForgeFlow',
        })

        const updatedTemplates = []

        for (const defaultTemplate of DEFAULT_WORKOUT_TEMPLATES) {
            const existingTemplate = existingTemplates.find((template) => {
                return String(template.name || '').toLowerCase().split(' ')[0] ===
                    String(defaultTemplate.name || '').toLowerCase().split(' ')[0]
            })

            const templateData = {
                ...defaultTemplate,
                userId: req.user.userId,
                exercises: buildDefaultTemplateExercises(defaultTemplate.name, userExercises),
            }

            if (existingTemplate) {
                existingTemplate.name = templateData.name
                existingTemplate.description = templateData.description
                existingTemplate.category = templateData.category
                existingTemplate.goal = templateData.goal
                existingTemplate.difficulty = templateData.difficulty
                existingTemplate.estimatedDuration = templateData.estimatedDuration
                existingTemplate.source = 'ForgeFlow'
                existingTemplate.exercises = templateData.exercises

                await existingTemplate.save()
                updatedTemplates.push(existingTemplate)
            } else {
                const createdTemplate = await WorkoutTemplate.create(templateData)
                updatedTemplates.push(createdTemplate)
            }
        }

        res.json({
            updated: updatedTemplates.length,
            templates: updatedTemplates,
            message: 'Templates padrão recriados com exercícios sugeridos.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao preencher templates padrão.',
        })
    }
})

app.put('/workout-templates/:id', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            goal,
            difficulty,
            estimatedDuration,
            exercises,
            isFavorite,
        } = req.body

        const updateData = {}

        if (name !== undefined) {
            if (!name?.trim()) {
                return res.status(400).json({
                    message: 'Informe o nome do template.',
                })
            }

            updateData.name = name.trim()
        }

        if (description !== undefined) updateData.description = description
        if (category !== undefined) updateData.category = category
        if (goal !== undefined) updateData.goal = goal
        if (difficulty !== undefined) updateData.difficulty = difficulty
        if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration
        if (exercises !== undefined) updateData.exercises = exercises
        if (isFavorite !== undefined) updateData.isFavorite = Boolean(isFavorite)

        const template = await WorkoutTemplate.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            updateData,
            {
                new: true,
            }
        )

        if (!template) {
            return res.status(404).json({
                message: 'Template não encontrado.',
            })
        }

        res.json(template)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao atualizar template.',
        })
    }
})

app.patch('/workout-templates/:id/favorite', authMiddleware, async (req, res) => {
    try {
        const template = await WorkoutTemplate.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!template) {
            return res.status(404).json({
                message: 'Template não encontrado.',
            })
        }

        template.isFavorite = !template.isFavorite

        await template.save()

        res.json(template)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao atualizar favorito do template.',
        })
    }
})

app.delete('/workout-templates/:id', authMiddleware, async (req, res) => {
    try {
        const template = await WorkoutTemplate.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!template) {
            return res.status(404).json({
                message: 'Template não encontrado.',
            })
        }

        res.json({
            ok: true,
            message: 'Template removido com sucesso.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao remover template.',
        })
    }
})

app.post('/workout-templates/:id/create-workout', authMiddleware, async (req, res) => {
    try {
        const template = await WorkoutTemplate.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!template) {
            return res.status(404).json({
                message: 'Template não encontrado.',
            })
        }

        const workout = await Workout.create({
            userId: req.user.userId,
            name: req.body.name?.trim() || template.name,
            description: template.description,
            folderId: req.body.folderId || null,
            folderName: '',
            exercises: template.exercises || [],
            estimatedDuration: template.estimatedDuration || null,
        })

        res.status(201).json(workout)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao criar treino a partir do template.',
        })
    }
})


app.get('/progress-photos', authMiddleware, async (req, res) => {
    try {
        const photos = await ProgressPhoto.find({
            userId: req.user.userId,
        }).sort({
            date: -1,
            createdAt: -1,
        })

        res.json(photos)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar fotos de evolução.',
        })
    }
})

app.post(
    '/progress-photos',
    authMiddleware,
    upload.single('photo'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: 'Envie uma imagem.',
                })
            }

            const {
                date,
                angle = 'front',
                weight,
                note = '',
            } = req.body

            const allowedAngles = ['front', 'side', 'back', 'other']
            const safeAngle = allowedAngles.includes(angle) ? angle : 'front'

            const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
                folder: `forgeflow/progress-photos/${req.user.userId}`,
                resource_type: 'image',
                transformation: [
                    {
                        width: 1200,
                        height: 1200,
                        crop: 'limit',
                        quality: 'auto',
                        fetch_format: 'auto',
                    },
                ],
            })

            const photo = await ProgressPhoto.create({
                userId: req.user.userId,
                imageUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                date: date || new Date(),
                angle: safeAngle,
                weight: parseDecimal(weight),
                note: String(note || '').trim().slice(0, 500),
            })

            res.status(201).json(photo)
        } catch (error) {
            console.error(error)

            res.status(500).json({
                message: error.message || 'Erro ao enviar foto de evolução.',
            })
        }
    }
)

app.put('/progress-photos/:id', authMiddleware, async (req, res) => {
    try {
        const {
            date,
            angle,
            weight,
            note,
        } = req.body

        const allowedAngles = ['front', 'side', 'back', 'other']
        const updateData = {}

        if (date !== undefined) updateData.date = date

        if (angle !== undefined) {
            updateData.angle = allowedAngles.includes(angle) ? angle : 'front'
        }

        if (weight !== undefined) updateData.weight = parseDecimal(weight)
        if (note !== undefined) updateData.note = String(note || '').trim().slice(0, 500)

        const photo = await ProgressPhoto.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            updateData,
            {
                new: true,
            }
        )

        if (!photo) {
            return res.status(404).json({
                message: 'Foto não encontrada.',
            })
        }

        res.json(photo)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao atualizar foto de evolução.',
        })
    }
})

app.delete('/progress-photos/:id', authMiddleware, async (req, res) => {
    try {
        const photo = await ProgressPhoto.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!photo) {
            return res.status(404).json({
                message: 'Foto não encontrada.',
            })
        }

        await cloudinary.uploader.destroy(photo.publicId)
        await ProgressPhoto.deleteOne({ _id: photo._id })

        res.json({
            ok: true,
            message: 'Foto removida com sucesso.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao remover foto de evolução.',
        })
    }
})

app.get('/exercises', authMiddleware, async (req, res) => {
    const exercises = await Exercise.find({
        userId: req.user.userId,
    }).sort({
        isFavorite: -1,
        updatedAt: -1,
        createdAt: -1,
    })

    res.json(exercises)
})

app.post('/exercises', authMiddleware, async (req, res) => {
    const exercise = await Exercise.create({
        ...req.body,
        userId: req.user.userId,
        isFavorite: Boolean(req.body.isFavorite),
    })

    res.status(201).json(exercise)
})

app.post('/exercises/import-defaults', authMiddleware, async (req, res) => {
    try {
        const { exercises = [] } = req.body

        if (!Array.isArray(exercises) || exercises.length === 0) {
            return res.status(400).json({
                message: 'Nenhum exercício enviado para importação.',
            })
        }

        const existingExercises = await Exercise.find({
            userId: req.user.userId,
        })

        const existingKeys = new Set(
            existingExercises.map((exercise) => {
                const name = String(exercise.name || '').trim().toLowerCase()
                const group = String(exercise.muscleGroup || '').trim().toLowerCase()
                const equipment = String(exercise.equipment || '').trim().toLowerCase()

                return `${name}|${group}|${equipment}`
            })
        )

        const safeExercises = exercises
            .filter((exercise) => exercise?.name)
            .map((exercise) => {
                const name = String(exercise.name || '').trim()
                const muscleGroup = String(exercise.muscleGroup || '').trim()
                const equipment = String(exercise.equipment || '').trim()

                const key = `${name.toLowerCase()}|${muscleGroup.toLowerCase()}|${equipment.toLowerCase()}`

                return {
                    key,
                    data: {
                        userId: req.user.userId,
                        name,
                        originalName: exercise.originalName || '',
                        muscleGroup,
                        targetMuscle: exercise.targetMuscle || '',
                        secondaryMuscles: Array.isArray(exercise.secondaryMuscles)
                            ? exercise.secondaryMuscles
                            : [],
                        equipment,
                        difficulty: exercise.difficulty || '',
                        movementPattern: exercise.movementPattern || '',
                        description: exercise.description || '',
                        mediaUrl: exercise.mediaUrl || '',
                        gifUrl: exercise.gifUrl || '',
                        uploadedFileName: exercise.uploadedFileName || '',
                        media: {
                            gif: exercise.media?.gif || '',
                            image: exercise.media?.image || '',
                        },
                        instructions: Array.isArray(exercise.instructions)
                            ? exercise.instructions
                            : [],
                        execution: Array.isArray(exercise.execution)
                            ? exercise.execution
                            : [],
                        tips: Array.isArray(exercise.tips)
                            ? exercise.tips
                            : [],
                        variations: Array.isArray(exercise.variations)
                            ? exercise.variations
                            : [],
                        commonMistakes: Array.isArray(exercise.commonMistakes)
                            ? exercise.commonMistakes
                            : [],
                        isFavorite: Boolean(exercise.isFavorite),
                        source: exercise.source || 'ForgeFlow',
                    },
                }
            })
            .filter((item) => !existingKeys.has(item.key))

        const exercisesToCreate = safeExercises.map((item) => item.data)

        const createdExercises =
            exercisesToCreate.length > 0
                ? await Exercise.insertMany(exercisesToCreate)
                : []

        const allExercises = await Exercise.find({
            userId: req.user.userId,
        }).sort({
            isFavorite: -1,
            updatedAt: -1,
            createdAt: -1,
        })

        res.status(201).json({
            imported: createdExercises.length,
            skipped: exercises.length - createdExercises.length,
            exercises: allExercises,
            message:
                createdExercises.length > 0
                    ? 'Biblioteca padrão importada com sucesso.'
                    : 'Nenhum exercício novo para importar.',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao importar biblioteca padrão.',
        })
    }
})

app.put('/exercises/:id', authMiddleware, async (req, res) => {
    const exercise = await Exercise.findOneAndUpdate(
        {
            _id: req.params.id,
            userId: req.user.userId,
        },
        req.body,
        {
            new: true,
        }
    )

    if (!exercise) {
        return res.status(404).json({
            message: 'Exercício não encontrado.',
        })
    }

    res.json(exercise)
})

app.patch('/exercises/:id/favorite', authMiddleware, async (req, res) => {
    try {
        const exercise = await Exercise.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        })

        if (!exercise) {
            return res.status(404).json({
                message: 'Exercício não encontrado.',
            })
        }

        exercise.isFavorite = !exercise.isFavorite

        await exercise.save()

        res.json(exercise)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao atualizar favorito do exercício.',
        })
    }
})

app.delete('/exercises/:id', authMiddleware, async (req, res) => {
    const exercise = await Exercise.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.userId,
    })

    if (!exercise) {
        return res.status(404).json({
            message: 'Exercício não encontrado.',
        })
    }

    res.json({
        ok: true,
        message: 'Exercício removido com sucesso.',
    })
})

app.use(notFoundHandler)
app.use(globalErrorHandler)

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`)
})