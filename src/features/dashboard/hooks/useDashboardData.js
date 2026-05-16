import { useEffect, useState } from 'react'

import { apiFetch } from '../../../services/api'
import { getInitialExercises } from '../../../utils/exerciseStorage'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../../../utils/userStorage'
import {
  normalizeBodyWeightFromApi,
  normalizeExerciseFromApi,
  normalizeHistoryFromApi,
  normalizeWorkoutFromApi,
  runWhenBrowserIsIdle,
} from '../dashboardUtils'

const emptyConsistencyStats = {
  currentStreak: 0,
  bestStreak: 0,
  workoutsLast7Days: 0,
  workoutsLast30Days: 0,
  totalWorkoutDays: 0,
  lastWorkoutDate: null,
}

function buildProfileFromUser(user) {
  const userProfile = user?.profile || {}

  return {
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
}

function normalizeHistoryResult(historyResult, cachedHistory) {
  const normalizedHistoryValue = historyResult.status === 'fulfilled'
    ? historyResult.value
    : null

  const normalizedHistoryArray = Array.isArray(normalizedHistoryValue)
    ? normalizedHistoryValue
    : Array.isArray(normalizedHistoryValue?.history)
      ? normalizedHistoryValue.history
      : []

  return normalizedHistoryArray.length > 0
    ? normalizedHistoryArray.map(normalizeHistoryFromApi)
    : cachedHistory
}

function normalizeExercisesResult(exercisesResult, cachedExercises) {
  const exercisesValue = exercisesResult.status === 'fulfilled'
    ? exercisesResult.value
    : null

  const exercisesArray = Array.isArray(exercisesValue)
    ? exercisesValue
    : Array.isArray(exercisesValue?.exercises)
      ? exercisesValue.exercises
      : []

  return exercisesArray.length > 0
    ? exercisesArray.map(normalizeExerciseFromApi)
    : (cachedExercises.length > 0 ? cachedExercises : getInitialExercises())
}

function normalizeConsistencyResult(consistencyResult) {
  const consistencyFromApi = consistencyResult.status === 'fulfilled'
    ? consistencyResult.value
    : null

  return {
    currentStreak: Number(consistencyFromApi?.currentStreak) || 0,
    bestStreak: Number(consistencyFromApi?.bestStreak) || 0,
    workoutsLast7Days: Number(consistencyFromApi?.workoutsLast7Days) || 0,
    workoutsLast30Days: Number(consistencyFromApi?.workoutsLast30Days) || 0,
    totalWorkoutDays: Number(consistencyFromApi?.totalWorkoutDays) || 0,
    lastWorkoutDate: consistencyFromApi?.lastWorkoutDate || null,
  }
}

function normalizeGoalsResult(goalsResult, cachedGoals) {
  return goalsResult.status === 'fulfilled' && Array.isArray(goalsResult.value)
    ? goalsResult.value.map((goal) => ({
        ...goal,
        id: goal._id || goal.id,
        progressPercent: Number(goal.progressPercent) || 0,
      }))
    : cachedGoals
}

function normalizeNotificationsResult(notificationsResult, cachedNotifications) {
  const notificationsFromApi = notificationsResult.status === 'fulfilled'
    ? notificationsResult.value
    : null

  const notifications = Array.isArray(notificationsFromApi?.notifications)
    ? notificationsFromApi.notifications.map((item) => ({
        ...item,
        id: item._id || item.id,
      }))
    : cachedNotifications

  return {
    notifications,
    unreadCount: Number(notificationsFromApi?.unreadCount) || 0,
  }
}

function getChartAccentColor() {
  if (typeof document === 'undefined') return '#8b5cf6'

  return getComputedStyle(document.documentElement)
    .getPropertyValue('--ff-accent')
    .trim() || '#8b5cf6'
}

export function useDashboardData(user) {
  const [exercises, setExercises] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [history, setHistory] = useState([])
  const [bodyWeight, setBodyWeight] = useState([])
  const [profile, setProfile] = useState({})
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false)
  const [dashboardSource, setDashboardSource] = useState('local')
  const [chartAccentColor, setChartAccentColor] = useState('#8b5cf6')
  const [muscleRecovery, setMuscleRecovery] = useState([])
  const [goals, setGoals] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [consistencyStats, setConsistencyStats] = useState(emptyConsistencyStats)

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
      const normalizedProfile = buildProfileFromUser(user)

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
          workoutsResult.status === 'fulfilled' && Array.isArray(workoutsResult.value)
            ? workoutsResult.value.map(normalizeWorkoutFromApi)
            : cachedWorkouts

        const normalizedHistory = normalizeHistoryResult(historyResult, cachedHistory)
        const userExercises = normalizeExercisesResult(exercisesResult, cachedExercises)

        const normalizedBodyWeight =
          bodyWeightResult.status === 'fulfilled' && Array.isArray(bodyWeightResult.value)
            ? bodyWeightResult.value.map(normalizeBodyWeightFromApi)
            : cachedBodyWeight

        const normalizedConsistency = normalizeConsistencyResult(consistencyResult)

        const muscleRecoveryFromApi =
          muscleRecoveryResult.status === 'fulfilled'
            ? muscleRecoveryResult.value
            : null

        const normalizedMuscleRecovery = Array.isArray(muscleRecoveryFromApi?.recovery)
          ? muscleRecoveryFromApi.recovery
          : []

        const normalizedGoals = normalizeGoalsResult(goalsResult, cachedGoals)
        const { notifications: normalizedNotifications, unreadCount } =
          normalizeNotificationsResult(notificationsResult, cachedNotifications)

        if (!isMounted) return

        setWorkouts(normalizedWorkouts)
        setHistory(normalizedHistory)
        setExercises(userExercises)
        setBodyWeight(normalizedBodyWeight)
        setConsistencyStats(normalizedConsistency)
        setMuscleRecovery(normalizedMuscleRecovery)
        setGoals(normalizedGoals)
        setNotifications(normalizedNotifications)
        setUnreadNotificationsCount(unreadCount)

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
        setConsistencyStats(emptyConsistencyStats)
        setMuscleRecovery([])
        setGoals(cachedGoals)
        setNotifications(cachedNotifications)
        setUnreadNotificationsCount(
          cachedNotifications.filter((item) => item.status === 'unread').length
        )
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
      setChartAccentColor(getChartAccentColor())
    }

    updateChartColor()

    window.addEventListener('forgeflow:settings-changed', updateChartColor)

    return () => {
      window.removeEventListener('forgeflow:settings-changed', updateChartColor)
    }
  }, [])

  return {
    exercises,
    workouts,
    history,
    bodyWeight,
    profile,
    loadingDashboard,
    shouldRenderCharts,
    dashboardSource,
    chartAccentColor,
    muscleRecovery,
    goals,
    notifications,
    unreadNotificationsCount,
    consistencyStats,
  }
}
