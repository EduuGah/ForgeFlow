import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, saveAuthToken } from '../services/api'
import { useAuth } from '../context/AuthContext'
import forgeflowIcon from '../assets/forgeflow-icon.png'
import { applyAppSettingsToDocument, getAppSettings } from '../utils/settingsUtils'

const API_URL = import.meta.env.VITE_API_URL

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
            />
            <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
            />
        </svg>
    )
}

function Login() {
    const navigate = useNavigate()
    const { setUser } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        applyAppSettingsToDocument(getAppSettings())
    }, [])

    function handleGoogleLogin() {
        window.location.href = `${API_URL}/auth/google`
    }

    async function handleSubmit(event) {
        event.preventDefault()

        setError('')
        setLoading(true)

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
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

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--ff-bg)] px-4 text-[var(--ff-text)]">
            <div className="w-full max-w-md rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-8 shadow-2xl">
                <div className="login-logo-card mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white">
                    <img
                        src={forgeflowIcon}
                        alt="ForgeFlow"
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="mt-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-lg font-black tracking-tight text-[var(--ff-text)]">
                            Forge
                        </span>
                        <span className="text-lg font-black tracking-tight text-[var(--ff-accent)] drop-shadow-[0_0_16px_var(--ff-accent-shadow)]">
                            Flow
                        </span>
                    </div>

                    <h1 className="mt-2 text-3xl font-black">
                        Entrar na sua conta
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                        Entre para salvar seus exercícios, treinos e histórico no banco de dados.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-[var(--ff-text)]">
                            E-mail
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="voce@email.com"
                            className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-sm text-[var(--ff-text)] outline-none transition placeholder:text-[var(--ff-muted-2)] focus:border-[var(--ff-accent-border)]"
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
                            placeholder="Sua senha"
                            className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-sm text-[var(--ff-text)] outline-none transition placeholder:text-[var(--ff-muted-2)] focus:border-[var(--ff-accent-border)]"
                        />
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-semibold text-red-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white transition hover:bg-[var(--ff-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[var(--ff-border)]" />
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted-2)]">
                        ou
                    </span>
                    <div className="h-px flex-1 bg-[var(--ff-border)]" />
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="group flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-sm font-black text-[var(--ff-text)] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)] active:translate-y-0"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm transition group-hover:scale-105">
                        <GoogleIcon />
                    </span>

                    <span>Entrar com Google</span>
                </button>

                <p className="mt-5 text-center text-sm text-[var(--ff-muted)]">
                    Não tem conta?{' '}
                    <Link
                        to="/register"
                        className="font-bold text-[var(--ff-accent-text)] hover:underline"
                    >
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login
