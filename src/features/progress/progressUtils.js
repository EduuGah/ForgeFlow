export const PROGRESS_PERIODS = [
  { key: '7d', label: '7 dias', days: 7, grouping: 'day' },
  { key: '30d', label: '30 dias', days: 30, grouping: 'day' },
  { key: '3m', label: '3 meses', days: 90, grouping: 'week' },
  { key: '6m', label: '6 meses', days: 180, grouping: 'week' },
  { key: 'year', label: 'Ano', days: 365, grouping: 'month' },
  { key: 'all', label: 'Tudo', days: null, grouping: 'month' },
]

const PT_BR_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
})

const PT_BR_LONG_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const PT_BR_MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: '2-digit',
})

const PT_BR_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
})

export function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function normalizeExerciseName(value) {
  return normalizeText(value).replace(/\s+/g, ' ')
}

export function parseLocalDate(value) {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime())
  }

  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const text = String(value).trim()
  if (!text) return null

  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0)
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null

  return date
}

export function startOfLocalDay(value) {
  const date = parseLocalDate(value)
  if (!date) return null

  const copy = new Date(date.getTime())
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function endOfLocalDay(value) {
  const date = parseLocalDate(value)
  if (!date) return null

  const copy = new Date(date.getTime())
  copy.setHours(23, 59, 59, 999)
  return copy
}

export function formatDateKey(value) {
  const date = parseLocalDate(value)
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatDate(dateString) {
  const date = parseLocalDate(dateString)
  if (!date) return 'Sem data'

  return PT_BR_DATE_FORMATTER.format(date)
}

export function formatLongDate(dateString) {
  const date = parseLocalDate(dateString)
  if (!date) return 'Sem data'

  return PT_BR_LONG_DATE_FORMATTER.format(date)
}

export function formatCompactDate(dateString) {
  const date = parseLocalDate(dateString)
  if (!date) return '—'

  return PT_BR_WEEKDAY_FORMATTER.format(date).replace('.', '')
}

export function formatNumber(value, options = {}) {
  const number = toNumber(value)

  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
    ...options,
  }).format(number)
}

export function formatCompactNumber(value, suffix = '') {
  const number = toNumber(value)
  const abs = Math.abs(number)
  const formatted = new Intl.NumberFormat('pt-BR', {
    notation: abs >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: abs >= 10000 ? 1 : 0,
  }).format(number)

  return suffix ? `${formatted} ${suffix}` : formatted
}

export function formatVolume(value) {
  return `${formatCompactNumber(value)} kg`
}

export function formatWeight(value) {
  if (value === null || value === undefined || value === '') return '—'

  return `${formatNumber(value)} kg`
}

export function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.round(toNumber(seconds)))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) return `${hours}h ${minutes}min`
  if (minutes > 0) return `${minutes}min`

  return `${totalSeconds}s`
}

export function getShortMonth(monthKey = '') {
  if (!monthKey) return 'Sem mês'

  const [year, month] = String(monthKey).split('-')
  if (!year || !month) return monthKey

  const date = new Date(Number(year), Number(month) - 1, 1, 12, 0, 0)
  return PT_BR_MONTH_FORMATTER.format(date)
}

export function getExerciseObject(item = {}) {
  if (item.exercise && typeof item.exercise === 'object') return item.exercise
  if (item.exerciseData && typeof item.exerciseData === 'object') return item.exerciseData
  if (item.details && typeof item.details === 'object') return item.details
  if (item.exerciseInfo && typeof item.exerciseInfo === 'object') return item.exerciseInfo
  if (item.originalExercise && typeof item.originalExercise === 'object') return item.originalExercise

  return item
}

export function getExerciseName(item = {}, index = 0) {
  const exercise = getExerciseObject(item)

  return (
    exercise.name ||
    exercise.exerciseName ||
    exercise.title ||
    exercise.label ||
    item.name ||
    item.exerciseName ||
    item.title ||
    item.label ||
    `Exercício ${index + 1}`
  )
}

