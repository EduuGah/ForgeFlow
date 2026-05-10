import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  CheckCircle2,
  Flag,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Target,
  Trophy,
  X,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import GoalCard from '../components/goals/GoalCard'
import GoalFormModal from '../components/goals/GoalFormModal'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  generateSmartNotifications,
  notifyNotificationsChanged,
  showNotificationPopup,
} from '../utils/notificationUtils'
import {
  clearLegacyForgeFlowStorage,
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

function normalizeGoal(goal) {
  return {
    ...goal,
    id: goal._id || goal.id,
    title: goal.title || 'Meta sem título',
    description: goal.description || '',
    type: goal.type || 'custom',
    targetValue: Number(goal.targetValue) || 0,
    currentValue: Number(goal.currentValue) || 0,
    progressPercent: Number(goal.progressPercent) || 0,
    unit: goal.unit || '',
    status: goal.status || 'active',
    direction: goal.direction || 'increase',
    period: goal.period || 'none',
    exerciseName: goal.exerciseName || '',
    deadline: goal.deadline ? String(goal.deadline).slice(0, 10) : '',
    completedAt: goal.completedAt || null,
    baselineValue: Number(goal.baselineValue) || 0,
    baselineAt: goal.baselineAt || null,
    baselinePeriodKey: goal.baselinePeriodKey || '',
  }
}


function MobileGoalCard({
  goal,
  onEdit,
  onComplete,
  onArchive,
  onUnarchive,
  onReactivate,
  onDelete,
}) {
  const progress = Math.max(0, Math.min(100, Number(goal.progressPercent || 0)))
  const isCompleted = goal.status === 'completed' || goal.isCompleted
  const isArchived = goal.status === 'archived'

  return (
    <div className="rounded-[1.7rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-base font-black leading-tight text-[var(--ff-text)]">
            {goal.title}
          </p>

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--ff-muted)]">
            {goal.description || goal.exerciseName || 'Meta de evolução'}
          </p>
        </div>

        <Badge
          variant={
            isCompleted
              ? 'success'
              : isArchived
                ? 'default'
                : progress >= 80
                  ? 'purple'
                  : 'default'
          }
        >
          {Math.round(progress)}%
        </Badge>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-[var(--ff-muted)]">
            {Number(goal.currentValue || 0).toLocaleString('pt-BR')}
            {goal.unit ? ` ${goal.unit}` : ''}
          </span>

          <span className="font-bold text-[var(--ff-muted)]">
            {Number(goal.targetValue || 0).toLocaleString('pt-BR')}
            {goal.unit ? ` ${goal.unit}` : ''}
          </span>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--ff-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--ff-accent)] shadow-[0_0_16px_var(--ff-accent-shadow)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {goal.exerciseName && (
          <span className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-1 text-[11px] font-bold text-[var(--ff-muted)]">
            {goal.exerciseName}
          </span>
        )}

        {goal.deadline && (
          <span className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-1 text-[11px] font-bold text-[var(--ff-muted)]">
            até {new Date(`${goal.deadline}T12:00:00`).toLocaleDateString('pt-BR')}
          </span>
        )}

        {goal.period !== 'none' && (
          <span className="rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-[11px] font-bold text-[var(--ff-accent-text)]">
            {goal.period === 'weekly' ? 'semanal' : 'mensal'}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(goal)}
          className="h-11 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-sm font-black text-[var(--ff-text-soft)] active:scale-[0.98]"
        >
          Editar
        </button>

        {!isCompleted && !isArchived && (
          <button
            type="button"
            onClick={() => onComplete(goal)}
            className="h-11 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)] active:scale-[0.98]"
          >
            Concluir
          </button>
        )}

        {isCompleted && (
          <button
            type="button"
            onClick={() => onReactivate(goal)}
            className="h-11 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)] active:scale-[0.98]"
          >
            Reativar
          </button>
        )}

        {isArchived && (
          <button
            type="button"
            onClick={() => onUnarchive(goal)}
            className="h-11 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)] active:scale-[0.98]"
          >
            Desarquivar
          </button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {!isArchived && (
          <button
            type="button"
            onClick={() => onArchive(goal)}
            className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-xs font-bold text-[var(--ff-muted)] active:scale-[0.98]"
          >
            Arquivar
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(goal)}
          className={
            isArchived
              ? 'col-span-2 h-10 rounded-2xl border border-red-500/20 bg-red-500/10 text-xs font-bold text-[var(--ff-danger-text)] active:scale-[0.98]'
              : 'h-10 rounded-2xl border border-red-500/20 bg-red-500/10 text-xs font-bold text-[var(--ff-danger-text)] active:scale-[0.98]'
          }
        >
          Excluir
        </button>
      </div>
    </div>
  )
}


function Goals() {
  const { user } = useAuth()

  const [goals, setGoals] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('local')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [modalGoal, setModalGoal] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return

    async function loadData() {
      setLoading(true)

      const cachedGoals = getUserStorageData(user, 'goals', [])
      const cachedExercises = getUserStorageData(user, 'exercises', [])

      try {
        const [goalsFromApi, exercisesFromApi] = await Promise.all([
          apiFetch('/goals'),
          apiFetch('/exercises'),
        ])

        const normalizedGoals = Array.isArray(goalsFromApi)
          ? goalsFromApi.map(normalizeGoal)
          : []

        const normalizedExercises = Array.isArray(exercisesFromApi)
          ? exercisesFromApi.map((exercise) => ({
              ...exercise,
              id: exercise._id || exercise.id,
            }))
          : []

        setGoals(normalizedGoals)
        setExercises(normalizedExercises)
        saveUserStorageData(user, 'goals', normalizedGoals)
        saveUserStorageData(user, 'exercises', normalizedExercises)
        setSource('database')
      } catch (error) {
        console.error(error)

        setGoals(Array.isArray(cachedGoals) ? cachedGoals.map(normalizeGoal) : [])
        setExercises(Array.isArray(cachedExercises) ? cachedExercises : [])
        setSource('local')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, refreshKey])

  function showToast(type, title, message = '') {
    setToast({ type, title, message })

    setTimeout(() => setToast(null), 3200)
  }

  const exerciseOptions = useMemo(() => {
    return exercises
      .map((exercise) => exercise.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [exercises])

  const stats = useMemo(() => {
    const active = goals.filter((goal) => goal.status === 'active')
    const completed = goals.filter((goal) => goal.status === 'completed' || goal.isCompleted)
    const archived = goals.filter((goal) => goal.status === 'archived')
    const averageProgress = active.length > 0
      ? Math.round(active.reduce((total, goal) => total + Number(goal.progressPercent || 0), 0) / active.length)
      : 0

    return {
      total: goals.length,
      active: active.length,
      completed: completed.length,
      archived: archived.length,
      averageProgress,
    }
  }, [goals])

  const filteredGoals = useMemo(() => {
    const term = search.toLowerCase().trim()

    return goals
      .filter((goal) => {
        const matchesStatus = statusFilter === 'all'
          ? true
          : statusFilter === 'completed'
            ? goal.status === 'completed' || goal.isCompleted
            : goal.status === statusFilter

        const matchesSearch = term
          ? `${goal.title} ${goal.description} ${goal.exerciseName} ${goal.type}`
              .toLowerCase()
              .includes(term)
          : true

        return matchesStatus && matchesSearch
      })
      .sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1
        if (a.status !== 'active' && b.status === 'active') return 1

        const progressDiff = Number(b.progressPercent || 0) - Number(a.progressPercent || 0)

        if (progressDiff !== 0) return progressDiff

        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      })
  }, [goals, search, statusFilter])

  function openCreateModal() {
    setModalGoal(null)
    setIsModalOpen(true)
  }

  function openEditModal(goal) {
    setModalGoal(goal)
    setIsModalOpen(true)
  }

  function closeModal() {
    setModalGoal(null)
    setIsModalOpen(false)
  }

  async function handleSubmitGoal(data) {
    try {
      const path = modalGoal ? `/goals/${modalGoal.id}` : '/goals'
      const method = modalGoal ? 'PUT' : 'POST'

      const goalFromApi = await apiFetch(path, {
        method,
        body: JSON.stringify(data),
      })

      const normalizedGoal = normalizeGoal(goalFromApi)

      const updatedGoals = modalGoal
        ? goals.map((goal) => (goal.id === normalizedGoal.id ? normalizedGoal : goal))
        : [normalizedGoal, ...goals]

      setGoals(updatedGoals)
      saveUserStorageData(user, 'goals', updatedGoals)
      if (modalGoal) {
        generateSmartNotifications({
          user,
          reason: 'goal-updated',
          force: true,
          showPopup: false,
        }).catch((error) => {
          console.error(error)
        })
      }

      closeModal()
      showToast('success', modalGoal ? 'Meta atualizada' : 'Meta criada', 'A meta foi salva com sucesso.')
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao salvar meta', error.message || 'Não foi possível salvar a meta.')
    }
  }

  function handleCompleteGoal(goal) {
    setConfirmModal({
      title: 'Concluir meta?',
      description: `A meta "${goal.title}" será marcada como concluída. Você ainda poderá editar ou arquivar depois.`,
      confirmText: 'Concluir',
      onConfirm: async () => {
        try {
          const goalFromApi = await apiFetch(`/goals/${goal.id}/complete`, {
            method: 'PATCH',
          })

          const normalizedGoal = normalizeGoal(goalFromApi)
          const updatedGoals = goals.map((item) => item.id === normalizedGoal.id ? normalizedGoal : item)

          setGoals(updatedGoals)
          saveUserStorageData(user, 'goals', updatedGoals)

          if (goalFromApi?.createdNotification) {
            showNotificationPopup({
              reason: 'goal-completed',
              created: 1,
              createdNotifications: [goalFromApi.createdNotification],
            })
          }

          notifyNotificationsChanged({
            reason: 'goal-completed',
            created: goalFromApi?.createdNotification ? 1 : 0,
          })

          generateSmartNotifications({
            user,
            reason: 'goal-completed',
            force: true,
            showPopup: false,
          }).catch((error) => {
            console.error(error)
          })
          setConfirmModal(null)
          showToast('success', 'Meta concluída', 'Boa! Sua meta foi marcada como concluída.')
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao concluir', error.message || 'Não foi possível concluir a meta.')
        }
      },
    })
  }

  function handleArchiveGoal(goal) {
    setConfirmModal({
      title: 'Arquivar meta?',
      description: `A meta "${goal.title}" sairá da lista de metas ativas, mas você poderá desarquivar depois.`,
      confirmText: 'Arquivar',
      onConfirm: async () => {
        try {
          const goalFromApi = await apiFetch(`/goals/${goal.id}/archive`, {
            method: 'PATCH',
          })

          const normalizedGoal = normalizeGoal(goalFromApi)
          const updatedGoals = goals.map((item) => item.id === normalizedGoal.id ? normalizedGoal : item)

          setGoals(updatedGoals)
          saveUserStorageData(user, 'goals', updatedGoals)
          setConfirmModal(null)
          showToast('success', 'Meta arquivada', 'A meta foi arquivada.')
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao arquivar', error.message || 'Não foi possível arquivar a meta.')
        }
      },
    })
  }

  function handleUnarchiveGoal(goal) {
    setConfirmModal({
      title: 'Desarquivar meta?',
      description: `A meta "${goal.title}" voltará para suas metas ativas.`,
      confirmText: 'Desarquivar',
      onConfirm: async () => {
        try {
          const goalFromApi = await apiFetch(`/goals/${goal.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              status: 'active',
              completedAt: null,
            }),
          })

          const normalizedGoal = normalizeGoal(goalFromApi)
          const updatedGoals = goals.map((item) => item.id === normalizedGoal.id ? normalizedGoal : item)

          setGoals(updatedGoals)
          saveUserStorageData(user, 'goals', updatedGoals)
          setConfirmModal(null)
          showToast('success', 'Meta desarquivada', 'A meta voltou para a lista de ativas.')
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao desarquivar', error.message || 'Não foi possível desarquivar a meta.')
        }
      },
    })
  }

  function handleReactivateGoal(goal) {
    setConfirmModal({
      title: 'Reativar meta?',
      description: `A meta "${goal.title}" voltará para andamento.`,
      confirmText: 'Reativar',
      onConfirm: async () => {
        try {
          const goalFromApi = await apiFetch(`/goals/${goal.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              status: 'active',
              completedAt: null,
            }),
          })

          const normalizedGoal = normalizeGoal(goalFromApi)
          const updatedGoals = goals.map((item) => item.id === normalizedGoal.id ? normalizedGoal : item)

          setGoals(updatedGoals)
          saveUserStorageData(user, 'goals', updatedGoals)
          setConfirmModal(null)
          showToast('success', 'Meta reativada', 'A meta voltou para andamento.')
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao reativar', error.message || 'Não foi possível reativar a meta.')
        }
      },
    })
  }

  function handleDeleteGoal(goal) {
    setConfirmModal({
      title: 'Excluir meta?',
      description: `A meta "${goal.title}" será removida permanentemente.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch(`/goals/${goal.id}`, {
            method: 'DELETE',
          })

          const updatedGoals = goals.filter((item) => item.id !== goal.id)

          setGoals(updatedGoals)
          saveUserStorageData(user, 'goals', updatedGoals)
          setConfirmModal(null)
          showToast('success', 'Meta excluída', 'A meta foi removida.')
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao excluir', error.message || 'Não foi possível excluir a meta.')
        }
      },
    })
  }

  return (
    <>
      <section className="lg:hidden">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--ff-accent-border)]/25 bg-gradient-to-br from-[var(--ff-accent-soft)]/25 via-[var(--ff-card)] to-[var(--ff-surface-2)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge variant={source === 'database' ? 'purple' : 'default'}>
                  {loading ? 'Carregando' : source === 'database' ? 'Sincronizado' : 'Local'}
                </Badge>

                <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[var(--ff-text)]">
                  Suas metas
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                  Acompanhe objetivos de treino, peso, PR, volume e fotos com cards rápidos para celular.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent)] text-white shadow-[0_0_18px_var(--ff-accent-shadow)] active:scale-95"
                aria-label="Criar meta"
              >
                <Plus size={22} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 text-center">
                <p className="text-2xl font-black text-[var(--ff-text)]">{stats.active}</p>
                <p className="mt-1 text-[11px] text-[var(--ff-muted)]">ativas</p>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 text-center">
                <p className="text-2xl font-black text-[var(--ff-accent-text)]">{stats.averageProgress}%</p>
                <p className="mt-1 text-[11px] text-[var(--ff-muted)]">média</p>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 text-center">
                <p className="text-2xl font-black text-[var(--ff-success-text)]">{stats.completed}</p>
                <p className="mt-1 text-[11px] text-[var(--ff-muted)]">feitas</p>
              </div>
            </div>
          </div>

          <div className="sticky top-[72px] z-20 -mx-4 border-y border-[var(--ff-border)] bg-[var(--ff-bg)]/95 px-4 py-3 backdrop-blur-xl">
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[var(--ff-muted)]">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar meta..."
                className="w-full bg-transparent text-sm font-medium text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {[
                ['Ativas', 'active'],
                ['Concluídas', 'completed'],
                ['Arquivadas', 'archived'],
                ['Todas', 'all'],
              ].map(([label, value]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={
                    statusFilter === value
                      ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]'
                      : 'shrink-0 rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 py-2 text-xs font-black text-[var(--ff-text-soft)]'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <section className="space-y-3">
            {filteredGoals.length === 0 ? (
              <Card className="p-4">
                <EmptyState
                  title={goals.length === 0 ? 'Nenhuma meta criada' : 'Nenhuma meta encontrada'}
                  description={
                    goals.length === 0
                      ? 'Crie metas como treinar na semana, bater PR, registrar fotos ou atingir volume mensal.'
                      : 'Tente mudar o filtro ou buscar por outro termo.'
                  }
                  action={
                    <Button type="button" onClick={openCreateModal}>
                      <Plus size={16} />
                      Criar meta
                    </Button>
                  }
                />
              </Card>
            ) : (
              filteredGoals.map((goal) => (
                <MobileGoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={openEditModal}
                  onDelete={handleDeleteGoal}
                  onComplete={handleCompleteGoal}
                  onArchive={handleArchiveGoal}
                  onUnarchive={handleUnarchiveGoal}
                  onReactivate={handleReactivateGoal}
                />
              ))
            )}
          </section>
        </div>
      </section>

      <div className="hidden lg:block">
        <PageHeader
          title="Metas"
          description="Crie objetivos claros e acompanhe automaticamente com base nos seus treinos, peso, fotos e PRs."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={source === 'database' ? 'purple' : 'default'}>
                {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Local'}
              </Badge>

              <Button type="button" variant="secondary" onClick={() => setRefreshKey((key) => key + 1)}>
                <RefreshCcw size={16} />
                Atualizar
              </Button>

              <Button type="button" onClick={openCreateModal}>
                <Plus size={16} />
                Nova meta
              </Button>
            </div>
          }
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--ff-muted)]">Metas ativas</p>
              <Flag size={20} className="text-[var(--ff-accent-text)]" />
            </div>
            <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.active}</h2>
            <p className="mt-2 text-xs text-[var(--ff-muted)]">em andamento</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--ff-muted)]">Progresso médio</p>
              <Target size={20} className="text-[var(--ff-accent-text)]" />
            </div>
            <h2 className="mt-2 text-3xl font-black text-[var(--ff-accent-text)]">{stats.averageProgress}%</h2>
            <p className="mt-2 text-xs text-[var(--ff-muted)]">das metas ativas</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--ff-muted)]">Concluídas</p>
              <CheckCircle2 size={20} className="text-[var(--ff-success-text)]" />
            </div>
            <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.completed}</h2>
            <p className="mt-2 text-xs text-[var(--ff-muted)]">metas finalizadas</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--ff-muted)]">Arquivadas</p>
              <Archive size={20} className="text-[var(--ff-muted)]" />
            </div>
            <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.archived}</h2>
            <p className="mt-2 text-xs text-[var(--ff-muted)]">guardadas para depois</p>
          </Card>
        </section>

        <Card className="mt-6">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[var(--ff-muted)]">
              <Search size={18} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar meta, exercício ou descrição..."
                className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none"
            >
              <option value="active">Ativas</option>
              <option value="completed">Concluídas</option>
              <option value="archived">Arquivadas</option>
              <option value="all">Todas</option>
            </select>

            <Button type="button" onClick={openCreateModal}>
              <Plus size={16} />
              Criar meta
            </Button>
          </div>
        </Card>

        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
          {filteredGoals.length === 0 ? (
            <div className="xl:col-span-2">
              <Card>
                <EmptyState
                  title={goals.length === 0 ? 'Nenhuma meta criada' : 'Nenhuma meta encontrada'}
                  description={
                    goals.length === 0
                      ? 'Crie metas como treinar 4x na semana, bater PR, chegar em certo peso ou registrar fotos no mês.'
                      : 'Tente mudar o filtro ou buscar por outro termo.'
                  }
                  action={
                    <Button type="button" onClick={openCreateModal}>
                      <Plus size={16} />
                      Criar primeira meta
                    </Button>
                  }
                />
              </Card>
            </div>
          ) : (
            filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditModal}
                onDelete={handleDeleteGoal}
                onComplete={handleCompleteGoal}
                onArchive={handleArchiveGoal}
                onUnarchive={handleUnarchiveGoal}
                onReactivate={handleReactivateGoal}
              />
            ))
          )}
        </section>
      </div>

      <GoalFormModal
        open={isModalOpen}
        goal={modalGoal}
        exerciseOptions={exerciseOptions}
        onClose={closeModal}
        onSubmit={handleSubmitGoal}
      />

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </>
  )
}


export default Goals
