import { apiFetch } from './api'

const STORAGE_KEY = 'forgeflow:nutrition:v2'
const LEGACY_STORAGE_KEY = 'forgeflow:nutrition:v1'

export function getBrazilDateKey(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    return offsetDate.toISOString().slice(0, 10)
  }
}

function todayKey() {
  return getBrazilDateKey()
}

function clampNumber(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || String(Date.now())
}

function getDefaultDay(date = todayKey()) {
  return {
    date,
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
    id: input.id || createId(),
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
    ...getDefaultDay(day.date || todayKey()),
    ...day,
    meals,
    ...totals,
    waterMl: clampNumber(day.waterMl, 0),
    waterGoalMl: clampNumber(day.waterGoalMl, 2500, 500),
    calorieGoal: clampNumber(day.calorieGoal, 2600, 500),
    proteinGoalG: clampNumber(day.proteinGoalG, 160, 20),
  }
}

function saveDayToLocal(day) {
  const all = readAll()
  const normalized = recalculateTotals(day)
  all[normalized.date || todayKey()] = normalized
  saveAll(all)
  return normalized
}

function saveManyDaysToLocal(days = []) {
  const all = readAll()
  days.forEach((day) => {
    if (!day?.date) return
    all[day.date] = recalculateTotals(day)
  })
  saveAll(all)
}

export function getTodayNutrition() {
  const key = todayKey()
  const all = readAll()
  return recalculateTotals({
    ...getDefaultDay(key),
    ...(all[key] || {}),
    date: key,
  })
}

export function saveTodayNutrition(day) {
  const key = todayKey()
  const next = recalculateTotals({
    ...getDefaultDay(key),
    ...day,
    date: key,
    updatedAt: new Date().toISOString(),
  })
  return saveDayToLocal(next)
}

export function addWater(amountMl = 250) {
  const current = getTodayNutrition()
  const nextWater = clampNumber(current.waterMl, 0) + clampNumber(amountMl, 0, -5000, 5000)

  return saveTodayNutrition({
    ...current,
    waterMl: clampNumber(nextWater, 0),
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

export function getNutritionHistory(days = 14) {
  const all = readAll()
  const today = new Date()

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    const key = getBrazilDateKey(date)

    return recalculateTotals({
      ...getDefaultDay(key),
      ...(all[key] || {}),
      date: key,
    })
  })
}

export async function loadNutritionFromDatabase(days = 30) {
  const data = await apiFetch(`/nutrition?days=${encodeURIComponent(days)}`)
  const history = Array.isArray(data?.history) ? data.history.map(recalculateTotals) : []
  const today = data?.today ? recalculateTotals(data.today) : history[0] || getTodayNutrition()

  saveManyDaysToLocal([today, ...history])

  return {
    source: data?.source || 'database',
    today,
    history,
  }
}

export async function saveNutritionDayToDatabase(day) {
  const normalized = recalculateTotals(day || getTodayNutrition())
  const saved = await apiFetch(`/nutrition/day/${normalized.date || todayKey()}`, {
    method: 'PUT',
    body: JSON.stringify(normalized),
  })

  return saveDayToLocal(saved)
}
