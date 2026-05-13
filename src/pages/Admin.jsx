import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  Activity,
  BarChart3,
  Bell,
  Trophy,
  Target,
  LineChart,
  Clock3,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Dumbbell,
  History,
  KeyRound,
  Loader2,
  ListChecks,
  LockOpen,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  UsersRound,
  Zap,
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

function formatLastLogin(value, fallbackCreatedAt = null) {
  if (value) return formatDate(value, true)

  if (fallbackCreatedAt) {
    return `Sem login registrado · criado em ${formatDate(fallbackCreatedAt)}`
  }

  return 'Ainda não registrado'
}

function formatDuration(seconds = 0) {
  const total = Number(seconds || 0)
  const minutes = Math.floor(total / 60)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours > 0) return `${hours}h ${rest}min`
  return `${minutes}min`
}

function formatCompactNumber(value = 0) {
  const number = Number(value || 0)

  return new Intl.NumberFormat('pt-BR', {
    notation: Math.abs(number) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(number)
}

function formatShortDate(value) {
  if (!value) return '—'

  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value

  return `${day}/${month}`
}

function getSeriesMax(series = [], key = 'count') {
  return Math.max(1, ...series.map((item) => Number(item?.[key] || 0)))
}

function MiniBarChart({ title, description, series = [], valueKey = 'count' }) {
  const max = getSeriesMax(series, valueKey)

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[var(--ff-text)]">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-[var(--ff-muted)]">{description}</p>
          )}
        </div>

        <LineChart size={19} className="text-[var(--ff-accent-text)]" />
      </div>

      <div className="mt-4 flex h-28 items-end gap-1.5 overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
        {series.length === 0 || series.every((item) => Number(item?.[valueKey] || 0) === 0) ? (
          <div className="flex h-full w-full items-center justify-center text-center text-xs font-bold text-[var(--ff-muted)]">
            Sem dados neste período
          </div>
        ) : (
          series.map((item) => {
            const value = Number(item?.[valueKey] || 0)
            const height = Math.max(6, Math.round((value / max) * 100))

            return (
              <div
                key={item.date}
                className="group relative flex min-w-[10px] flex-1 items-end justify-center"
                title={`${formatShortDate(item.date)}: ${value}`}
              >
                <div
                  className="w-full max-w-5 rounded-t-lg bg-[var(--ff-accent)]/75 transition group-hover:bg-[var(--ff-accent)]"
                  style={{ height: `${height}%` }}
                />
              </div>
            )
          })
        )}
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-bold text-[var(--ff-muted)]">
        <span>{formatShortDate(series[0]?.date)}</span>
        <span>{formatShortDate(series[series.length - 1]?.date)}</span>
      </div>
    </Card>
  )
}


