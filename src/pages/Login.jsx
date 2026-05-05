import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, saveAuthToken } from '../services/api'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

function Login() {
    const navigate = useNavigate()
    const { setUser } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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
                body: JSON.stringify({
                    email,
                    password,
                }),
            })

            saveAuthToken(data.token)
            setUser(data.user)

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
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
            <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121216] p-8 shadow-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_30px_var(--ff-accent-shadow)]/30">
                    <span className="text-2xl font-black">F</span>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm font-bold text-[var(--ff-accent-text)]">
                        ForgeFlow
                    </p>

                    <h1 className="mt-2 text-3xl font-black">
                        Entrar na sua conta
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                        Entre para salvar seus exercícios, treinos e histórico no banco de dados.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
                            E-mail
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="voce@email.com"
                            className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none transition focus:border-[var(--ff-accent-border)]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
                            Senha
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Sua senha"
                            className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none transition focus:border-[var(--ff-accent-border)]"
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
                    <div className="h-px flex-1 bg-zinc-800" />
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-600">
                        ou
                    </span>
                    <div className="h-px flex-1 bg-zinc-800" />
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white text-sm font-black text-zinc-950 transition hover:bg-zinc-200"
                >
                    <span className="text-lg">G</span>
                    Entrar com Google
                </button>

                <p className="mt-5 text-center text-sm text-zinc-500">
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