export function getExerciseGroup(item = {}) {
  const exercise = getExerciseObject(item)

  return (
    exercise.muscleGroup ||
    exercise.normalizedGroup ||
    exercise.group ||
    exercise.primaryMuscle ||
    exercise.targetMuscle ||
    item.muscleGroup ||
    item.normalizedGroup ||
    item.group ||
    item.primaryMuscle ||
    item.targetMuscle ||
    'Sem grupo'
  )
}

export function getExerciseEquipment(item = {}) {
  const exercise = getExerciseObject(item)

  return (
    exercise.equipment ||
    exercise.machine ||
    item.equipment ||
    item.machine ||
    'Sem equipamento'
  )
}

export function getExerciseMedia(item = {}) {
  const exercise = getExerciseObject(item)

  return (
    exercise.imageUrl ||
    exercise.gifUrl ||
    exercise.mediaUrl ||
    exercise.media?.image ||
    exercise.media?.gif ||
    exercise.image ||
    exercise.gif ||
    item.imageUrl ||
    item.gifUrl ||
    item.mediaUrl ||
    item.media?.image ||
    item.media?.gif ||
    item.image ||
    item.gif ||
    ''
  )
}

export function getExerciseSets(exerciseItem = {}) {
  if (Array.isArray(exerciseItem.sets)) return exerciseItem.sets
  if (Array.isArray(exerciseItem.series)) return exerciseItem.series
  if (Array.isArray(exerciseItem.completedSets)) return exerciseItem.completedSets
  if (Array.isArray(exerciseItem.performedSets)) return exerciseItem.performedSets
  if (Array.isArray(exerciseItem.exerciseSets)) return exerciseItem.exerciseSets

  return []
}

export function getSetWeight(set = {}) {
  return toNumber(set.weight ?? set.weightKg ?? set.load ?? set.kg ?? set.peso)
}

export function getSetReps(set = {}) {
  return toNumber(set.reps ?? set.repetitions ?? set.rep ?? set.repeticoes)
}

export function getSetVolume(set = {}) {
  return getSetWeight(set) * getSetReps(set)
}

export function isValidSet(set = {}) {
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
    set.kind !== 'warmup' &&
    isCompleted &&
    getSetWeight(set) > 0 &&
    getSetReps(set) > 0
  )
}

export function getSessionDate(session = {}) {
  return (
    session.finishedAt ||
    session.completedAt ||
    session.date ||
    session.createdAt ||
    session.startedAt ||
    null
  )
}

export function getSessionDuration(session = {}) {
  return toNumber(session.durationSeconds ?? session.duration ?? session.elapsedSeconds)
}

export function normalizeHistoryEntry(session = {}, index = 0) {
  const date = parseLocalDate(getSessionDate(session))
  const id = session._id || session.id || `${formatDateKey(date)}-${index}`

  return {
    ...session,
    id,
    _localIndex: index,
    workoutName: session.workoutName || session.name || `Treino ${index + 1}`,
    durationSeconds: getSessionDuration(session),
    finishedAt: getSessionDate(session),
    date,
    dateKey: formatDateKey(date),
    exercises: Array.isArray(session.exercises) ? session.exercises : [],
  }
}

export function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return []

  return history
    .map(normalizeHistoryEntry)
    .filter((session) => session.date)
    .sort((a, b) => b.date - a.date)
}

