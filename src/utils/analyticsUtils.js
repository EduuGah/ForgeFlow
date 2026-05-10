export function getStorageData(key, fallback = []) {
  const data = localStorage.getItem(key)

  if (!data) return fallback

  try {
    return JSON.parse(data)
  } catch {
    return fallback
  }
}

export function isValidWorkingSet(set = {}) {
  const hasCompletionFlag =
    set.completed !== undefined ||
    set.isCompleted !== undefined ||
    set.done !== undefined

  const isCompleted = hasCompletionFlag
    ? set.completed === true || set.isCompleted === true || set.done === true
    : true

  return (
    set.type !== 'warmup' &&
    isCompleted &&
    Number(set.weight) > 0 &&
    Number(set.reps) > 0
  )
}

export function getSetVolume(set = {}) {
  const weight = Number(set.weight) || 0
  const reps = Number(set.reps) || 0

  return weight * reps
}

function getSessionDate(session = {}) {
  return (
    session.finishedAt ||
    session.completedAt ||
    session.date ||
    session.createdAt ||
    session.startedAt ||
    null
  )
}

function getExerciseObject(item = {}) {
  return item.exercise || item.exerciseData || item.details || item
}

function getExerciseName(item = {}, index = 0) {
  const exercise = getExerciseObject(item)

  return (
    exercise.name ||
    exercise.exerciseName ||
    exercise.title ||
    item.name ||
    item.exerciseName ||
    item.title ||
    `Exercício ${index + 1}`
  )
}

function getExerciseMuscleGroup(item = {}) {
  const exercise = getExerciseObject(item)

  return (
    exercise.muscleGroup ||
    exercise.normalizedGroup ||
    exercise.group ||
    item.muscleGroup ||
    item.normalizedGroup ||
    item.group ||
    'Sem grupo'
  )
}

function getExerciseEquipment(item = {}) {
  const exercise = getExerciseObject(item)

  return (
    exercise.equipment ||
    item.equipment ||
    'Sem equipamento'
  )
}

export function getCompletedSets(history = []) {
  if (!Array.isArray(history)) return []

  return history.flatMap((session, sessionIndex) => {
    const exercises = Array.isArray(session?.exercises) ? session.exercises : []
    const workoutName = session?.workoutName || session?.name || `Treino ${sessionIndex + 1}`
    const date = getSessionDate(session)

    return exercises.flatMap((exerciseItem, exerciseIndex) => {
      const sets = Array.isArray(exerciseItem?.sets) ? exerciseItem.sets : []
      const exerciseName = getExerciseName(exerciseItem, exerciseIndex)
      const muscleGroup = getExerciseMuscleGroup(exerciseItem)
      const equipment = getExerciseEquipment(exerciseItem)

      return sets
        .filter(isValidWorkingSet)
        .map((set, setIndex) => ({
          id:
            set.id ||
            set._id ||
            `${session?._id || session?.id || sessionIndex}-${exerciseIndex}-${setIndex}`,
          workoutName,
          date,
          fullDate: date,
          sessionIndex,
          exerciseIndex,
          rawSetIndex: setIndex,
          exerciseName,
          muscleGroup,
          equipment,
          weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0,
          volume: getSetVolume(set),
          setNumber: set.setNumber || setIndex + 1,
          plannedDescription: set.plannedDescription,
          isPR: Boolean(set.isPR || set.isWeightPR || set.isVolumePR),
          isWeightPR: Boolean(set.isWeightPR),
          isVolumePR: Boolean(set.isVolumePR),
        }))
    })
  })
}

export function getTotalVolume(sets = []) {
  return sets.reduce((total, set) => total + getSetVolume(set), 0)
}

export function getHeaviestExercise(sets = []) {
  if (sets.length === 0) return null

  return sets.reduce((best, current) => {
    if (current.weight > best.weight) return current
    if (current.weight === best.weight && current.reps > best.reps) return current
    return best
  }, sets[0])
}

export function getBestVolumeSet(sets = []) {
  if (sets.length === 0) return null

  return sets.reduce((best, current) => {
    if (getSetVolume(current) > getSetVolume(best)) return current
    return best
  }, sets[0])
}

export function getMostTrainedExercise(sets = []) {
  const count = {}

  sets.forEach((set) => {
    const name = set.exerciseName || 'Sem nome'
    count[name] = (count[name] || 0) + 1
  })

  const entries = Object.entries(count)
  if (entries.length === 0) return null

  const [name, total] = entries.sort((a, b) => b[1] - a[1])[0]
  return { name, exerciseName: name, total }
}

export function getMuscleGroupStats(sets = []) {
  const count = {}

  sets.forEach((set) => {
    const group = set.muscleGroup || 'Sem grupo'
    count[group] = (count[group] || 0) + 1
  })

  return Object.entries(count).map(([group, total]) => ({ group, muscleGroup: group, total }))
}

export function getMuscleGroupVolumeStats(sets = []) {
  const volumeByGroup = {}

  sets.forEach((set) => {
    const group = set.muscleGroup || 'Sem grupo'
    volumeByGroup[group] = (volumeByGroup[group] || 0) + getSetVolume(set)
  })

  return Object.entries(volumeByGroup).map(([group, volume]) => ({
    group,
    muscleGroup: group,
    volume,
  }))
}

export function getPRCount(sets = []) {
  return sets.filter((set) => set.isPR).length
}

export function getWeightPRCount(sets = []) {
  return sets.filter((set) => set.isWeightPR).length
}

export function getVolumePRCount(sets = []) {
  return sets.filter((set) => set.isVolumePR).length
}

export function getExercisePRs(sets = []) {
  const prs = {}

  sets.forEach((set) => {
    if (!set.weight || !set.reps) return

    const current = prs[set.exerciseName]

    if (!current || set.weight > current.weight || (set.weight === current.weight && set.reps > current.reps)) {
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

export function getExerciseVolumePRs(sets = []) {
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

export function getRecentPRs(sets = [], limit = 8) {
  return sets
    .filter((set) => set.isPR)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit)
}

export function getBodyWeightHistory() {
  return getStorageData('forgeflow:bodyweight', [])
}
