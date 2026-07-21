import {
  buildStatsMap,
  defaultEquipmentList,
  getSortedUnique,
  getStatsFromMap,
  muscleGroupOrder,
  normalizeText,
} from './exerciseLibraryUtils'

function formatExerciseStatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

function getExerciseNameKey(value) {
  return normalizeText(value || '')
}

function getHistoryExerciseKeys(historyExercise = {}) {
  const exercise = historyExercise.exercise || historyExercise
  const keys = [
    historyExercise.originalExerciseId,
    historyExercise.exerciseId,
    historyExercise.id,
    exercise.id,
    exercise._id,
    exercise.localId,
    exercise.originalLocalId,
    exercise.name,
    exercise.originalName,
  ]

  return keys.filter(Boolean).map((value) => String(value))
}

function buildExerciseLibraryStats(indexedExercises = []) {
  const groupMap = buildStatsMap(indexedExercises, 'normalizedGroup')
  const subgroupMap = buildStatsMap(indexedExercises, 'subgroup')
  const equipmentMap = buildStatsMap(indexedExercises, 'normalizedEquipment')

  const muscleGroups = getStatsFromMap(groupMap, muscleGroupOrder).map((item) => item.name)
  const subgroupList = getStatsFromMap(subgroupMap).map((item) => item.name)

  const equipmentNames = getSortedUnique(
    [
      ...defaultEquipmentList,
      ...Array.from(equipmentMap.keys()),
    ],
    defaultEquipmentList
  )

  const equipmentStats = equipmentNames
    .map((item) => ({
      name: item,
      count: equipmentMap.get(item) || 0,
    }))
    .filter((item) => item.count > 0)

  return {
    groupStats: getStatsFromMap(groupMap, muscleGroupOrder),
    subgroupStats: getStatsFromMap(subgroupMap),
    equipmentStats,
    muscleGroups,
    subgroupList,
    equipmentList: equipmentNames,
    favoriteExercisesCount: indexedExercises.filter((exercise) => exercise.isFavorite).length,
  }
}

function buildExerciseStatsMapFromHistory(history = []) {
  const map = new Map()

  function applyStat(key, session, set, historyExercise) {
    if (!key) return

    const exerciseName = historyExercise.exercise?.name || historyExercise.name || key
    const normalizedKey = String(key)
    const weight = Number(set.weight) || 0
    const reps = Number(set.reps) || 0
    const volume = weight * reps
    const finishedAt = session.finishedAt || session.createdAt || session.updatedAt || session.startedAt
    const current = map.get(normalizedKey) || {
      exerciseName,
      sessions: 0,
      setCount: 0,
      prCount: 0,
      bestWeight: 0,
      bestVolume: 0,
      lastPerformedAtRaw: '',
      lastPerformedAt: '',
      lastSetLabel: '',
    }

    current.setCount += 1
    current.bestWeight = Math.max(current.bestWeight, weight)
    current.bestVolume = Math.max(current.bestVolume, volume)

    if (set.isPR || set.isWeightPR || set.isVolumePR) {
      current.prCount += 1
    }

    const currentLast = current.lastPerformedAtRaw ? new Date(current.lastPerformedAtRaw).getTime() : 0
    const candidateLast = finishedAt ? new Date(finishedAt).getTime() : 0

    if (!current.lastPerformedAtRaw || candidateLast >= currentLast) {
      current.lastPerformedAtRaw = finishedAt || current.lastPerformedAtRaw
      current.lastPerformedAt = formatExerciseStatDate(finishedAt)
      current.lastSetLabel = weight && reps ? `${weight}kg x ${reps}` : `${reps || 0} reps`
      current.sessions += current._lastSessionId === session.id ? 0 : 1
      current._lastSessionId = session.id
    }

    map.set(normalizedKey, current)
  }

  history.forEach((session) => {
    const sessionExercises = Array.isArray(session.exercises) ? session.exercises : []

    sessionExercises.forEach((historyExercise) => {
      const workingSets = Array.isArray(historyExercise.sets)
        ? historyExercise.sets.filter((set) => set.completed && Number(set.weight) > 0 && Number(set.reps) > 0)
        : []

      if (workingSets.length === 0) return

      const rawKeys = getHistoryExerciseKeys(historyExercise)
      const keys = new Set([
        ...rawKeys,
        ...rawKeys.map(getExerciseNameKey).filter(Boolean),
      ])

      workingSets.forEach((set) => {
        keys.forEach((key) => applyStat(key, session, set, historyExercise))
      })
    })
  })

  map.forEach((value) => {
    delete value._lastSessionId
  })

  return map
}

export {
  buildExerciseLibraryStats,
  buildExerciseStatsMapFromHistory,
}
