import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  Flag,
  Medal,
  Play,
  Search,
  Target,
  Trophy,
  UserRound,
  Weight,
  X,
  Sparkles,
  LineChart,
} from 'lucide-react'
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

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
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

function getDaysDiff(dateA, dateB) {
  const start = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate())
  const end = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate())

  return Math.round((start - end) / 86400000)
}

function getUniqueWorkoutDays(history = []) {
  const days = new Map()

  history.forEach((session) => {
    if (!session.finishedAt) return

    const date = new Date(session.finishedAt)

    if (Number.isNaN(date.getTime())) return

    const key = date.toISOString().slice(0, 10)

    days.set(key, date)
  })

  return Array.from(days.values()).sort((a, b) => b - a)
}

function getCurrentStreak(history = []) {
  const workoutDays = getUniqueWorkoutDays(history)

  if (workoutDays.length === 0) return 0

  const today = new Date()
  const firstDay = workoutDays[0]

  const diffFromToday = getDaysDiff(today, firstDay)

  if (diffFromToday > 1) return 0

  let streak = 1
  let previousDay = firstDay

  for (let index = 1; index < workoutDays.length; index += 1) {
    const currentDay = workoutDays[index]
    const diff = getDaysDiff(previousDay, currentDay)

    if (diff === 1) {
      streak += 1
      previousDay = currentDay
    } else if (diff > 1) {
      break
    }
  }

  return streak
}

