import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import { apiFetch } from '../services/api'
import { useAuth } from '../context/AuthContext'

function formatDate(value) {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function Admin() {
  const { user } = useAuth()

  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

  const isAdmin = user?.role === 'admin'

  function showToast(type, title, message = '') {
    setToast({ type, title, message })
    window.setTimeout(() => setToast(null), 3500)
  }

  async function loadUsers() {
    setLoading(true)

    try {
      const data = await apiFetch('/admin/users')
      setUsers(Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao carregar usuários', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserDetails(userId) {
    setLoadingDetails(true)
    setDetails(null)

    try {
      const data = await apiFetch(`/admin/users/${userId}`)
      setDetails(data)
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao carregar detalhes', error.message)
    } finally {
      setLoadingDetails(false)
    }
  }

  function handleSelectUser(item) {
    setSelectedUser(item)
    setResetPassword('')
    loadUserDetails(item.id || item._id)
  }

  async function handleAdminResetPassword() {
    if (!selectedUser) return

    const safePassword = resetPassword.trim()

    if (safePassword.length < 6) {
      showToast('error', 'Senha muito curta', 'Use pelo menos 6 caracteres.')
      return
    }

    try {
      await apiFetch(`/admin/users/${selectedUser.id || selectedUser._id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({
          password: safePassword,
        }),
      })

      setResetPassword('')
      showToast(
        'success',
        'Senha redefinida',
        'A nova senha temporária foi aplicada para este usuário.'
      )
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao redefinir senha', error.message)
    }
  }

  async function handleClearActiveWorkout() {
    if (!selectedUser) return

    try {
      await apiFetch(`/admin/users/${selectedUser.id || selectedUser._id}/active-workout`, {
        method: 'DELETE',
      })

      showToast('success', 'Treino ativo limpo', 'A sessão ativa do usuário foi removida.')
      loadUserDetails(selectedUser.id || selectedUser._id)
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao limpar treino ativo', error.message)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    loadUsers()
  }, [isAdmin])

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()

    if (!term) return users

    return users.filter((item) => {
      const searchable = `${item.name || ''} ${item.email || ''}`.toLowerCase()
      return searchable.includes(term)
    })
  }, [users, query])

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Admin"
          description="Área restrita para administradores."
        />

        <Card className="border-red-500/20 bg-red-500/10">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 text-red-300" size={24} />

            <div>
              <h2 className="text-xl font-black text-red-100">
                Acesso negado
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-red-100/75">
                Sua conta não possui permissão de administrador.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="ff-hevy-admin space-y-6">
      <PageHeader
        title="Admin"
        description="Gerencie usuários, suporte e redefinição de senha."
        action={
          <Badge variant="purple">
            <ShieldCheck size={13} />
            Administrador
          </Badge>
        }
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.4fr)]">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[var(--ff-text)]">
                Usuários
              </h2>
              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                {loading ? 'Carregando...' : `${filteredUsers.length} conta(s)`}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-accent-text)]">
              <UsersRound size={20} />
            </div>
          </div>

          <div className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4">
            <Search size={18} className="text-[var(--ff-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
            />
          </div>

          <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-6 text-sm text-[var(--ff-muted)]">
                <Loader2 className="animate-spin" size={18} />
                Carregando usuários...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5 text-sm text-[var(--ff-muted)]">
                Nenhum usuário encontrado.
              </div>
            ) : (
              filteredUsers.map((item) => {
                const itemId = item.id || item._id
                const isSelected = selectedUser && (selectedUser.id || selectedUser._id) === itemId

                return (
                  <button
                    key={itemId}
                    type="button"
                    onClick={() => handleSelectUser(item)}
                    className={[
                      'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition',
                      isSelected
                        ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]'
                        : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:border-[var(--ff-accent-border)]',
                    ].join(' ')}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-accent-text)]">
                      <UserRound size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[var(--ff-text)]">
                        {item.name || 'Sem nome'}
                      </p>
                      <p className="truncate text-xs text-[var(--ff-muted)]">
                        {item.email}
                      </p>
                    </div>

                    {item.role === 'admin' && (
                      <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-2 py-1 text-[10px] font-black uppercase text-purple-200">
                        Admin
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <div className="space-y-5">
          {!selectedUser ? (
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 text-[var(--ff-accent-text)]" size={26} />
                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">
                    Selecione um usuário
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                    Escolha uma conta para visualizar dados básicos, suporte e ações administrativas.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
                      Conta selecionada
                    </p>
                    <h2 className="mt-2 truncate text-2xl font-black text-[var(--ff-text)]">
                      {selectedUser.name || 'Sem nome'}
                    </h2>
                    <p className="mt-1 truncate text-sm text-[var(--ff-muted)]">
                      {selectedUser.email}
                    </p>
                  </div>

                  <Badge variant={selectedUser.role === 'admin' ? 'purple' : 'default'}>
                    {selectedUser.role || 'user'}
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                    <p className="text-xs text-[var(--ff-muted)]">Criado em</p>
                    <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                    <p className="text-xs text-[var(--ff-muted)]">Perfil</p>
                    <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                      {selectedUser.profileCompleted ? 'Completo' : 'Incompleto'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                    <p className="text-xs text-[var(--ff-muted)]">Login</p>
                    <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                      {selectedUser.provider || 'email'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-500/10 text-yellow-200">
                    <KeyRound size={20} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-[var(--ff-text)]">
                      Resetar senha
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                      Defina uma senha temporária. A senha atual não é exibida nem recuperável.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    type="text"
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    placeholder="Nova senha temporária"
                    className="h-12 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition focus:border-[var(--ff-accent-border)]"
                  />

                  <Button
                    type="button"
                    onClick={() =>
                      setConfirmModal({
                        title: 'Resetar senha?',
                        description: `A senha de ${selectedUser.email} será alterada para a senha informada.`,
                        confirmText: 'Resetar senha',
                        variant: 'danger',
                        onConfirm: () => {
                          setConfirmModal(null)
                          handleAdminResetPassword()
                        },
                      })
                    }
                  >
                    Resetar
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[var(--ff-text)]">
                      Suporte rápido
                    </h2>
                    <p className="mt-1 text-sm text-[var(--ff-muted)]">
                      Dados principais e ações seguras.
                    </p>
                  </div>

                  {loadingDetails && <Loader2 className="animate-spin text-[var(--ff-muted)]" size={20} />}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <p className="text-xs text-[var(--ff-muted)]">Treinos</p>
                    <p className="mt-1 text-2xl font-black text-[var(--ff-text)]">
                      {details?.counts?.workouts ?? '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <p className="text-xs text-[var(--ff-muted)]">Histórico</p>
                    <p className="mt-1 text-2xl font-black text-[var(--ff-text)]">
                      {details?.counts?.history ?? '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <p className="text-xs text-[var(--ff-muted)]">Treino ativo</p>
                    <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                      {details?.activeWorkout ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => loadUserDetails(selectedUser.id || selectedUser._id)}
                  >
                    Atualizar dados
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    onClick={() =>
                      setConfirmModal({
                        title: 'Limpar treino ativo?',
                        description: 'Use isso apenas se a sessão ativa do usuário estiver travada.',
                        confirmText: 'Limpar treino ativo',
                        variant: 'danger',
                        onConfirm: () => {
                          setConfirmModal(null)
                          handleClearActiveWorkout()
                        },
                      })
                    }
                  >
                    <Trash2 size={16} />
                    Limpar treino ativo
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </section>

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Admin
