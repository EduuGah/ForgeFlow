import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Ban,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  History,
  ListChecks,
  ShieldCheck,
  Target,
  Trophy,
  UsersRound,
  Zap,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import { apiFetch } from '../services/api'
import { useAuth } from '../context/AuthContext'
import AdminControlPanel from '../features/admin/components/AdminControlPanel'
import AdminOverviewSection from '../features/admin/components/AdminOverviewSection'
import AdminRankingsSection from '../features/admin/components/AdminRankingsSection'
import AdminUsersSection from '../features/admin/components/AdminUsersSection'
import { formatCompactNumber, getUserId } from '../features/admin/adminUtils'

import AppPageIntro from '../components/app/AppPageIntro'

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
  const [userPage, setUserPage] = useState(1)
  const [userLimit, setUserLimit] = useState(25)
  const [userPagination, setUserPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })
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
  const [loadedAdminViews, setLoadedAdminViews] = useState({
    overview: false,
    rankings: false,
    users: false,
  })

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
      setLoadedAdminViews((current) => ({ ...current, overview: true }))
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao carregar métricas', error.message)
    }
  }

  async function loadRankings(days = analyticsDays) {
    try {
      const data = await apiFetch(`/admin/rankings?days=${days}`)
      setAdminRankings(data)
      setLoadedAdminViews((current) => ({ ...current, rankings: true }))
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

  async function loadUsers(page = userPage, limit = userLimit) {
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (providerFilter !== 'all') params.set('provider', providerFilter)
      params.set('page', String(page))
      params.set('limit', String(limit))

      const data = await apiFetch(`/admin/users?${params.toString()}`)
      const nextUsers = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : []
      setUsers(nextUsers)
      setUserPagination(data?.pagination || {
        page,
        limit,
        total: nextUsers.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: page > 1,
      })
      setLoadedAdminViews((current) => ({ ...current, users: true }))

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

  function handleUserFilterChange(filter, value) {
    if (filter === 'role') setRoleFilter(value)
    if (filter === 'status') setStatusFilter(value)
    if (filter === 'provider') setProviderFilter(value)

    setUserPage(1)
    setLoadedAdminViews((current) => ({ ...current, users: false }))
  }

  function handleUserPageChange(nextPage) {
    const safePage = Math.max(Number(nextPage) || 1, 1)
    setUserPage(safePage)
    loadUsers(safePage, userLimit)
  }

  function handleUserLimitChange(value) {
    const nextLimit = Number(value) || 25
    setUserLimit(nextLimit)
    setUserPage(1)
    loadUsers(1, nextLimit)
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
      await loadUsers(userPage, userLimit)
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
    if (!isAdmin) return

    loadAdminStats()
    loadAnalytics()
    // rankings e usuários carregam sob demanda ao abrir as abas
     
  }, [isAdmin, roleFilter, statusFilter, providerFilter])


  useEffect(() => {
    if (!isAdmin) return

    if (activeAdminView === 'rankings' && !loadedAdminViews.rankings) {
      loadRankings(analyticsDays)
    }

    if (activeAdminView === 'users' && !loadedAdminViews.users) {
      loadUsers()
    }
     
  }, [activeAdminView, isAdmin])
   

  useEffect(() => {
    if (!isAdmin || activeAdminView !== 'users') return

    const timeoutId = window.setTimeout(() => {
      setUserPage(1)
      loadUsers(1, userLimit)
    }, 350)

    return () => window.clearTimeout(timeoutId)
     
  }, [roleFilter, statusFilter, providerFilter, query])

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
      <div className="ff-hevy-page ff-hevy-page-admin">
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
    <div className="ff-hevy-page ff-hevy-page-admin">

      <AppPageIntro eyebrow="Admin" title="Painel" description="Visão administrativa com cards mais compactos e leitura melhor no celular." />

    <div className="ff-hevy-admin ff-admin-v48 ff-page-mobile-main-grid space-y-6">
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

      <AdminControlPanel
        analyticsDays={analyticsDays}
        activeAdminView={activeAdminView}
        orphanHistoryCount={analyticsCards.orphanHistoryCount}
        cleanupLoading={cleanupLoading}
        onDaysChange={(days) => {
          setAnalyticsDays(days)
          if (activeAdminView === 'overview') loadAnalytics(days)
          if (activeAdminView === 'rankings') loadRankings(days)
        }}
        onRefresh={() => {
          loadAdminStats()
          if (activeAdminView === 'overview') loadAnalytics(analyticsDays)
          if (activeAdminView === 'rankings') loadRankings(analyticsDays)
          if (activeAdminView === 'users') loadUsers()
        }}
        onCleanupOrphanHistory={handleCleanupOrphanHistory}
        onViewChange={setActiveAdminView}
      />

      {activeAdminView === 'overview' && (
        <AdminOverviewSection
          overviewCards={overviewCards}
          systemCards={systemCards}
          analytics={analytics}
          analyticsDays={analyticsDays}
          analyticsSeries={analyticsSeries}
          recentLogins={recentLogins}
          topWorkoutUsers={topWorkoutUsers}
        />
      )}

      {activeAdminView === 'rankings' && (
        <AdminRankingsSection
          rankingOptions={rankingOptions}
          selectedRanking={selectedRanking}
          activeRankingView={activeRankingView}
          setActiveRankingView={setActiveRankingView}
        />
      )}

      {activeAdminView === 'users' && (
        <AdminUsersSection
          filteredUsers={filteredUsers}
          query={query}
          setQuery={setQuery}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          providerFilter={providerFilter}
          userLimit={userLimit}
          userPage={userPage}
          userPagination={userPagination}
          selectedUser={selectedUser}
          selectedUserId={selectedUserId}
          details={details}
          activeWorkout={activeWorkout}
          historySummary={historySummary}
          logs={logs}
          loading={loading}
          loadingDetails={loadingDetails}
          actionLoading={actionLoading}
          resetPassword={resetPassword}
          copied={copied}
          onUserFilterChange={handleUserFilterChange}
          onUserPageChange={handleUserPageChange}
          onUserLimitChange={handleUserLimitChange}
          onSelectUser={handleSelectUser}
          onLoadUsers={loadUsers}
          onLoadUserDetails={loadUserDetails}
          onCopyText={copyText}
          onSetConfirmModal={setConfirmModal}
          onAdminResetPassword={handleAdminResetPassword}
          onToggleRole={handleToggleRole}
          onToggleBlock={handleToggleBlock}
          onClearActiveWorkout={handleClearActiveWorkout}
        />
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
  
    </div>
  )

}

export default Admin
