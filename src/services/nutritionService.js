import { apiFetch } from './api'

const STORAGE_KEY = 'forgeflow:nutrition:v3'
const LEGACY_STORAGE_KEYS = ['forgeflow:nutrition:v2', 'forgeflow:nutrition:v1']
const DEFAULT_WATER_GOAL_ML = 2500
const DEFAULT_CALORIE_GOAL = 2600
const DEFAULT_PROTEIN_GOAL_G = 160
const DEFAULT_CARBS_GOAL_G = ''
const DEFAULT_FAT_GOAL_G = ''

export function getBrazilDateKey(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return offsetDate.toISOString().slice(0, 10)
  }
}

export function getBrazilTimeHHmm(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  } catch {
    return date.toTimeString().slice(0, 5)
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

function normalizeOptionalPositiveNumber(value, fallback = '') {
  if (value === '' || value === null || value === undefined) return fallback
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

function createId(prefix = 'nutrition') {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getDefaultDay(date = todayKey()) {
  return {
    id: date,
    date,
    waterMl: 0,
    waterGoalMl: DEFAULT_WATER_GOAL_ML,
    calories: 0,
    calorieGoal: DEFAULT_CALORIE_GOAL,
    proteinG: 0,
    proteinGoalG: DEFAULT_PROTEIN_GOAL_G,
    carbsG: 0,
    carbsGoalG: DEFAULT_CARBS_GOAL_G,
    fatG: 0,
    fatGoalG: DEFAULT_FAT_GOAL_G,
    meals: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function readStorage(key) {
  if (typeof window === 'undefined') return {}

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function readAll() {
  const current = readStorage(STORAGE_KEY)
  if (Object.keys(current).length) return current

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacy = readStorage(legacyKey)
    if (Object.keys(legacy).length) {
      saveAll(legacy)
      return legacy
    }
  }

  return {}
}

function saveAll(data) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}))
    window.dispatchEvent(new CustomEvent('forgeflow:nutrition-changed', { detail: data || {} }))
  } catch (error) {
    console.warn('[ForgeFlow] Não foi possível salvar nutrição localmente:', error)
  }
}

export function normalizeMeal(input = {}) {
  const name = String(input.name || input.title || input.description || '').trim()
  const notes = String(input.notes || input.observation || '').trim()
  const now = new Date().toISOString()

  return {
    id: input.id || createId('meal'),
    name: name || 'Refeição',
    title: name || 'Refeição',
    description: String(input.description || notes || name || '').trim(),
    type: String(input.type || 'meal'),
    calories: clampNumber(input.calories, 0, 0, 30000),
    proteinG: clampNumber(input.proteinG ?? input.protein, 0, 0, 1000),
    carbsG: clampNumber(input.carbsG ?? input.carbs, 0, 0, 2000),
    fatG: clampNumber(input.fatG ?? input.fat, 0, 0, 1000),
    notes: notes.slice(0, 600),
    time: /^\d{2}:\d{2}$/.test(String(input.time || '')) ? input.time : getBrazilTimeHHmm(),
    photo: input.photo && typeof input.photo === 'object'
      ? {
          dataUrl: String(input.photo.dataUrl || '').slice(0, 6_500_000),
          mimeType: String(input.photo.mimeType || ''),
          size: clampNumber(input.photo.size, 0, 0, 8 * 1024 * 1024),
          capturedAt: input.photo.capturedAt || now,
        }
      : null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  }
}

export function normalizeNutritionLog(day = {}) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(day.date || '')) ? day.date : todayKey()
  const meals = Array.isArray(day.meals) ? day.meals.map(normalizeMeal).slice(0, 80) : []
  const totals = meals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories
      acc.proteinG += meal.proteinG
      acc.carbsG += meal.carbsG
      acc.fatG += meal.fatG
      return acc
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )

  return {
    ...getDefaultDay(date),
    ...day,
    id: day.id || date,
    date,
    meals,
    ...totals,
    waterMl: clampNumber(day.waterMl, 0, 0, 30000),
    waterGoalMl: clampNumber(day.waterGoalMl, DEFAULT_WATER_GOAL_ML, 500, 30000),
    calorieGoal: clampNumber(day.calorieGoal, DEFAULT_CALORIE_GOAL, 0, 30000),
    proteinGoalG: clampNumber(day.proteinGoalG, DEFAULT_PROTEIN_GOAL_G, 0, 1000),
    carbsGoalG: normalizeOptionalPositiveNumber(day.carbsGoalG, DEFAULT_CARBS_GOAL_G),
    fatGoalG: normalizeOptionalPositiveNumber(day.fatGoalG, DEFAULT_FAT_GOAL_G),
    createdAt: day.createdAt || new Date().toISOString(),
    updatedAt: day.updatedAt || new Date().toISOString(),
  }
}

