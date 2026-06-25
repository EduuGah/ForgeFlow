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

const COMMON_STRENGTH_BENCHMARKS = [
  {
    key: 'bench-press',
    label: 'Supino reto',
    aliases: ['supino reto', 'supino barra', 'supino livre', 'bench press', 'barbell bench press'],
    sourceLabel: 'Strength Level / StrengthLog',
    sourceNote: 'Referências gerais de 1RM para supino reto com barra.',
    standards: {
      male: { beginner: 47, intermediate: 98, advanced: 140 },
      female: { beginner: 17, intermediate: 51, advanced: 75 },
    },
    ratios: { beginner: 0.6, intermediate: 1, advanced: 1.5 },
  },
  {
    key: 'squat',
    label: 'Agachamento livre',
    aliases: ['agachamento', 'agachamento livre', 'agachamento barra', 'squat', 'back squat'],
    sourceLabel: 'Strength Level',
    sourceNote: 'Referências gerais de 1RM para agachamento com barra.',
    standards: {
      male: { beginner: 64, intermediate: 130, advanced: 173 },
      female: { beginner: 29, intermediate: 73, advanced: 105 },
    },
    ratios: { beginner: 0.75, intermediate: 1.5, advanced: 2.25 },
  },
  {
    key: 'deadlift',
    label: 'Levantamento terra',
    aliases: ['levantamento terra', 'terra', 'deadlift', 'peso morto'],
    sourceLabel: 'Strength Level / StrengthLog',
    sourceNote: 'Referências gerais de 1RM para levantamento terra.',
    standards: {
      male: { beginner: 78, intermediate: 152, advanced: 210 },
      female: { beginner: 38, intermediate: 87, advanced: 125 },
    },
    ratios: { beginner: 1, intermediate: 1.8, advanced: 2.5 },
  },
  {
    key: 'shoulder-press',
    label: 'Desenvolvimento',
    aliases: ['desenvolvimento', 'desenvolvimento militar', 'desenvolvimento ombro', 'shoulder press', 'overhead press', 'military press'],
    sourceLabel: 'Strength Level / StrengthLog',
    sourceNote: 'Referências gerais de 1RM para desenvolvimento/shoulder press com barra.',
    standards: {
      male: { beginner: 30, intermediate: 64, advanced: 87 },
      female: { beginner: 13, intermediate: 34, advanced: 48 },
    },
    ratios: { beginner: 0.35, intermediate: 0.7, advanced: 1 },
  },
  {
    key: 'bent-over-row',
    label: 'Remada curvada',
    aliases: ['remada curvada', 'remada barra', 'barbell row', 'bent over row', 'bent-over row'],
    sourceLabel: 'Strength Level',
    sourceNote: 'Referências gerais de 1RM para remada curvada com barra.',
    standards: {
      male: { beginner: 41, intermediate: 85, advanced: 120 },
      female: { beginner: 15, intermediate: 41, advanced: 59 },
    },
    ratios: { beginner: 0.5, intermediate: 0.9, advanced: 1.2 },
  },
  {
    key: 'dumbbell-bench-press',
    label: 'Supino halteres',
    aliases: ['supino halter', 'supino halteres', 'supino com halteres', 'dumbbell bench press'],
    sourceLabel: 'Strength Level',
    sourceNote: 'Referências gerais de 1RM por halter para supino com halteres.',
    standards: {
      male: { beginner: 16, intermediate: 41, advanced: 59 },
      female: { beginner: 6, intermediate: 21, advanced: 31 },
    },
    ratios: { beginner: 0.25, intermediate: 0.55, advanced: 0.8 },
    perSide: true,
  },
]

const AGE_REFERENCE_FACTORS = [
  { label: '18–39', factor: 1, note: 'base geral' },
  { label: '40–49', factor: 0.9, note: 'referência conservadora' },
  { label: '50+', factor: 0.75, note: 'referência conservadora' },
]


const STRENGTH_PERCENTILE_ANCHORS = [
  { key: 'starter', label: 'Base', percentile: 5, ratio: 0 },
  { key: 'beginner', label: 'Iniciante', percentile: 25 },
  { key: 'intermediate', label: 'Intermediário', percentile: 50 },
  { key: 'advanced', label: 'Avançado', percentile: 80 },
  { key: 'elite', label: 'Elite', percentile: 95, advancedMultiplier: 1.28 },
]

function clampNumber(value, min = 0, max = 100) {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.min(max, Math.max(min, number))
}

function interpolate(value, startValue, endValue, startPercentile, endPercentile) {
  if (endValue <= startValue) return startPercentile

  const progress = clampNumber((value - startValue) / (endValue - startValue), 0, 1)
  return startPercentile + ((endPercentile - startPercentile) * progress)
}

function getStandardsWithElite(standards = {}) {
  const beginner = toNumber(standards.beginner)
  const intermediate = toNumber(standards.intermediate)
  const advanced = toNumber(standards.advanced)

  return {
    starter: 0,
    beginner,
    intermediate,
    advanced,
    elite: advanced > 0 ? advanced * STRENGTH_PERCENTILE_ANCHORS.find((item) => item.key === 'elite').advancedMultiplier : 0,
  }
}

