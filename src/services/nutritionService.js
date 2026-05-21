const STORAGE_KEY = 'forgeflow:nutrition:v2'
const LEGACY_STORAGE_KEY = 'forgeflow:nutrition:v1'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function clampNumber(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function getDefaultDay() {
  return {
    date: todayKey(),
    waterMl: 0,
    waterGoalMl: 2500,
    calories: 0,
    calorieGoal: 2600,
    proteinG: 0,
    proteinGoalG: 160,
    carbsG: 0,
    fatG: 0,
    meals: [],
    updatedAt: new Date().toISOString(),
  }
}

function readStorage(key) {
  if (typeof window === 'undefined') return {}

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function readAll() {
  const current = readStorage(STORAGE_KEY)
  if (Object.keys(current).length) return current
  return readStorage(LEGACY_STORAGE_KEY)
}

function saveAll(data) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function normalizeMeal(input = {}) {
  return {
    id: input.id || globalThis.crypto?.randomUUID?.() || String(Date.now()),
    name: String(input.name || 'Refeição').trim() || 'Refeição',
    type: String(input.type || 'meal'),
    calories: clampNumber(input.calories, 0),
    proteinG: clampNumber(input.proteinG, 0),
    carbsG: clampNumber(input.carbsG, 0),
    fatG: clampNumber(input.fatG, 0),
    notes: String(input.notes || '').slice(0, 500),
    time: input.time || new Date().toTimeString().slice(0, 5),
    photo: input.photo && typeof input.photo === 'object' ? {
      dataUrl: String(input.photo.dataUrl || ''),
      mimeType: String(input.photo.mimeType || ''),
      size: clampNumber(input.photo.size, 0),
      capturedAt: input.photo.capturedAt || new Date().toISOString(),
    } : null,
    createdAt: input.createdAt || new Date().toISOString(),
  }
}

function recalculateTotals(day) {
  const meals = Array.isArray(day.meals) ? day.meals.map(normalizeMeal) : []
  const totals = meals.reduce((acc, meal) => {
    acc.calories += meal.calories
    acc.proteinG += meal.proteinG
    acc.carbsG += meal.carbsG
    acc.fatG += meal.fatG
    return acc
  }, { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })

  return {
    ...day,
    meals,
    ...totals,
  }
}

export function getTodayNutrition() {
  const key = todayKey()
  const all = readAll()
  return recalculateTotals({
    ...getDefaultDay(),
    ...(all[key] || {}),
    date: key,
  })
}

export function saveTodayNutrition(day) {
  const key = todayKey()
  const all = readAll()
  const next = recalculateTotals({
    ...getDefaultDay(),
    ...day,
    date: key,
    updatedAt: new Date().toISOString(),
  })
  all[key] = next
  saveAll(all)
  return next
}

export function addWater(amountMl = 250) {
  const current = getTodayNutrition()
  return saveTodayNutrition({
    ...current,
    waterMl: clampNumber(current.waterMl, 0) + clampNumber(amountMl, 0, -5000, 5000),
  })
}

export function setWater(amountMl = 0) {
  const current = getTodayNutrition()
  return saveTodayNutrition({
    ...current,
    waterMl: clampNumber(amountMl, 0),
  })
}

export function addMeal(input = {}) {
  const current = getTodayNutrition()
  const meal = normalizeMeal(input)

  return saveTodayNutrition({
    ...current,
    meals: [meal, ...(Array.isArray(current.meals) ? current.meals : [])].slice(0, 40),
  })
}

export function removeMeal(mealId) {
  const current = getTodayNutrition()
  const meals = Array.isArray(current.meals) ? current.meals : []

  return saveTodayNutrition({
    ...current,
    meals: meals.filter((item) => item.id !== mealId),
  })
}

export function updateNutritionGoals({ waterGoalMl, calorieGoal, proteinGoalG }) {
  const current = getTodayNutrition()
  return saveTodayNutrition({
    ...current,
    waterGoalMl: Math.max(500, Number(waterGoalMl) || current.waterGoalMl),
    calorieGoal: Math.max(500, Number(calorieGoal) || current.calorieGoal),
    proteinGoalG: Math.max(20, Number(proteinGoalG) || current.proteinGoalG),
  })
}
