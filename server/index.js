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

dotenv.config()

// Ajuda quando o Windows/rede dá erro com mongodb+srv
dns.setServers(['1.1.1.1', '8.8.8.8'])

const app = express()

const {
    PORT = 3001,
    FRONTEND_URL,
    BACKEND_URL,
    MONGODB_URI,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    JWT_SECRET,
    SESSION_SECRET,
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

const normalizedFrontendUrl = FRONTEND_URL.replace(/\/$/, '')
const normalizedBackendUrl = BACKEND_URL.replace(/\/$/, '')

app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use(
    cors({
        origin: normalizedFrontendUrl,
        credentials: true,
    })
)

app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
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

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)
const Workout = mongoose.model('Workout', workoutSchema)
const WorkoutTemplate = mongoose.model('WorkoutTemplate', workoutTemplateSchema)
const WorkoutHistory = mongoose.model('WorkoutHistory', workoutHistorySchema)
const BodyWeight = mongoose.model('BodyWeight', bodyWeightSchema)

function createToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
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

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Você precisa estar logado.',
        })
    }

    const token = authHeader.split(' ')[1]

    try {
        req.user = jwt.verify(token, JWT_SECRET)
        next()
    } catch {
        return res.status(401).json({
            message: 'Token inválido ou expirado.',
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
                    user.googleId = profile.id
                    user.name = user.name || profile.displayName
                    user.avatarUrl = profile.photos?.[0]?.value || user.avatarUrl
                    user.provider = user.passwordHash ? 'both' : 'google'

                    user = await user.save()
                } else {
                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email,
                        avatarUrl: profile.photos?.[0]?.value || '',
                        provider: 'google',
                        profileCompleted: false,
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

app.get('/health', (req, res) => {
    res.json({
        ok: true,
        message: 'ForgeFlow API online.',
    })
})

app.get(
    '/auth/google',
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
    (req, res) => {
        const token = createToken(req.user)

        res.redirect(`${normalizedFrontendUrl}/auth/callback?token=${token}`)
    }
)

app.post('/auth/register', async (req, res) => {
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

    const token = createToken(user)

    res.status(201).json({
        token,
        user: buildUserResponse(user),
    })
})

app.post('/auth/login', async (req, res) => {
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

    const token = createToken(user)

    res.json({
        token,
        user: buildUserResponse(user),
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

function calculateWorkoutHistorySummary(exercises = []) {
    let totalVolume = 0
    let totalSets = 0
    let totalReps = 0

    for (const item of exercises) {
        const sets = Array.isArray(item.sets) ? item.sets : []

        for (const set of sets) {
            const isCompleted =
                set.completed === true ||
                set.isCompleted === true ||
                set.done === true

            if (!isCompleted) continue

            const weight = Number(set.weight || set.load || 0)
            const reps = Number(set.reps || 0)

            totalSets += 1
            totalReps += Number.isFinite(reps) ? reps : 0

            if (Number.isFinite(weight) && Number.isFinite(reps)) {
                totalVolume += weight * reps
            }
        }
    }

    return {
        totalVolume,
        totalSets,
        totalReps,
    }
}

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

        res.json(history)
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

        res.json(historyItem)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao buscar treino do histórico.',
        })
    }
})

app.post('/workout-history', authMiddleware, async (req, res) => {
    try {
        const {
            workoutId = null,
            workoutName,
            name,
            exercises = [],
            durationSeconds = 0,
            startedAt = null,
            finishedAt = new Date(),
            prs = [],
            notes = '',
        } = req.body

        const finalWorkoutName = workoutName || name

        if (!finalWorkoutName?.trim()) {
            return res.status(400).json({
                message: 'Informe o nome do treino finalizado.',
            })
        }

        const summary = calculateWorkoutHistorySummary(exercises)

        const historyItem = await WorkoutHistory.create({
            userId: req.user.userId,
            workoutId: workoutId || null,
            workoutName: finalWorkoutName.trim(),
            exercises,
            durationSeconds: Number(durationSeconds) || 0,
            startedAt: startedAt || null,
            finishedAt: finishedAt || new Date(),
            totalVolume: summary.totalVolume,
            totalSets: summary.totalSets,
            totalReps: summary.totalReps,
            prs: Array.isArray(prs) ? prs : [],
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

        const [workouts, history, exercises, bodyWeight] = await Promise.all([
            Workout.find({ userId }).sort({ updatedAt: -1 }).limit(20),
            WorkoutHistory.find({ userId }).sort({ finishedAt: -1, createdAt: -1 }).limit(50),
            Exercise.find({ userId }).sort({ isFavorite: -1, updatedAt: -1 }).limit(100),
            BodyWeight.find({ userId }).sort({ date: 1, createdAt: 1 }).limit(100),
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
            consistency,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Erro ao carregar dashboard.',
        })
    }
})


app.get('/export-data', authMiddleware, async (req, res) => {
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
        ] = await Promise.all([
            User.findById(userId),
            AppSettings.findOne({ userId }),
            Exercise.find({ userId }).sort({ createdAt: 1 }),
            Workout.find({ userId }).sort({ createdAt: 1 }),
            WorkoutHistory.find({ userId }).sort({ finishedAt: 1, createdAt: 1 }),
            BodyWeight.find({ userId }).sort({ date: 1, createdAt: 1 }),
            WorkoutTemplate.find({ userId }).sort({ createdAt: 1 }),
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

        if (!backup || backup.app !== 'ForgeFlow' || !backup.data) {
            return res.status(400).json({
                message: 'Arquivo de backup inválido.',
            })
        }

        const userId = req.user.userId

        const {
            exercises = [],
            workouts = [],
            workoutHistory = [],
            bodyWeight = [],
            workoutTemplates = [],
        } = backup.data

        const imported = {
            exercises: 0,
            workouts: 0,
            workoutHistory: 0,
            bodyWeight: 0,
            workoutTemplates: 0,
        }

        if (mode === 'replace') {
            await Promise.all([
                Exercise.deleteMany({ userId }),
                Workout.deleteMany({ userId }),
                WorkoutHistory.deleteMany({ userId }),
                BodyWeight.deleteMany({ userId }),
                WorkoutTemplate.deleteMany({ userId }),
            ])
        }

        const exercisesToCreate = cleanArrayForImport(exercises, userId)
        const workoutsToCreate = cleanArrayForImport(workouts, userId)
        const historyToCreate = cleanArrayForImport(workoutHistory, userId)
        const bodyWeightToCreate = cleanArrayForImport(bodyWeight, userId)
        const templatesToCreate = cleanArrayForImport(workoutTemplates, userId)

        if (exercisesToCreate.length > 0) {
            const created = await Exercise.insertMany(exercisesToCreate, {
                ordered: false,
            })

            imported.exercises = created.length
        }

        if (workoutsToCreate.length > 0) {
            const created = await Workout.insertMany(workoutsToCreate, {
                ordered: false,
            })

            imported.workouts = created.length
        }

        if (historyToCreate.length > 0) {
            const created = await WorkoutHistory.insertMany(historyToCreate, {
                ordered: false,
            })

            imported.workoutHistory = created.length
        }

        if (bodyWeightToCreate.length > 0) {
            const created = await BodyWeight.insertMany(bodyWeightToCreate, {
                ordered: false,
            })

            imported.bodyWeight = created.length
        }

        if (templatesToCreate.length > 0) {
            const created = await WorkoutTemplate.insertMany(templatesToCreate, {
                ordered: false,
            })

            imported.workoutTemplates = created.length
        }

        if (backup.user?.profile) {
            const user = await User.findById(userId)

            if (user) {
                user.profile = {
                    ...user.profile,
                    ...backup.user.profile,
                }

                user.profileCompleted = buildProfileCompletion(user.profile)

                if (backup.user.name) {
                    user.name = backup.user.name
                }

                if (backup.user.avatarUrl) {
                    user.avatarUrl = backup.user.avatarUrl
                }

                await user.save()
            }
        }

        if (backup.settings) {
            await AppSettings.findOneAndUpdate(
                { userId },
                {
                    userId,
                    data: backup.settings,
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

app.get('/export/workout-history.csv', authMiddleware, async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`)
})