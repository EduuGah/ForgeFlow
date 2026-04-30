export function getWorkoutHistory() {
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

export function getExerciseHistory(exerciseName) {
  const history = getWorkoutHistory()

  const exerciseHistory = []

  history.forEach((session) => {
    session.exercises.forEach((sessionExercise) => {
      if (sessionExercise.exercise.name === exerciseName) {
        exerciseHistory.push({
          workoutName: session.workoutName,
          date: session.finishedAt || session.startedAt,
          sets: sessionExercise.sets,
        })
      }
    })
  })

  return exerciseHistory
}

export function getLastExercisePerformance(exerciseName) {
  const history = getExerciseHistory(exerciseName)

  if (history.length === 0) {
    return null
  }

  return history[0]
}

export function getBestWeightPerformance(exerciseName) {
  const history = getExerciseHistory(exerciseName)

  let best = null

  history.forEach((record) => {
    record.sets.forEach((set) => {
      const weight = Number(set.weight)
      const reps = Number(set.reps)

      if (!weight || !reps || !set.completed) return

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

export function getBestVolumePerformance(exerciseName) {
  const history = getExerciseHistory(exerciseName)

  let best = null

  history.forEach((record) => {
    record.sets.forEach((set) => {
      const weight = Number(set.weight)
      const reps = Number(set.reps)
      const volume = weight * reps

      if (!weight || !reps || !set.completed) return

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

export function getBestExercisePerformance(exerciseName) {
  return getBestWeightPerformance(exerciseName)
}

export function getSessionPRTypes(exerciseName, sets) {
  const previousBestWeight = getBestWeightPerformance(exerciseName)
  const previousBestVolume = getBestVolumePerformance(exerciseName)

  let bestWeight = previousBestWeight?.weight || 0
  let bestVolume = previousBestVolume?.volume || 0

  let weightPRSetId = null
  let volumePRSetId = null

  sets.forEach((set) => {
    const weight = Number(set.weight)
    const reps = Number(set.reps)
    const volume = weight * reps

    if (!set.completed || !weight || !reps) return

    if (weight > bestWeight) {
      bestWeight = weight
      weightPRSetId = set.id
    }

    if (volume > bestVolume) {
      bestVolume = volume
      volumePRSetId = set.id
    }
  })

  return {
    weightPRSetId,
    volumePRSetId,
  }
}

export function getExerciseComparison(exerciseName, currentSet) {
  const lastPerformance = getLastExercisePerformance(exerciseName)
  const bestWeight = getBestWeightPerformance(exerciseName)
  const bestVolume = getBestVolumePerformance(exerciseName)

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
    isWeightPR: bestWeight ? currentWeight > bestWeight.weight : true,
    isVolumePR: bestVolume ? currentVolume > bestVolume.volume : true,
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