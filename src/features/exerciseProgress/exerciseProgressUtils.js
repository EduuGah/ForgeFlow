import {
  filterHistoryByPeriod,
  formatCompactNumber,
  formatDate,
  formatDateKey,
  formatLongDate,
  formatNumber,
  formatVolume,
  formatWeight,
  getExerciseMedia,
  getExerciseObject,
  getSessionSets,
  getValidSetRows,
  normalizeExerciseName,
  normalizeHistory,
  parseLocalDate,
  startOfLocalDay,
  toNumber,
} from '../progress/progressUtils'

export {
  formatDate,
  formatLongDate,
  formatVolume,
  formatWeight,
  normalizeExerciseName,
}

export function getFallbackExercise(name = '', defaultExercises = []) {
  const normalized = normalizeExerciseName(name)

  return defaultExercises.find((exercise) => {
    return [exercise.name, exercise.originalName, exercise.title, exercise.label]
      .filter(Boolean)
      .some((item) => normalizeExerciseName(item) === normalized)
  }) || null
}

function getExerciseMetaFromRow(row = {}, defaultExercises = []) {
  const fallback = getFallbackExercise(row.exerciseName, defaultExercises)
  const fallbackObject = fallback ? getExerciseObject(fallback) : null

  return {
    name: row.exerciseName || fallbackObject?.name || 'Exercício',
    muscleGroup: row.muscleGroup || fallbackObject?.muscleGroup || fallbackObject?.group || 'Sem grupo',
    equipment: row.equipment || fallbackObject?.equipment || 'Sem equipamento',
    mediaUrl: row.mediaUrl || row.imageUrl || (fallback ? getExerciseMedia(fallback) : ''),
  }
}

export function buildExerciseOptions(history = [], defaultExercises = []) {
  const map = new Map()

  getValidSetRows(history).forEach((row) => {
    const key = row.normalizedExerciseName || normalizeExerciseName(row.exerciseName)
    if (!key) return

    const meta = getExerciseMetaFromRow(row, defaultExercises)
    const current = map.get(key) || {
      key,
      normalizedName: key,
      name: meta.name,
      muscleGroup: meta.muscleGroup,
      equipment: meta.equipment,
      mediaUrl: meta.mediaUrl,
      setCount: 0,
      sessions: new Set(),
      maxWeight: 0,
      maxVolume: 0,
      lastDate: row.date,
      lastDateObject: row.dateObject,
    }

    current.setCount += 1
    current.sessions.add(row.sessionId || row.dateKey)
    current.maxWeight = Math.max(current.maxWeight, row.weight)
    current.maxVolume = Math.max(current.maxVolume, row.volume)

    if (!current.lastDateObject || row.dateObject > current.lastDateObject) {
      current.lastDate = row.date
      current.lastDateObject = row.dateObject
    }

    map.set(key, current)
  })

  return Array.from(map.values())
    .map((exercise) => ({
      ...exercise,
      timesTrained: exercise.sessions.size,
      sessions: undefined,
    }))
    .sort((a, b) => b.timesTrained - a.timesTrained || b.maxWeight - a.maxWeight)
}

export function filterExerciseOptions(options = [], search = '') {
  const term = normalizeExerciseName(search)
  if (!term) return options

  return options.filter((exercise) => {
    return [exercise.name, exercise.muscleGroup, exercise.equipment]
      .filter(Boolean)
      .some((value) => normalizeExerciseName(value).includes(term))
  })
}

export function getExerciseWorkoutEntries(history = [], selectedExerciseName = '') {
  const selectedKey = normalizeExerciseName(selectedExerciseName)
  if (!selectedKey) return []

  const entries = []

  normalizeHistory(history)
    .slice()
    .sort((a, b) => a.date - b.date)
    .forEach((session) => {
      const rows = getSessionSets(session)
        .filter((row) => row.isValid && row.normalizedExerciseName === selectedKey)

      if (rows.length === 0) return

      const bestSet = rows.slice().sort((a, b) => b.weight - a.weight || b.reps - a.reps || b.volume - a.volume)[0]
      const bestVolumeSet = rows.slice().sort((a, b) => b.volume - a.volume)[0]
      const maxRepsSet = rows.slice().sort((a, b) => b.reps - a.reps || b.weight - a.weight)[0]
      const totalVolume = rows.reduce((total, row) => total + row.volume, 0)
      const totalReps = rows.reduce((total, row) => total + row.reps, 0)

      entries.push({
        id: `${session.id}-${selectedKey}-${entries.length}`,
        sessionId: session.id,
        workoutName: session.workoutName,
        exerciseName: bestSet.exerciseName,
        muscleGroup: bestSet.muscleGroup,
        equipment: bestSet.equipment,
        mediaUrl: bestSet.mediaUrl,
        date: session.finishedAt,
        dateObject: session.date,
        dateKey: session.dateKey,
        sets: rows,
        totalSets: rows.length,
        totalReps,
        totalVolume,
        maxWeight: bestSet.weight,
        maxReps: maxRepsSet.reps,
        bestSet,
        bestVolumeSet,
        maxRepsSet,
      })
    })

  return entries
}

