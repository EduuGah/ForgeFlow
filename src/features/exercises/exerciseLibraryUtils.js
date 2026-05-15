const INITIAL_VISIBLE_COUNT = 8
const LOAD_MORE_COUNT = 8

const muscleGroupOrder = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraço',
  'Abdômen',
  'Lombar',
  'Glúteos',
  'Quadríceps',
  'Posterior de coxa',
  'Panturrilhas',
  'Adutores',
  'Abdutores',
  'Cardio',
  'Mobilidade',
  'Alongamento',
  'Corpo inteiro',
]

const defaultEquipmentList = [
  'Barra',
  'Halteres',
  'Máquina',
  'Cabo',
  'Peso corporal',
  'Banco',
  'Paralelas',
  'Máquina Smith',
  'Anilha',
  'Roda abdominal',
  'Barra fixa',
  'Mobilidade',
]

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeMuscleGroup(group) {
  if (!group) return 'Outros'

  const normalized = String(group).trim()

  const aliases = {
    Core: 'Abdômen',
    Abdomen: 'Abdômen',
    Abs: 'Abdômen',
    Pernas: 'Pernas',
    Ombro: 'Ombros',
    Costas: 'Costas',
    Peito: 'Peito',
    Biceps: 'Bíceps',
    Bíceps: 'Bíceps',
    Triceps: 'Tríceps',
    Tríceps: 'Tríceps',
    'Posterior de Coxa': 'Posterior de coxa',
    'Corpo Inteiro': 'Corpo inteiro',
  }

  const normalizedKey = normalized.toLowerCase()

  if (normalizedKey.includes('barra') && (normalizedKey.includes('w') || normalizedKey.includes('z') || normalizedKey.includes('ez') || normalizedKey.includes('reta') || normalizedKey.includes('curva'))) {
    return 'Barra'
  }

  return aliases[normalized] || aliases[normalizedKey] || normalized
}

function normalizeEquipment(equipment) {
  if (!equipment) return 'Não informado'

  const normalized = String(equipment).trim()

  const aliases = {
    Halter: 'Halteres',
    Dumbbell: 'Halteres',
    Dumbbells: 'Halteres',
    Bodyweight: 'Peso corporal',
    'Peso Corporal': 'Peso corporal',
    Machine: 'Máquina',
    Cable: 'Cabo',
    Barbell: 'Barra',
    Bench: 'Banco',
    'Barra EZ': 'Barra',
    'Barra W': 'Barra',
    'Barra Z': 'Barra',
    'EZ Bar': 'Barra',
    'EZ-bar': 'Barra',
    'W Bar': 'Barra',
    'Z Bar': 'Barra',
    'Barra curva': 'Barra',
    'Barra reta': 'Barra',
  }

  const normalizedKey = normalized.toLowerCase()

  if (normalizedKey.includes('barra') && (normalizedKey.includes('w') || normalizedKey.includes('z') || normalizedKey.includes('ez') || normalizedKey.includes('reta') || normalizedKey.includes('curva'))) {
    return 'Barra'
  }

  return aliases[normalized] || aliases[normalizedKey] || normalized
}

function getSubgroup(exercise) {
  return (
    exercise.targetMuscle ||
    exercise.subgroup ||
    exercise.muscle ||
    exercise.primaryMuscle ||
    normalizeMuscleGroup(exercise.muscleGroup)
  )
}

function getExerciseMedia(exercise) {
  if (exercise.media?.gif) return exercise.media.gif
  if (exercise.media?.image) return exercise.media.image
  if (exercise.gifUrl) return exercise.gifUrl
  if (exercise.mediaUrl) return exercise.mediaUrl

  return ''
}

function getExerciseIdentityKey(exercise = {}) {
  const possibleId = exercise.originalLocalId || exercise.localId

  if (possibleId) {
    return `local:${String(possibleId)}`
  }

  const name = normalizeText(exercise.originalName || exercise.name)
  const group = normalizeText(exercise.muscleGroup || exercise.normalizedGroup)
  const equipment = normalizeText(exercise.equipment || exercise.normalizedEquipment)

  if (name) {
    return `exercise:${name}:${group}:${equipment}`
  }

  return `id:${String(exercise.id || exercise._id || crypto.randomUUID())}`
}

