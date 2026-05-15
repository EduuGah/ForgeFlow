import { getWorkoutId } from '../../utils/workoutNormalizers'

export function buildWorkoutPayload({ workoutName, selectedFolderId, workoutExercises }) {
  return {
    name: String(workoutName || '').trim(),
    folderId: selectedFolderId,
    exercises: workoutExercises,
  }
}

export function mergeWorkoutsFromCacheAndApi(cachedList = [], apiList = []) {
  const cachedWorkouts = Array.isArray(cachedList) ? cachedList : []
  const apiWorkouts = Array.isArray(apiList) ? apiList : []

  if (apiWorkouts.length === 0) return cachedWorkouts
  if (cachedWorkouts.length === 0) return apiWorkouts

  const map = new Map()

  cachedWorkouts.forEach((workout) => {
    const workoutId = getWorkoutId(workout)
    if (!workoutId) return
    map.set(String(workoutId), workout)
  })

  apiWorkouts.forEach((workout) => {
    const workoutId = getWorkoutId(workout)
    if (!workoutId) return
    map.set(String(workoutId), workout)
  })

  return Array.from(map.values()).sort((a, b) => {
    const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime()
    const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime()

    return (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate)
  })
}

export function createDefaultWorkoutSets(model = 'hypertrophy', customSetModels = []) {
  const fixedModels = {
    hypertrophy: ['12 Rep', '10-12 Rep', '5-8 Rep', '5-8 Rep'],
    beginner: ['12 Rep', '12 Rep', '12 Rep'],
    strength: ['5 Rep', '5 Rep', '5 Rep', '5 Rep', '5 Rep'],
    pyramid: ['15 Rep', '12 Rep', '10 Rep', '8 Rep'],
    custom: ['8-12 Rep'],
  }

  const customModel = customSetModels.find((item) => item.id === model)
  const selectedModel = customModel ? customModel.sets : fixedModels[model] || fixedModels.hypertrophy

  return selectedModel.map((description) => {
    const normalized = String(description || '').toLowerCase()
    const isWarmup =
      normalized.includes('aquecimento') ||
      normalized.includes('warmup') ||
      normalized.includes('warm-up')

    return {
      id: crypto.randomUUID(),
      description,
      type: isWarmup ? 'warmup' : 'working',
    }
  })
}

export function createInitialManualSet(type = 'working') {
  return {
    id: crypto.randomUUID(),
    description: type === 'warmup' ? 'Aquecimento' : '8-12 Rep',
    type,
  }
}
