import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        applyAppSettingsToDocument(getAppSettings())
    }, [])

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
            </div>
        </div>
    )
}

export default Register
