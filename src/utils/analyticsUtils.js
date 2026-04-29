export function getStorageData(key, fallback = []) {
  const data = localStorage.getItem(key)

  if (!data) return fallback

  try {
    return JSON.parse(data)
  } catch {
    return fallback
  }
}

export function getCompletedSets(history) {
  return history.flatMap((session) =>
    session.exercises.flatMap((exercise) =>
      exercise.sets
        .filter((set) => set.completed)
        .map((set) => ({
          workoutName: session.workoutName,
          date: session.finishedAt,
          exerciseName: exercise.exercise.name,
          muscleGroup: exercise.exercise.muscleGroup,
          weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0,
          isPR: Boolean(set.isPR),
        }))
    )
  )
}

export function getTotalVolume(sets) {
  return sets.reduce((total, set) => {
    return total + set.weight * set.reps
  }, 0)
}

export function getHeaviestExercise(sets) {
  if (sets.length === 0) return null

  return sets.reduce((best, current) => {
    if (current.weight > best.weight) return current
    return best
  }, sets[0])
}

export function getMostTrainedExercise(sets) {
  const count = {}

  sets.forEach((set) => {
    count[set.exerciseName] = (count[set.exerciseName] || 0) + 1
  })

  const entries = Object.entries(count)

  if (entries.length === 0) return null

  const [name, total] = entries.sort((a, b) => b[1] - a[1])[0]

  return { name, total }
}

export function getMuscleGroupStats(sets) {
  const count = {}

  sets.forEach((set) => {
    count[set.muscleGroup] = (count[set.muscleGroup] || 0) + 1
  })

  return Object.entries(count).map(([group, total]) => ({
    group,
    total,
  }))
}

export function getPRCount(sets) {
  return sets.filter((set) => set.isPR).length
}

export function getExercisePRs(sets) {
  const prs = {}

  sets.forEach((set) => {
    if (!set.weight || !set.reps) return

    const current = prs[set.exerciseName]

    if (
      !current ||
      set.weight > current.weight ||
      (set.weight === current.weight && set.reps > current.reps)
    ) {
      prs[set.exerciseName] = {
        exerciseName: set.exerciseName,
        muscleGroup: set.muscleGroup,
        weight: set.weight,
        reps: set.reps,
      }
    }
  })

  return Object.values(prs)
}

export function getBodyWeightHistory() {
  return getStorageData('forgeflow:bodyweight', [])
}