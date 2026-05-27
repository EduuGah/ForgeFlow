import { useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../services/api'
import forgeflowIcon from '../assets/forgeflow-icon.png'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [debugResetUrl, setDebugResetUrl] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setDebugResetUrl('')

    try {
      const result = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      setMessage(result?.message || 'Se existir uma conta com este e-mail, enviaremos um link de recuperação.')

      if (result?.resetUrl) {
        setDebugResetUrl(result.resetUrl)
      }
    } catch (error) {
      console.error(error)
      setMessage('Se existir uma conta com este e-mail, enviaremos um link de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-forgotpassword">

    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <img
            src={forgeflowIcon}
            alt="ForgeFlow"
            className="h-12 w-12 rounded-2xl object-cover"
          />
          <div>
            <h1 className="text-2xl font-black">Recuperar senha</h1>
            <p className="text-sm text-zinc-400">ForgeFlow</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-zinc-400">
          Informe seu e-mail. Se existir uma conta com senha tradicional, enviaremos um link de recuperação.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
              E-mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-bold outline-none transition focus:border-violet-500"
              placeholder="seu@email.com"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-violet-600 text-sm font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-200">
            {message}
          </div>
        )}

        {debugResetUrl && (
          <div className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-100">
            <p className="font-black">Modo desenvolvimento</p>
            <p className="mt-1 break-all">{debugResetUrl}</p>
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

export default ForgotPassword
