import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, KeyRound } from 'lucide-react'

import { apiFetch } from '../services/api'
import forgeflowIcon from '../assets/forgeflow-icon.png'
import { unlockGlobalScroll } from '../utils/scrollLockUtils'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    unlockGlobalScroll()
    return () => unlockGlobalScroll()
  }, [])

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
      setError(requestError.message || 'Nao foi possivel redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="ff-hevy-page ff-hevy-page-resetpassword ff-auth-route text-[var(--ff-text)]">
      <section className="ff-auth-route__shell">
        <div className="ff-auth-card">
          <div className="flex items-center gap-3">
            <img
              src={forgeflowIcon}
              alt="ForgeFlow"
              className="h-12 w-12 rounded-2xl object-cover"
            />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
                Conta
              </p>
              <h1 className="text-2xl font-black">Nova senha</h1>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-[var(--ff-accent-border)]/25 bg-[var(--ff-accent-soft)]/10 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent)] text-white shadow-[0_0_20px_var(--ff-accent-shadow)]">
                <KeyRound size={20} />
              </span>
              <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                Defina uma senha nova. Este link expira por seguranca.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                Nova senha
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition placeholder:text-[var(--ff-muted-2)] focus:border-[var(--ff-accent-border)]"
                placeholder="Minimo 6 caracteres"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                Confirmar senha
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition placeholder:text-[var(--ff-muted-2)] focus:border-[var(--ff-accent-border)]"
                placeholder="Repita a senha"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
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
            className="mt-5 block text-center text-sm font-bold text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]"
          >
            Voltar para login
          </Link>
        </div>
      </section>
    </main>
  )
}

export default ResetPassword
