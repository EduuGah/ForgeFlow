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


export const HISTORY_TIMELINE_MODES = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'list', label: 'Lista' },
]

function startOfWeek(date) {
  const nextDate = new Date(date)
  const day = nextDate.getDay()
  const diff = day === 0 ? -6 : 1 - day

  nextDate.setHours(0, 0, 0, 0)
  nextDate.setDate(nextDate.getDate() + diff)

  return nextDate
}

function endOfWeek(date) {
  const nextDate = new Date(date)

  nextDate.setDate(nextDate.getDate() + 6)
  nextDate.setHours(23, 59, 59, 999)

  return nextDate
}

function formatTinyDate(date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function getSessionDateFromMeta(session, historyMetaMap) {
  const meta = historyMetaMap.get(session.id)
  const fallbackDate = session.finishedAt || session.createdAt
  const date = meta?.finishedDate || (fallbackDate ? new Date(fallbackDate) : null)

  return date && Number.isFinite(date.getTime()) ? date : null
}

export function getSessionMuscles(session) {
  const muscles = new Set()

  ;(session.exercises || []).forEach((item) => {
    const exercise = item.exercise || item
    const muscle = exercise.muscleGroup || exercise.group || item.muscleGroup || ''
    const normalized = normalizeText(muscle)

    if (normalized) {
      muscles.add(normalized)
    }
  })

  return Array.from(muscles)
}

export function getSessionMuscleLabels(session) {
  const map = new Map()

  ;(session.exercises || []).forEach((item) => {
    const exercise = item.exercise || item
    const label = exercise.muscleGroup || exercise.group || item.muscleGroup || ''
    const key = normalizeText(label)

    if (key && !map.has(key)) {
      map.set(key, label)
    }
  })

  return Array.from(map.values())
}

export function groupHistoryByTimeline(sessions, historyMetaMap, timelineMode = 'week') {
  if (timelineMode === 'list') {
    return [
      {
        key: 'list',
        label: 'Mais recentes',
        subtitle: `${sessions.length} registro${sessions.length === 1 ? '' : 's'}`,
        sessions,
        totalVolume: sessions.reduce((total, session) => total + (historyMetaMap.get(session.id)?.sessionVolume || 0), 0),
        totalPRs: sessions.reduce((total, session) => total + (historyMetaMap.get(session.id)?.sessionPRs?.length || 0), 0),
      },
    ]
  }

  const groups = new Map()

  sessions.forEach((session) => {
    const date = getSessionDateFromMeta(session, historyMetaMap)
    const meta = historyMetaMap.get(session.id)
    const groupDate = date || new Date(0)
    let key = 'sem-data'
    let label = 'Sem data'
    let subtitle = 'Registros sem data de finalização'

    if (date && timelineMode === 'month') {
      key = `${groupDate.getFullYear()}-${String(groupDate.getMonth() + 1).padStart(2, '0')}`
      label = groupDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
      subtitle = 'Resumo mensal'
    }

    if (date && timelineMode === 'week') {
      const start = startOfWeek(groupDate)
      const end = endOfWeek(start)

      key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
      label = `${formatTinyDate(start)} - ${formatTinyDate(end)}`
      subtitle = 'Semana de treino'
    }

    const current = groups.get(key) || {
      key,
      label,
      subtitle,
      sessions: [],
      totalVolume: 0,
      totalPRs: 0,
    }

    current.sessions.push(session)
    current.totalVolume += meta?.sessionVolume || 0
    current.totalPRs += meta?.sessionPRs?.length || 0
    groups.set(key, current)
  })

  return Array.from(groups.values())
}

export function getHistoryPeriodSummary(history, historyMetaMap) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const previousMonth = previousMonthDate.getMonth()
  const previousMonthYear = previousMonthDate.getFullYear()
  const last30Days = new Date(now)

  last30Days.setDate(now.getDate() - 30)
  last30Days.setHours(0, 0, 0, 0)

  return history.reduce(
    (summary, session) => {
      const meta = historyMetaMap.get(session.id)
      const date = meta?.finishedDate

      if (!date) return summary

      if (date >= last30Days) {
        summary.last30.sessions += 1
        summary.last30.volume += meta.sessionVolume || 0
        summary.last30.prs += meta.sessionPRs?.length || 0
      }

      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        summary.currentMonth.sessions += 1
        summary.currentMonth.volume += meta.sessionVolume || 0
      }

      if (date.getMonth() === previousMonth && date.getFullYear() === previousMonthYear) {
        summary.previousMonth.sessions += 1
        summary.previousMonth.volume += meta.sessionVolume || 0
      }

      return summary
    },
    {
      last30: { sessions: 0, volume: 0, prs: 0 },
      currentMonth: { sessions: 0, volume: 0 },
      previousMonth: { sessions: 0, volume: 0 },
    }
  )
}
