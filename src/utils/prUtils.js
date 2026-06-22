import { getUserStorageData } from './userStorage'

export function getWorkoutHistory(user) {
  if (user) {
    return getUserStorageData(user, 'history', [])
  }

  const savedHistory = localStorage.getItem('forgeflow:history')

  if (!savedHistory) {
    return []
  }

  try {
    return JSON.parse(savedHistory)
  } catch {
    return []
  }
}

function normalizeExerciseKey(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getExerciseName(sessionExercise = {}) {
  return (
    sessionExercise.exercise?.name ||
    sessionExercise.exerciseName ||
    sessionExercise.name ||
    ''
  )
}

function isCompletedSet(set = {}) {
  return set.completed === true || set.isCompleted === true || set.done === true
}

function isWarmupSet(set = {}) {
  return set.type === 'warmup' || set.isWarmup === true || set.warmup === true
}

export function getExerciseHistory(exerciseName, user) {
  const history = getWorkoutHistory(user)
  const exerciseHistory = []
  const targetKey = normalizeExerciseKey(exerciseName)

  history.forEach((session) => {
    const exercises = Array.isArray(session.exercises) ? session.exercises : []

    exercises.forEach((sessionExercise) => {
      if (normalizeExerciseKey(getExerciseName(sessionExercise)) === targetKey) {
        exerciseHistory.push({
          workoutName: session.workoutName,
          date: session.finishedAt || session.startedAt,
          sets: Array.isArray(sessionExercise.sets) ? sessionExercise.sets : [],
        })
      }
    })
  })

  return exerciseHistory
}

export function getLastExercisePerformance(exerciseName, user) {
  const history = getExerciseHistory(exerciseName, user)

  if (history.length === 0) {
    return null
  }

  return history[0]
}

export function getBestWeightPerformance(exerciseName, user) {
  const history = getExerciseHistory(exerciseName, user)
  let best = null

  history.forEach((record) => {
    record.sets.forEach((set) => {
      const weight = Number(set.weight)
      const reps = Number(set.reps)

      if (!weight || !reps || !isCompletedSet(set) || isWarmupSet(set)) return

      if (!best || weight > best.weight) {
        best = {
          weight,
          reps,
          volume: weight * reps,
          date: record.date,
          workoutName: record.workoutName,
        }
      }
    })
  })

  return best
}

export function getBestVolumePerformance(exerciseName, user) {
  const history = getExerciseHistory(exerciseName, user)
  let best = null

  history.forEach((record) => {
    record.sets.forEach((set) => {
      const weight = Number(set.weight)
      const reps = Number(set.reps)
      const volume = weight * reps

      if (!weight || !reps || !isCompletedSet(set) || isWarmupSet(set)) return

      if (!best || volume > best.volume) {
        best = {
          weight,
          reps,
          volume,
          date: record.date,
          workoutName: record.workoutName,
        }
      }
    })
  })

  return best
}

export function getBestExercisePerformance(exerciseName, user) {
  return getBestWeightPerformance(exerciseName, user)
}

export function getSessionPRTypes(exerciseName, sets, user) {
  const previousBestWeight = getBestWeightPerformance(exerciseName, user)
  const previousBestVolume = getBestVolumePerformance(exerciseName, user)

  const hasPreviousWeightRecord = Boolean(previousBestWeight?.weight)
  const hasPreviousVolumeRecord = Boolean(previousBestVolume?.volume)

  const previousWeight = Number(previousBestWeight?.weight || 0)
  const previousVolume = Number(previousBestVolume?.volume || 0)

  let bestWeightSet = null
  let bestVolumeSet = null

  sets.forEach((set) => {
    const weight = Number(set.weight)
    const reps = Number(set.reps)
    const volume = weight * reps

    if (!isCompletedSet(set) || isWarmupSet(set) || !weight || !reps) return

    if (
      hasPreviousWeightRecord &&
      weight > previousWeight &&
      (!bestWeightSet || weight > Number(bestWeightSet.weight || 0))
    ) {
      bestWeightSet = set
    }

    if (
      hasPreviousVolumeRecord &&
      volume > previousVolume &&
      (!bestVolumeSet || volume > Number(bestVolumeSet.weight || 0) * Number(bestVolumeSet.reps || 0))
    ) {
      bestVolumeSet = set
    }
  })

  return {
    weightPRSetId: bestWeightSet?.id || null,
    volumePRSetId: bestVolumeSet?.id || null,
    previousBestWeight,
    previousBestVolume,
  }
}

export function getExerciseComparison(exerciseName, currentSet, user) {
  const lastPerformance = getLastExercisePerformance(exerciseName, user)
  const bestWeight = getBestWeightPerformance(exerciseName, user)
  const bestVolume = getBestVolumePerformance(exerciseName, user)

  const currentWeight = Number(currentSet.weight)
  const currentReps = Number(currentSet.reps)
  const currentVolume = currentWeight * currentReps

  if (!currentWeight || !currentReps) {
    return {
      hasData: false,
      message: 'Informe peso e reps para comparar.',
    }
  }

  const lastCompletedSet = lastPerformance?.sets?.find(
    (set) => set.completed && set.weight && set.reps
  )

  const lastWeight = Number(lastCompletedSet?.weight) || 0
  const lastReps = Number(lastCompletedSet?.reps) || 0
  const lastVolume = lastWeight * lastReps

  return {
    hasData: true,
    current: {
      weight: currentWeight,
      reps: currentReps,
      volume: currentVolume,
    },
    last: lastCompletedSet
      ? {
          weight: lastWeight,
          reps: lastReps,
          volume: lastVolume,
          workoutName: lastPerformance.workoutName,
          date: lastPerformance.date,
        }
      : null,
    bestWeight,
    bestVolume,
    weightDiffFromLast: lastCompletedSet ? currentWeight - lastWeight : null,
    repsDiffFromLast: lastCompletedSet ? currentReps - lastReps : null,
    volumeDiffFromLast: lastCompletedSet ? currentVolume - lastVolume : null,
    isWeightPR: bestWeight ? currentWeight > bestWeight.weight : false,
    isVolumePR: bestVolume ? currentVolume > bestVolume.volume : false,
  }
}

export function formatPerformance(set) {
  if (!set?.weight || !set?.reps) {
    return 'Sem registro'
  }

  return `${set.weight}kg x ${set.reps} reps`
}

export function formatDiff(value, suffix = '') {
  if (value === null || value === undefined) return ''

  if (value > 0) return `+${value}${suffix}`
  if (value < 0) return `${value}${suffix}`

  return `0${suffix}`
}
