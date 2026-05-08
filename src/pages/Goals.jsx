import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Flag, Plus, RefreshCcw, Search, Target, Trophy, X } from 'lucide-react'

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
    deadline: goal.deadline || null,
  }
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
      description: `A meta "${goal.title}" será marcada como concluída.`,
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
      description: `A meta "${goal.title}" ficará oculta das metas ativas.`,
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
      <PageHeader
        title="Metas"
        description="Crie objetivos reais e acompanhe automaticamente com base nos seus treinos, peso, fotos e PRs."
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
            <CheckCircle2 size={20} className="text-emerald-400" />
          </div>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.completed}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">metas finalizadas</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ff-muted)]">Total</p>
            <Trophy size={20} className="text-[var(--ff-accent-text)]" />
          </div>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.total}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">criadas no app</p>
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

      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
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
            />
          ))
        )}
      </section>

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
