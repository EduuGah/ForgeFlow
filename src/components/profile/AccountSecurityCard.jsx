import { useState } from 'react'
import { KeyRound, Lock, ShieldCheck } from 'lucide-react'

import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'

import { apiFetch } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function AccountSecurityCard({ onSuccess }) {
  const { user, setUser } = useAuth()

  const alreadyHasPassword =
    user?.provider === 'credentials' || user?.provider === 'both'

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage(null)

    if (!password || !confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Informe a nova senha e a confirmação.',
      })
      return
    }

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'As senhas não conferem.',
      })
      return
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'A senha precisa ter pelo menos 6 caracteres.',
      })
      return
    }

    setLoading(true)

    try {
      const data = await apiFetch('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          password,
          confirmPassword,
        }),
      })

      setUser(data.user)

      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')

      setMessage({
        type: 'success',
        text: data.message || 'Senha atualizada com sucesso.',
      })

      onSuccess?.(data.user)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
          <ShieldCheck size={24} />
        </div>

        <div>
          <h2 className="text-xl font-bold">
            Segurança da conta
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            {alreadyHasPassword
              ? 'Altere sua senha de acesso por e-mail.'
              : 'Crie uma senha para entrar também com e-mail, além do Google.'}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
          <KeyRound size={17} className="text-[var(--ff-accent-text)]" />

          Tipo de acesso
        </div>

        <p className="mt-2 text-sm text-zinc-500">
          {user?.provider === 'both'
            ? 'Sua conta pode entrar com Google e e-mail/senha.'
            : user?.provider === 'google'
              ? 'Sua conta entra apenas com Google. Crie uma senha para ativar login por e-mail.'
              : 'Sua conta entra com e-mail e senha.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {alreadyHasPassword && (
          <Input
            label="Senha atual"
            type="password"
            placeholder="Digite sua senha atual"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        )}

        <Input
          label={alreadyHasPassword ? 'Nova senha' : 'Criar senha'}
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Input
          label="Confirmar senha"
          type="password"
          placeholder="Digite novamente"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        {message && (
          <div
            className={
              message.type === 'success'
                ? 'rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300'
                : 'rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-semibold text-red-300'
            }
          >
            {message.text}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          <Lock size={17} />
          {loading
            ? 'Salvando...'
            : alreadyHasPassword
              ? 'Alterar senha'
              : 'Criar senha'}
        </Button>
      </form>
    </Card>
  )
}

export default AccountSecurityCard