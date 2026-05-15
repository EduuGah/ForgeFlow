import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardTopSection from '../features/dashboard/components/DashboardTopSection'
import DashboardOverviewSection from '../features/dashboard/components/DashboardOverviewSection'
import DashboardGoalsSection from '../features/dashboard/components/DashboardGoalsSection'
import DashboardNotificationsSection from '../features/dashboard/components/DashboardNotificationsSection'
import DashboardRecoverySection from '../features/dashboard/components/DashboardRecoverySection'
import DashboardMetricsSection from '../features/dashboard/components/DashboardMetricsSection'
import DashboardQuickAccessSection from '../features/dashboard/components/DashboardQuickAccessSection'
import DashboardChartsSection from '../features/dashboard/components/DashboardChartsSection'
import DashboardPrsSection from '../features/dashboard/components/DashboardPrsSection'

import { useWorkoutSession } from '../context/useWorkoutSession'
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
import {
  formatDuration,
  formatRecoveryDate,
  formatShortDate,
  formatVolume,
  getProfileCompletion,
  getRecoveryStyle,
  getValidSetValue,
  normalizeBodyWeightFromApi,
  normalizeExerciseFromApi,
  normalizeHistoryFromApi,
  normalizeWorkoutFromApi,
  runWhenBrowserIsIdle,
  shortenChartLabel,
} from '../features/dashboard/dashboardUtils'

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

      <DashboardChartsSection
        shouldRenderCharts={shouldRenderCharts}
        volumeByWorkout={volumeByWorkout}
        completedSets={completedSets}
        radarData={radarData}
        workoutsByWeek={workoutsByWeek}
        setsByWorkout={setsByWorkout}
        muscleVolumeChartData={muscleVolumeChartData}
        chartAccentColor={chartAccentColor}
      />

      <DashboardPrsSection
        exercisePRs={exercisePRs}
        recentPRs={recentPRs}
        prSearch={prSearch}
        setPrSearch={setPrSearch}
        formatShortDate={formatShortDate}
        formatVolume={formatVolume}
      />
    </>
  )
}

export default Dashboard