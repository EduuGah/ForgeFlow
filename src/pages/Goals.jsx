import { useEffect, useMemo, useState } from 'react'
import GoalsPageSections from '../features/goals/components/GoalsPageSections'

import { useAuth } from '../context/AuthContext'
import { useTutorial } from '../context/TutorialContext'
import { apiFetch } from '../services/api'
import { getInitialExercises } from '../utils/exerciseStorage'
import { removeGoalReminder, syncGoalReminder } from '../utils/goalReminderUtils'
import {
  generateSmartNotifications,
  notifyNotificationsChanged,
  showNotificationPopup,
} from '../utils/notificationUtils'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

import {
  enrichGoalWithLocalProgress,
  getGoalDeadlineState,
  getGoalPacing,
  getGoalPeriodKey,
  getGoalRawValue,
  getLocalDateKey,
  normalizeGoal,
  parseLocalDate,
  shouldUseGoalBaseline,
} from '../features/goals/goalUtils'

import AppPageIntro from '../components/app/AppPageIntro'

function createLocalGoal(data, existingGoal = null) {
  const now = new Date().toISOString()

  return normalizeGoal({
    ...existingGoal,
    ...data,
    id: existingGoal?.id || existingGoal?._id || `local-goal-${Date.now()}`,
    _id: existingGoal?._id,
    createdAt: existingGoal?.createdAt || now,
    updatedAt: now,
  })
}

function normalizeGoalExerciseList(value, fallback = []) {
  const list = Array.isArray(value)
    ? value
    : Array.isArray(value?.exercises)
      ? value.exercises
      : Array.isArray(value?.data)
        ? value.data
        : []
  const source = list.length ? list : fallback

  return source
    .filter(Boolean)
    .map((exercise, index) => ({
      ...exercise,
      id: exercise._id || exercise.id || exercise.localId || `${exercise.name || 'exercise'}-${index}`,
      isFavorite: Boolean(exercise.isFavorite),
    }))
}

function prepareGoalPayload(data, existingGoal = null, context = {}) {
  const period = data.period || 'none'
  const periodKey = period !== 'none' ? getGoalPeriodKey({ period }, new Date()) : ''
  const structuralChange = existingGoal && (
    data.type !== existingGoal.type ||
    data.period !== existingGoal.period ||
    data.exerciseName !== existingGoal.exerciseName ||
    data.exerciseId !== existingGoal.exerciseId
  )
  const resetBaseline = !existingGoal || data.resetProgressBaseline || structuralChange
  const shouldSetBaseline = resetBaseline && shouldUseGoalBaseline(data)
  const baselineValue = shouldSetBaseline ? getGoalRawValue(data, context) : existingGoal?.baselineValue || data.baselineValue || 0

  return {
    ...data,
    manualPeriodKey: periodKey,
    baselineValue,
    baselineAt: shouldSetBaseline ? new Date().toISOString() : existingGoal?.baselineAt || data.baselineAt || null,
    baselinePeriodKey: shouldSetBaseline ? getGoalPeriodKey(data, new Date()) : existingGoal?.baselinePeriodKey || data.baselinePeriodKey || '',
    completedAt: data.status === 'completed' ? (existingGoal?.completedAt || new Date().toISOString()) : null,
  }
}

function getWeekStart(date = new Date()) {
  const start = parseLocalDate(date) || new Date()
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1)
  return start
}