function RankingCard({ title, description, icon: Icon = Trophy, items = [], valueLabel = '', formatValue = (value) => value, empty = 'Sem dados neste período.' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[var(--ff-text)]">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-[var(--ff-muted)]">{description}</p>
          )}
        </div>

        <Icon size={19} className="text-[var(--ff-accent-text)]" />
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm text-[var(--ff-muted)]">
            {empty}
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={item.userId || item.email || item.id || index}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--ff-text)]">
                  {index + 1}. {item.name || 'Usuário'}
                </p>
                <p className="truncate text-xs text-[var(--ff-muted)]">
                  {item.email || 'sem e-mail'}
                </p>
                {item.lastLoginAt && (
                  <p className="truncate text-[11px] text-[var(--ff-muted-2)]">
                    Último acesso: {formatDate(item.lastLoginAt, true)}
                  </p>
                )}
                {item.updatedAt && (
                  <p className="truncate text-[11px] text-[var(--ff-muted-2)]">
                    Atualizado: {formatDate(item.updatedAt, true)}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-[var(--ff-text)]">
                  {formatValue(item.value ?? item.count ?? item.exerciseCount ?? 0)}
                </p>
                <p className="text-[11px] text-[var(--ff-muted)]">
                  {valueLabel}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}


function getUserId(item) {
  return item?.id || item?._id || ''
}

function Admin() {
  const { user } = useAuth()

  const [adminStats, setAdminStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [adminRankings, setAdminRankings] = useState(null)
  const [analyticsDays, setAnalyticsDays] = useState(14)
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
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [copied, setCopied] = useState('')
  const [activeAdminView, setActiveAdminView] = useState('overview')
  const [activeRankingView, setActiveRankingView] = useState('mostWorkouts')

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

  async function loadAnalytics(days = analyticsDays) {
    try {
      const data = await apiFetch(`/admin/analytics?days=${days}`)
      setAnalytics(data)
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao carregar métricas', error.message)
    }
  }

  async function loadRankings(days = analyticsDays) {
    try {
      const data = await apiFetch(`/admin/rankings?days=${days}`)
      setAdminRankings(data)
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao carregar rankings', error.message)
    }
  }

  async function loadAdminStats() {
    try {
      const data = await apiFetch('/admin/stats')
      setAdminStats(data)
    } catch (error) {
      console.error(error)
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

  async function handleCleanupOrphanHistory() {
    setCleanupLoading(true)

    try {
      const result = await apiFetch('/admin/analytics/orphan-history', {
        method: 'DELETE',
      })

      showToast(
        'success',
        'Limpeza concluída',
        `${result.deletedCount || 0} histórico(s) órfão(s) removido(s).`
      )

      await loadAnalytics(analyticsDays)
      await loadRankings(analyticsDays)
      await loadAdminStats()
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao limpar históricos órfãos', error.message)
    } finally {
      setCleanupLoading(false)
    }
  }

  async function handleAdminResetPassword() {
    if (!selectedUser) return

    setActionLoading(true)

    try {
      const data = await apiFetch(`/admin/users/${getUserId(selectedUser)}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ debugReturnLink: true }),
      })

      setResetPassword(data.resetUrl || '')
      showToast(
        'success',
        data.emailSent ? 'Link enviado' : 'Link gerado',
        data.message || 'Link temporário de redefinição criado.'
      )
      await loadUserDetails(getUserId(selectedUser))
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao gerar link', error.message)
    } finally {
      setActionLoading(false)
    }
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

    loadAdminStats()
    loadAnalytics()
    loadRankings()
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
  const analyticsCards = analytics?.cards || {}
  const analyticsSeries = analytics?.series || {}
  const recentLogins = Array.isArray(analytics?.recentLogins) ? analytics.recentLogins : []
  const topWorkoutUsers = Array.isArray(analytics?.topWorkoutUsers) ? analytics.topWorkoutUsers : []
  const rankings = adminRankings || {}

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

  const overviewCards = [
    ['Usuários', analyticsCards.totalUsers ?? adminStats?.cards?.totalUsers ?? users.length, UsersRound],
    ['Acessos', analyticsCards.loginEvents ?? '—', Clock3],
    ['Treinos', analyticsCards.totalWorkouts ?? '—', Dumbbell],
    ['Históricos', analyticsCards.totalHistory ?? '—', History],
    ['Volume', analyticsCards.totalVolume ? `${formatCompactNumber(analyticsCards.totalVolume)} kg` : '—', Trophy],
    ['Ativos', analyticsCards.activeWorkoutSessions ?? '—', Activity],
  ]

  const systemCards = [
    ['Órfãos', analyticsCards.orphanHistoryCount ?? 0, AlertTriangle],
    ['Admins', analyticsCards.totalAdmins ?? '—', ShieldCheck],
    ['Bloqueados', analyticsCards.blockedUsers ?? '—', Ban],
    ['Exercícios', analyticsCards.totalExercises ?? '—', Target],
    ['Metas', analyticsCards.totalGoals ?? '—', CheckCircle2],
    ['Notificações', analyticsCards.totalNotifications ?? '—', Bell],
  ]

  const rankingOptions = [
    {
      id: 'mostWorkouts',
      label: 'Mais treinos',
      icon: Dumbbell,
      description: 'Usuários com mais treinos finalizados.',
      valueLabel: 'treinos',
      items: Array.isArray(rankings.mostWorkouts) ? rankings.mostWorkouts : [],
    },
    {
      id: 'highestVolume',
      label: 'Maior volume',
      icon: Trophy,
      description: 'Volume total levantado no período.',
      valueLabel: 'kg',
      formatValue: formatCompactNumber,
      items: Array.isArray(rankings.highestVolume) ? rankings.highestVolume : [],
    },
    {
      id: 'mostSets',
      label: 'Mais séries',
      icon: ListChecks,
      description: 'Soma de séries finalizadas.',
      valueLabel: 'séries',
      formatValue: formatCompactNumber,
      items: Array.isArray(rankings.mostSets) ? rankings.mostSets : [],
    },
    {
      id: 'mostReps',
      label: 'Mais reps',
      icon: Activity,
      description: 'Soma de repetições registradas.',
      valueLabel: 'reps',
      formatValue: formatCompactNumber,
      items: Array.isArray(rankings.mostReps) ? rankings.mostReps : [],
    },
    {
      id: 'mostLogins',
      label: 'Mais acessos',
      icon: CalendarDays,
      description: 'Eventos de login registrados.',
      valueLabel: 'acessos',
      items: Array.isArray(rankings.mostLogins) ? rankings.mostLogins : [],
    },
    {
      id: 'usersWithoutWorkout',
      label: 'Sem treino',
      icon: AlertTriangle,
      description: 'Usuários que ainda não possuem histórico.',
      valueLabel: 'status',
      empty: 'Nenhum usuário sem treino encontrado.',
      items: Array.isArray(rankings.usersWithoutWorkout)
        ? rankings.usersWithoutWorkout.map((item) => ({ ...item, value: '—' }))
        : [],
    },
    {
      id: 'inactiveUsers',
      label: 'Sem acesso recente',
      icon: Clock3,
      description: 'Usuários sem login nos últimos 30 dias.',
      valueLabel: 'status',
      empty: 'Nenhum usuário inativo encontrado.',
      items: Array.isArray(rankings.inactiveUsers)
        ? rankings.inactiveUsers.map((item) => ({ ...item, value: item.lastLoginAt ? '30d+' : 'nunca' }))
        : [],
    },
    {
      id: 'activeWorkouts',
      label: 'Treino ativo',
      icon: Zap,
      description: 'Sessões ativas salvas no servidor.',
      valueLabel: 'exercícios',
      empty: 'Nenhum treino ativo encontrado.',
      items: Array.isArray(rankings.activeWorkouts)
        ? rankings.activeWorkouts.map((item) => ({ ...item, value: item.exerciseCount || 0 }))
        : [],
    },
    {
      id: 'staleActiveWorkouts',
      label: 'Treino travado',
      icon: AlertTriangle,
      description: 'Treinos ativos sem atualização há mais de 24h.',
      valueLabel: 'exercícios',
      empty: 'Nenhum treino travado encontrado.',
      items: Array.isArray(rankings.staleActiveWorkouts)
        ? rankings.staleActiveWorkouts.map((item) => ({ ...item, value: item.exerciseCount || 0 }))
        : [],
    },
  ]

  const selectedRanking = rankingOptions.find((item) => item.id === activeRankingView) || rankingOptions[0]

  return (
    <div className="ff-hevy-admin ff-admin-v48 space-y-6">
      <PageHeader
        title="Admin"
        description="Painel de produção, usuários, métricas, rankings e suporte."
        action={
          <Badge variant="purple">
            <ShieldCheck size={13} />
            Administrador
          </Badge>
        }
      />

      <section className="rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
              Central administrativa
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ff-text)]">
              Visão limpa do ForgeFlow
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ff-muted)]">
              Use os atalhos abaixo para alternar entre métricas, rankings e gerenciamento de usuários sem misturar tudo na mesma tela.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    setAnalyticsDays(days)
                    loadAnalytics(days)
                    loadRankings(days)
                  }}
                  className={[
                    'h-10 rounded-2xl border px-3 text-xs font-black transition',
                    analyticsDays === days
                      ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]'
                      : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]',
                  ].join(' ')}
                >
                  {days}d
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                loadAnalytics(analyticsDays)
                loadRankings(analyticsDays)
                loadAdminStats()
                loadUsers()
              }}
              className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-xs font-black text-[var(--ff-text)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]"
            >
              Atualizar
            </button>

            {Number(analyticsCards.orphanHistoryCount || 0) > 0 && (
              <button
                type="button"
                onClick={handleCleanupOrphanHistory}
                disabled={cleanupLoading}
                className="h-10 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 text-xs font-black text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cleanupLoading ? 'Limpando...' : 'Limpar órfãos'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {[
            ['overview', 'Resumo', BarChart3],
            ['rankings', 'Rankings', Trophy],
            ['users', 'Usuários', UsersRound],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveAdminView(id)}
              className={[
                'flex h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black transition',
                activeAdminView === id
                  ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_18px_var(--ff-accent-shadow)]'
                  : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]',
              ].join(' ')}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {activeAdminView === 'overview' && (
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {overviewCards.map(([label, value, Icon]) => (
              <Card key={label} className="ff-admin-stat-card p-4">
                <div className="relative flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                      {label}
                    </p>
                    <p className="mt-2 break-words text-xl font-black leading-tight text-[var(--ff-text)] sm:text-2xl">
                      {value}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                    <Icon size={19} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <details className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
            <summary className="cursor-pointer text-sm font-black text-[var(--ff-text)]">
              Métricas de sistema
            </summary>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {systemCards.map(([label, value, Icon]) => (
                <Card key={label} className="ff-admin-stat-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                        {label}
                      </p>
                      <p className="mt-2 break-words text-xl font-black leading-tight text-[var(--ff-text)]">
                        {value}
                      </p>
                    </div>

                    <Icon size={18} className="shrink-0 text-[var(--ff-accent-text)]" />
                  </div>
                </Card>
              ))}
            </div>
          </details>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <MiniBarChart
              title="Acessos por dia"
              description={`Últimos ${analytics?.period?.days || analyticsDays} dias`}
              series={analyticsSeries.logins || []}
            />

            <MiniBarChart
              title="Novos usuários"
              description="Cadastros por dia"
              series={analyticsSeries.newUsers || []}
            />

            <MiniBarChart
              title="Treinos finalizados"
              description="Históricos salvos por dia"
              series={analyticsSeries.history || []}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-[var(--ff-text)]">
                    Últimos acessos
                  </h3>
                  <p className="mt-1 text-xs text-[var(--ff-muted)]">
                    Entradas recentes registradas pelo sistema.
                  </p>
                </div>

                <CalendarDays size={19} className="text-[var(--ff-accent-text)]" />
              </div>

              <div className="mt-4 space-y-2">
                {recentLogins.length === 0 ? (
                  <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm text-[var(--ff-muted)]">
                    Nenhum acesso registrado ainda.
                  </p>
                ) : (
                  recentLogins.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[var(--ff-text)]">
                          {item.email}
                        </p>
                        <p className="text-xs text-[var(--ff-muted)]">
                          {item.provider} · {formatDate(item.createdAt, true)}
                        </p>
                      </div>

                      <Badge>{item.provider}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <RankingCard
              title="Top treinos"
              description="Ranking rápido por treinos finalizados."
              icon={Trophy}
              items={topWorkoutUsers}
              valueLabel="treinos"
              empty="Nenhum histórico encontrado ainda."
            />
          </div>
        </section>
      )}

      {activeAdminView === 'rankings' && (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="p-4">
            <div>
              <h2 className="text-xl font-black text-[var(--ff-text)]">
                Rankings
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                Escolha um ranking para analisar o período selecionado.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {rankingOptions.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveRankingView(item.id)}
                    className={[
                      'flex min-h-12 items-center gap-3 rounded-2xl border p-3 text-left transition',
                      activeRankingView === item.id
                        ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]'
                        : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]',
                    ].join(' ')}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-black">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          <RankingCard
            title={selectedRanking.label}
            description={selectedRanking.description}
            icon={selectedRanking.icon}
            items={selectedRanking.items}
            valueLabel={selectedRanking.valueLabel}
            formatValue={selectedRanking.formatValue || ((value) => value)}
            empty={selectedRanking.empty}
          />
        </section>
      )}

      {activeAdminView === 'users' && (
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
                          Último login: {formatLastLogin(item.lastLoginAt, item.createdAt)}
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
                      <p className="mt-1 text-sm font-black text-[var(--ff-text)]">{formatLastLogin(selectedUser.lastLoginAt, selectedUser.createdAt)}</p>
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
                      <h2 className="text-xl font-black text-[var(--ff-text)]">Gerar link de reset</h2>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                        Gera um link temporário. O admin não define nem visualiza a senha do usuário.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      type="text"
                      value={resetPassword}
                      readOnly
                      placeholder="O link temporário aparecerá aqui após gerar"
                      className="h-12 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition focus:border-[var(--ff-accent-border)]"
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          setConfirmModal({
                            title: 'Gerar link de reset?',
                            description: `Será gerado um link temporário de redefinição para ${selectedUser.email}. O admin não verá nem definirá a senha final.`,
                            confirmText: 'Gerar link de reset',
                            variant: 'danger',
                            onConfirm: () => {
                              setConfirmModal(null)
                              handleAdminResetPassword()
                            },
                          })
                        }
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Gerando...' : 'Gerar link'}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => copyText(resetPassword, 'Link de reset')}
                        disabled={!resetPassword}
                      >
                        Copiar
                      </Button>
                    </div>
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
      )}

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