function isApiExercise(exercise = {}) {
  return typeof (exercise._id || exercise.id) === 'string' && /^[a-f\d]{24}$/i.test(exercise._id || exercise.id)
}

function normalizeExerciseFromApi(exercise) {
  const normalizedGroup = normalizeMuscleGroup(exercise.muscleGroup)
  const normalizedEquipment = normalizeEquipment(exercise.equipment)
  const subgroup = getSubgroup({
    ...exercise,
    muscleGroup: normalizedGroup,
  })

  return {
    ...exercise,
    id: exercise._id || exercise.id,
    normalizedGroup,
    normalizedEquipment,
    subgroup,
    isFavorite: Boolean(exercise.isFavorite),
  }
}

function normalizeExerciseForList(exercise) {
  const normalizedGroup = normalizeMuscleGroup(exercise.muscleGroup || exercise.normalizedGroup)
  const normalizedEquipment = normalizeEquipment(exercise.equipment || exercise.normalizedEquipment)
  const subgroup = getSubgroup({
    ...exercise,
    muscleGroup: normalizedGroup,
  })

  return {
    ...exercise,
    id: exercise._id || exercise.id || crypto.randomUUID(),
    normalizedGroup,
    normalizedEquipment,
    subgroup,
    isFavorite: Boolean(exercise.isFavorite),
  }
}

function mergeExercisesWithoutDuplicates(...lists) {
  const merged = new Map()

  lists.flat().filter(Boolean).forEach((exercise) => {
    const normalized = normalizeExerciseForList(exercise)
    const identityKey = getExerciseIdentityKey(normalized)
    const current = merged.get(identityKey)

    if (!current) {
      merged.set(identityKey, normalized)
      return
    }

    const shouldReplace =
      isApiExercise(normalized) ||
      (!isApiExercise(current) && new Date(normalized.updatedAt || 0) > new Date(current.updatedAt || 0)) ||
      (normalized.isFavorite && !current.isFavorite)

    if (shouldReplace) {
      merged.set(identityKey, {
        ...current,
        ...normalized,
        isFavorite: Boolean(current.isFavorite || normalized.isFavorite),
      })
    }
  })

  return Array.from(merged.values())
}

function normalizeList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return [value]

  return []
}

function textToList(text) {
  return text
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function listToText(list) {
  if (Array.isArray(list)) return list.join('\n')
  return list || ''
}

function getSortedUnique(values, preferredOrder = []) {
  const uniqueValues = [...new Set(values.filter(Boolean))]

  return uniqueValues.sort((a, b) => {
    const indexA = preferredOrder.indexOf(a)
    const indexB = preferredOrder.indexOf(b)

    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1

    return String(a).localeCompare(String(b))
  })
}

function buildStatsMap(items, key) {
  const map = new Map()

  items.forEach((item) => {
    const value = item[key]

    if (!value) return

    map.set(value, (map.get(value) || 0) + 1)
  })

  return map
}

function getStatsFromMap(map, preferredOrder = []) {
  return Array.from(map.entries())
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => {
      const indexA = preferredOrder.indexOf(a.name)
      const indexB = preferredOrder.indexOf(b.name)

      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1

      return a.name.localeCompare(b.name)
    })
}



export {
  INITIAL_VISIBLE_COUNT,
  LOAD_MORE_COUNT,
  buildStatsMap,
  defaultEquipmentList,
  getExerciseIdentityKey,
  getExerciseMedia,
  getSortedUnique,
  getStatsFromMap,
  getSubgroup,
  isApiExercise,
  listToText,
  mergeExercisesWithoutDuplicates,
  muscleGroupOrder,
  normalizeEquipment,
  normalizeExerciseForList,
  normalizeExerciseFromApi,
  normalizeList,
  normalizeMuscleGroup,
  normalizeText,
  textToList,
}
