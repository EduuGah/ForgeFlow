import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { apiFetch } from '../services/api'
import forgeflowIcon from '../assets/forgeflow-icon.png'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const result = await apiFetch(`/auth/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({
          password,
          confirmPassword,
        }),
      })

      setMessage(result?.message || 'Senha redefinida com sucesso.')

      window.setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (requestError) {
      console.error(requestError)
      setError(requestError.message || 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-resetpassword">

    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <img
            src={forgeflowIcon}
            alt="ForgeFlow"
            className="h-12 w-12 rounded-2xl object-cover"
          />
          <div>
            <h1 className="text-2xl font-black">Nova senha</h1>
            <p className="text-sm text-zinc-400">ForgeFlow</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
              Nova senha
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-bold outline-none transition focus:border-violet-500"
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
              Confirmar senha
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
              className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-bold outline-none transition focus:border-violet-500"
              placeholder="Repita a senha"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-violet-600 text-sm font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-relaxed text-red-200">
            {error}
          </div>
        )}

        <Link
          to="/login"
          className="mt-5 block text-center text-sm font-bold text-zinc-400 transition hover:text-white"
        >
          Voltar para login
        </Link>
      </section>
    </main>
  
    </div>
  )
}

export default ResetPassword
