import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Mail, RotateCcw, ShieldCheck } from 'lucide-react'
import { apiFetch, saveAuthToken } from '../services/api'
import { useAuth } from '../context/AuthContext'
import forgeflowIcon from '../assets/forgeflow-icon.png'
import { applyAppSettingsToDocument, getAppSettings } from '../utils/settingsUtils'

function Register() {
    const navigate = useNavigate()
    const { setUser } = useAuth()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [pendingEmail, setPendingEmail] = useState('')
    const [devCode, setDevCode] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState('register')

    useEffect(() => {
        applyAppSettingsToDocument(getAppSettings())
    }, [])

    async function handleSubmit(event) {
        event.preventDefault()

        setError('')
        setMessage('')
        setLoading(true)

        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password }),
            })

            if (data.requiresEmailVerification) {
                setPendingEmail(data.email || email)
                setDevCode(data.devCode || '')
                setStep('verify')
                setMessage(
                    data.emailSent
                        ? 'Enviamos um código de 4 dígitos para seu e-mail.'
                        : 'Código gerado. Configure SMTP para envio real por e-mail.'
                )
                return
            }

            saveAuthToken(data.token)
            setUser(data.user)

            if (!data.user?.profileCompleted) {
                navigate('/complete-profile')
                return
            }

            navigate('/')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyEmail(event) {
        event.preventDefault()

        setError('')
        setMessage('')
        setLoading(true)

        try {
            const data = await apiFetch('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({
                    email: pendingEmail,
                    code: verificationCode,
                }),
            })

            saveAuthToken(data.token)
            setUser(data.user)

            if (!data.user?.profileCompleted) {
                navigate('/complete-profile')
                return
            }

            navigate('/')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleResendCode() {
        setError('')
        setMessage('')
        setLoading(true)

        try {
            const data = await apiFetch('/auth/resend-verification-code', {
                method: 'POST',
                body: JSON.stringify({
                    email: pendingEmail || email,
                }),
            })

            setDevCode(data.devCode || '')
            setMessage(
                data.emailSent
                    ? 'Novo código enviado para o e-mail.'
                    : 'Novo código gerado. Configure SMTP para envio real por e-mail.'
            )
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--ff-bg)] px-4 py-10 text-[var(--ff-text)]">
            <div className="w-full max-w-md rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-8 shadow-2xl">
                <div className="login-logo-card mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white">
                    <img
                        src={forgeflowIcon}
                        alt="ForgeFlow"
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm font-bold text-[var(--ff-accent-text)]">
                        ForgeFlow
                    </p>

                    <h1 className="mt-2 text-3xl font-black">
                        {step === 'verify' ? 'Verificar e-mail' : 'Criar conta'}
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                        {step === 'verify'
                            ? `Digite o código de 4 dígitos enviado para ${pendingEmail}.`
                            : 'Crie sua conta para salvar exercícios, treinos e histórico no banco de dados.'}
                    </p>
                </div>

                {step === 'verify' ? (
                    <form onSubmit={handleVerifyEmail} className="mt-7 space-y-4">
                        <div className="rounded-3xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-card)] text-[var(--ff-accent-text)]">
                                    <Mail size={20} />
                                </div>

                                <div>
                                    <p className="text-sm font-black text-[var(--ff-text)]">
                                        Código de confirmação
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">
                                        O código expira em 15 minutos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-[var(--ff-text)]">
                                Código de 4 dígitos
                            </label>

                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(event) => {
                                    const value = event.target.value.replace(/\D/g, '').slice(0, 4)
                                    setVerificationCode(value)
                                }}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={4}
                                required
                                className="h-16 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-center text-3xl font-black tracking-[0.45em] text-[var(--ff-text)] outline-none transition focus:border-[var(--ff-accent-border)]"
                                placeholder="0000"
                            />
                        </div>

                        {devCode && (
                            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                                <p className="font-black">Código de teste:</p>
                                <p className="mt-1 text-2xl font-black tracking-[0.35em]">{devCode}</p>
                                <p className="mt-1 text-xs text-amber-100/75">
                                    Isso aparece porque o SMTP não está configurado.
                                </p>
                            </div>
                        )}

                        {message && (
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <ShieldCheck size={17} />
                            {loading ? 'Verificando...' : 'Verificar e entrar'}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={loading}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-sm font-black text-[var(--ff-text-soft)] disabled:opacity-60"
                        >
                            <RotateCcw size={16} />
                            Reenviar código
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setStep('register')
                                setVerificationCode('')
                                setError('')
                                setMessage('')
                            }}
                            className="w-full text-center text-sm font-bold text-[var(--ff-muted)]"
                        >
                            Voltar e corrigir cadastro
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-[var(--ff-text)]">
                                Nome
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                                className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm text-[var(--ff-text)] outline-none transition focus:border-[var(--ff-accent-border)]"
                                placeholder="Seu nome"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-[var(--ff-text)]">
                                E-mail
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm text-[var(--ff-text)] outline-none transition focus:border-[var(--ff-accent-border)]"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-[var(--ff-text)]">
                                Senha
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm text-[var(--ff-text)] outline-none transition focus:border-[var(--ff-accent-border)]"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Criando...' : 'Criar conta'}
                        </button>

                        <p className="text-center text-sm text-[var(--ff-muted)]">
                            Já tem conta?{' '}
                            <Link
                                to="/login"
                                className="font-bold text-[var(--ff-accent-text)] transition hover:text-[var(--ff-accent-hover)]"
                            >
                                Entrar
                            </Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    )
}

export default Register
