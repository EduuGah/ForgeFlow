export function getWorkoutHistory() {
  const savedHistory = localStorage.getItem('forgeflow:history')

  if (!savedHistory) {
    return []
  }

  return JSON.parse(savedHistory)
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

export function getBestExercisePerformance(exerciseName) {
  const history = getExerciseHistory(exerciseName)

  let best = null

  history.forEach((record) => {
    record.sets.forEach((set) => {
      const weight = Number(set.weight)
      const reps = Number(set.reps)

      if (!weight || !reps) return

      if (!best) {
        best = {
          weight,
          reps,
          date: record.date,
          workoutName: record.workoutName,
        }

        return
      }

      const isHigherWeight = weight > best.weight
      const isSameWeightHigherReps = weight === best.weight && reps > best.reps

      if (isHigherWeight || isSameWeightHigherReps) {
        best = {
          weight,
          reps,
          date: record.date,
          workoutName: record.workoutName,
        }
      }
    })
  })

  return best
}

export function isNewPR(exerciseName, weight, reps) {
  const best = getBestExercisePerformance(exerciseName)

  const currentWeight = Number(weight)
  const currentReps = Number(reps)

  if (!currentWeight || !currentReps) {
    return false
  }

  if (!best) {
    return true
  }

  return (
    currentWeight > best.weight ||
    (currentWeight === best.weight && currentReps > best.reps)
  )
}

export function formatPerformance(set) {
  if (!set?.weight || !set?.reps) {
    return 'Sem registro'
  }

  return `${set.weight}kg x ${set.reps} reps`
}