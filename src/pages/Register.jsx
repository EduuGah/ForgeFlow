import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, saveAuthToken } from '../services/api'
import { useAuth } from '../context/AuthContext'
import forgeflowIcon from '../assets/forgeflow-icon.png'
import { applyAppSettingsToDocument, getAppSettings } from '../utils/settingsUtils'
import { getGoogleLoginUrl } from '../utils/platformUtils'

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://forgeflow-citr.onrender.com')).replace(/\/$/, '')

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

function Register() {
    const navigate = useNavigate()
    const { setUser } = useAuth()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        applyAppSettingsToDocument(getAppSettings())
    }, [])

    function handleGoogleLogin() {
        window.location.href = getGoogleLoginUrl(API_URL)
    }

    async function handleSubmit(event) {
        event.preventDefault()

        setError('')
        setLoading(true)

        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password }),
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
    <div className="ff-hevy-page ff-hevy-page-register">

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
                        Criar conta
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                        Crie sua conta para salvar exercícios, treinos e histórico no banco de dados.
                    </p>
                </div>

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

                    <span>Criar/entrar com Google</span>
                </button>

                <div className="mt-5">
                    <p className="text-center text-sm text-[var(--ff-muted)]">
                        Já tem conta?{' '}
                        <Link
                            to="/login"
                            className="font-bold text-[var(--ff-accent-text)] transition hover:text-[var(--ff-accent-hover)]"
                        >
                            Entrar
                        </Link>
                    </p>
                </div>

          <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-bold text-[var(--ff-muted)]">
            <Link to="/privacy" className="transition hover:text-[var(--ff-accent-text)]">
              Privacidade
            </Link>
            <Link to="/delete-account" className="transition hover:text-[var(--ff-accent-text)]">
              Excluir conta
            </Link>
            <Link to="/data-safety" className="transition hover:text-[var(--ff-accent-text)]">
              Data Safety
            </Link>
          </div>
            </div>
        </div>
    
    </div>
  )
}

export default Register
