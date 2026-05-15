import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, CalendarDays, Search, Target, X } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import ResponsiveContainer from '../components/ui/SafeResponsiveContainer'
import DashboardTopSection from '../features/dashboard/components/DashboardTopSection'
import DashboardOverviewSection from '../features/dashboard/components/DashboardOverviewSection'
import DashboardGoalsSection from '../features/dashboard/components/DashboardGoalsSection'
import DashboardNotificationsSection from '../features/dashboard/components/DashboardNotificationsSection'
import DashboardRecoverySection from '../features/dashboard/components/DashboardRecoverySection'
import DashboardMetricsSection from '../features/dashboard/components/DashboardMetricsSection'
import DashboardQuickAccessSection from '../features/dashboard/components/DashboardQuickAccessSection'
import DashboardSectionIntro from '../features/dashboard/components/DashboardSectionIntro'

import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useWorkoutSession } from '../context/WorkoutSessionContext'
import { useAuth } from '../context/AuthContext'
import { getInitialExercises } from '../utils/exerciseStorage'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

import { apiFetch } from '../services/api'
import {
  getCompletedSets,
  getExercisePRs,
  getHeaviestExercise,
  getBestVolumeSet,
  getMostTrainedExercise,
  getMuscleGroupStats,
  getMuscleGroupVolumeStats,
  getPRCount,
  getWeightPRCount,
  getVolumePRCount,
  getRecentPRs,
  getTotalVolume,
} from '../utils/analyticsUtils'

function formatVolume(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')} kg`
}

function formatShortDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatDuration(seconds) {
  const totalSeconds = Number(seconds) || 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }

  return `${minutes}min`
}

function normalizeBodyWeightFromApi(item) {
  const rawDate = item.date || item.createdAt

  return {
    ...item,
    id: item._id || item.id,
    weight: Number(item.weight) || 0,
    date: rawDate ? String(rawDate).slice(0, 10) : '',
    note: item.note || '',
  }
}

function shortenChartLabel(value, maxLength = 12) {
  if (!value) return ''

  const text = String(value)

  if (text.length <= maxLength) return text

  return `${text.slice(0, maxLength)}...`
}

const chartCursor = {
  fill: 'rgba(255, 255, 255, 0.04)',
}

const chartTooltipStyle = {
  background: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
}

const chartTooltipLabelStyle = {
  color: '#fff',
  fontWeight: 700,
}

const chartTooltipItemStyle = {
  color: '#d4d4d8',
}

const chartFocusFixClass =
  'focus:outline-none [&_*]:outline-none [&_svg]:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none'

function getTooltipLabel(label) {
  return label || 'Registro'
}

function formatChartVolume(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')} kg`
}

function runWhenBrowserIsIdle(callback) {
  if (typeof window === 'undefined') return undefined

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, {
      timeout: 1800,
    })

    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = window.setTimeout(callback, 700)

  return () => window.clearTimeout(timeoutId)
}

function ChartLoadingPlaceholder({ label = 'Preparando gráfico' }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-6 text-center">
      <div>
        <div className="mx-auto h-10 w-10 animate-pulse rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]" />

        <p className="mt-4 text-sm font-bold text-[var(--ff-text)]">
          {label}
        </p>

        <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">

        </p>
      </div>
    </div>
  )
}

function getProfileCompletion(profile = {}) {
  const fields = [
    profile.name,
    profile.goal,
    profile.experience,
    profile.currentWeight,
    profile.height,
    profile.weeklyTarget,
  ]

  const completed = fields.filter(Boolean).length

  return Math.round((completed / fields.length) * 100)
}

function getValidSetValue(set) {
  const weight = Number(set.weight) || 0
  const reps = Number(set.reps) || 0

  return {
    weight,
    reps,
    volume: weight * reps,
  }
}

function normalizeWorkoutFromApi(workout) {
  return {
    ...workout,
    id: workout._id || workout.id,
    folderId: workout.folderId || null,
    exercises: Array.isArray(workout.exercises) ? workout.exercises : [],
  }
}

function normalizeHistoryFromApi(session) {
  return {
    ...session,
    id: session._id || session.id,
    duration: session.durationSeconds ?? session.duration ?? 0,
    workoutName: session.workoutName || session.name || 'Treino',
    exercises: Array.isArray(session.exercises) ? session.exercises : [],
    finishedAt: session.finishedAt || session.createdAt,
  }
}

