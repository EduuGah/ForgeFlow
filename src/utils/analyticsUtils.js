export function getStorageData(key, fallback = []) {
  const data = localStorage.getItem(key)

  if (!data) return fallback

  try {
    return JSON.parse(data)
  } catch {
    return fallback
  }
}

export function isValidWorkingSet(set) {
  return (
    set.type !== 'warmup' &&
    set.completed &&
    set.weight &&
    set.reps &&
    Number(set.weight) > 0 &&
    Number(set.reps) > 0
  )
}

export function getSetVolume(set) {
  const weight = Number(set.weight) || 0
  const reps = Number(set.reps) || 0

  return weight * reps
}

export function getCompletedSets(history) {
  return history.flatMap((session) =>
    session.exercises.flatMap((exercise) =>
      exercise.sets
        .filter(isValidWorkingSet)
        .map((set) => ({
          workoutName: session.workoutName,
          date: session.finishedAt,
          exerciseName: exercise.exercise?.name || 'Sem nome',
          muscleGroup: exercise.exercise?.muscleGroup || 'Sem grupo',
          equipment: exercise.exercise?.equipment || 'Sem equipamento',
          weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0,
          volume: getSetVolume(set),
          setNumber: set.setNumber,
          plannedDescription: set.plannedDescription,
          isPR: Boolean(set.isPR || set.isWeightPR || set.isVolumePR),
          isWeightPR: Boolean(set.isWeightPR),
          isVolumePR: Boolean(set.isVolumePR),
        }))
    )
  )
}

export function getTotalVolume(sets) {
  return sets.reduce((total, set) => {
    return total + getSetVolume(set)
  }, 0)
}

export function getHeaviestExercise(sets) {
  if (sets.length === 0) return null

  return sets.reduce((best, current) => {
    if (current.weight > best.weight) return current

    if (current.weight === best.weight && current.reps > best.reps) {
      return current
    }

    return best
  }, sets[0])
}

export function getBestVolumeSet(sets) {
  if (sets.length === 0) return null

  return sets.reduce((best, current) => {
    if (getSetVolume(current) > getSetVolume(best)) return current

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

export function getMuscleGroupVolumeStats(sets) {
  const volumeByGroup = {}

  sets.forEach((set) => {
    volumeByGroup[set.muscleGroup] =
      (volumeByGroup[set.muscleGroup] || 0) + getSetVolume(set)
  })

  return Object.entries(volumeByGroup).map(([group, volume]) => ({
    group,
    volume,
  }))
}

export function getPRCount(sets) {
  return sets.filter((set) => set.isPR).length
}

export function getWeightPRCount(sets) {
  return sets.filter((set) => set.isWeightPR).length
}

export function getVolumePRCount(sets) {
  return sets.filter((set) => set.isVolumePR).length
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
        volume: getSetVolume(set),
        date: set.date,
        workoutName: set.workoutName,
        setNumber: set.setNumber,
      }
    }
  })

  return Object.values(prs)
}

export function getExerciseVolumePRs(sets) {
  const prs = {}

  sets.forEach((set) => {
    if (!set.weight || !set.reps) return

    const current = prs[set.exerciseName]
    const volume = getSetVolume(set)

    if (!current || volume > current.volume) {
      prs[set.exerciseName] = {
        exerciseName: set.exerciseName,
        muscleGroup: set.muscleGroup,
        weight: set.weight,
        reps: set.reps,
        volume,
        date: set.date,
        workoutName: set.workoutName,
        setNumber: set.setNumber,
      }
    }
  })

  return Object.values(prs)
}

export function getRecentPRs(sets, limit = 8) {
  return sets
    .filter((set) => set.isPR)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit)
}

export function getBodyWeightHistory() {
  return getStorageData('forgeflow:bodyweight', [])
}