export function getSessionSets(session = {}) {
  const normalizedSession = session.date ? session : normalizeHistoryEntry(session)
  const rows = []
  const exercises = Array.isArray(normalizedSession.exercises) ? normalizedSession.exercises : []

  exercises.forEach((item, exerciseIndex) => {
    const sets = getExerciseSets(item)
    const exerciseName = getExerciseName(item, exerciseIndex)
    const muscleGroup = getExerciseGroup(item)
    const equipment = getExerciseEquipment(item)
    const mediaUrl = getExerciseMedia(item)
    const normalizedExerciseName = normalizeExerciseName(exerciseName)

    sets.forEach((set, setIndex) => {
      const weight = getSetWeight(set)
      const reps = getSetReps(set)
      const volume = weight * reps
      const setNumber = toNumber(set.setNumber ?? set.order ?? setIndex + 1, setIndex + 1)
      const completed =
        set.completed === true ||
        set.isCompleted === true ||
        set.done === true ||
        set.status === 'completed' ||
        set.status === 'done'

      rows.push({
        ...set,
        id: `${normalizedSession.id || normalizedSession._id || normalizedSession.dateKey}-${exerciseIndex}-${set.id || set._id || setIndex}`,
        rawSetId: set.id || set._id || '',
        sessionId: normalizedSession.id || normalizedSession._id || '',
        date: normalizedSession.finishedAt,
        dateObject: normalizedSession.date,
        dateKey: normalizedSession.dateKey,
        workoutName: normalizedSession.workoutName || 'Treino',
        exerciseName,
        normalizedExerciseName,
        muscleGroup,
        equipment,
        mediaUrl,
        imageUrl: mediaUrl,
        exerciseIndex: exerciseIndex + 1,
        setNumber,
        completed,
        isValid: isValidSet(set),
        weight,
        reps,
        volume,
        notes: set.note || set.notes || item.note || '',
        isPR: Boolean(set.isPR || set.isWeightPR || set.isVolumePR),
        isWeightPR: Boolean(set.isWeightPR),
        isVolumePR: Boolean(set.isVolumePR),
      })
    })
  })

  return rows
}

export function getAllRecentSetRows(workouts = []) {
  return normalizeHistory(workouts).flatMap(getSessionSets)
}

export function getValidSetRows(history = []) {
  return getAllRecentSetRows(history).filter((row) => row.isValid)
}

export function calculateTotalVolume(history = []) {
  return getValidSetRows(history).reduce((total, row) => total + row.volume, 0)
}

export function getPeriodConfig(periodKey = '30d') {
  return PROGRESS_PERIODS.find((period) => period.key === periodKey) || PROGRESS_PERIODS[1]
}

export function getPeriodRange(periodKey = '30d', nowValue = new Date()) {
  const config = getPeriodConfig(periodKey)
  const now = endOfLocalDay(nowValue) || new Date()

  if (!config.days) {
    return {
      key: config.key,
      label: config.label,
      start: null,
      end: now,
      days: null,
      grouping: config.grouping,
    }
  }

  const start = startOfLocalDay(now)
  start.setDate(start.getDate() - config.days + 1)

  return {
    key: config.key,
    label: config.label,
    start,
    end: now,
    days: config.days,
    grouping: config.grouping,
  }
}

export function filterHistoryByPeriod(history = [], periodKey = '30d', nowValue = new Date()) {
  const normalizedHistory = normalizeHistory(history)
  const range = getPeriodRange(periodKey, nowValue)

  if (!range.start) return normalizedHistory

  return normalizedHistory.filter((session) => {
    if (!session.date) return false
    return session.date >= range.start && session.date <= range.end
  })
}

export function getPreviousPeriodHistory(history = [], periodKey = '30d', nowValue = new Date()) {
  const config = getPeriodConfig(periodKey)
  if (!config.days) return []

  const currentRange = getPeriodRange(periodKey, nowValue)
  const previousEnd = new Date(currentRange.start.getTime())
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1)

  const previousStart = startOfLocalDay(previousEnd)
  previousStart.setDate(previousStart.getDate() - config.days + 1)

  return normalizeHistory(history).filter((session) => {
    if (!session.date) return false
    return session.date >= previousStart && session.date <= previousEnd
  })
}

export function getActiveDayKeys(history = []) {
  return Array.from(
    new Set(
      normalizeHistory(history)
        .map((session) => session.dateKey)
        .filter(Boolean)
    )
  ).sort()
}