function normalizeExerciseFromApi(exercise) {
  return {
    ...exercise,
    id: exercise._id || exercise.id,
    isFavorite: Boolean(exercise.isFavorite),
  }
}

function getRecoveryStyle(level) {
  const styles = {
    low: {
      label: 'Recuperando',
      text: 'text-red-300',
      border: 'border-red-500/20',
      bg: 'bg-red-500/10',
      bar: 'bg-red-400',
    },
    medium: {
      label: 'Parcial',
      text: 'text-yellow-300',
      border: 'border-yellow-500/20',
      bg: 'bg-yellow-500/10',
      bar: 'bg-yellow-400',
    },
    good: {
      label: 'Quase pronto',
      text: 'text-blue-300',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10',
      bar: 'bg-blue-400',
    },
    ready: {
      label: 'Recuperado',
      text: 'text-emerald-300',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      bar: 'bg-emerald-400',
    },
    unknown: {
      label: 'Sem dados',
      text: 'text-zinc-400',
      border: 'border-zinc-800',
      bg: 'bg-zinc-950',
      bar: 'bg-zinc-500',
    },
  }

  return styles[level] || styles.unknown
}

function formatRecoveryDate(dateString) {
  if (!dateString) return 'Sem registro'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}



function Dashboard() {
  const { user } = useAuth()

  const [exercises, setExercises] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [history, setHistory] = useState([])
  const [bodyWeight, setBodyWeight] = useState([])
  const [profile, setProfile] = useState({})
  const [prSearch, setPrSearch] = useState('')
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false)
  const [dashboardSource, setDashboardSource] = useState('local')
  const [chartAccentColor, setChartAccentColor] = useState('#8b5cf6')
  const [muscleRecovery, setMuscleRecovery] = useState([])
  const [goals, setGoals] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [consistencyStats, setConsistencyStats] = useState({
    currentStreak: 0,
    bestStreak: 0,
    workoutsLast7Days: 0,
    workoutsLast30Days: 0,
    totalWorkoutDays: 0,
    lastWorkoutDate: null,
  })

  const navigate = useNavigate()
  const { startSession } = useWorkoutSession()
  const deferredPrSearch = useDeferredValue(prSearch)

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadDashboardData() {
      setLoadingDashboard(true)
      setShouldRenderCharts(false)

      const cachedExercises = getUserStorageData(user, 'exercises', getInitialExercises())
      const cachedWorkouts = getUserStorageData(user, 'workouts', [])
      const cachedHistory = getUserStorageData(user, 'history', getUserStorageData(user, 'workoutHistory', []))
      const cachedBodyWeight = getUserStorageData(user, 'bodyweight', [])
      const cachedGoals = getUserStorageData(user, 'goals', [])
      const cachedNotifications = getUserStorageData(user, 'notifications', [])

      const userProfile = user?.profile || {}
      const normalizedProfile = {
        name: user?.name || '',
        avatarUrl: user?.avatarUrl || '',
        height: userProfile.height || '',
        currentWeight: userProfile.currentWeight || '',
        goal: userProfile.mainGoal || '',
        experience: userProfile.trainingLevel || '',
        weeklyTarget: userProfile.trainingFrequency
          ? `${userProfile.trainingFrequency} treinos`
          : '',
        preferredSplit: userProfile.preferredSplit || '',
        notes: userProfile.notes || '',
      }

      setProfile(normalizedProfile)
      setExercises(cachedExercises)
      setWorkouts(cachedWorkouts)
      setHistory(cachedHistory)
      setBodyWeight(cachedBodyWeight)
      setGoals(cachedGoals)
      setNotifications(cachedNotifications)
      setUnreadNotificationsCount(
        cachedNotifications.filter((item) => item.status === 'unread').length
      )

      try {
        const [
          workoutsResult,
          historyResult,
          exercisesResult,
          bodyWeightResult,
          consistencyResult,
          muscleRecoveryResult,
          goalsResult,
          notificationsResult,
        ] = await Promise.allSettled([
          apiFetch('/workouts'),
          apiFetch('/workout-history'),
          apiFetch('/exercises'),
          apiFetch('/body-weight'),
          apiFetch('/stats/consistency'),
          apiFetch('/stats/muscle-recovery'),
          apiFetch('/goals'),
          apiFetch('/notifications?limit=5'),
        ])

        const normalizedWorkouts =
          workoutsResult.status === 'fulfilled' &&
            Array.isArray(workoutsResult.value)
            ? workoutsResult.value.map(normalizeWorkoutFromApi)
            : cachedWorkouts

        const normalizedHistoryValue = historyResult.status === 'fulfilled'
          ? historyResult.value
          : null

        const normalizedHistoryArray = Array.isArray(normalizedHistoryValue)
          ? normalizedHistoryValue
          : Array.isArray(normalizedHistoryValue?.history)
            ? normalizedHistoryValue.history
            : []

        const normalizedHistory = normalizedHistoryArray.length > 0
          ? normalizedHistoryArray.map(normalizeHistoryFromApi)
          : cachedHistory

        const exercisesValue = exercisesResult.status === 'fulfilled'
          ? exercisesResult.value
          : null

        const exercisesArray = Array.isArray(exercisesValue)
          ? exercisesValue
          : Array.isArray(exercisesValue?.exercises)
            ? exercisesValue.exercises
            : []

        const userExercises = exercisesArray.length > 0
          ? exercisesArray.map(normalizeExerciseFromApi)
          : (cachedExercises.length > 0 ? cachedExercises : getInitialExercises())

        const normalizedBodyWeight =
          bodyWeightResult.status === 'fulfilled' &&
            Array.isArray(bodyWeightResult.value)
            ? bodyWeightResult.value.map(normalizeBodyWeightFromApi)
            : cachedBodyWeight

        const consistencyFromApi =
          consistencyResult.status === 'fulfilled'
            ? consistencyResult.value
            : null

        const normalizedConsistency = {
          currentStreak: Number(consistencyFromApi?.currentStreak) || 0,
          bestStreak: Number(consistencyFromApi?.bestStreak) || 0,
          workoutsLast7Days: Number(consistencyFromApi?.workoutsLast7Days) || 0,
          workoutsLast30Days: Number(consistencyFromApi?.workoutsLast30Days) || 0,
          totalWorkoutDays: Number(consistencyFromApi?.totalWorkoutDays) || 0,
          lastWorkoutDate: consistencyFromApi?.lastWorkoutDate || null,
        }

        const muscleRecoveryFromApi =
          muscleRecoveryResult.status === 'fulfilled'
            ? muscleRecoveryResult.value
            : null

        const normalizedMuscleRecovery = Array.isArray(
          muscleRecoveryFromApi?.recovery
        )
          ? muscleRecoveryFromApi.recovery
          : []

        const normalizedGoals =
          goalsResult.status === 'fulfilled' && Array.isArray(goalsResult.value)
            ? goalsResult.value.map((goal) => ({
                ...goal,
                id: goal._id || goal.id,
                progressPercent: Number(goal.progressPercent) || 0,
              }))
            : cachedGoals

        const notificationsFromApi =
          notificationsResult.status === 'fulfilled'
            ? notificationsResult.value
            : null

        const normalizedNotifications = Array.isArray(notificationsFromApi?.notifications)
          ? notificationsFromApi.notifications.map((item) => ({
              ...item,
              id: item._id || item.id,
            }))
          : cachedNotifications

        if (!isMounted) return

        setWorkouts(normalizedWorkouts)
        setHistory(normalizedHistory)
        setExercises(userExercises)
        setBodyWeight(normalizedBodyWeight)
        setConsistencyStats(normalizedConsistency)
        setMuscleRecovery(normalizedMuscleRecovery)
        setGoals(normalizedGoals)
        setNotifications(normalizedNotifications)
        setUnreadNotificationsCount(Number(notificationsFromApi?.unreadCount) || 0)


        saveUserStorageData(user, 'workouts', normalizedWorkouts)
        saveUserStorageData(user, 'history', normalizedHistory)
        saveUserStorageData(user, 'workoutHistory', normalizedHistory)
        saveUserStorageData(user, 'exercises', userExercises)
        saveUserStorageData(user, 'bodyweight', normalizedBodyWeight)
        saveUserStorageData(user, 'goals', normalizedGoals)
        saveUserStorageData(user, 'notifications', normalizedNotifications)

        const hasAnyApiSuccess = [
          workoutsResult,
          historyResult,
          exercisesResult,
          bodyWeightResult,
          consistencyResult,
          muscleRecoveryResult,
          goalsResult,
          notificationsResult,
        ].some((result) => result.status === 'fulfilled')

        setDashboardSource(hasAnyApiSuccess ? 'database' : 'local')
      } catch (error) {
        console.error(error)

        if (!isMounted) return

        setExercises(cachedExercises)
        setWorkouts(cachedWorkouts)
        setHistory(cachedHistory)
        setBodyWeight(cachedBodyWeight)

        setConsistencyStats({
          currentStreak: 0,
          bestStreak: 0,
          workoutsLast7Days: 0,
          workoutsLast30Days: 0,
          totalWorkoutDays: 0,
          lastWorkoutDate: null,
        })

        setMuscleRecovery([])
        setGoals(cachedGoals)
        setNotifications(cachedNotifications)
        setUnreadNotificationsCount(cachedNotifications.filter((item) => item.status === 'unread').length)
        setDashboardSource('local')
      } finally {
        if (isMounted) {
          setLoadingDashboard(false)

          runWhenBrowserIsIdle(() => {
            if (isMounted) setShouldRenderCharts(true)
          })
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    function updateChartColor() {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--ff-accent')
        .trim()

      setChartAccentColor(color || '#8b5cf6')
    }

    updateChartColor()

    window.addEventListener('forgeflow:settings-changed', updateChartColor)

    return () => {
      window.removeEventListener('forgeflow:settings-changed', updateChartColor)
    }
  }, [])

  const completedSets = useMemo(() => getCompletedSets(history), [history])

  const totalVolume = useMemo(() => getTotalVolume(completedSets), [completedSets])

  const heaviestExercise = useMemo(
    () => getHeaviestExercise(completedSets),
    [completedSets]
  )

  const mostTrainedExercise = useMemo(
    () => getMostTrainedExercise(completedSets),
    [completedSets]
  )

  const muscleStats = useMemo(
    () => getMuscleGroupStats(completedSets),
    [completedSets]
  )

  const prCount = useMemo(() => getPRCount(completedSets), [completedSets])

  const weightPRCount = useMemo(
    () => getWeightPRCount(completedSets),
    [completedSets]
  )

  const volumePRCount = useMemo(
    () => getVolumePRCount(completedSets),
    [completedSets]
  )

  const bestVolumeSet = useMemo(
    () => getBestVolumeSet(completedSets),
    [completedSets]
  )

  const muscleVolumeStats = useMemo(
    () => getMuscleGroupVolumeStats(completedSets),
    [completedSets]
  )

  const recentPRs = useMemo(
    () => getRecentPRs(completedSets, 4),
    [completedSets]
  )

  const mostRecoveredMuscles = useMemo(() => {
    return muscleRecovery
      .slice()
      .sort((a, b) => b.recoveryPercent - a.recoveryPercent)
      .slice(0, 4)
  }, [muscleRecovery])

  const musclesStillRecovering = useMemo(() => {
    return muscleRecovery
      .filter((item) => item.level === 'low' || item.level === 'medium')
      .slice(0, 4)
  }, [muscleRecovery])

  const workoutsByWeek = useMemo(() => {
    const map = new Map()

    history.forEach((session) => {
      if (!session.finishedAt) return

      const date = new Date(session.finishedAt)
      const year = date.getFullYear()
      const firstDayOfYear = new Date(year, 0, 1)
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000
      const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
      const key = `Sem ${week}`

      map.set(key, (map.get(key) || 0) + 1)
    })

    return Array.from(map.entries()).map(([week, total]) => ({
      week,
      total,
    }))
  }, [history])

  const setsByWorkout = useMemo(() => {
    return history
      .slice()
      .reverse()
      .slice(-8)
      .map((session) => {
        const sets = getCompletedSets([session])

        return {
          name: shortenChartLabel(session.workoutName, 14),
          fullName: session.workoutName,
          sets: sets.length,
        }
      })
  }, [history])

  const muscleVolumeChartData = useMemo(() => {
    return muscleVolumeStats
      .slice()
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 4)
  }, [muscleVolumeStats])

  const exercisePRs = useMemo(() => {
    const weightPRs = getExercisePRs(completedSets)
    const volumeMap = new Map()

    completedSets.forEach((set) => {
      const exerciseName = set.exerciseName

      if (!exerciseName) return

      const { weight, reps, volume } = getValidSetValue(set)

      if (!weight || !reps) return

      const current = volumeMap.get(exerciseName)

      if (!current || volume > current.volume) {
        volumeMap.set(exerciseName, {
          exerciseName,
          muscleGroup: set.muscleGroup || 'Sem grupo',
          weight,
          reps,
          volume,
          date: set.date,
          workoutName: set.workoutName,
          setNumber: set.setNumber,
        })
      }
    })

    return weightPRs
      .map((weightPr) => {
        const volumePr = volumeMap.get(weightPr.exerciseName)
        const weightVolume = Number(weightPr.weight) * Number(weightPr.reps)

        return {
          exerciseName: weightPr.exerciseName,
          muscleGroup: weightPr.muscleGroup,
          weightPR: {
            weight: weightPr.weight,
            reps: weightPr.reps,
            volume: weightVolume,
            date: weightPr.date,
            workoutName: weightPr.workoutName,
            setNumber: weightPr.setNumber,
          },
          volumePR: volumePr || {
            weight: weightPr.weight,
            reps: weightPr.reps,
            volume: weightVolume,
            date: weightPr.date,
            workoutName: weightPr.workoutName,
            setNumber: weightPr.setNumber,
          },
        }
      })
      .filter((pr) =>
        `${pr.exerciseName} ${pr.muscleGroup}`
          .toLowerCase()
          .includes(deferredPrSearch.toLowerCase())
      )
      .sort((a, b) => Number(b.weightPR.weight) - Number(a.weightPR.weight))
      .slice(0, 12)
  }, [completedSets, deferredPrSearch])

  const favoriteWorkouts = useMemo(() => {
    return workouts.filter((workout) => workout.isFavorite)
  }, [workouts])

  const favoriteExercises = useMemo(() => {
    return exercises.filter((exercise) => exercise.isFavorite)
  }, [exercises])

  const recentWorkouts = useMemo(() => {
    return workouts
      .slice()
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1

        const dateA = new Date(a.lastStartedAt || a.updatedAt || a.createdAt || 0)
        const dateB = new Date(b.lastStartedAt || b.updatedAt || b.createdAt || 0)

        return dateB - dateA
      })
      .slice(0, 4)
  }, [workouts])

  const lastSession = history[0] || null
  const currentWeight = bodyWeight.at(-1)?.weight || profile.currentWeight || null

  const totalTrainingSeconds = useMemo(() => {
    return history.reduce((total, session) => {
      return total + Number(session.duration || session.durationSeconds || 0)
    }, 0)
  }, [history])

  const averageDuration = useMemo(() => {
    if (history.length === 0) return 0

    return Math.round(totalTrainingSeconds / history.length)
  }, [history.length, totalTrainingSeconds])

  const averageVolume = useMemo(() => {
    if (history.length === 0) return 0

    return Math.round(totalVolume / history.length)
  }, [history.length, totalVolume])

  const profileCompletion = useMemo(() => {
    return getProfileCompletion(profile)
  }, [profile])

  const lastWorkoutVolume = useMemo(() => {
    if (!lastSession) return 0

    const sets = getCompletedSets([lastSession])

    return getTotalVolume(sets)
  }, [lastSession])

  const volumeByWorkout = useMemo(() => {
    return history
      .slice()
      .reverse()
      .slice(-8)
      .map((session) => {
        const sets = getCompletedSets([session])
        const volume = getTotalVolume(sets)

        return {
          name: shortenChartLabel(session.workoutName, 14),
          fullName: session.workoutName,
          volume,
        }
      })
  }, [history])

  const radarData = useMemo(() => {
    const mainGroups = {
      Peito: 0,
      Costas: 0,
      Ombros: 0,
      Braços: 0,
      Pernas: 0,
      Core: 0,
    }

    completedSets.forEach((set) => {
      if (set.muscleGroup === 'Peito') mainGroups.Peito += 1
      else if (set.muscleGroup === 'Costas') mainGroups.Costas += 1
      else if (set.muscleGroup === 'Ombros') mainGroups.Ombros += 1
      else if (
        set.muscleGroup === 'Bíceps' ||
        set.muscleGroup === 'Tríceps' ||
        set.muscleGroup === 'Antebraço'
      ) {
        mainGroups.Braços += 1
      } else if (
        set.muscleGroup === 'Pernas' ||
        set.muscleGroup === 'Glúteos' ||
        set.muscleGroup === 'Panturrilhas' ||
        set.muscleGroup === 'Quadríceps' ||
        set.muscleGroup === 'Posterior de Coxa' ||
        set.muscleGroup === 'Posterior de coxa'
      ) {
        mainGroups.Pernas += 1
      } else if (
        set.muscleGroup === 'Abdômen' ||
        set.muscleGroup === 'Lombar'
      ) {
        mainGroups.Core += 1
      }
    })

    return Object.entries(mainGroups).map(([group, total]) => ({
      group,
      total,
    }))
  }, [completedSets])

  const strongestMuscleGroup = useMemo(() => {
    return muscleStats.slice().sort((a, b) => b.total - a.total)[0] || null
  }, [muscleStats])

  const dashboardGoals = useMemo(() => {
    return goals
      .filter((goal) => goal.status !== 'archived')
      .sort((a, b) => Number(b.progressPercent || 0) - Number(a.progressPercent || 0))
      .slice(0, 3)
  }, [goals])

  const dashboardNotifications = useMemo(() => {
    return notifications
      .filter((notification) => notification.status !== 'archived')
      .slice(0, 3)
  }, [notifications])

  async function handleStartWorkout(workout) {
    try {
      if (workout?.id) {
        await apiFetch(`/workouts/${workout.id}/start`, {
          method: 'POST',
        })
      }
    } catch (error) {
      console.error(error)
    }

    startSession(workout)
    navigate('/start-workout')
  }

  return (
    <>
      <DashboardTopSection
        dashboardSource={dashboardSource}
        loadingDashboard={loadingDashboard}
        history={history}
        recentPRs={recentPRs}
        formatShortDate={formatShortDate}
      />

      <DashboardOverviewSection
        profile={profile}
        lastSession={lastSession}
        currentWeight={currentWeight}
        heaviestExercise={heaviestExercise}
        strongestMuscleGroup={strongestMuscleGroup}
        profileCompletion={profileCompletion}
        formatShortDate={formatShortDate}
      />


      <DashboardGoalsSection dashboardGoals={dashboardGoals} goals={goals} />


      <DashboardNotificationsSection
        unreadNotificationsCount={unreadNotificationsCount}
        dashboardNotifications={dashboardNotifications}
      />

      <DashboardRecoverySection
        muscleRecovery={muscleRecovery}
        mostRecoveredMuscles={mostRecoveredMuscles}
        musclesStillRecovering={musclesStillRecovering}
        getRecoveryStyle={getRecoveryStyle}
        formatRecoveryDate={formatRecoveryDate}
      />

      <DashboardMetricsSection
        history={history}
        totalVolume={totalVolume}
        totalTrainingSeconds={totalTrainingSeconds}
        prCount={prCount}
        consistencyStats={consistencyStats}
        averageDuration={averageDuration}
        favoriteWorkouts={favoriteWorkouts}
        favoriteExercises={favoriteExercises}
        weightPRCount={weightPRCount}
        volumePRCount={volumePRCount}
        bestVolumeSet={bestVolumeSet}
        lastSession={lastSession}
        lastWorkoutVolume={lastWorkoutVolume}
        averageVolume={averageVolume}
        profile={profile}
        formatVolume={formatVolume}
        formatDuration={formatDuration}
        formatShortDate={formatShortDate}
      />

      <DashboardQuickAccessSection
        recentWorkouts={recentWorkouts}
        favoriteWorkouts={favoriteWorkouts}
        favoriteExercises={favoriteExercises}
        exercises={exercises}
        heaviestExercise={heaviestExercise}
        mostTrainedExercise={mostTrainedExercise}
        handleStartWorkout={handleStartWorkout}
        formatShortDate={formatShortDate}
      />

      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Volume por treino</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Soma de peso × repetições nos últimos treinos.
              </p>
            </div>

            <BarChart3 size={24} className="text-[var(--ff-accent-text)]" />
          </div>

          <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
            {!shouldRenderCharts ? (
              <ChartLoadingPlaceholder label="Preparando gráfico de volume" />
            ) : volumeByWorkout.length === 0 ? (
              <EmptyState
                title="Sem dados para gráfico"
                description="Finalize treinos para gerar evolução de volume."
              />
            ) : (
              <ResponsiveContainer height={320}>
                <BarChart data={volumeByWorkout}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />

                  <XAxis
                    dataKey="name"
                    stroke="var(--ff-muted)"
                    tick={{
                      fontSize: 11,
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="var(--ff-muted)"
                    tick={{
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    cursor={chartCursor}
                    formatter={(value) => [formatChartVolume(value), 'Volume']}
                    labelFormatter={(label, payload) =>
                      getTooltipLabel(payload?.[0]?.payload?.fullName || label)
                    }
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                  />

                  <Bar
                    dataKey="volume"
                    fill={chartAccentColor}
                    radius={[8, 8, 0, 0]}
                    activeBar={{
                      fill: chartAccentColor,
                      opacity: 0.85,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Mapa muscular</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Distribuição dos grupos mais treinados.
              </p>
            </div>

            <Target size={24} className="text-[var(--ff-accent-text)]" />
          </div>

          <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
            {!shouldRenderCharts ? (
              <ChartLoadingPlaceholder label="Preparando radar muscular" />
            ) : completedSets.length === 0 ? (
              <EmptyState
                title="Sem dados musculares"
                description="Finalize treinos para gerar o gráfico."
              />
            ) : (
              <ResponsiveContainer height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis dataKey="group" stroke="#a1a1aa" />

                  <Radar
                    name="Séries"
                    dataKey="total"
                    stroke={chartAccentColor}
                    fill={chartAccentColor}
                    fillOpacity={0.35}
                    activeDot={{
                      r: 5,
                      fill: chartAccentColor,
                      stroke: '#fff',
                      strokeWidth: 2,
                    }}
                  />

                  <Tooltip
                    cursor={false}
                    formatter={(value) => [`${value} série(s)`, 'Total']}
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Treinos por semana</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Frequência semanal registrada no histórico.
              </p>
            </div>

            <CalendarDays size={24} className="text-[var(--ff-accent-text)]" />
          </div>

          <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
            {!shouldRenderCharts ? (
              <ChartLoadingPlaceholder label="Preparando gráfico semanal" />
            ) : workoutsByWeek.length === 0 ? (
              <EmptyState
                title="Sem frequência"
                description="Finalize treinos para gerar esse gráfico."
              />
            ) : (
              <ResponsiveContainer height={320}>
                <BarChart data={workoutsByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                  <XAxis dataKey="week" stroke="var(--ff-muted)" />

                  <YAxis
                    stroke="var(--ff-muted)"
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [`${value} treino(s)`, 'Treinos']}
                    labelFormatter={(label) => `Semana: ${label}`}
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    labelStyle={{
                      color: 'var(--ff-text)',
                      fontWeight: 700,
                    }}
                  />

                  <Bar
                    dataKey="total"
                    fill={chartAccentColor}
                    radius={[8, 8, 0, 0]}
                    activeBar={{
                      fill: chartAccentColor,
                      opacity: 0.85,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Séries por treino</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Quantidade de séries válidas nos últimos treinos.
              </p>
            </div>

            <BarChart3 size={24} className="text-[var(--ff-accent-text)]" />
          </div>

          <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
            {!shouldRenderCharts ? (
              <ChartLoadingPlaceholder label="Preparando gráfico de séries" />
            ) : setsByWorkout.length === 0 ? (
              <EmptyState
                title="Sem séries"
                description="Finalize treinos para gerar esse gráfico."
              />
            ) : (
              <ResponsiveContainer height={320}>
                <BarChart data={setsByWorkout}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />

                  <XAxis
                    dataKey="name"
                    stroke="var(--ff-muted)"
                    tick={{
                      fontSize: 11,
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="var(--ff-muted)"
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [`${value} série(s)`, 'Séries concluídas']}
                    labelFormatter={(label, payload) =>
                      getTooltipLabel(payload?.[0]?.payload?.fullName || label)
                    }
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    labelStyle={{
                      color: 'var(--ff-text)',
                      fontWeight: 700,
                    }}
                  />

                  <Bar
                    dataKey="sets"
                    fill={chartAccentColor}
                    radius={[8, 8, 0, 0]}
                    activeBar={{
                      fill: chartAccentColor,
                      opacity: 0.85,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Volume por músculo</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Grupos musculares com maior volume acumulado.
              </p>
            </div>

            <BarChart3 size={24} className="text-[var(--ff-accent-text)]" />
          </div>

          <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
            {!shouldRenderCharts ? (
              <ChartLoadingPlaceholder label="Preparando gráfico muscular" />
            ) : muscleVolumeChartData.length === 0 ? (
              <EmptyState
                title="Sem volume"
                description="Finalize treinos para gerar esse gráfico."
              />
            ) : (
              <ResponsiveContainer height={320}>
                <BarChart data={muscleVolumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                  <XAxis dataKey="group" stroke="var(--ff-muted)" />

                  <YAxis
                    stroke="var(--ff-muted)"
                    tick={{
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [formatChartVolume(value), 'Volume acumulado']}
                    labelFormatter={(label) => `Grupo: ${label}`}
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    labelStyle={{
                      color: 'var(--ff-text)',
                      fontWeight: 700,
                    }}
                  />

                  <Bar
                    dataKey="volume"
                    fill={chartAccentColor}
                    radius={[8, 8, 0, 0]}
                    activeBar={{
                      fill: chartAccentColor,
                      opacity: 0.85,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </section>

      <DashboardSectionIntro eyebrow="Recordes" title="Seus PRs e destaques" description="Veja seus recordes recentes com contexto completo: data, treino, tipo de PR e volume da série." className="mt-2" />

      <section id="dashboard-prs" className="scroll-mt-24 mt-3 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Recordes pessoais</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Melhores marcas registradas por exercício, separando carga máxima e volume.
              </p>
            </div>

            <Badge variant="purple">
              {exercisePRs.length} exercícios
            </Badge>
          </div>

          <div className="mt-4 flex h-12 items-center gap-3 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-[var(--ff-muted)]">
            <Search size={20} />

            <input
              type="text"
              placeholder="Buscar exercício..."
              value={prSearch}
              onChange={(event) => setPrSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted-2)]"
            />

            {prSearch && (
              <button
                type="button"
                onClick={() => setPrSearch('')}
                className="text-zinc-500 transition hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-2">
            {exercisePRs.length === 0 && (
              <EmptyState
                title="Nenhum PR encontrado"
                description="Tente buscar outro exercício ou finalize treinos."
              />
            )}

            {exercisePRs.map((pr, index) => (
              <div
                key={pr.exerciseName}
                className="rounded-3xl border border-zinc-800 bg-[#18181b] p-4 transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)]/40 hover:bg-[#1f1f23]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)]">
                        #{index + 1}
                      </span>

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 font-bold leading-snug text-white">
                          {pr.exerciseName}
                        </h3>

                        <p className="mt-1 text-xs text-zinc-500">
                          {pr.muscleGroup}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[var(--ff-accent-text)]">
                        Peso PR
                      </p>
                      <Badge>Peso</Badge>
                    </div>

                    <p className="mt-1 text-lg font-black">
                      {pr.weightPR.weight}kg × {pr.weightPR.reps}
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                      {formatShortDate(pr.weightPR.date)} • {pr.weightPR.workoutName || 'Treino'} • Série {pr.weightPR.setNumber || '-'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-orange-300">
                        Volume PR
                      </p>
                      <Badge>Volume</Badge>
                    </div>

                    <p className="mt-1 text-lg font-black">
                      {pr.volumePR.volume}kg
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {pr.volumePR.weight}kg × {pr.volumePR.reps}
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                      {formatShortDate(pr.volumePR.date)} • {pr.volumePR.workoutName || 'Treino'} • Série {pr.volumePR.setNumber || '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">PRs recentes</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Últimos recordes registrados durante os treinos.
          </p>

          <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-2">
            {recentPRs.length === 0 && (
              <EmptyState
                title="Nenhum PR recente"
                description="Finalize treinos com peso e reps para gerar recordes."
              />
            )}

            {recentPRs.map((pr, index) => (
              <div
                key={`${pr.exerciseName}-${index}`}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-bold leading-snug text-white">
                      {pr.exerciseName}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {pr.muscleGroup || 'Sem grupo'} • {formatShortDate(pr.date)}
                    </p>

                    <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                      {pr.workoutName || 'Treino'} • Série {pr.setNumber || '-'} • Volume {formatVolume(pr.volume)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge>
                      {pr.isWeightPR && pr.isVolumePR
                        ? 'Peso + Volume'
                        : pr.isWeightPR
                          ? 'Peso PR'
                          : pr.isVolumePR
                            ? 'Volume PR'
                            : 'PR'}
                    </Badge>

                    <span className="text-xs font-black text-[var(--ff-accent-text)]">
                      {pr.weight}kg × {pr.reps}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  )
}

export default Dashboard