export function calculateExerciseRecords(entries = []) {
  const allSets = entries.flatMap((entry) => entry.sets)

  if (entries.length === 0 || allSets.length === 0) {
    return {
      bestWeight: null,
      bestSet: null,
      bestReps: null,
      bestSetVolume: null,
      bestWorkoutVolume: null,
      prs: [],
    }
  }

  const bestWeight = allSets.slice().sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0]
  const bestSet = bestWeight
  const bestReps = allSets.slice().sort((a, b) => b.reps - a.reps || b.weight - a.weight)[0]
  const bestSetVolume = allSets.slice().sort((a, b) => b.volume - a.volume)[0]
  const bestWorkoutVolume = entries.slice().sort((a, b) => b.totalVolume - a.totalVolume)[0]

  const prs = [
    {
      id: 'best-weight',
      label: 'Maior carga',
      value: formatWeight(bestWeight.weight),
      rawValue: bestWeight.weight,
      date: bestWeight.date,
      dateObject: bestWeight.dateObject,
      detail: `${formatWeight(bestWeight.weight)} x ${bestWeight.reps}`,
    },
    {
      id: 'best-reps',
      label: 'Mais repetições',
      value: `${formatNumber(bestReps.reps, { maximumFractionDigits: 0 })} reps`,
      rawValue: bestReps.reps,
      date: bestReps.date,
      dateObject: bestReps.dateObject,
      detail: `${formatWeight(bestReps.weight)} x ${bestReps.reps}`,
    },
    {
      id: 'best-set-volume',
      label: 'Maior volume em série',
      value: formatVolume(bestSetVolume.volume),
      rawValue: bestSetVolume.volume,
      date: bestSetVolume.date,
      dateObject: bestSetVolume.dateObject,
      detail: `${formatWeight(bestSetVolume.weight)} x ${bestSetVolume.reps}`,
    },
    {
      id: 'best-workout-volume',
      label: 'Maior volume no treino',
      value: formatVolume(bestWorkoutVolume.totalVolume),
      rawValue: bestWorkoutVolume.totalVolume,
      date: bestWorkoutVolume.date,
      dateObject: bestWorkoutVolume.dateObject,
      detail: `${bestWorkoutVolume.totalSets} séries no dia`,
    },
  ]

  return {
    bestWeight,
    bestSet,
    bestReps,
    bestSetVolume,
    bestWorkoutVolume,
    prs,
  }
}

function calculateTrend(entries = []) {
  if (entries.length < 2) {
    return {
      direction: 'neutral',
      label: 'Dados iniciais',
      description: 'Registre mais treinos para o ForgeFlow comparar tendência.',
    }
  }

  const first = entries[0]
  const last = entries[entries.length - 1]
  const deltaWeight = last.maxWeight - first.maxWeight
  const deltaVolume = last.totalVolume - first.totalVolume

  if (deltaWeight > 0 || deltaVolume > 0) {
    return {
      direction: 'up',
      label: 'Tendência positiva',
      description: deltaWeight > 0
        ? `Carga máxima subiu ${formatWeight(deltaWeight)} desde o primeiro registro.`
        : `Volume subiu ${formatVolume(deltaVolume)} desde o primeiro registro.`,
    }
  }

  if (deltaWeight < 0 && deltaVolume < 0) {
    return {
      direction: 'down',
      label: 'Tendência menor',
      description: 'Os últimos registros ficaram abaixo do início do período. Isso pode ser normal por variação de treino.',
    }
  }

  return {
    direction: 'neutral',
    label: 'Tendência estável',
    description: 'A performance ficou próxima dos registros anteriores.',
  }
}

export function compareLastExerciseWorkouts(entries = []) {
  if (entries.length < 2) return null

  const previous = entries[entries.length - 2]
  const current = entries[entries.length - 1]

  return {
    current,
    previous,
    maxWeight: current.maxWeight - previous.maxWeight,
    volume: current.totalVolume - previous.totalVolume,
    reps: current.totalReps - previous.totalReps,
    sets: current.totalSets - previous.totalSets,
  }
}

