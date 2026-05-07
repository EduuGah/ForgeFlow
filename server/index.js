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

requiredEnv('FRONTEND_URL', FRONTEND_URL)
requiredEnv('BACKEND_URL', BACKEND_URL)
requiredEnv('MONGODB_URI', MONGODB_URI)
requiredEnv('GOOGLE_CLIENT_ID', GOOGLE_CLIENT_ID)
requiredEnv('GOOGLE_CLIENT_SECRET', GOOGLE_CLIENT_SECRET)
requiredEnv('JWT_SECRET', JWT_SECRET)
requiredEnv('SESSION_SECRET', SESSION_SECRET)

const normalizedFrontendUrl = FRONTEND_URL.replace(/\/$/, '')
const normalizedBackendUrl = BACKEND_URL.replace(/\/$/, '')

app.use(express.json({ limit: '1mb' }))
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
const WorkoutHistory = mongoose.model('WorkoutHistory', workoutHistorySchema)

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

app.get('/exercises', authMiddleware, async (req, res) => {
    const exercises = await Exercise.find({
        userId: req.user.userId,
    }).sort({
        createdAt: -1,
    })

    res.json(exercises)
})

app.post('/exercises', authMiddleware, async (req, res) => {
    const exercise = await Exercise.create({
        ...req.body,
        userId: req.user.userId,
    })

    res.status(201).json(exercise)
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