export function calculateWorkoutFrequency(history = [], periodKey = '30d') {
  const activeDayKeys = getActiveDayKeys(history)
  const activeDays = activeDayKeys.length
  const totalWorkouts = normalizeHistory(history).length
  const range = getPeriodRange(periodKey)
  const daysInRange = range.days || Math.max(1, activeDays)

  let bestStreak = 0
  let currentStreak = 0
  let previousDate = null

  activeDayKeys.forEach((key) => {
    const date = startOfLocalDay(key)
    if (!date) return

    if (previousDate) {
      const diffDays = Math.round((date - previousDate) / 86400000)
      currentStreak = diffDays === 1 ? currentStreak + 1 : 1
    } else {
      currentStreak = 1
    }

    bestStreak = Math.max(bestStreak, currentStreak)
    previousDate = date
  })

  const averageWeekly = daysInRange > 0 ? totalWorkouts / (daysInRange / 7) : totalWorkouts

  return {
    totalWorkouts,
    activeDays,
    bestStreak,
    averageWeekly: Number.isFinite(averageWeekly) ? averageWeekly : 0,
    activeDayKeys,
  }
}

function getWeekKey(dateValue) {
  const date = startOfLocalDay(dateValue)
  if (!date) return 'sem-data'

  const day = date.getDay() || 7
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + 1)

  return formatDateKey(monday)
}

