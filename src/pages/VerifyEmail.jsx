import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react'

import forgeflowIcon from '../assets/forgeflow-icon.png'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { unlockGlobalScroll } from '../utils/scrollLockUtils'

function getVerificationStorageKey(user) {
  const id = user?.id || user?._id || user?.email || 'anonymous'
  return `forgeflow:email-verification-dev-code:${id}`
}

function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setUser, logout } = useAuth()

  const [code, setCode] = useState('')
  const [message, setMessage] = useState(location.state?.message || 'Enviamos um codigo para o seu e-mail.')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [devCode, setDevCode] = useState('')

  const emailLabel = useMemo(() => user?.email || 'seu e-mail', [user?.email])

  useEffect(() => {
    unlockGlobalScroll()
    return () => unlockGlobalScroll()
  }, [])

  useEffect(() => {
    if (!user) return

    if (user.emailVerified !== false) {
      navigate(user.profileCompleted ? '/' : '/complete-profile', { replace: true })
      return
    }

    const storageKey = getVerificationStorageKey(user)
    const storedDevCode = window.sessionStorage.getItem(storageKey) || location.state?.devCode || ''
    setDevCode(storedDevCode)
  }, [location.state?.devCode, navigate, user])

  async function handleResend() {
    setError('')
    setMessage('')
    setResending(true)

    try {
      const result = await apiFetch('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      if (result?.user) {
        setUser(result.user)
      }

      if (result?.devCode) {
        window.sessionStorage.setItem(getVerificationStorageKey(user), result.devCode)
        setDevCode(result.devCode)
      }

      setMessage(result?.message || 'Codigo reenviado para o seu e-mail.')
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel reenviar o codigo.')
    } finally {
      setResending(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const result = await apiFetch('/auth/verify-email-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })

      const nextUser = result?.user || user

      if (nextUser) {
        setUser(nextUser)
        window.sessionStorage.removeItem(getVerificationStorageKey(nextUser))
      }

      setMessage(result?.message || 'E-mail verificado com sucesso.')

      window.setTimeout(() => {
        navigate(nextUser?.profileCompleted ? '/' : '/complete-profile', { replace: true })
      }, 550)
    } catch (requestError) {
      setError(requestError.message || 'Codigo invalido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  function handleBackToLogin() {
    logout({ redirect: false })
    navigate('/login', { replace: true })
  }

  return (
    <main className="ff-hevy-page ff-hevy-page-verifyemail ff-auth-route text-[var(--ff-text)]">
      <section className="ff-auth-route__shell">
        <div className="ff-auth-card">
          <div className="flex items-center gap-3">
            <img
              src={forgeflowIcon}
              alt="ForgeFlow"
              className="h-12 w-12 rounded-2xl object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
                Verificacao
              </p>
              <h1 className="text-2xl font-black">Confirme seu e-mail</h1>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-[var(--ff-accent-border)]/25 bg-[var(--ff-accent-soft)]/10 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent)] text-white shadow-[0_0_20px_var(--ff-accent-shadow)]">
                <MailCheck size={21} />
              </span>
              <div className="min-w-0">
                <strong className="block text-sm">Codigo enviado</strong>
                <p className="mt-1 break-words text-sm leading-relaxed text-[var(--ff-muted)]">
                  Digite o codigo de 6 numeros enviado para {emailLabel}.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                Codigo de verificacao
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="h-14 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-center text-2xl font-black tracking-[0.32em] text-[var(--ff-text)] outline-none transition placeholder:text-[var(--ff-muted-2)] focus:border-[var(--ff-accent-border)]"
                placeholder="000000"
              />
            </label>

            {message && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm leading-relaxed text-emerald-200">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-sm leading-relaxed text-red-200">
                {error}
              </div>
            )}

            {import.meta.env.DEV && devCode && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
                <strong className="block">Modo desenvolvimento</strong>
                Codigo: <span className="font-black tracking-[0.16em]">{devCode}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
              {loading ? 'Verificando...' : 'Verificar e continuar'}
            </button>
          </form>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
              {resending ? 'Reenviando...' : 'Reenviar codigo'}
            </button>

            <div className="flex items-start gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-xs leading-relaxed text-[var(--ff-muted)]">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
              <span>Essa etapa protege sua conta e libera o onboarding sem travar o app.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="mt-5 block w-full text-center text-sm font-bold text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]"
          >
            Voltar para login
          </button>
        </div>
      </section>
    </main>
  )
}

export default VerifyEmail
