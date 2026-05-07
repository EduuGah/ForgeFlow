import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  Medal,
  Play,
  Search,
  Target,
  Trophy,
  UserRound,
  Weight,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useWorkoutSession } from '../context/WorkoutSessionContext'
import { useAuth } from '../context/AuthContext'
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
  }
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
  const [dashboardSource, setDashboardSource] = useState('local')
  const [chartAccentColor, setChartAccentColor] = useState('#8b5cf6')

  const navigate = useNavigate()
  const { startSession } = useWorkoutSession()

  useEffect(() => {
    if (!user) return

    async function loadDashboardData() {
      setLoadingDashboard(true)

      const cachedExercises = getUserStorageData(user, 'exercises', [])
      const cachedWorkouts = getUserStorageData(user, 'workouts', [])
      const cachedHistory = getUserStorageData(user, 'history', [])
      const cachedBodyWeight = getUserStorageData(user, 'bodyweight', [])

      const userProfile = user?.profile || {}

      setProfile({
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
      })

      try {
        const [workoutsFromApi, historyFromApi, exercisesFromApi] =
          await Promise.all([
            apiFetch('/workouts'),
            apiFetch('/workout-history'),
            apiFetch('/exercises'),
          ])

        const normalizedWorkouts = Array.isArray(workoutsFromApi)
          ? workoutsFromApi.map(normalizeWorkoutFromApi)
          : []

        const normalizedHistory = Array.isArray(historyFromApi)
          ? historyFromApi.map(normalizeHistoryFromApi)
          : []

        const userExercises = Array.isArray(exercisesFromApi)
          ? exercisesFromApi.map(normalizeExerciseFromApi)
          : []

        const finalExercises =
          userExercises.length > 0 ? userExercises : cachedExercises

        setWorkouts(normalizedWorkouts)
        setHistory(normalizedHistory)
        setExercises(finalExercises)
        setBodyWeight(cachedBodyWeight)

        saveUserStorageData(user, 'workouts', normalizedWorkouts)
        saveUserStorageData(user, 'history', normalizedHistory)

        if (userExercises.length > 0) {
          saveUserStorageData(user, 'exercises', userExercises)
        }

        setDashboardSource('database')
      } catch (error) {
        console.error(error)

        setExercises(cachedExercises)
        setWorkouts(cachedWorkouts)
        setHistory(cachedHistory)
        setBodyWeight(cachedBodyWeight)
        setDashboardSource('local')
      } finally {
        setLoadingDashboard(false)
      }
    }

    loadDashboardData()
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
    () => getRecentPRs(completedSets, 6),
    [completedSets]
  )

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
      .slice(0, 8)
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
          },
          volumePR: volumePr || {
            weight: weightPr.weight,
            reps: weightPr.reps,
            volume: weightVolume,
          },
        }
      })
      .filter((pr) =>
        `${pr.exerciseName} ${pr.muscleGroup}`
          .toLowerCase()
          .includes(prSearch.toLowerCase())
      )
      .sort((a, b) => Number(b.weightPR.weight) - Number(a.weightPR.weight))
      .slice(0, 12)
  }, [completedSets, prSearch])

  const recentWorkouts = workouts
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.lastStartedAt || a.updatedAt || a.createdAt || 0)
      const dateB = new Date(b.lastStartedAt || b.updatedAt || b.createdAt || 0)

      return dateB - dateA
    })
    .slice(0, 5)

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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden border-[var(--ff-accent-border)]/20 bg-gradient-to-br from-[var(--ff-accent-soft)]/20 via-[#18181b] to-[#121212]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-[var(--ff-accent-border)]/30 bg-zinc-950 shadow-[0_0_28px_var(--ff-accent-shadow)]/20">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
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

              <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <Link to="/workouts">
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:w-auto"
                  >
                    <Dumbbell size={18} />
                    Iniciar treino
                  </button>
                </Link>

                <Link to="/history">
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950/70 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900 sm:w-auto"
                  >
                    <CalendarDays size={18} />
                    Ver histórico
                  </button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
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

              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">Peso atual</p>

                <p className="mt-2 text-lg font-bold text-[var(--ff-accent-text)]">
                  {currentWeight ? `${currentWeight}kg` : '--'}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {profile?.height ? `${profile.height}cm altura` : 'Perfil incompleto'}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4 sm:col-span-2 lg:col-span-1">
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

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Streak atual</p>
            <Flame size={20} className="text-orange-400" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-orange-300">
            {currentStreak}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            {currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Últimos 7 dias</p>
            <CalendarDays size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">
            {workoutsLast7Days}
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

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Biblioteca</p>
            <Dumbbell size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">
            {exercises.length}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            exercícios cadastrados
          </p>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
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
              {workoutsLast30Days}
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

          <p className="mt-4 text-sm text-zinc-500">
            {profile?.weeklyTarget
              ? `Sua meta atual é ${profile.weeklyTarget.toLowerCase()} por semana.`
              : workoutsLast30Days > 0
                ? 'Continue registrando seus treinos para acompanhar sua consistência.'
                : 'Finalize seus primeiros treinos para começar a medir consistência.'}
          </p>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Rotinas rápidas</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Inicie uma rotina salva em poucos segundos.
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

          <div className="mt-5 space-y-3">
            {recentWorkouts.length === 0 && (
              <EmptyState
                title="Nenhuma rotina salva"
                description="Crie um treino para iniciar por aqui."
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

      <section className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Volume por treino</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Soma de peso × repetições nos últimos treinos.
              </p>
            </div>

            <Flame size={24} className="text-orange-400" />
          </div>

          <div className={`mt-5 h-[280px] sm:h-72 ${chartFocusFixClass}`}>
            {volumeByWorkout.length === 0 ? (
              <EmptyState
                title="Sem dados para gráfico"
                description="Finalize treinos para gerar evolução de volume."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByWorkout}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

                  <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    tick={{
                      fontSize: 11,
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="#71717a"
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

          <div className={`mt-5 h-[280px] sm:h-72 ${chartFocusFixClass}`}>
            {completedSets.length === 0 ? (
              <EmptyState
                title="Sem dados musculares"
                description="Finalize treinos para gerar o gráfico."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
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

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
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

          <div className={`mt-5 h-[260px] ${chartFocusFixClass}`}>
            {workoutsByWeek.length === 0 ? (
              <EmptyState
                title="Sem frequência"
                description="Finalize treinos para gerar esse gráfico."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workoutsByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="week" stroke="#71717a" />

                  <YAxis
                    stroke="#71717a"
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
                      color: '#fff',
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

          <div className={`mt-5 h-[260px] ${chartFocusFixClass}`}>
            {setsByWorkout.length === 0 ? (
              <EmptyState
                title="Sem séries"
                description="Finalize treinos para gerar esse gráfico."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setsByWorkout}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

                  <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    tick={{
                      fontSize: 11,
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="#71717a"
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
                      color: '#fff',
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

            <Flame size={24} className="text-orange-400" />
          </div>

          <div className={`mt-5 h-[260px] ${chartFocusFixClass}`}>
            {muscleVolumeChartData.length === 0 ? (
              <EmptyState
                title="Sem volume"
                description="Finalize treinos para gerar esse gráfico."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={muscleVolumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="group" stroke="#71717a" />

                  <YAxis
                    stroke="#71717a"
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
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  />

                  <Bar
                    dataKey="volume"
                    fill="#f97316"
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

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
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

          <div className="mt-4 flex h-12 items-center gap-3 rounded-xl bg-[#2a2a2c] px-4 text-zinc-400">
            <Search size={20} />

            <input
              type="text"
              placeholder="Buscar exercício..."
              value={prSearch}
              onChange={(event) => setPrSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-400"
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
                    <p className="text-xs font-bold text-[var(--ff-accent-text)]">
                      Peso PR
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {pr.weightPR.weight}kg × {pr.weightPR.reps}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
                    <p className="text-xs font-bold text-orange-300">
                      Volume PR
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {pr.volumePR.volume}kg
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {pr.volumePR.weight}kg × {pr.volumePR.reps}
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
                      {pr.muscleGroup || 'Sem grupo'}
                    </p>
                  </div>

                  <Badge>
                    {pr.weight}kg × {pr.reps}
                  </Badge>
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