function getMonthKey(dateValue) {
  const date = parseLocalDate(dateValue)
  if (!date) return 'sem-data'

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getChartBucketLabel(key, grouping) {
  if (grouping === 'month') return getShortMonth(key)
  if (grouping === 'week') return `Sem. ${formatDate(key).slice(0, 5)}`
  return formatCompactDate(key)
}

export function buildVolumeTrend(history = [], periodKey = '30d') {
  const range = getPeriodRange(periodKey)
  const grouping = range.grouping
  const sessions = normalizeHistory(history).slice().sort((a, b) => a.date - b.date)
  const map = new Map()

  sessions.forEach((session) => {
    const sessionRows = getSessionSets(session).filter((row) => row.isValid)
    if (sessionRows.length === 0) return

    const bucketKey = grouping === 'month'
      ? getMonthKey(session.date)
      : grouping === 'week'
        ? getWeekKey(session.date)
        : session.dateKey

    const current = map.get(bucketKey) || {
      key: bucketKey,
      label: getChartBucketLabel(bucketKey, grouping),
      longLabel: grouping === 'month' ? getShortMonth(bucketKey) : formatLongDate(bucketKey),
      workouts: 0,
      sets: 0,
      volume: 0,
      prs: 0,
    }

    current.workouts += 1
    current.sets += sessionRows.length
    current.volume += sessionRows.reduce((sum, row) => sum + row.volume, 0)

    map.set(bucketKey, current)
  })

  const result = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
  const maxVolume = Math.max(0, ...result.map((item) => item.volume))

  return result.map((item) => ({
    ...item,
    isBest: item.volume === maxVolume && maxVolume > 0,
  }))
}

function getExerciseWorkoutEntries(history = []) {
  const entries = []

  normalizeHistory(history)
    .slice()
    .sort((a, b) => a.date - b.date)
    .forEach((session) => {
      const groupedByExercise = new Map()

      getSessionSets(session)
        .filter((row) => row.isValid)
        .forEach((row) => {
          const key = row.normalizedExerciseName || normalizeExerciseName(row.exerciseName)
          const current = groupedByExercise.get(key) || {
            key,
            exerciseName: row.exerciseName,
            muscleGroup: row.muscleGroup,
            equipment: row.equipment,
            mediaUrl: row.mediaUrl,
            sessionId: session.id,
            workoutName: session.workoutName,
            date: session.finishedAt,
            dateObject: session.date,
            dateKey: session.dateKey,
            sets: [],
            maxWeight: 0,
            maxReps: 0,
            totalVolume: 0,
          }

          current.sets.push(row)
          current.maxWeight = Math.max(current.maxWeight, row.weight)
          current.maxReps = Math.max(current.maxReps, row.reps)
          current.totalVolume += row.volume

          groupedByExercise.set(key, current)
        })

      entries.push(...groupedByExercise.values())
    })

  return entries
}

function buildSavedPrs(history = []) {
  const saved = []

  normalizeHistory(history).forEach((session) => {
    if (Array.isArray(session.prs)) {
      session.prs.forEach((pr, index) => {
        saved.push({
          id: `${session.id}-server-pr-${pr.id || pr.setId || index}`,
          type: normalizeText(pr.type || pr.label || 'recorde') || 'recorde',
          label: pr.label || pr.type || 'PR',
          exerciseName: pr.exerciseName || pr.exercise || pr.name || 'Exercício',
          value: toNumber(pr.value ?? pr.newValue ?? pr.weight ?? pr.volume),
          previousValue: toNumber(pr.previousValue ?? pr.previous),
          weight: toNumber(pr.weight),
          reps: toNumber(pr.reps),
          volume: toNumber(pr.volume),
          date: pr.date || session.finishedAt,
          dateObject: parseLocalDate(pr.date || session.finishedAt),
          dateKey: formatDateKey(pr.date || session.finishedAt),
          workoutName: pr.workoutName || session.workoutName,
          source: 'saved',
        })
      })
    }

    getSessionSets(session).forEach((row) => {
      if (!row.isValid || !row.isPR) return

      saved.push({
        id: `${row.id}-saved-pr`,
        type: row.isWeightPR ? 'weight' : row.isVolumePR ? 'volume' : 'recorde',
        label: row.isWeightPR ? 'Maior carga' : row.isVolumePR ? 'Maior volume' : 'PR',
        exerciseName: row.exerciseName,
        value: row.isVolumePR ? row.volume : row.weight,
        previousValue: toNumber(row.previousValue ?? row.previousBestWeight ?? row.previousBestVolume),
        weight: row.weight,
        reps: row.reps,
        volume: row.volume,
        date: row.date,
        dateObject: row.dateObject,
        dateKey: row.dateKey,
        workoutName: row.workoutName,
        source: 'saved',
      })
    })
  })

  return saved
}

export function calculateRecentPRs(history = [], periodKey = '30d') {
  const allRows = getValidSetRows(history).slice().sort((a, b) => a.dateObject - b.dateObject)
  const bestByExercise = new Map()
  const computed = []

  allRows.forEach((row) => {
    const key = row.normalizedExerciseName
    if (!key) return

    const previous = bestByExercise.get(key) || {
      weight: 0,
      reps: 0,
      setVolume: 0,
    }

    if (row.weight > previous.weight && previous.weight > 0) {
      computed.push({
        id: `${row.id}-weight-pr`,
        type: 'weight',
        label: 'Maior carga',
        exerciseName: row.exerciseName,
        value: row.weight,
        previousValue: previous.weight,
        weight: row.weight,
        reps: row.reps,
        volume: row.volume,
        date: row.date,
        dateObject: row.dateObject,
        dateKey: row.dateKey,
        workoutName: row.workoutName,
        source: 'computed',
      })
    }

    if (row.reps > previous.reps && previous.reps > 0) {
      computed.push({
        id: `${row.id}-reps-pr`,
        type: 'reps',
        label: 'Mais repetições',
        exerciseName: row.exerciseName,
        value: row.reps,
        previousValue: previous.reps,
        weight: row.weight,
        reps: row.reps,
        volume: row.volume,
        date: row.date,
        dateObject: row.dateObject,
        dateKey: row.dateKey,
        workoutName: row.workoutName,
        source: 'computed',
      })
    }

    if (row.volume > previous.setVolume && previous.setVolume > 0) {
      computed.push({
        id: `${row.id}-set-volume-pr`,
        type: 'set-volume',
        label: 'Volume em série',
        exerciseName: row.exerciseName,
        value: row.volume,
        previousValue: previous.setVolume,
        weight: row.weight,
        reps: row.reps,
        volume: row.volume,
        date: row.date,
        dateObject: row.dateObject,
        dateKey: row.dateKey,
        workoutName: row.workoutName,
        source: 'computed',
      })
    }

    bestByExercise.set(key, {
      weight: Math.max(previous.weight, row.weight),
      reps: Math.max(previous.reps, row.reps),
      setVolume: Math.max(previous.setVolume, row.volume),
    })
  })

  const bestWorkoutVolume = new Map()
  getExerciseWorkoutEntries(history).forEach((entry) => {
    const previousBest = bestWorkoutVolume.get(entry.key) || 0

    if (entry.totalVolume > previousBest && previousBest > 0) {
      computed.push({
        id: `${entry.sessionId}-${entry.key}-workout-volume-pr`,
        type: 'exercise-volume',
        label: 'Volume do exercício',
        exerciseName: entry.exerciseName,
        value: entry.totalVolume,
        previousValue: previousBest,
        volume: entry.totalVolume,
        date: entry.date,
        dateObject: entry.dateObject,
        dateKey: entry.dateKey,
        workoutName: entry.workoutName,
        source: 'computed',
      })
    }

    bestWorkoutVolume.set(entry.key, Math.max(previousBest, entry.totalVolume))
  })

  const range = getPeriodRange(periodKey)
  const allPrs = [...buildSavedPrs(history), ...computed]
  const unique = new Map()

  allPrs.forEach((pr) => {
    const key = `${normalizeExerciseName(pr.exerciseName)}-${pr.type}-${pr.dateKey}-${pr.value}`
    if (!unique.has(key)) unique.set(key, pr)
  })

  return Array.from(unique.values())
    .filter((pr) => {
      if (!pr.dateObject) return false
      if (!range.start) return pr.dateObject <= range.end
      return pr.dateObject >= range.start && pr.dateObject <= range.end
    })
    .sort((a, b) => b.dateObject - a.dateObject)
}

export function calculateMuscleGroupStats(history = []) {
  const map = new Map()

  getValidSetRows(history).forEach((row) => {
    const key = normalizeText(row.muscleGroup) || 'sem-grupo'
    const current = map.get(key) || {
      key,
      muscleGroup: row.muscleGroup || 'Sem grupo',
      sets: 0,
      volume: 0,
      workouts: new Set(),
    }

    current.sets += 1
    current.volume += row.volume
    current.workouts.add(row.sessionId || row.dateKey)
    map.set(key, current)
  })

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      workouts: item.workouts.size,
    }))
    .sort((a, b) => b.sets - a.sets || b.volume - a.volume)
}

