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
requiredEnv('MONGODB_URI', MONGODB_URI)
requiredEnv('GOOGLE_CLIENT_ID', GOOGLE_CLIENT_ID)
requiredEnv('GOOGLE_CLIENT_SECRET', GOOGLE_CLIENT_SECRET)
requiredEnv('JWT_SECRET', JWT_SECRET)
requiredEnv('SESSION_SECRET', SESSION_SECRET)

const normalizedFrontendUrl = FRONTEND_URL.replace(/\/$/, '')

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

        source: {
            type: String,
            default: 'User',
        },
    },
    {
        timestamps: true,
    }
)

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)

function createToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
        },
        JWT_SECRET,
        {
            expiresIn: '7d',
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
            callbackURL: '/auth/google/callback',
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

app.put('/settings', authMiddleware, async (req, res) => {
    const settings = await AppSettings.findOneAndUpdate(
        {
            userId: req.user.userId,
        },
        {
            userId: req.user.userId,
            data: req.body,
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

    if (!user || !user.passwordHash) {
        return res.status(401).json({
            message: 'E-mail ou senha inválidos.',
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
    const user = await User.findById(req.user.userId).select('-passwordHash -__v')

    if (!user) {
        return res.status(404).json({
            message: 'Usuário não encontrado.',
        })
    }

    res.json(user)
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

    const user = await User.findByIdAndUpdate(
        req.user.userId,
        {
            ...(name ? { name: name.trim() } : {}),
            ...(avatarUrl !== undefined ? { avatarUrl } : {}),
            profile,
            profileCompleted,
        },
        {
            new: true,
        }
    ).select('-passwordHash -__v')

    if (!user) {
        return res.status(404).json({
            message: 'Usuário não encontrado.',
        })
    }

    res.json(user)
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