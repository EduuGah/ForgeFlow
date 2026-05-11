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
    set.done !== undefined ||
    set.status !== undefined

  const isCompleted = hasCompletionFlag
    ? set.completed === true ||
      set.isCompleted === true ||
      set.done === true ||
      set.status === 'completed' ||
      set.status === 'done'
    : true

  return (
    set.type !== 'warmup' &&
    isCompleted &&
    Number(set.weight ?? set.weightKg ?? set.load ?? set.kg ?? 0) > 0 &&
    Number(set.reps ?? set.repetitions ?? set.rep ?? 0) > 0
  )
}

export function getSetVolume(set = {}) {
  const weight = Number(set.weight ?? set.weightKg ?? set.load ?? set.kg ?? 0) || 0
  const reps = Number(set.reps ?? set.repetitions ?? set.rep ?? 0) || 0

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
  if (item.exercise && typeof item.exercise === 'object') return item.exercise
  if (item.exerciseData && typeof item.exerciseData === 'object') return item.exerciseData
  if (item.details && typeof item.details === 'object') return item.details
  if (item.exerciseInfo && typeof item.exerciseInfo === 'object') return item.exerciseInfo
  if (item.originalExercise && typeof item.originalExercise === 'object') return item.originalExercise

  return item
}

function getExerciseName(item = {}, index = 0) {
  const exercise = getExerciseObject(item)

  return (
    exercise.name ||
    exercise.exerciseName ||
    exercise.title ||
    exercise.label ||
    exercise?.exercise?.name ||
    item.name ||
    item.exerciseName ||
    item.title ||
    item.label ||
    item?.exercise?.name ||
    item?.exercise?.exerciseName ||
    `Exercício ${index + 1}`
  )
}

function getExerciseMuscleGroup(item = {}) {
  const exercise = getExerciseObject(item)

  return (
    exercise.muscleGroup ||
    exercise.normalizedGroup ||
    exercise.group ||
    exercise.primaryMuscle ||
    exercise.targetMuscle ||
    exercise?.exercise?.muscleGroup ||
    item.muscleGroup ||
    item.normalizedGroup ||
    item.group ||
    item.primaryMuscle ||
    item.targetMuscle ||
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


function getExerciseMediaValue(item = {}) {
  const exercise = getExerciseObject(item)

  return (
    exercise.imageUrl ||
    exercise.gifUrl ||
    exercise.mediaUrl ||
    exercise.image ||
    exercise.gif ||
    exercise.media?.image ||
    exercise.media?.gif ||
    item.imageUrl ||
    item.gifUrl ||
    item.mediaUrl ||
    item.image ||
    item.gif ||
    item.media?.image ||
    item.media?.gif ||
    ''
  )
}

function getExerciseSets(exerciseItem = {}) {
  if (Array.isArray(exerciseItem.sets)) return exerciseItem.sets
  if (Array.isArray(exerciseItem.series)) return exerciseItem.series
  if (Array.isArray(exerciseItem.completedSets)) return exerciseItem.completedSets
  if (Array.isArray(exerciseItem.performedSets)) return exerciseItem.performedSets
  if (Array.isArray(exerciseItem.exerciseSets)) return exerciseItem.exerciseSets

  return []
}

function getSetWeight(set = {}) {
  return Number(set.weight ?? set.weightKg ?? set.load ?? set.kg ?? 0) || 0
}

function getSetReps(set = {}) {
  return Number(set.reps ?? set.repetitions ?? set.rep ?? 0) || 0
}

export function getCompletedSets(history = []) {
  if (!Array.isArray(history)) return []

  return history.flatMap((session, sessionIndex) => {
    const exercises = Array.isArray(session?.exercises) ? session.exercises : []
    const workoutName = session?.workoutName || session?.name || `Treino ${sessionIndex + 1}`
    const date = getSessionDate(session)

    return exercises.flatMap((exerciseItem, exerciseIndex) => {
      const sets = getExerciseSets(exerciseItem)
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
          mediaUrl: getExerciseMediaValue(exerciseItem),
          imageUrl: getExerciseMediaValue(exerciseItem),
          weight: getSetWeight(set),
          reps: getSetReps(set),
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