export function calculateExerciseHighlights(history = []) {
  const map = new Map()
  const entries = getExerciseWorkoutEntries(history)

  entries.forEach((entry) => {
    const current = map.get(entry.key) || {
      key: entry.key,
      name: entry.exerciseName,
      muscleGroup: entry.muscleGroup,
      equipment: entry.equipment,
      mediaUrl: entry.mediaUrl,
      sessions: 0,
      totalVolume: 0,
      maxVolume: 0,
      maxWeight: 0,
      firstWeight: 0,
      lastWeight: 0,
      firstDate: entry.date,
      lastDate: entry.date,
    }

    current.sessions += 1
    current.totalVolume += entry.totalVolume
    current.maxVolume = Math.max(current.maxVolume, entry.totalVolume)
    current.maxWeight = Math.max(current.maxWeight, entry.maxWeight)
    current.lastWeight = entry.maxWeight
    current.lastDate = entry.date

    if (!current.firstWeight) {
      current.firstWeight = entry.maxWeight
      current.firstDate = entry.date
    }

    map.set(entry.key, current)
  })

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      improvement: item.lastWeight - item.firstWeight,
    }))
    .sort((a, b) => {
      const aScore = Math.max(0, a.improvement) * 8 + a.sessions * 2 + a.maxVolume / 1000
      const bScore = Math.max(0, b.improvement) * 8 + b.sessions * 2 + b.maxVolume / 1000
      return bScore - aScore
    })
}

export function comparePeriods(currentHistory = [], previousHistory = []) {
  const currentRows = getValidSetRows(currentHistory)
  const previousRows = getValidSetRows(previousHistory)
  const currentPrs = calculateRecentPRs(currentHistory, 'all')
  const previousPrs = calculateRecentPRs(previousHistory, 'all')

  const current = {
    workouts: normalizeHistory(currentHistory).length,
    volume: currentRows.reduce((sum, row) => sum + row.volume, 0),
    sets: currentRows.length,
    prs: currentPrs.length,
  }

  const previous = {
    workouts: normalizeHistory(previousHistory).length,
    volume: previousRows.reduce((sum, row) => sum + row.volume, 0),
    sets: previousRows.length,
    prs: previousPrs.length,
  }

  function buildMetric(key) {
    const currentValue = current[key]
    const previousValue = previous[key]
    const delta = currentValue - previousValue
    const percent = previousValue > 0 ? (delta / previousValue) * 100 : null

    return {
      current: currentValue,
      previous: previousValue,
      delta,
      percent,
      hasComparison: previousValue > 0 || currentValue > 0,
    }
  }

  return {
    hasPreviousData: previous.workouts > 0 || previousRows.length > 0,
    volume: buildMetric('volume'),
    workouts: buildMetric('workouts'),
    sets: buildMetric('sets'),
    prs: buildMetric('prs'),
  }
}

