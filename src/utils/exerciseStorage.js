import defaultExercises from '../data/defaultExercises'

const EXERCISES_KEY = 'forgeflow:exercises'
const EXERCISES_VERSION_KEY = 'forgeflow:exercisesVersion'

const CURRENT_EXERCISES_VERSION = '18'

function mergeDefaultWithSaved(defaultList = [], savedList = []) {
  const map = new Map()

  defaultList.forEach((exercise) => {
    map.set(String(exercise.id), {
      ...exercise,
      isFavorite: Boolean(exercise.isFavorite),
    })
  })

  savedList.forEach((exercise) => {
    if (!exercise?.id) return

    const originalLocalId = exercise.originalLocalId || exercise.localId

    if (originalLocalId && map.has(String(originalLocalId))) {
      map.delete(String(originalLocalId))
    }

    map.set(String(exercise.id), {
      ...exercise,
      isFavorite: Boolean(exercise.isFavorite),
    })
  })

  return Array.from(map.values())
}

export function getInitialExercises() {
  const savedVersion = localStorage.getItem(EXERCISES_VERSION_KEY)
  const savedExercisesRaw = localStorage.getItem(EXERCISES_KEY)

  if (savedVersion !== CURRENT_EXERCISES_VERSION) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises))
    localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION)

    return defaultExercises
  }

  if (!savedExercisesRaw) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises))
    localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION)

    return defaultExercises
  }

  try {
    const savedExercises = JSON.parse(savedExercisesRaw)

    if (!Array.isArray(savedExercises)) {
      localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises))
      localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION)

      return defaultExercises
    }

    const mergedExercises = mergeDefaultWithSaved(defaultExercises, savedExercises)

    localStorage.setItem(EXERCISES_KEY, JSON.stringify(mergedExercises))
    localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION)

    return mergedExercises
  } catch (error) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises))
    localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION)

    return defaultExercises
  }
}