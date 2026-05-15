export function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function formatLongDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatWeight(value) {
  if (value === null || value === undefined || value === '') return '—'

  return `${Number(value || 0).toLocaleString('pt-BR')}kg`
}

export function getShortMonth(monthKey = '') {
  if (!monthKey) return 'Sem mês'

  const [year, month] = String(monthKey).split('-')

  if (!year || !month) return monthKey

  const date = new Date(Number(year), Number(month) - 1, 1)

  return date.toLocaleDateString('pt-BR', {
    month: 'short',
    year: '2-digit',
  })
}

export function getExerciseName(item = {}) {
  return (
    item.exercise?.name ||
    item.name ||
    item.exerciseName ||
    'Sem nome'
  )
}

export function getExerciseGroup(item = {}) {
  return (
    item.exercise?.muscleGroup ||
    item.exercise?.normalizedGroup ||
    item.muscleGroup ||
    'Sem grupo'
  )
}

export function getExerciseEquipment(item = {}) {
  return (
    item.exercise?.equipment ||
    item.equipment ||
    'Sem equipamento'
  )
}

export function isValidSet(set = {}) {
  const hasCompletionFlag =
    set.completed !== undefined ||
    set.isCompleted !== undefined ||
    set.done !== undefined

  const isCompleted = hasCompletionFlag
    ? set.completed === true || set.isCompleted === true || set.done === true
    : true

  const weight = Number(set.weight || set.load || 0)
  const reps = Number(set.reps || 0)

  return set.type !== 'warmup' && isCompleted && weight > 0 && reps > 0
}

export function getSetWeight(set = {}) {
  return Number(set.weight || set.load || 0)
}

export function getSetReps(set = {}) {
  return Number(set.reps || 0)
}

export function getSetVolume(set = {}) {
  return getSetWeight(set) * getSetReps(set)
}

export function getSessionDate(session = {}) {
  return session.finishedAt || session.createdAt || session.startedAt
}

export function getSessionSets(session = {}) {
  const rows = []

  const exercises = Array.isArray(session.exercises)
    ? session.exercises
    : []

  exercises.forEach((item, exerciseIndex) => {
    const sets = Array.isArray(item.sets) ? item.sets : []
    const exerciseName = getExerciseName(item)
    const muscleGroup = getExerciseGroup(item)
    const equipment = getExerciseEquipment(item)

    sets.forEach((set, setIndex) => {
      const weight = getSetWeight(set)
      const reps = getSetReps(set)
      const volume = getSetVolume(set)

      rows.push({
        id: `${session._id || session.id || getSessionDate(session)}-${exerciseName}-${set.id || set._id || setIndex}`,
        date: getSessionDate(session),
        workoutName: session.workoutName || session.name || 'Treino',
        exerciseName,
        muscleGroup,
        equipment,
        exerciseIndex: exerciseIndex + 1,
        setNumber: Number(set.setNumber || set.order || setIndex + 1),
        setType: set.type || 'working',
        completed: set.completed === true || set.isCompleted === true || set.done === true,
        isValid: isValidSet(set),
        weight,
        reps,
        volume,
        notes: set.note || set.notes || item.note || '',
      })
    })
  })

  return rows
}

export function getAllRecentSetRows(workouts = []) {
  return workouts.flatMap(getSessionSets)
}

export function getTooltipStyle() {
  return {
    background: 'var(--ff-card)',
    border: '1px solid var(--ff-border)',
    borderRadius: '16px',
    color: 'var(--ff-text)',
    boxShadow: '0 22px 60px rgba(0,0,0,.35)',
  }
}

export function runWhenBrowserIsIdle(callback) {
  if (typeof window === 'undefined') return undefined

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, {
      timeout: 2200,
    })

    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = window.setTimeout(callback, 650)

  return () => window.clearTimeout(timeoutId)
}