function getActiveWorkoutStreak(history = []) {
  const trainedDays = new Set(history.map((session) => (
    getLocalDateKey(session.finishedAt || session.completedAt || session.date || session.createdAt || session.startedAt)
  )).filter(Boolean))

  let cursor = parseLocalDate(new Date())
  let streak = 0

  while (cursor) {
    const key = getLocalDateKey(cursor)
    if (!trainedDays.has(key)) break

    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function isCompletedThisWeek(goal) {
  if (!(goal.status === 'completed' || goal.isCompleted)) return false

  const completedDate = parseLocalDate(goal.completedAt || goal.updatedAt)
  if (!completedDate) return false

  return completedDate >= getWeekStart(new Date())
}

function Goals() {
  const { user } = useAuth()
  const { completeFirstStepMission } = useTutorial()

  const [goals, setGoals] = useState([])
  const [history, setHistory] = useState([])
  const [bodyWeight, setBodyWeight] = useState([])
  const [progressPhotos, setProgressPhotos] = useState([])
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
    if (!user) return undefined

    let isMounted = true

    async function loadData() {
      setLoading(true)

      const cachedGoals = getUserStorageData(user, 'goals', [])
      const cachedExercises = getUserStorageData(user, 'exercises', [])
      const initialExercises = normalizeGoalExerciseList(cachedExercises, getInitialExercises())
      const cachedHistory = getUserStorageData(user, 'history', [])
      const cachedBodyWeight = getUserStorageData(user, 'bodyweight', [])
      const cachedProgressPhotos = getUserStorageData(user, 'progress-photos', [])

      if (isMounted) {
        setGoals(Array.isArray(cachedGoals) ? cachedGoals.map(normalizeGoal) : [])
        setExercises(initialExercises)
        setHistory(Array.isArray(cachedHistory) ? cachedHistory : [])
        setBodyWeight(Array.isArray(cachedBodyWeight) ? cachedBodyWeight : [])
        setProgressPhotos(Array.isArray(cachedProgressPhotos) ? cachedProgressPhotos : [])
        setSource('local')
      }

      const results = await Promise.allSettled([
        apiFetch('/goals'),
        apiFetch('/exercises'),
        apiFetch('/workout-history'),
        apiFetch('/body-weight'),
        apiFetch('/progress-photos'),
      ])

      if (!isMounted) return

      const [goalsResult, exercisesResult, historyResult, bodyWeightResult, progressPhotosResult] = results
      const hasRemoteGoals = goalsResult.status === 'fulfilled'
      const hasAnyRemoteData = results.some((result) => result.status === 'fulfilled')

      if (hasRemoteGoals) {
        const normalizedGoals = Array.isArray(goalsResult.value)
          ? goalsResult.value.map(normalizeGoal)
          : []

        setGoals(normalizedGoals)
        saveUserStorageData(user, 'goals', normalizedGoals)
      }

      if (exercisesResult.status === 'fulfilled') {
        const normalizedExercises = normalizeGoalExerciseList(exercisesResult.value, initialExercises)

        setExercises(normalizedExercises)
        saveUserStorageData(user, 'exercises', normalizedExercises)
      }

      if (historyResult.status === 'fulfilled') {
        const normalizedHistory = Array.isArray(historyResult.value)
          ? historyResult.value
          : historyResult.value?.history || []

        setHistory(normalizedHistory)
        saveUserStorageData(user, 'history', normalizedHistory)
      }

      if (bodyWeightResult.status === 'fulfilled') {
        const normalizedBodyWeight = Array.isArray(bodyWeightResult.value) ? bodyWeightResult.value : []
        setBodyWeight(normalizedBodyWeight)
        saveUserStorageData(user, 'bodyweight', normalizedBodyWeight)
      }

      if (progressPhotosResult.status === 'fulfilled') {
        const normalizedProgressPhotos = Array.isArray(progressPhotosResult.value) ? progressPhotosResult.value : []
        setProgressPhotos(normalizedProgressPhotos)
        saveUserStorageData(user, 'progress-photos', normalizedProgressPhotos)
      }

      setSource(hasAnyRemoteData ? 'database' : 'local')
      setLoading(false)
    }

    loadData().catch((error) => {
      console.error(error)
      if (isMounted) {
        setLoading(false)
        setSource('local')
      }
    })

    return () => {
      isMounted = false
    }
  }, [user, refreshKey])

  function showToast(type, title, message = '') {
    setToast({ type, title, message })
    window.setTimeout(() => setToast(null), 3200)
  }

  const progressContext = useMemo(() => ({ history, bodyWeight, progressPhotos }), [history, bodyWeight, progressPhotos])

  const enrichedGoals = useMemo(() => {
    return goals.map((goal) => enrichGoalWithLocalProgress(goal, progressContext))
  }, [goals, progressContext])

  useEffect(() => {
    if (enrichedGoals.length > 0) {
      completeFirstStepMission?.('create-goal')
    }
  }, [completeFirstStepMission, enrichedGoals.length])

  const exerciseOptions = useMemo(() => {
    return exercises
      .map((exercise) => exercise.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [exercises])

  const stats = useMemo(() => {
    const active = enrichedGoals.filter((goal) => goal.status === 'active' && !goal.isCompleted)
    const completed = enrichedGoals.filter((goal) => goal.status === 'completed' || goal.isCompleted)
    const archived = enrichedGoals.filter((goal) => goal.status === 'archived')
    const overdue = enrichedGoals.filter((goal) => goal.status === 'active' && getGoalDeadlineState(goal) === 'overdue')
    const behind = active.filter((goal) => getGoalPacing(goal).status === 'behind')
    const dueToday = active.filter((goal) => getGoalPacing(goal).daysLeft === 0)
    const almostDone = active.filter((goal) => Number(goal.progressPercent || 0) >= 75)
    const completedThisWeek = completed.filter(isCompletedThisWeek)
    const averageProgress = active.length > 0
      ? Math.round(active.reduce((total, goal) => total + Number(goal.progressPercent || 0), 0) / active.length)
      : 0

    return {
      total: enrichedGoals.length,
      active: active.length,
      completed: completed.length,
      completedThisWeek: completedThisWeek.length,
      archived: archived.length,
      overdue: overdue.length,
      behind: behind.length,
      dueToday: dueToday.length,
      almostDone: almostDone.length,
      streak: getActiveWorkoutStreak(history),
      averageProgress,
    }
  }, [enrichedGoals, history])

  const filteredGoals = useMemo(() => {
    const term = search.toLowerCase().trim()

    return enrichedGoals
      .filter((goal) => {
        const deadlineState = getGoalDeadlineState(goal)
        const matchesStatus = statusFilter === 'all'
          ? true
          : statusFilter === 'completed'
            ? goal.status === 'completed' || goal.isCompleted
            : statusFilter === 'overdue'
              ? goal.status === 'active' && deadlineState === 'overdue'
              : statusFilter === 'active'
                ? goal.status === 'active' && !goal.isCompleted
                : goal.status === statusFilter

        const matchesSearch = term
          ? `${goal.title} ${goal.description} ${goal.exerciseName} ${goal.type}`
              .toLowerCase()
              .includes(term)
          : true

        return matchesStatus && matchesSearch
      })
      .sort((a, b) => {
        const aDeadline = getGoalDeadlineState(a)
        const bDeadline = getGoalDeadlineState(b)

        if (aDeadline === 'overdue' && bDeadline !== 'overdue') return -1
        if (aDeadline !== 'overdue' && bDeadline === 'overdue') return 1
        if (a.status === 'active' && b.status !== 'active') return -1
        if (a.status !== 'active' && b.status === 'active') return 1

        const progressDiff = Number(b.progressPercent || 0) - Number(a.progressPercent || 0)
        if (progressDiff !== 0) return progressDiff

        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      })
  }, [enrichedGoals, search, statusFilter])

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

  function persistGoals(nextGoals) {
    setGoals(nextGoals)
    saveUserStorageData(user, 'goals', nextGoals)
  }

  async function handleSubmitGoal(data) {
    const payloadData = prepareGoalPayload(data, modalGoal, progressContext)

    try {
      const path = modalGoal ? `/goals/${modalGoal.id}` : '/goals'
      const method = modalGoal ? 'PUT' : 'POST'

      const goalFromApi = await apiFetch(path, {
        method,
        body: JSON.stringify(payloadData),
      })

      const normalizedGoal = normalizeGoal(goalFromApi)
      const updatedGoals = modalGoal
        ? goals.map((goal) => (goal.id === normalizedGoal.id ? normalizedGoal : goal))
        : [normalizedGoal, ...goals]

      persistGoals(updatedGoals)
      setSource('database')
      await syncGoalReminder(user, normalizeGoal({ ...payloadData, ...normalizedGoal }))
      completeFirstStepMission?.('create-goal')

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

      const localGoal = createLocalGoal(payloadData, modalGoal)
      const updatedGoals = modalGoal
        ? goals.map((goal) => (goal.id === localGoal.id ? localGoal : goal))
        : [localGoal, ...goals]

      persistGoals(updatedGoals)
      setSource('local')
      await syncGoalReminder(user, localGoal)
      completeFirstStepMission?.('create-goal')
      closeModal()
      showToast('success', modalGoal ? 'Meta salva localmente' : 'Meta criada localmente', 'Não consegui sincronizar agora, mas preservei a meta no aparelho.')
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

          persistGoals(updatedGoals)
          setSource('database')
          await removeGoalReminder(user, normalizedGoal)

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
          const updatedGoals = goals.map((item) => item.id === goal.id
            ? normalizeGoal({ ...item, status: 'completed', completedAt: new Date().toISOString(), manualPeriodKey: item.period && item.period !== 'none' ? getGoalPeriodKey(item, new Date()) : item.manualPeriodKey, progressPercent: 100, isCompleted: true })
            : item)

          persistGoals(updatedGoals)
          setConfirmModal(null)
          setSource('local')
          await removeGoalReminder(user, goal)
          showToast('success', 'Meta concluída localmente', 'Não consegui sincronizar agora, mas preservei a alteração no aparelho.')
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

          persistGoals(updatedGoals)
          setSource('database')
          await removeGoalReminder(user, normalizedGoal)
          setConfirmModal(null)
          showToast('success', 'Meta arquivada', 'A meta foi arquivada.')
        } catch (error) {
          console.error(error)
          const updatedGoals = goals.map((item) => item.id === goal.id ? normalizeGoal({ ...item, status: 'archived' }) : item)
          persistGoals(updatedGoals)
          setSource('local')
          await removeGoalReminder(user, goal)
          setConfirmModal(null)
          showToast('success', 'Meta arquivada localmente', 'Não consegui sincronizar agora, mas preservei a alteração no aparelho.')
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
        const nextPayload = { status: 'active', completedAt: null }

        try {
          const goalFromApi = await apiFetch(`/goals/${goal.id}`, {
            method: 'PUT',
            body: JSON.stringify(nextPayload),
          })

          const normalizedGoal = normalizeGoal(goalFromApi)
          const updatedGoals = goals.map((item) => item.id === normalizedGoal.id ? normalizedGoal : item)

          persistGoals(updatedGoals)
          setSource('database')
          await syncGoalReminder(user, normalizedGoal)
          setConfirmModal(null)
          showToast('success', 'Meta desarquivada', 'A meta voltou para a lista de ativas.')
        } catch (error) {
          console.error(error)
          const updatedGoals = goals.map((item) => item.id === goal.id ? normalizeGoal({ ...item, ...nextPayload, isCompleted: false }) : item)
          persistGoals(updatedGoals)
          setSource('local')
          await syncGoalReminder(user, normalizeGoal({ ...goal, ...nextPayload, isCompleted: false }))
          setConfirmModal(null)
          showToast('success', 'Meta desarquivada localmente', 'Não consegui sincronizar agora, mas preservei a alteração no aparelho.')
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
        const nextPayload = { status: 'active', completedAt: null }

        try {
          const goalFromApi = await apiFetch(`/goals/${goal.id}`, {
            method: 'PUT',
            body: JSON.stringify(nextPayload),
          })

          const normalizedGoal = normalizeGoal(goalFromApi)
          const updatedGoals = goals.map((item) => item.id === normalizedGoal.id ? normalizedGoal : item)

          persistGoals(updatedGoals)
          setSource('database')
          await syncGoalReminder(user, normalizedGoal)
          setConfirmModal(null)
          showToast('success', 'Meta reativada', 'A meta voltou para andamento.')
        } catch (error) {
          console.error(error)
          const updatedGoals = goals.map((item) => item.id === goal.id ? normalizeGoal({ ...item, ...nextPayload, isCompleted: false }) : item)
          persistGoals(updatedGoals)
          setSource('local')
          await syncGoalReminder(user, normalizeGoal({ ...goal, ...nextPayload, isCompleted: false }))
          setConfirmModal(null)
          showToast('success', 'Meta reativada localmente', 'Não consegui sincronizar agora, mas preservei a alteração no aparelho.')
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

          persistGoals(updatedGoals)
          setSource('database')
          await removeGoalReminder(user, goal)
          setConfirmModal(null)
          showToast('success', 'Meta excluída', 'A meta foi removida.')
        } catch (error) {
          console.error(error)
          const updatedGoals = goals.filter((item) => item.id !== goal.id)
          persistGoals(updatedGoals)
          setSource('local')
          await removeGoalReminder(user, goal)
          setConfirmModal(null)
          showToast('success', 'Meta excluída localmente', 'Não consegui sincronizar agora, mas removi a meta deste aparelho.')
        }
      },
    })
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-goals ff-goals-page">
      <AppPageIntro
        eyebrow="Metas"
        title="Transforme consistência em progresso"
        description="Metas automáticas, progresso claro e ações simples para manter o ritmo."
        metrics={[
          { label: 'Ativas', value: stats.active },
          { label: 'Concluída na semana', value: stats.completedThisWeek },
          { label: 'Progresso médio', value: `${stats.averageProgress}%` },
        ]}
      />

      <div className="ff-goals-body ff-page-mobile-main-grid">
        <GoalsPageSections
          source={source}
          loading={loading}
          stats={stats}
          search={search}
          statusFilter={statusFilter}
          goals={enrichedGoals}
          filteredGoals={filteredGoals}
          isModalOpen={isModalOpen}
          modalGoal={modalGoal}
          exerciseOptions={exerciseOptions}
          exercises={exercises}
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
    </div>
  )
}

export default Goals