function countWorkoutsInLastDays(history = [], days = 7) {
  const now = new Date()
  const limit = new Date()

  limit.setDate(now.getDate() - days)

  return history.filter((session) => {
    if (!session.finishedAt) return false

    const date = new Date(session.finishedAt)

    return date >= limit && date <= now
  }).length
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


function SectionIntro({ eyebrow, title, description, className = '' }) {
  return (
    <div className={`mb-4 flex flex-col gap-1 ${className}`.trim()}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ff-accent-text)]">
        {eyebrow}
      </p>

      <h2 className="text-2xl font-black tracking-tight text-[var(--ff-text)]">
        {title}
      </h2>

      {description && (
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--ff-muted)]">
          {description}
        </p>
      )}
    </div>
  )
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

  const currentStreak = useMemo(() => {
    return getCurrentStreak(history)
  }, [history])

  const workoutsLast7Days = useMemo(() => {
    return countWorkoutsInLastDays(history, 7)
  }, [history])

  const workoutsLast30Days = useMemo(() => {
    return countWorkoutsInLastDays(history, 30)
  }, [history])

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
      <PageHeader
        title="Dashboard"
        description={
          dashboardSource === 'database'
            ? 'Resumo geral da sua evolução com dados sincronizados do banco.'
            : 'Resumo geral da sua evolução usando dados locais.'
        }
        action={
          <div className="flex items-center gap-3">
            <Badge variant={dashboardSource === 'database' ? 'purple' : 'default'}>
              {loadingDashboard
                ? 'Carregando...'
                : dashboardSource === 'database'
                  ? 'Sincronizado'
                  : 'Local'}
            </Badge>

            <Link to="/workouts">
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] hover:shadow-[0_0_20px_var(--ff-accent-shadow)]"
              >
                <Play size={18} />
                Novo treino
              </button>
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden border-[var(--ff-accent-border)]/30 bg-[linear-gradient(135deg,var(--ff-card),var(--ff-surface-2))] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--ff-accent-text)]">
                Início personalizado
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ff-text)]">
                {history.length > 0 ? 'Continue evoluindo hoje' : 'Comece sua jornada no ForgeFlow'}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ff-muted)]">
                {history.length > 0
                  ? `Você já registrou ${history.length} treino${history.length === 1 ? '' : 's'}. Use o painel para voltar ao treino, acompanhar PRs e revisar seu progresso.`
                  : 'Crie sua primeira rotina, inicie o treino e acompanhe evolução, PRs e histórico.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
              <Link
                to="/workouts"
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)]"
              >
                <Play size={17} />
                Treinar
              </Link>

              <Link
                to="/exercise-progress"
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-black text-[var(--ff-text-soft)]"
              >
                <LineChart size={17} />
                PRs
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-500/10 text-yellow-200">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-sm font-black text-[var(--ff-text)]">
                Ranking rápido
              </p>
              <p className="text-xs text-[var(--ff-muted)]">
                Seus destaques recentes
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {recentPRs.length > 0 ? (
              recentPRs.slice(0, 3).map((pr, index) => (
                <div
                  key={`${pr.exerciseName}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[var(--ff-text)]">
                      {pr.exerciseName}
                    </p>
                    <p className="text-xs text-[var(--ff-muted)]">
                      {formatShortDate(pr.date)}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-black text-yellow-200">
                    PR
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm text-[var(--ff-muted)]">
                Registre treinos para montar seu ranking.
              </p>
            )}
          </div>
        </Card>
      </section>



      <nav className="mb-6 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
        <p className="px-2 pb-2 text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
          Mapa rápido
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <a href="#dashboard-overview" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
            Resumo
          </a>
          <a href="#dashboard-goals" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
            Metas
          </a>
          <a href="#dashboard-today" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
            Hoje
          </a>
          <a href="#dashboard-performance" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
            Evolução
          </a>
          <a href="#dashboard-prs" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
            PRs
          </a>
          <a href="#dashboard-notifications" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
            Alertas
          </a>
        </div>
      </nav>

      <SectionIntro eyebrow="Visão geral" title="Seu painel principal" />

      <section id="dashboard-overview" className="scroll-mt-24 mb-8 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden border-[var(--ff-accent-border)]/20 bg-gradient-to-br from-[var(--ff-accent-soft)]/20 via-[var(--ff-card)] to-[var(--ff-surface-2)]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-[var(--ff-accent-border)]/30 bg-zinc-950 shadow-[0_0_28px_var(--ff-accent-shadow)]/20">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      loading="eager"
                      decoding="async"
                      alt={profile?.name || 'Foto de perfil'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--ff-accent-soft)]/20 text-3xl font-black text-[var(--ff-accent-text)]">
                      {(profile?.name || 'F').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10" />
                </div>

                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 px-3 py-1 text-xs font-bold text-[var(--ff-accent-text)]">
                    <Activity size={14} />
                    ForgeFlow ativo
                  </div>

                  <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
                    {profile?.name
                      ? `Olá, ${profile.name}`
                      : 'Bem-vindo ao ForgeFlow'}
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Veja seu progresso, frequência, volume, recordes e próximos treinos em uma visão geral.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <Link to="/workouts">
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-5 text-sm font-bold text-[var(--ff-text)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)] sm:w-auto"
                  >
                    <Dumbbell size={18} />
                    Iniciar treino
                  </button>
                </Link>

                <Link to="/history">
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-5 text-sm font-bold text-[var(--ff-text)] transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)]/50 hover:bg-[var(--ff-card-hover)] sm:w-auto"
                  >
                    <CalendarDays size={18} />
                    Ver histórico
                  </button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                <p className="text-xs text-zinc-500">Último treino</p>

                <p className="mt-2 text-lg font-bold leading-snug text-white">
                  {lastSession ? lastSession.workoutName : '--'}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {lastSession
                    ? formatShortDate(lastSession.finishedAt)
                    : 'Sem histórico'}
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                <p className="text-xs text-zinc-500">Peso atual</p>

                <p className="mt-2 text-lg font-bold text-[var(--ff-accent-text)]">
                  {currentWeight ? `${currentWeight}kg` : '--'}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {profile?.height ? `${profile.height}cm altura` : 'Perfil incompleto'}
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 sm:col-span-2 lg:col-span-1">
                <p className="text-xs text-zinc-500">Melhor destaque</p>

                <p className="mt-2 text-lg font-bold leading-snug text-white">
                  {heaviestExercise
                    ? `${heaviestExercise.exerciseName} • ${heaviestExercise.weight}kg x ${heaviestExercise.reps}`
                    : strongestMuscleGroup
                      ? `${strongestMuscleGroup.group} • ${strongestMuscleGroup.total} séries`
                      : '--'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
              <Target size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">Perfil do atleta</h2>
              <p className="text-sm text-zinc-500">Resumo da sua conta</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-300">
                Perfil preenchido
              </p>

              <p className="text-sm font-black text-[var(--ff-accent-text)]">
                {profileCompletion}%
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
                style={{
                  width: `${profileCompletion}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Objetivo</p>
              <p className="mt-1 font-bold">{profile?.goal || 'Não definido'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Nível</p>
                <p className="mt-1 font-bold">
                  {profile?.experience || '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Peso</p>
                <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
                  {currentWeight ? `${currentWeight}kg` : '—'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Meta semanal</p>
              <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
                {profile?.weeklyTarget || 'Não definida'}
              </p>
            </div>

            <Link to="/profile">
              <button
                type="button"
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-[#18181b] text-sm font-bold text-white transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900"
              >
                <UserRound size={18} />
                Editar perfil
              </button>
            </Link>
          </div>
        </Card>
      </section>


      {/* Metas e notificações aparecem depois do resumo principal para não empurrar o Dashboard para baixo. */}
      <SectionIntro eyebrow="Metas" title="Próximos objetivos" description="Aqui ficam suas metas ativas e o que está mais perto de ser concluído." />

      <section id="dashboard-goals" className="scroll-mt-24 mb-8 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-xs font-black text-[var(--ff-accent-text)]">
                <Target size={14} />
                Metas ativas
              </div>

              <h2 className="mt-3 text-xl font-black text-[var(--ff-text)]">
                Seus próximos objetivos
              </h2>

              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                Acompanhe metas automáticas como treinos semanais, volume mensal, peso corporal e PRs.
              </p>
            </div>

            <Link to="/goals">
              <Button variant="secondary">
                Ver metas
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {dashboardGoals.length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">
                Nenhuma meta criada ainda. Crie metas para treinar, evoluir peso, bater PRs ou registrar fotos.
              </div>
            ) : (
              dashboardGoals.map((goal) => (
                <Link
                  key={goal.id || goal._id}
                  to="/goals"
                  className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-black text-[var(--ff-text)]">
                        {goal.title}
                      </p>

                      <p className="mt-1 text-xs text-[var(--ff-muted)]">
                        {Number(goal.currentValue || 0).toLocaleString('pt-BR')}
                        {goal.unit || ''} / {Number(goal.targetValue || 0).toLocaleString('pt-BR')}
                        {goal.unit || ''}
                      </p>
                    </div>

                    <Badge variant="purple">
                      {Math.min(100, Number(goal.progressPercent || 0))}%
                    </Badge>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--ff-border)]">
                    <div
                      className="h-full rounded-full bg-[var(--ff-accent)]"
                      style={{ width: `${Math.min(100, Number(goal.progressPercent || 0))}%` }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Link
          to="/goals"
          className="flex min-h-[150px] flex-col justify-between rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-5 text-[var(--ff-accent-text)] transition hover:-translate-y-0.5 hover:shadow-[0_0_22px_var(--ff-accent-shadow)]"
        >
          <Flag size={26} />
          <div>
            <p className="text-3xl font-black">{goals.filter((goal) => goal.status === 'active').length}</p>
            <p className="text-sm font-bold">metas ativas</p>
          </div>
        </Link>
      </section>


      <section id="dashboard-today" className="scroll-mt-24 mb-6">
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-xs font-black text-[var(--ff-accent-text)]">
                <Bell size={14} />
                {unreadNotificationsCount > 0
                  ? `${unreadNotificationsCount} não lida(s)`
                  : 'Tudo em dia'}
              </div>

              <h2 className="mt-3 text-xl font-black text-[var(--ff-text)]">
                Notificações inteligentes
              </h2>

              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                Alertas sobre metas, treino, peso corporal e fotos de evolução.
              </p>
            </div>

            <Link to="/notifications">
              <Button variant="secondary">
                Ver notificações
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {dashboardNotifications.length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">
                Nenhuma notificação por enquanto. O ForgeFlow vai avisar quando encontrar algo importante.
              </div>
            ) : (
              dashboardNotifications.map((notification) => (
                <Link
                  key={notification.id || notification._id}
                  to={notification.actionUrl || '/notifications'}
                  className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-black text-[var(--ff-text)]">
                        {notification.title}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs text-[var(--ff-muted)]">
                        {notification.message || 'Sem detalhes.'}
                      </p>
                    </div>

                    {notification.status === 'unread' && (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ff-accent)] shadow-[0_0_14px_var(--ff-accent-shadow)]" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </section>

      <SectionIntro eyebrow="Evolução" title="Como você está treinando" description="Resumo de frequência, consistência, volume e distribuição muscular para entender rapidamente sua fase atual." className="mt-2" />

      <section id="dashboard-performance" className="scroll-mt-24 mt-3 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Recuperação muscular
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Estimativa baseada nos grupos musculares treinados recentemente.
              </p>
            </div>

            <Badge>
              {muscleRecovery.length} grupos
            </Badge>
          </div>

          <div className="mt-5">
            {muscleRecovery.filter((item) => item.level !== 'unknown').length === 0 ? (
              <EmptyState
                title="Sem dados de recuperação"
                description="Finalize alguns treinos para calcular a recuperação dos grupos musculares."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {muscleRecovery
                  .filter((item) => item.level !== 'unknown')
                  .slice(0, 4)
                  .map((item) => {
                    const style = getRecoveryStyle(item.level)

                    return (
                      <div
                        key={item.muscleGroup}
                        className={`rounded-3xl border ${style.border} ${style.bg} p-4`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-white">
                              {item.muscleGroup}
                            </h3>

                            <p className={`mt-1 text-xs font-bold ${style.text}`}>
                              {item.status}
                            </p>
                          </div>

                          <span className={`text-lg font-black ${style.text}`}>
                            {item.recoveryPercent}%
                          </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
                          <div
                            className={`h-full rounded-full ${style.bar}`}
                            style={{
                              width: `${item.recoveryPercent}%`,
                            }}
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl border border-black/20 bg-black/20 p-3">
                            <p className="text-xs text-zinc-500">
                              Último treino
                            </p>

                            <p className="mt-1 text-sm font-bold">
                              {formatRecoveryDate(item.lastTrainedAt)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-black/20 bg-black/20 p-3">
                            <p className="text-xs text-zinc-500">
                              Séries
                            </p>

                            <p className="mt-1 text-sm font-bold">
                              {item.totalSets}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                          {item.message}
                        </p>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">
            Sugestão rápida
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Use isso para escolher melhor o próximo treino.
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-bold text-[var(--ff-success-text)]">
                Mais recuperados
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {mostRecoveredMuscles.length > 0 ? (
                  mostRecoveredMuscles.map((item) => (
                    <Badge key={item.muscleGroup}>
                      {item.muscleGroup}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">
                    Sem dados ainda.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-xs font-bold text-[var(--ff-warning-text)]">
                Ainda recuperando
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {musclesStillRecovering.length > 0 ? (
                  musclesStillRecovering.map((item) => (
                    <Badge key={item.muscleGroup}>
                      {item.muscleGroup}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">
                    Nenhum grupo crítico agora.
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-zinc-500">
              A recuperação é estimada pelo tempo desde o último treino. Depois podemos melhorar usando volume, séries e intensidade.
            </p>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Treinos</p>
            <CalendarDays size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">{history.length}</h2>

          <p className="mt-2 text-xs text-[var(--ff-accent-text)]">
            finalizados
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Volume total</p>
            <Weight size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-[var(--ff-accent-text)]">
            {formatVolume(totalVolume)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            peso × reps
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Tempo total</p>
            <Activity size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">
            {formatDuration(totalTrainingSeconds)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            treinando
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">PRs</p>
            <Trophy size={20} className="text-yellow-400" />
          </div>

          <h2 className="mt-2 text-2xl font-black">{prCount}</h2>

          <p className="mt-2 text-xs text-zinc-500">
            recordes
          </p>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Streak atual</p>
            <Flame size={20} className="text-orange-400" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-orange-300">
            {consistencyStats.currentStreak}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            {consistencyStats.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Últimos 7 dias</p>
            <CalendarDays size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">
            {consistencyStats.workoutsLast7Days}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            treinos feitos
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Média por treino</p>
            <BarChart3 size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">
            {formatDuration(averageDuration)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            duração média
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Favoritos</p>
            <Trophy size={20} className="text-yellow-400" />
          </div>

          <h2 className="mt-2 text-3xl font-black text-[var(--ff-warning-text)]">
            {favoriteWorkouts.length + favoriteExercises.length}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            {favoriteWorkouts.length} treinos • {favoriteExercises.length} exercícios
          </p>
        </Card>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">PRs de peso</p>
            <Trophy size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-[var(--ff-accent-text)]">
            {weightPRCount}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Recordes por maior carga
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">PRs de volume</p>
            <Flame size={20} className="text-orange-400" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-orange-300">
            {volumePRCount}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Recordes por peso × reps
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Melhor volume em série</p>
            <Weight size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          {bestVolumeSet ? (
            <>
              <h2 className="mt-2 text-2xl font-black text-[var(--ff-accent-text)]">
                {bestVolumeSet.volume}kg
              </h2>

              <p className="mt-2 text-xs text-zinc-500">
                {bestVolumeSet.exerciseName} • {bestVolumeSet.weight}kg × {bestVolumeSet.reps}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-black">--</h2>
              <p className="mt-2 text-xs text-zinc-500">Sem dados ainda</p>
            </>
          )}
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 px-3 py-1 text-xs font-bold text-[var(--ff-accent-text)]">
                <Dumbbell size={14} />
                Último treino
              </div>

              <h2 className="mt-4 text-2xl font-black">
                {lastSession
                  ? lastSession.workoutName
                  : 'Nenhum treino finalizado'}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                {lastSession
                  ? `${formatShortDate(lastSession.finishedAt)} • ${formatDuration(lastSession.duration || lastSession.durationSeconds)} • ${formatVolume(lastWorkoutVolume)}`
                  : 'Finalize um treino para ver o resumo aqui.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Exercícios</p>
                <p className="mt-1 text-xl font-black">
                  {lastSession?.exercises?.length || 0}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Volume</p>
                <p className="mt-1 text-xl font-black text-[var(--ff-accent-text)]">
                  {formatVolume(lastWorkoutVolume)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Duração</p>
                <p className="mt-1 text-xl font-black">
                  {lastSession
                    ? formatDuration(lastSession.duration || lastSession.durationSeconds)
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Consistência</h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Nos últimos 30 dias você finalizou:
          </p>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-5xl font-black text-[var(--ff-accent-text)]">
              {consistencyStats.workoutsLast30Days}
            </span>

            <span className="pb-2 text-sm font-bold text-zinc-400">
              treino(s)
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs text-zinc-500">Volume médio por treino</p>

            <p className="mt-1 text-lg font-black text-[var(--ff-accent-text)]">
              {formatVolume(averageVolume)}
            </p>
          </div>

          <div className="mt-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
            <p className="text-xs font-bold text-[var(--ff-warning-text)]">
              Melhor sequência
            </p>

            <p className="mt-1 text-lg font-black text-[var(--ff-warning-text)]">
              {consistencyStats.bestStreak} dia(s)
            </p>
          </div>

          {consistencyStats.lastWorkoutDate && (
            <p className="mt-3 text-xs text-zinc-500">
              Último treino em {formatShortDate(consistencyStats.lastWorkoutDate)}
            </p>
          )}

          <p className="mt-4 text-sm text-zinc-500">
            {profile?.weeklyTarget
              ? `Sua meta atual é ${profile.weeklyTarget.toLowerCase()} por semana.`
              : consistencyStats.workoutsLast30Days > 0
                ? 'Continue registrando seus treinos para acompanhar sua consistência.'
                : 'Finalize seus primeiros treinos para começar a medir consistência.'}
          </p>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Rotinas rápidas</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Favoritos aparecem primeiro para você iniciar mais rápido.
              </p>
            </div>

            <Link to="/workouts">
              <button
                type="button"
                className="hidden items-center gap-1 text-sm font-bold text-[var(--ff-accent-text)] transition hover:text-[var(--ff-accent-text)] sm:flex"
              >
                Ver todas
                <ChevronRight size={18} />
              </button>
            </Link>
          </div>

          {favoriteWorkouts.length > 0 && (
            <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm font-bold text-[var(--ff-warning-text)]">
                ⭐ {favoriteWorkouts.length} treino(s) favorito(s)
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">
                Eles aparecem primeiro nesta lista para facilitar o início do treino.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {recentWorkouts.length === 0 && (
              <EmptyState
                title="Nenhuma rotina salva"
                description="Crie um treino e marque seus favoritos para aparecerem aqui."
                action={
                  <Link to="/workouts">
                    <Button>Criar treino</Button>
                  </Link>
                }
              />
            )}

            {recentWorkouts.map((workout) => {
              const groups = [
                ...new Set(
                  workout.exercises.map((item) => item.exercise?.muscleGroup)
                ),
              ].filter(Boolean)

              const firstExercise = workout.exercises[0]?.exercise
              const media =
                firstExercise?.media?.gif ||
                firstExercise?.mediaUrl ||
                firstExercise?.gifUrl ||
                ''

              const lastStartedLabel = workout.lastStartedAt
                ? `Último início: ${formatShortDate(workout.lastStartedAt)}`
                : `${workout.exercises.length} exercícios`

              return (
                <div
                  key={workout.id}
                  className="rounded-3xl border border-zinc-800 bg-[#18181b] p-4 transition hover:border-[var(--ff-accent-border)]/40 hover:bg-[#1f1f23]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                        {media ? (
                          <img
                            src={media}
                            loading="lazy"
                            decoding="async"
                            alt={firstExercise?.name || workout.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Dumbbell size={28} className="text-zinc-900" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white">
                          {workout.name}
                        </h3>
                        {workout.isFavorite && (
                          <div className="mt-2">
                            <Badge>
                              ⭐ Favorito
                            </Badge>
                          </div>
                        )}

                        <p className="mt-1 text-sm text-zinc-500">
                          {lastStartedLabel}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {groups.slice(0, 4).map((group) => (
                            <Badge key={group} variant="purple">
                              {group}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
                      <button
                        type="button"
                        onClick={() => handleStartWorkout(workout)}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)] sm:w-auto"
                      >
                        <Play size={17} />
                        Iniciar
                      </button>

                      <Link to="/workouts">
                        <button
                          type="button"
                          className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 sm:w-auto"
                        >
                          Ver
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
              <Medal size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">Destaques</h2>
              <p className="text-sm text-zinc-500">Melhores marcas</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Maior carga</p>

              {heaviestExercise ? (
                <>
                  <h3 className="mt-1 text-2xl font-black text-[var(--ff-accent-text)]">
                    {heaviestExercise.weight}kg
                  </h3>

                  <p className="mt-1 text-sm text-zinc-400">
                    {heaviestExercise.exerciseName} × {heaviestExercise.reps} reps
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">Sem registro ainda.</p>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Mais treinado</p>

              {mostTrainedExercise ? (
                <>
                  <h3 className="mt-1 text-lg font-bold">
                    {mostTrainedExercise.name}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-400">
                    {mostTrainedExercise.total} séries feitas
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">Sem registro ainda.</p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Exercícios favoritos
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Atalhos para os exercícios que você mais usa na montagem de treino.
              </p>
            </div>

            <Badge>
              ⭐ {favoriteExercises.length}
            </Badge>
          </div>

          <div className="mt-5">
            {favoriteExercises.length === 0 ? (
              <EmptyState
                title="Nenhum exercício favorito"
                description="Marque exercícios como favoritos na biblioteca para aparecerem aqui."
                action={
                  <Link to="/exercises">
                    <Button variant="secondary">
                      Ver exercícios
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {favoriteExercises.slice(0, 6).map((exercise) => {
                  const media =
                    exercise.media?.gif ||
                    exercise.media?.image ||
                    exercise.mediaUrl ||
                    exercise.gifUrl ||
                    ''

                  return (
                    <Link
                      key={exercise.id}
                      to={`/exercises/${exercise.id}`}
                      className="rounded-3xl border border-zinc-800 bg-[#18181b] p-4 transition hover:-translate-y-0.5 hover:border-yellow-500/30 hover:bg-[#1f1f23]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-700 bg-white">
                          {media ? (
                            <img
                              src={media}
                              loading="lazy"
                              decoding="async"
                              alt={exercise.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Dumbbell size={24} className="text-zinc-900" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 font-bold leading-snug text-white">
                            {exercise.name}
                          </h3>

                          <p className="mt-1 text-xs text-zinc-500">
                            {exercise.muscleGroup || 'Sem grupo'} • {exercise.equipment || 'Sem equipamento'}
                          </p>
                        </div>

                        <span className="text-yellow-300">
                          ⭐
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">
            Biblioteca
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Resumo dos exercícios cadastrados.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">
                Total de exercícios
              </p>

              <p className="mt-1 text-2xl font-black">
                {exercises.length}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-xs text-yellow-200/70">
                Favoritos
              </p>

              <p className="mt-1 text-2xl font-black text-yellow-300">
                {favoriteExercises.length}
              </p>
            </div>

            <Link to="/exercises">
              <button
                type="button"
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-[#18181b] text-sm font-bold text-white transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900"
              >
                <Dumbbell size={18} />
                Abrir biblioteca
              </button>
            </Link>
          </div>
        </Card>
      </section>

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

      <SectionIntro eyebrow="Recordes" title="Seus PRs e destaques" description="Veja seus recordes recentes com contexto completo: data, treino, tipo de PR e volume da série." className="mt-2" />

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