import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, KeyRound, Mail, RefreshCw } from 'lucide-react'

import { apiFetch } from '../services/api'
import forgeflowIcon from '../assets/forgeflow-icon.png'
import { unlockGlobalScroll } from '../utils/scrollLockUtils'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [debugResetUrl, setDebugResetUrl] = useState('')
  const [debugResetCode, setDebugResetCode] = useState('')
  const [codeStepVisible, setCodeStepVisible] = useState(false)

  useEffect(() => {
    unlockGlobalScroll()
    return () => unlockGlobalScroll()
  }, [])

  async function handleSendCode(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    setDebugResetUrl('')
    setDebugResetCode('')

    try {
      const result = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      setCodeStepVisible(true)
      setMessage(result?.message || 'Se existir uma conta com este e-mail, enviaremos um codigo de recuperacao.')

      if (result?.resetUrl) setDebugResetUrl(result.resetUrl)
      if (result?.resetCode) setDebugResetCode(result.resetCode)
    } catch (requestError) {
      console.error(requestError)
      setCodeStepVisible(true)
      setMessage('Se existir uma conta com este e-mail, enviaremos um codigo de recuperacao.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetWithCode(event) {
    event.preventDefault()
    setResetting(true)
    setError('')
    setMessage('')

    try {
      const result = await apiFetch('/auth/reset-password-code', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code,
          password,
          confirmPassword,
        }),
      })

      setMessage(result?.message || 'Senha redefinida com sucesso. Volte para o login.')
      setCode('')
      setPassword('')
      setConfirmPassword('')
      setDebugResetCode('')
      setDebugResetUrl('')
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel redefinir a senha com este codigo.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <main className="ff-hevy-page ff-hevy-page-forgotpassword ff-auth-route text-[var(--ff-text)]">
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
              <h1 className="text-2xl font-black">Recuperar senha</h1>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-[var(--ff-muted)]">
            Envie um codigo para o e-mail da conta e defina uma senha nova sem sair desta tela.
          </p>

          <form onSubmit={handleSendCode} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                E-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition placeholder:text-[var(--ff-muted-2)] focus:border-[var(--ff-accent-border)]"
                placeholder="seu@email.com"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <RefreshCw size={17} className="animate-spin" /> : <Mail size={17} />}
              {loading ? 'Enviando...' : codeStepVisible ? 'Reenviar codigo' : 'Enviar codigo'}
            </button>
          </form>

          {codeStepVisible && (
            <form onSubmit={handleResetWithCode} className="mt-5 space-y-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <div className="flex items-center gap-2 text-sm font-black">
                <KeyRound size={18} className="text-[var(--ff-accent-text)]" />
                Codigo e nova senha
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                  Codigo recebido
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-center text-xl font-black tracking-[0.26em] text-[var(--ff-text)] outline-none transition placeholder:text-[var(--ff-muted-2)] focus:border-[var(--ff-accent-border)]"
                  placeholder="000000"
                />
              </label>

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
                disabled={resetting || code.length !== 6}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={18} />
                {resetting ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}

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

          {import.meta.env.DEV && (debugResetUrl || debugResetCode) && (
            <div className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-100">
              <p className="font-black">Modo desenvolvimento</p>
              {debugResetCode && <p className="mt-1">Codigo: <span className="font-black tracking-[0.16em]">{debugResetCode}</span></p>}
              {debugResetUrl && <p className="mt-1 break-all">{debugResetUrl}</p>}
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

export default ForgotPassword