export function calculateProgressSummary(history = [], periodKey = '30d', previousHistory = []) {
  const normalized = normalizeHistory(history)
  const validRows = getValidSetRows(normalized)
  const totalVolume = validRows.reduce((total, row) => total + row.volume, 0)
  const totalReps = validRows.reduce((total, row) => total + row.reps, 0)
  const totalDurationSeconds = normalized.reduce((total, session) => total + getSessionDuration(session), 0)
  const exerciseNames = new Set(validRows.map((row) => row.normalizedExerciseName).filter(Boolean))
  const frequency = calculateWorkoutFrequency(normalized, periodKey)
  const prs = calculateRecentPRs(history, periodKey)

  return {
    periodKey,
    totalWorkouts: normalized.length,
    totalFinishedWorkouts: normalized.length,
    totalVolume,
    totalSets: validRows.length,
    totalReps,
    totalDurationSeconds,
    uniqueExercises: exerciseNames.size,
    averageVolumePerWorkout: normalized.length ? totalVolume / normalized.length : 0,
    activeDays: frequency.activeDays,
    bestStreak: frequency.bestStreak,
    averageWeekly: frequency.averageWeekly,
    prs: prs.length,
    recentPrs: prs,
    muscleGroups: calculateMuscleGroupStats(normalized),
    exerciseHighlights: calculateExerciseHighlights(normalized),
    comparison: comparePeriods(normalized, previousHistory),
  }
}

export function buildProgressInsights(data = {}) {
  const insights = []
  const summary = data.summary || {}
  const muscleGroups = summary.muscleGroups || []
  const highlights = summary.exerciseHighlights || []
  const comparison = summary.comparison || {}

  if (comparison.volume?.hasComparison && comparison.hasPreviousData) {
    if (comparison.volume.delta > 0) {
      insights.push(`Seu volume subiu ${formatVolume(comparison.volume.delta)} em relação ao período anterior.`)
    } else if (comparison.volume.delta < 0) {
      insights.push('Seu volume ficou menor que no período anterior. Isso pode acontecer por mudança de foco, descanso ou treinos mais técnicos.')
    }
  }

  if (summary.averageWeekly > 0) {
    insights.push(`Sua média no período foi de ${formatNumber(summary.averageWeekly, { maximumFractionDigits: 1 })} treino(s) por semana.`)
  }

  if (muscleGroups.length >= 2) {
    insights.push(`Você treinou mais ${muscleGroups[0].muscleGroup.toLowerCase()} do que ${muscleGroups[1].muscleGroup.toLowerCase()} neste período.`)
  }

  const topImprovement = highlights.find((exercise) => exercise.improvement > 0)
  if (topImprovement) {
    insights.push(`${topImprovement.name} evoluiu ${formatWeight(topImprovement.improvement)} desde o primeiro registro do período.`)
  }

  if (summary.prs > 0) {
    insights.push(`Você registrou ${summary.prs} PR${summary.prs > 1 ? 's' : ''} no período selecionado.`)
  }

  if (insights.length === 0 && summary.totalWorkouts > 0) {
    insights.push('Continue registrando os treinos para o ForgeFlow identificar tendências com mais segurança.')
  }

  return insights.slice(0, 4)
}

export function getTooltipStyle() {
  return {
    background: 'var(--ff-card)',
    border: '1px solid var(--ff-border)',
    borderRadius: '16px',
    color: 'var(--ff-text)',
    boxShadow: 'var(--ff-shadow-floating)',
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
