import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  History,
  KeyRound,
  Loader2,
  LockOpen,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  UsersRound,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import { apiFetch } from '../services/api'
import { useAuth } from '../context/AuthContext'

function formatDate(value, withTime = false) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    ...(withTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  })
}

function formatLastLogin(value) {
  if (!value) return 'Ainda não registrado'

  return formatDate(value, true)
}

function formatDuration(seconds = 0) {
  const total = Number(seconds || 0)
  const minutes = Math.floor(total / 60)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours > 0) return `${hours}h ${rest}min`
  return `${minutes}min`
}

function getUserId(item) {
  return item?.id || item?._id || ''
}

function Admin() {
  const { user } = useAuth()

  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [copied, setCopied] = useState('')

  const isAdmin = user?.role === 'admin'

  function showToast(type, title, message = '') {
    setToast({ type, title, message })
    window.setTimeout(() => setToast(null), 3500)
  }

  async function copyText(value, label) {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      showToast('success', 'Copiado', `${label} copiado para a área de transferência.`)
      window.setTimeout(() => setCopied(''), 1800)
    } catch {
      showToast('error', 'Não foi possível copiar', 'Copie manualmente.')
    }
  }

  async function loadUsers() {
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (providerFilter !== 'all') params.set('provider', providerFilter)
      params.set('limit', '200')

      const data = await apiFetch(`/admin/users?${params.toString()}`)
      const nextUsers = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : []
      setUsers(nextUsers)

      if (selectedUser) {
        const current = nextUsers.find((item) => getUserId(item) === getUserId(selectedUser))
        if (current) setSelectedUser(current)
      }
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao carregar usuários', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserDetails(userId) {
    if (!userId) return

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
    loadUserDetails(getUserId(item))
  }

  async function runUserAction(action, successMessage) {
    if (!selectedUser) return

    setActionLoading(true)

    try {
      await action()
      showToast('success', 'Tudo certo', successMessage)
      await loadUsers()
      await loadUserDetails(getUserId(selectedUser))
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro na ação admin', error.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAdminResetPassword() {
    if (!selectedUser) return

    const safePassword = resetPassword.trim()

    if (safePassword.length < 6) {
      showToast('error', 'Senha muito curta', 'Use pelo menos 6 caracteres.')
      return
    }

    await runUserAction(
      () =>
        apiFetch(`/admin/users/${getUserId(selectedUser)}/reset-password`, {
          method: 'POST',
          body: JSON.stringify({
            password: safePassword,
          }),
        }),
      'Senha temporária aplicada.'
    )

    setResetPassword('')
  }

  async function handleToggleRole() {
    if (!selectedUser) return

    const nextRole = selectedUser.role === 'admin' ? 'user' : 'admin'

    await runUserAction(
      () =>
        apiFetch(`/admin/users/${getUserId(selectedUser)}/role`, {
          method: 'PATCH',
          body: JSON.stringify({
            role: nextRole,
          }),
        }),
      nextRole === 'admin' ? 'Usuário promovido a admin.' : 'Usuário rebaixado para comum.'
    )
  }

  async function handleToggleBlock() {
    if (!selectedUser) return

    const nextBlocked = !selectedUser.isBlocked

    await runUserAction(
      () =>
        apiFetch(`/admin/users/${getUserId(selectedUser)}/block`, {
          method: 'PATCH',
          body: JSON.stringify({
            blocked: nextBlocked,
          }),
        }),
      nextBlocked ? 'Usuário bloqueado.' : 'Usuário desbloqueado.'
    )
  }

  async function handleClearActiveWorkout() {
    if (!selectedUser) return

    await runUserAction(
      () =>
        apiFetch(`/admin/users/${getUserId(selectedUser)}/active-workout`, {
          method: 'DELETE',
        }),
      'Treino ativo removido, se existia.'
    )
  }

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, roleFilter, statusFilter, providerFilter])

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()

    if (!term) return users

    return users.filter((item) => {
      const searchable = `${item.name || ''} ${item.email || ''}`.toLowerCase()
      return searchable.includes(term)
    })
  }, [users, query])

  const selectedUserId = getUserId(selectedUser)
  const activeWorkout = details?.activeWorkout
  const historySummary = Array.isArray(details?.historySummary) ? details.historySummary : []
  const logs = Array.isArray(details?.logs) ? details.logs : []

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin" description="Área restrita para administradores." />

        <Card className="border-red-500/20 bg-red-500/10">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 text-red-300" size={24} />

            <div>
              <h2 className="text-xl font-black text-red-100">Acesso negado</h2>
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
        title="Admin avançado"
        description="Gerencie usuários, permissões, bloqueios, suporte e logs."
        action={
          <Badge variant="purple">
            <ShieldCheck size={13} />
            Administrador
          </Badge>
        }
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(390px,0.85fr)_minmax(0,1.55fr)]">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[var(--ff-text)]">Usuários</h2>
              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                {loading ? 'Carregando...' : `${filteredUsers.length} conta(s)`}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_18px_var(--ff-accent-shadow)]">
              <UsersRound size={20} />
            </div>
          </div>

          <div className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4">
            <Search size={18} className="text-[var(--ff-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') loadUsers()
              }}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
            />
          </div>

          <div className="admin-filter-grid mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text)] outline-none"
            >
              <option value="all">Todos roles</option>
              <option value="admin">Admins</option>
              <option value="user">Usuários</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text)] outline-none"
            >
              <option value="all">Todos status</option>
              <option value="active">Ativos</option>
              <option value="blocked">Bloqueados</option>
            </select>

            <select
              value={providerFilter}
              onChange={(event) => setProviderFilter(event.target.value)}
              className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text)] outline-none"
            >
              <option value="all">Todos logins</option>
              <option value="credentials">E-mail</option>
              <option value="google">Google</option>
              <option value="both">Ambos</option>
            </select>
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={loadUsers} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              Buscar
            </Button>
          </div>

          <div className="mt-4 max-h-[640px] space-y-2 overflow-y-auto pr-1">
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
                const itemId = getUserId(item)
                const isSelected = selectedUserId === itemId

                return (
                  <button
                    key={itemId}
                    type="button"
                    onClick={() => handleSelectUser(item)}
                    className={[
                      'admin-user-row flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition',
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
                      <p className="truncate text-xs text-[var(--ff-muted)]">{item.email}</p>
                      <p className="mt-1 text-[11px] text-[var(--ff-muted)]">
                        Último login: {formatLastLogin(item.lastLoginAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {item.role === 'admin' && <Badge variant="purple">Admin</Badge>}
                      {item.isBlocked && <Badge variant="red">Bloqueado</Badge>}
                    </div>
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
                  <h2 className="text-xl font-black text-[var(--ff-text)]">Selecione um usuário</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                    Escolha uma conta para visualizar dados, histórico, treino ativo e ações administrativas.
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
                    <p className="mt-1 truncate text-sm text-[var(--ff-muted)]">{selectedUser.email}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={selectedUser.role === 'admin' ? 'purple' : 'default'}>
                      {selectedUser.role || 'user'}
                    </Badge>
                    {selectedUser.isBlocked ? <Badge variant="red">Bloqueado</Badge> : <Badge variant="green">Ativo</Badge>}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                    <p className="text-xs text-[var(--ff-muted)]">Criado em</p>
                    <p className="mt-1 text-sm font-black text-[var(--ff-text)]">{formatDate(selectedUser.createdAt)}</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                    <p className="text-xs text-[var(--ff-muted)]">Último login</p>
                    <p className="mt-1 text-sm font-black text-[var(--ff-text)]">{formatLastLogin(selectedUser.lastLoginAt)}</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                    <p className="text-xs text-[var(--ff-muted)]">Perfil</p>
                    <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                      {selectedUser.profileCompleted ? 'Completo' : 'Incompleto'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                    <p className="text-xs text-[var(--ff-muted)]">Login</p>
                    <p className="mt-1 text-sm font-black text-[var(--ff-text)]">{selectedUser.provider || 'email'}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <Button variant="secondary" className="w-full justify-center" onClick={() => copyText(selectedUserId, 'ID')}>
                    {copied === 'ID' ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                    Copiar ID
                  </Button>

                  <Button variant="secondary" className="w-full justify-center" onClick={() => copyText(selectedUser.email, 'E-mail')}>
                    {copied === 'E-mail' ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                    Copiar e-mail
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() =>
                      setConfirmModal({
                        title: selectedUser.role === 'admin' ? 'Rebaixar admin?' : 'Promover para admin?',
                        description:
                          selectedUser.role === 'admin'
                            ? 'Este usuário perderá acesso ao painel administrativo.'
                            : 'Este usuário ganhará acesso ao painel administrativo.',
                        confirmText: selectedUser.role === 'admin' ? 'Rebaixar' : 'Promover',
                        variant: selectedUser.role === 'admin' ? 'danger' : 'default',
                        onConfirm: () => {
                          setConfirmModal(null)
                          handleToggleRole()
                        },
                      })
                    }
                    disabled={actionLoading}
                  >
                    <UserCog size={16} />
                    {selectedUser.role === 'admin' ? 'Rebaixar admin' : 'Promover admin'}
                  </Button>

                  <Button
                    variant={selectedUser.isBlocked ? 'secondary' : 'danger'}
                    className="w-full justify-center"
                    onClick={() =>
                      setConfirmModal({
                        title: selectedUser.isBlocked ? 'Desbloquear usuário?' : 'Bloquear usuário?',
                        description: selectedUser.isBlocked
                          ? 'O usuário poderá acessar a conta novamente.'
                          : 'O usuário será impedido de acessar a conta.',
                        confirmText: selectedUser.isBlocked ? 'Desbloquear' : 'Bloquear',
                        variant: selectedUser.isBlocked ? 'default' : 'danger',
                        onConfirm: () => {
                          setConfirmModal(null)
                          handleToggleBlock()
                        },
                      })
                    }
                    disabled={actionLoading}
                  >
                    {selectedUser.isBlocked ? <LockOpen size={16} /> : <Ban size={16} />}
                    {selectedUser.isBlocked ? 'Desbloquear' : 'Bloquear'}
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-500/10 text-yellow-200">
                    <KeyRound size={20} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-[var(--ff-text)]">Resetar senha</h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                      Define uma senha temporária. A senha atual não é exibida nem recuperável.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
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
                    disabled={actionLoading}
                  >
                    Resetar
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[var(--ff-text)]">Diagnóstico da conta</h2>
                    <p className="mt-1 text-sm text-[var(--ff-muted)]">Histórico, treinos e sessão ativa.</p>
                  </div>

                  {loadingDetails && <Loader2 className="animate-spin text-[var(--ff-muted)]" size={20} />}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <p className="text-xs text-[var(--ff-muted)]">Treinos</p>
                    <p className="mt-1 text-2xl font-black text-[var(--ff-text)]">{details?.counts?.workouts ?? '—'}</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <p className="text-xs text-[var(--ff-muted)]">Histórico</p>
                    <p className="mt-1 text-2xl font-black text-[var(--ff-text)]">{details?.counts?.history ?? '—'}</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <p className="text-xs text-[var(--ff-muted)]">Treino ativo</p>
                    <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                      {activeWorkout ? activeWorkout.workoutName || activeWorkout.name || 'Em andamento' : 'Não'}
                    </p>
                  </div>
                </div>

                {activeWorkout && (
                  <div className="mt-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
                          Treino ativo completo
                        </p>
                        <h3 className="mt-1 text-lg font-black text-[var(--ff-text)]">
                          {activeWorkout.workoutName || activeWorkout.name || 'Treino em andamento'}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--ff-muted)]">
                          Atualizado em {formatDate(details?.activeWorkoutUpdatedAt, true)}
                        </p>
                      </div>

                      <Button
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
                        disabled={actionLoading}
                      >
                        <Trash2 size={16} />
                        Limpar
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {(activeWorkout.exercises || []).map((item, index) => (
                        <div
                          key={`${item.exercise?.name || item.name || index}-${index}`}
                          className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3"
                        >
                          <p className="font-black text-[var(--ff-text)]">
                            {item.exercise?.name || item.name || `Exercício ${index + 1}`}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ff-muted)]">
                            {(item.sets || []).length} série(s)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Button variant="secondary" onClick={() => loadUserDetails(selectedUserId)} disabled={loadingDetails}>
                    Atualizar dados
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <History size={20} className="text-[var(--ff-accent-text)]" />
                  <div>
                    <h2 className="text-xl font-black text-[var(--ff-text)]">Histórico resumido</h2>
                    <p className="text-sm text-[var(--ff-muted)]">Últimos treinos finalizados.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {historySummary.length === 0 ? (
                    <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">
                      Nenhum treino finalizado encontrado.
                    </p>
                  ) : (
                    historySummary.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-black text-[var(--ff-text)]">{item.workoutName}</p>
                            <p className="mt-1 text-xs text-[var(--ff-muted)]">
                              {formatDate(item.finishedAt || item.createdAt, true)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge>{item.exercisesCount} exercícios</Badge>
                            <Badge>{item.totalSets} séries</Badge>
                            <Badge>{formatDuration(item.durationSeconds)}</Badge>
                            {item.prsCount > 0 && <Badge variant="yellow">{item.prsCount} PRs</Badge>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-[var(--ff-accent-text)]" />
                  <div>
                    <h2 className="text-xl font-black text-[var(--ff-text)]">Logs administrativos</h2>
                    <p className="text-sm text-[var(--ff-muted)]">Últimas ações feitas nesta conta.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {logs.length === 0 ? (
                    <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">
                      Nenhum log administrativo encontrado.
                    </p>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-black text-[var(--ff-text)]">{log.message || log.action}</p>
                            <p className="mt-1 text-xs text-[var(--ff-muted)]">{log.action}</p>
                          </div>

                          <p className="text-xs font-bold text-[var(--ff-muted)]">
                            {formatDate(log.createdAt, true)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </section>

      {confirmModal && (
        <ConfirmModal
          open
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
