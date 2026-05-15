export function formatVolume(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')} kg`
}

export function formatShortDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function formatDuration(seconds) {
  const totalSeconds = Number(seconds) || 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }

  return `${minutes}min`
}

export function normalizeBodyWeightFromApi(item) {
  const rawDate = item.date || item.createdAt

  return {
    ...item,
    id: item._id || item.id,
    weight: Number(item.weight) || 0,
    date: rawDate ? String(rawDate).slice(0, 10) : '',
    note: item.note || '',
  }
}

export function shortenChartLabel(value, maxLength = 12) {
  if (!value) return ''

  const text = String(value)

  if (text.length <= maxLength) return text

  return `${text.slice(0, maxLength)}...`
}

export function runWhenBrowserIsIdle(callback) {
  if (typeof window === 'undefined') return undefined

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, {
      timeout: 1800,
    })

    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = window.setTimeout(callback, 700)

  return () => window.clearTimeout(timeoutId)
}

export function getProfileCompletion(profile = {}) {
  const fields = [
    profile.name,
    profile.goal,
    profile.experience,
    profile.currentWeight,
    profile.height,
    profile.weeklyTarget,
  ]

  const completed = fields.filter(Boolean).length

  return Math.round((completed / fields.length) * 100)
}

export function getValidSetValue(set) {
  const weight = Number(set.weight) || 0
  const reps = Number(set.reps) || 0

  return {
    weight,
    reps,
    volume: weight * reps,
  }
}

export function normalizeWorkoutFromApi(workout) {
  return {
    ...workout,
    id: workout._id || workout.id,
    folderId: workout.folderId || null,
    exercises: Array.isArray(workout.exercises) ? workout.exercises : [],
  }
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

export function normalizeExerciseFromApi(exercise) {
  return {
    ...exercise,
    id: exercise._id || exercise.id,
    isFavorite: Boolean(exercise.isFavorite),
  }
}

export function getRecoveryStyle(level) {
  const styles = {
    low: {
      label: 'Recuperando',
      text: 'text-red-300',
      border: 'border-red-500/20',
      bg: 'bg-red-500/10',
      bar: 'bg-red-400',
    },
    medium: {
      label: 'Parcial',
      text: 'text-yellow-300',
      border: 'border-yellow-500/20',
      bg: 'bg-yellow-500/10',
      bar: 'bg-yellow-400',
    },
    good: {
      label: 'Quase pronto',
      text: 'text-blue-300',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10',
      bar: 'bg-blue-400',
    },
    ready: {
      label: 'Recuperado',
      text: 'text-emerald-300',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      bar: 'bg-emerald-400',
    },
    unknown: {
      label: 'Sem dados',
      text: 'text-zinc-400',
      border: 'border-zinc-800',
      bg: 'bg-zinc-950',
      bar: 'bg-zinc-500',
    },
  }

  return styles[level] || styles.unknown
}

export function formatRecoveryDate(dateString) {
  if (!dateString) return 'Sem registro'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}
