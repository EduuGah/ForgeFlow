import { useDeferredValue, useMemo } from 'react'

import {
  getBestVolumeSet,
  getCompletedSets,
  getExercisePRs,
  getHeaviestExercise,
  getMostTrainedExercise,
  getMuscleGroupStats,
  getMuscleGroupVolumeStats,
  getPRCount,
  getRecentPRs,
  getTotalVolume,
  getVolumePRCount,
  getWeightPRCount,
} from '../../../utils/analyticsUtils'
import {
  getProfileCompletion,
  getValidSetValue,
  shortenChartLabel,
} from '../dashboardUtils'

function buildRadarData(completedSets) {
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
}

function formatShortDate(date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

function getMonday(date) {
  const copy = new Date(date)
  const day = copy.getDay() || 7
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - day + 1)
  return copy
}

function buildWorkoutWeekData(history) {
  const map = new Map()

  history.forEach((session) => {
    if (!session.finishedAt) return

    const date = new Date(session.finishedAt)
    if (Number.isNaN(date.getTime())) return

    const start = getMonday(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    const key = start.toISOString().slice(0, 10)
    const label = `${formatShortDate(start)}–${formatShortDate(end)}`

    const current = map.get(key) || { week: label, fullWeek: label, total: 0, sortDate: start.getTime() }
    current.total += 1
    map.set(key, current)
  })

  return Array.from(map.values())
    .sort((a, b) => a.sortDate - b.sortDate)
    .map((item) => ({ week: item.week, fullWeek: item.fullWeek, total: item.total }))
}

function buildExercisePRs(completedSets, search) {
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
        .includes(search.toLowerCase())
    )
    .sort((a, b) => Number(b.weightPR.weight) - Number(a.weightPR.weight))
    .slice(0, 12)
}

export function useDashboardDerivedData({
  bodyWeight,
  exercises,
  goals,
  history,
  muscleRecovery,
  notifications,
  prSearch,
  profile,
  workouts,
}) {
  const deferredPrSearch = useDeferredValue(prSearch)
  const completedSets = useMemo(() => getCompletedSets(history), [history])
  const totalVolume = useMemo(() => getTotalVolume(completedSets), [completedSets])
  const heaviestExercise = useMemo(() => getHeaviestExercise(completedSets), [completedSets])
  const mostTrainedExercise = useMemo(() => getMostTrainedExercise(completedSets), [completedSets])
  const muscleStats = useMemo(() => getMuscleGroupStats(completedSets), [completedSets])
  const prCount = useMemo(() => getPRCount(completedSets), [completedSets])
  const weightPRCount = useMemo(() => getWeightPRCount(completedSets), [completedSets])
  const volumePRCount = useMemo(() => getVolumePRCount(completedSets), [completedSets])
  const bestVolumeSet = useMemo(() => getBestVolumeSet(completedSets), [completedSets])
  const muscleVolumeStats = useMemo(() => getMuscleGroupVolumeStats(completedSets), [completedSets])
  const recentPRs = useMemo(() => getRecentPRs(completedSets, 4), [completedSets])

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

  const workoutsByWeek = useMemo(() => buildWorkoutWeekData(history), [history])

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

  const exercisePRs = useMemo(
    () => buildExercisePRs(completedSets, deferredPrSearch),
    [completedSets, deferredPrSearch]
  )

  const favoriteWorkouts = useMemo(
    () => workouts.filter((workout) => workout.isFavorite),
    [workouts]
  )

  const favoriteExercises = useMemo(
    () => exercises.filter((exercise) => exercise.isFavorite),
    [exercises]
  )

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

  const profileCompletion = useMemo(() => getProfileCompletion(profile), [profile])

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
      .map((session, index) => {
        const sets = getCompletedSets([session])
        const volume = getTotalVolume(sets)

        return {
          // O nome do treino se repete sempre que a pessoa refaz a mesma
          // rotina, então ele não serve como chave de lista no React.
          id: session.id || session._id || `${session.finishedAt || ''}-${index}`,
          name: shortenChartLabel(session.workoutName, 14),
          fullName: session.workoutName,
          volume,
        }
      })
  }, [history])

  const radarData = useMemo(() => buildRadarData(completedSets), [completedSets])

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

  return {
    averageDuration,
    averageVolume,
    bestVolumeSet,
    completedSets,
    currentWeight,
    dashboardGoals,
    dashboardNotifications,
    exercisePRs,
    favoriteExercises,
    favoriteWorkouts,
    heaviestExercise,
    lastSession,
    lastWorkoutVolume,
    mostRecoveredMuscles,
    mostTrainedExercise,
    muscleVolumeChartData,
    musclesStillRecovering,
    prCount,
    profileCompletion,
    radarData,
    recentPRs,
    recentWorkouts,
    setsByWorkout,
    strongestMuscleGroup,
    totalTrainingSeconds,
    totalVolume,
    volumeByWorkout,
    volumePRCount,
    weightPRCount,
    workoutsByWeek,
  }
}
