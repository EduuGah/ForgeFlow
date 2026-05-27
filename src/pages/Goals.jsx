import { useEffect, useMemo, useState } from 'react'
import GoalsPageSections from '../features/goals/components/GoalsPageSections'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  generateSmartNotifications,
  notifyNotificationsChanged,
  showNotificationPopup,
} from '../utils/notificationUtils'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

import { normalizeGoal } from '../features/goals/goalUtils'

import AppPageIntro from '../components/app/AppPageIntro'

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
    <div className="ff-hevy-page ff-hevy-page-goals">

      <AppPageIntro
        eyebrow="Metas"
        title="Objetivos"
        description="Acompanhe metas com visual de app, ações claras e menos poluição."
        metrics={[
          { label: 'Total', value: goals.length },
          { label: 'Ativas', value: stats.active },
          { label: 'Concluídas', value: stats.completed },
        ]}
      />

    <GoalsPageSections
      source={source}
      loading={loading}
      stats={stats}
      search={search}
      statusFilter={statusFilter}
      goals={goals}
      filteredGoals={filteredGoals}
      isModalOpen={isModalOpen}
      modalGoal={modalGoal}
      exerciseOptions={exerciseOptions}
      confirmModal={confirmModal}
      toast={toast}
      onRefresh={() => setRefreshKey((key) => key + 1)}
      onCreate={openCreateModal}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      onEdit={openEditModal}
      onDelete={handleDeleteGoal}
      onComplete={handleCompleteGoal}
      onArchive={handleArchiveGoal}
      onUnarchive={handleUnarchiveGoal}
      onReactivate={handleReactivateGoal}
      onCloseModal={closeModal}
      onSubmitGoal={handleSubmitGoal}
      onCancelConfirm={() => setConfirmModal(null)}
      onCloseToast={() => setToast(null)}
    />
  
    </div>
  )
}

export default Goals
