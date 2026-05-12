import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'

import { apiFetch } from '../services/api'
import forgeflowIcon from '../assets/forgeflow-icon.png'
import { applyAppSettingsToDocument, getAppSettings } from '../utils/settingsUtils'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState('')
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
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      setSent(true)
      setDevResetUrl(data?.resetUrl || '')
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
          <img src={forgeflowIcon} alt="ForgeFlow" className="h-full w-full object-cover" />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-bold text-[var(--ff-accent-text)]">ForgeFlow</p>
          <h1 className="mt-2 text-3xl font-black">Esqueci minha senha</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ff-muted)]">
            Informe seu e-mail. Se a conta existir, enviaremos um link para redefinir a senha.
          </p>
        </div>

        {sent ? (
          <div className="mt-7 rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-center">
            <CheckCircle2 className="mx-auto text-emerald-300" size={34} />
            <h2 className="mt-3 text-lg font-black text-emerald-100">
              Verifique seu e-mail
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/75">
              Se houver uma conta para esse e-mail, o link de recuperação foi gerado.
            </p>

            {devResetUrl && (
              <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-left">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-200">
                  Ambiente sem e-mail configurado
                </p>
                <a
                  href={devResetUrl}
                  className="mt-2 block break-all text-sm font-bold text-amber-100 underline"
                >
                  {devResetUrl}
                </a>
              </div>
            )}

            <Link
              to="/login"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-black text-white"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--ff-text)]">
                E-mail
              </label>
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4">
                <Mail size={18} className="text-[var(--ff-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-transparent text-sm font-bold text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
                  placeholder="seu@email.com"
                />
              </div>
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
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>

            <Link
              to="/login"
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-sm font-black text-[var(--ff-text-soft)]"
            >
              <ArrowLeft size={16} />
              Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