export function getNutritionLogs() {
  const all = readAll()
  return Object.values(all)
    .map(normalizeNutritionLog)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

export function saveNutritionLogs(logs = []) {
  const normalized = {}
  logs.forEach((log) => {
    const day = normalizeNutritionLog(log)
    normalized[day.date] = day
  })
  saveAll(normalized)
  return Object.values(normalized)
}

function saveManyDaysToLocal(days = []) {
  const all = readAll()
  days.forEach((day) => {
    const normalized = normalizeNutritionLog(day)
    if (!normalized.date) return
    all[normalized.date] = normalized
  })
  saveAll(all)
}

export function saveNutritionLog(day) {
  const all = readAll()
  const normalized = normalizeNutritionLog(day)
  normalized.updatedAt = new Date().toISOString()
  all[normalized.date || todayKey()] = normalized
  saveAll(all)
  return normalized
}

export function getTodayNutritionLog() {
  return getTodayNutrition()
}

export function getTodayNutrition() {
  const key = todayKey()
  const all = readAll()
  return normalizeNutritionLog({
    ...getDefaultDay(key),
    ...(all[key] || {}),
    date: key,
  })
}

export function saveTodayNutrition(day) {
  const key = todayKey()
  return saveNutritionLog({
    ...getDefaultDay(key),
    ...day,
    date: key,
  })
}

export function addWater(amountMl = 250) {
  const current = getTodayNutrition()
  const delta = clampNumber(amountMl, 0, -5000, 5000)
  return saveTodayNutrition({
    ...current,
    waterMl: clampNumber(current.waterMl + delta, 0, 0, 30000),
  })
}

export function removeWater(amountMl = 250) {
  return addWater(-Math.abs(clampNumber(amountMl, 250, 0, 5000)))
}

export function setWater(amountMl = 0) {
  const current = getTodayNutrition()
  return saveTodayNutrition({
    ...current,
    waterMl: clampNumber(amountMl, 0, 0, 30000),
  })
}

export function setDailyWaterGoal(amountMl = DEFAULT_WATER_GOAL_ML) {
  const current = getTodayNutrition()
  return saveTodayNutrition({
    ...current,
    waterGoalMl: clampNumber(amountMl, DEFAULT_WATER_GOAL_ML, 500, 30000),
  })
}

export function addMeal(input = {}) {
  const current = getTodayNutrition()
  const meal = normalizeMeal(input)
  return saveTodayNutrition({
    ...current,
    meals: [meal, ...(Array.isArray(current.meals) ? current.meals : [])].slice(0, 80),
  })
}

export function updateMeal(mealId, input = {}) {
  const current = getTodayNutrition()
  const meals = Array.isArray(current.meals) ? current.meals : []
  const nextMeals = meals.map((meal) => (
    meal.id === mealId
      ? normalizeMeal({ ...meal, ...input, id: meal.id, createdAt: meal.createdAt, updatedAt: new Date().toISOString() })
      : meal
  ))

  return saveTodayNutrition({
    ...current,
    meals: nextMeals,
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

export function deleteMeal(mealId) {
  return removeMeal(mealId)
}

export function updateNutritionGoals({ waterGoalMl, calorieGoal, proteinGoalG, carbsGoalG, fatGoalG } = {}) {
  const current = getTodayNutrition()
  return saveTodayNutrition({
    ...current,
    waterGoalMl: clampNumber(waterGoalMl, current.waterGoalMl || DEFAULT_WATER_GOAL_ML, 500, 30000),
    calorieGoal: clampNumber(calorieGoal, current.calorieGoal || DEFAULT_CALORIE_GOAL, 0, 30000),
    proteinGoalG: clampNumber(proteinGoalG, current.proteinGoalG || DEFAULT_PROTEIN_GOAL_G, 0, 1000),
    carbsGoalG: normalizeOptionalPositiveNumber(carbsGoalG, current.carbsGoalG || DEFAULT_CARBS_GOAL_G),
    fatGoalG: normalizeOptionalPositiveNumber(fatGoalG, current.fatGoalG || DEFAULT_FAT_GOAL_G),
  })
}

export function calculateWaterProgress(waterMl = 0, goalMl = DEFAULT_WATER_GOAL_ML) {
  const safeGoal = Math.max(1, Number(goalMl) || DEFAULT_WATER_GOAL_ML)
  const safeWater = Math.max(0, Number(waterMl) || 0)
  return Math.max(0, Math.min(100, Math.round((safeWater / safeGoal) * 100)))
}

export function calculateNutritionSummary(log = getTodayNutrition(), goals = {}) {
  const day = normalizeNutritionLog({ ...log, ...goals })
  return {
    waterProgress: calculateWaterProgress(day.waterMl, day.waterGoalMl),
    waterRemainingMl: Math.max(0, day.waterGoalMl - day.waterMl),
    caloriesRemaining: Math.max(0, day.calorieGoal - day.calories),
    proteinRemainingG: Math.max(0, day.proteinGoalG - day.proteinG),
    mealCount: day.meals.length,
  }
}

export function buildNutritionInsights(log = getTodayNutrition()) {
  const day = normalizeNutritionLog(log)
  const summary = calculateNutritionSummary(day)
  const insights = []

  insights.push(`Você atingiu ${summary.waterProgress}% da meta de água hoje.`)

  if (summary.waterRemainingMl > 0) {
    insights.push(`Faltam ${summary.waterRemainingMl} ml para sua meta diária.`)
  } else {
    insights.push('Meta de água concluída hoje.')
  }

  if (summary.mealCount > 0) {
    insights.push(`Você registrou ${summary.mealCount} refeição${summary.mealCount > 1 ? 'ões' : ''} hoje.`)
  } else {
    insights.push('Registre uma refeição para ter um resumo melhor do dia.')
  }

  return insights
}

export function getNutritionHistory(days = 14) {
  const all = readAll()
  const today = new Date()
  const safeDays = clampNumber(days, 14, 1, 120)

  return Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    const key = getBrazilDateKey(date)
    return normalizeNutritionLog({
      ...getDefaultDay(key),
      ...(all[key] || {}),
      date: key,
    })
  })
}

export async function loadNutritionFromDatabase(days = 30) {
  const data = await apiFetch(`/nutrition?days=${encodeURIComponent(days)}`)
  const history = Array.isArray(data?.history) ? data.history.map(normalizeNutritionLog) : []
  const today = data?.today ? normalizeNutritionLog(data.today) : history[0] || getTodayNutrition()

  saveManyDaysToLocal([today, ...history])

  return {
    source: data?.source || 'database',
    today,
    history,
  }
}

export async function saveNutritionDayToDatabase(day) {
  const normalized = saveNutritionLog(day || getTodayNutrition())
  const saved = await apiFetch(`/nutrition/day/${normalized.date || todayKey()}`, {
    method: 'PUT',
    body: JSON.stringify(normalized),
  })

  return saveNutritionLog(saved)
}

export function formatNutritionDate(date) {
  const dateKey = typeof date === 'string' ? date : getBrazilDateKey(date)
  const safeDate = new Date(`${dateKey}T12:00:00`)
  return safeDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

export function validateMealFields(values = {}) {
  const hasContent = Boolean(
    String(values.name || values.description || values.notes || '').trim() ||
      Number(values.calories) > 0 ||
      Number(values.proteinG) > 0 ||
      values.photo?.dataUrl,
  )

  if (!hasContent) return 'Preencha pelo menos uma descrição ou alimento.'
  return ''
}

export function validateNutritionGoals(values = {}) {
  const waterGoal = Number(values.waterGoalMl)
  if (!Number.isFinite(waterGoal) || waterGoal < 500) return 'Informe uma meta de água válida.'

  for (const key of ['calorieGoal', 'proteinGoalG', 'carbsGoalG', 'fatGoalG']) {
    if (values[key] === '' || values[key] === null || values[key] === undefined) continue
    const number = Number(values[key])
    if (!Number.isFinite(number) || number < 0) return 'Informe metas válidas.'
  }

  return ''
}
