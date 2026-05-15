export const INITIAL_VISIBLE_SESSIONS = 10
export const LOAD_MORE_SESSIONS = 10

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function normalizeHistoryFromApi(session) {
  return {
    ...session,
    id: session._id || session.id,
    duration: session.durationSeconds ?? session.duration ?? 0,
    workoutName: session.workoutName || session.name || 'Treino',
    exercises: Array.isArray(session.exercises) ? session.exercises : [],
    finishedAt: session.finishedAt || session.createdAt,
  }
}

export function formatTime(seconds) {
  const safeSeconds = Number(seconds) || 0
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  const date = new Date(dateString)

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(dateString) {
  if (!dateString) return 'Sem data'

  const date = new Date(dateString)

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function formatHour(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatVolume(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')}kg`
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

export function getSessionCompletedSets(session) {
  return session.exercises.flatMap((exercise) =>
    (exercise.sets || [])
      .filter(isValidWorkingSet)
      .map((set) => ({
        ...set,
        exerciseName: exercise.exercise?.name,
        muscleGroup: exercise.exercise?.muscleGroup,
        equipment: exercise.exercise?.equipment,
      }))
  )
}

export function getSessionVolumeFromSets(sets = []) {
  return sets.reduce((total, set) => {
    const weight = Number(set.weight) || 0
    const reps = Number(set.reps) || 0

    return total + weight * reps
  }, 0)
}

export function getSessionPRsFromSets(sets = []) {
  return sets.filter((set) => set.isPR || set.isWeightPR || set.isVolumePR)
}

export function getExerciseVolume(exercise) {
  return (exercise.sets || []).reduce((total, set) => {
    if (!set.completed) return total

    const weight = Number(set.weight) || 0
    const reps = Number(set.reps) || 0

    return total + weight * reps
  }, 0)
}

export function buildSessionMeta(session, index, totalSessions) {
  const completedSets = getSessionCompletedSets(session)
  const sessionVolume = getSessionVolumeFromSets(completedSets)
  const sessionPRs = getSessionPRsFromSets(completedSets)
  const exerciseNames = session.exercises
    .map((item) => item.exercise?.name)
    .filter(Boolean)
    .join(' ')

  const searchableText = normalizeText(`${session.workoutName} ${exerciseNames}`)

  return {
    id: session.id,
    indexLabel: totalSessions - index,
    completedSets,
    sessionVolume,
    sessionPRs,
    searchableText,
    finishedDate: session.finishedAt ? new Date(session.finishedAt) : null,
  }
}