export function estimateStrengthPercentile(oneRepMax = 0, standards = {}) {
  const value = toNumber(oneRepMax)
  const safeStandards = getStandardsWithElite(standards)

  if (value <= 0 || !safeStandards.beginner || !safeStandards.intermediate || !safeStandards.advanced) {
    return 0
  }

  if (value < safeStandards.beginner) {
    return Math.round(interpolate(value, 0, safeStandards.beginner, 5, 25))
  }

  if (value < safeStandards.intermediate) {
    return Math.round(interpolate(value, safeStandards.beginner, safeStandards.intermediate, 25, 50))
  }

  if (value < safeStandards.advanced) {
    return Math.round(interpolate(value, safeStandards.intermediate, safeStandards.advanced, 50, 80))
  }

  if (value < safeStandards.elite) {
    return Math.round(interpolate(value, safeStandards.advanced, safeStandards.elite, 80, 95))
  }

  return 95
}

function getPercentileLabel(percentile = 0) {
  const value = clampNumber(percentile, 0, 99)

  if (value >= 80) return 'muito acima da média'
  if (value >= 50) return 'acima da média'
  if (value >= 25) return 'em evolução'
  return 'base inicial'
}

function getBenchmarkLevelRows(standards = {}) {
  const withElite = getStandardsWithElite(standards)

  return STRENGTH_PERCENTILE_ANCHORS
    .filter((anchor) => anchor.key !== 'starter')
    .map((anchor) => ({
      key: anchor.key,
      label: anchor.label,
      percentile: anchor.percentile,
      weight: withElite[anchor.key],
    }))
}

function buildPercentileComparison(estimatedOneRepMax = 0, standards = {}, label = '') {
  const percentile = estimateStrengthPercentile(estimatedOneRepMax, standards)

  return {
    label,
    percentile,
    status: getPercentileLabel(percentile),
    levelRows: getBenchmarkLevelRows(standards),
  }
}

function buildBodyweightRatioBar(ratio = 0, bodyweightTargets = []) {
  if (!ratio || bodyweightTargets.length === 0) return null

  const maxTarget = Math.max(...bodyweightTargets.map((target) => target.multiplier), ratio, 1)
  const scaleMax = Math.max(maxTarget * 1.1, 1.2)

  return {
    value: ratio,
    percent: clampNumber((ratio / scaleMax) * 100, 0, 100),
    scaleMax,
    markers: bodyweightTargets.map((target) => ({
      ...target,
      percent: clampNumber((target.multiplier / scaleMax) * 100, 0, 100),
    })),
  }
}

function buildAgeComparisonRows(ageRows = [], estimatedOneRepMax = 0) {
  return ageRows.map((row) => {
    const neutralIntermediate = (row.maleIntermediate + row.femaleIntermediate) / 2
    const target = neutralIntermediate > 0 ? neutralIntermediate : row.maleIntermediate || row.femaleIntermediate || 0

    return {
      ...row,
      target,
      percentOfTarget: target > 0 ? clampNumber((estimatedOneRepMax / target) * 100, 0, 160) : 0,
    }
  })
}

function buildBenchmarkAliasSet(benchmark) {
  return new Set([benchmark.label, benchmark.key, ...benchmark.aliases].map(normalizeExerciseName))
}

export function getExerciseBenchmark(exerciseName = '') {
  const normalized = normalizeExerciseName(exerciseName)
  if (!normalized) return null

  return COMMON_STRENGTH_BENCHMARKS.find((benchmark) => {
    const aliases = buildBenchmarkAliasSet(benchmark)
    if (aliases.has(normalized)) return true

    return Array.from(aliases).some((alias) => {
      return alias && (normalized.includes(alias) || alias.includes(normalized))
    })
  }) || null
}

export function estimateOneRepMaxFromSet(set = null) {
  const weight = toNumber(set?.weight)
  const reps = toNumber(set?.reps)

  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight

  const safeReps = Math.min(reps, 12)
  return weight * (1 + safeReps / 30)
}

export function buildBenchmarkSummary(exerciseName = '', bestSet = null, bodyWeightKg = 0, profileContext = {}) {
  const benchmark = getExerciseBenchmark(exerciseName)
  if (!benchmark) return null

  const estimatedOneRepMax = estimateOneRepMaxFromSet(bestSet)
  const ratio = bodyWeightKg > 0 && estimatedOneRepMax > 0
    ? estimatedOneRepMax / bodyWeightKg
    : 0

  const bodyweightTargets = bodyWeightKg > 0
    ? Object.entries(benchmark.ratios).map(([level, multiplier]) => ({
        level,
        multiplier,
        weight: bodyWeightKg * multiplier,
      }))
    : []

  const ageRows = AGE_REFERENCE_FACTORS.map((age) => ({
    ...age,
    maleIntermediate: benchmark.standards.male.intermediate * age.factor,
    femaleIntermediate: benchmark.standards.female.intermediate * age.factor,
  }))

  const maleComparison = buildPercentileComparison(estimatedOneRepMax, benchmark.standards.male, 'Masculino')
  const femaleComparison = buildPercentileComparison(estimatedOneRepMax, benchmark.standards.female, 'Feminino')
  const gender = profileContext.gender || ''
  const primaryComparison = gender === 'female'
    ? femaleComparison
    : gender === 'male'
      ? maleComparison
      : null

  return {
    benchmark,
    estimatedOneRepMax,
    ratio,
    bodyweightTargets,
    ageRows,
    hasBodyWeight: bodyWeightKg > 0,
    bodyweightRatioBar: buildBodyweightRatioBar(ratio, bodyweightTargets),
    ageComparisonRows: buildAgeComparisonRows(ageRows, estimatedOneRepMax),
    maleComparison,
    femaleComparison,
    primaryComparison,
    profileContext,
  }
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