export function buildExerciseChartData(entries = []) {
  return entries.map((entry, index) => ({
    index: index + 1,
    key: entry.dateKey || String(index),
    dateLabel: formatDate(entry.date),
    longDate: formatLongDate(entry.date),
    workoutName: entry.workoutName,
    maxWeight: entry.maxWeight,
    totalVolume: entry.totalVolume,
    totalReps: entry.totalReps,
    bestSetLabel: `${formatCompactNumber(entry.bestSet?.weight || 0)}x${entry.bestSet?.reps || 0}`,
  }))
}

export function calculateExerciseStats(entries = []) {
  const allSets = entries.flatMap((entry) => entry.sets)
  const records = calculateExerciseRecords(entries)
  const lastEntry = entries[entries.length - 1] || null
  const firstEntry = entries[0] || null
  const totalVolume = entries.reduce((total, entry) => total + entry.totalVolume, 0)
  const totalReps = entries.reduce((total, entry) => total + entry.totalReps, 0)
  const totalSets = allSets.length
  const averageWeight = totalSets
    ? allSets.reduce((total, set) => total + set.weight, 0) / totalSets
    : 0

  return {
    totalVolume,
    totalReps,
    totalSets,
    trainedTimes: entries.length,
    lastEntry,
    firstEntry,
    lastWeight: lastEntry?.maxWeight || 0,
    averageWeight,
    bestWeight: records.bestWeight?.weight || 0,
    bestSet: records.bestSet,
    bestReps: records.bestReps?.reps || 0,
    bestWorkoutVolume: records.bestWorkoutVolume?.totalVolume || 0,
    records,
    comparison: compareLastExerciseWorkouts(entries),
    trend: calculateTrend(entries),
  }
}

export function buildExerciseInsights(entries = [], stats = {}) {
  const insights = []
  const first = stats.firstEntry
  const last = stats.lastEntry

  if (first && last && first.id !== last.id) {
    const weightDelta = last.maxWeight - first.maxWeight
    if (weightDelta > 0) {
      insights.push(`Você aumentou a carga máxima em ${formatWeight(weightDelta)} desde o primeiro registro.`)
    } else if (weightDelta < 0) {
      insights.push('A carga máxima recente ficou menor que no primeiro registro do período. Isso pode ser estratégia de treino ou controle de fadiga.')
    }
  }

  if (stats.records?.bestWorkoutVolume) {
    insights.push(`Seu melhor volume foi em ${formatLongDate(stats.records.bestWorkoutVolume.date)}.`)
  }

  const thirtyDaysAgo = startOfLocalDay(new Date())
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const recentCount = entries.filter((entry) => {
    const date = parseLocalDate(entry.date)
    return date && date >= thirtyDaysAgo
  }).length

  if (recentCount > 0) {
    insights.push(`Você treinou este exercício ${recentCount} vez${recentCount > 1 ? 'es' : ''} nos últimos 30 dias.`)
  }

  if (stats.trend?.description) {
    insights.push(stats.trend.description)
  }

  if (insights.length === 0 && entries.length > 0) {
    insights.push('Continue registrando séries com peso e repetições para gerar insights melhores.')
  }

  return insights.slice(0, 4)
}

export function calculateExerciseProgress(history = [], selectedExerciseName = '', periodKey = 'all') {
  const periodHistory = periodKey === 'all'
    ? normalizeHistory(history)
    : filterHistoryByPeriod(history, periodKey)
  const entries = getExerciseWorkoutEntries(periodHistory, selectedExerciseName)
  const stats = calculateExerciseStats(entries)
  const chartData = buildExerciseChartData(entries)
  const insights = buildExerciseInsights(entries, stats)

  return {
    entries,
    stats,
    chartData,
    insights,
    hasData: entries.length > 0,
  }
}

export function resolveExerciseFromQuery(options = [], queryValue = '') {
  const query = normalizeExerciseName(queryValue)
  if (!query) return ''

  const match = options.find((exercise) => {
    return exercise.normalizedName === query || normalizeExerciseName(exercise.name) === query
  })

  return match?.normalizedName || ''
}

export function getDaysSinceLastEntry(entry = null) {
  if (!entry?.date) return null

  const date = startOfLocalDay(entry.date)
  const today = startOfLocalDay(new Date())
  if (!date || !today) return null

  return Math.max(0, Math.round((today - date) / 86400000))
}

export function getPrTone(record = {}) {
  const label = normalizeExerciseName(record.label)
  if (label.includes('carga')) return 'yellow'
  if (label.includes('volume')) return 'orange'
  return 'purple'
}

export function getComparisonLabel(value, formatter = formatNumber) {
  const number = toNumber(value)

  if (number > 0) return `+${formatter(number)}`
  if (number < 0) return formatter(number)

  return '0'
}

export function getDateKey(value) {
  return formatDateKey(value)
}
