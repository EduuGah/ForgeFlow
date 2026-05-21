const STORAGE_KEY = 'forgeflow:nutrition:v1'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
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
    meals: [],
    updatedAt: new Date().toISOString(),
  }
}

function readAll() {
  if (typeof window === 'undefined') return {}

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveAll(data) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getTodayNutrition() {
  const key = todayKey()
  const all = readAll()
  return {
    ...getDefaultDay(),
    ...(all[key] || {}),
    date: key,
  }
}

export function saveTodayNutrition(day) {
  const key = todayKey()
  const all = readAll()
  const next = {
    ...getDefaultDay(),
    ...day,
    date: key,
    updatedAt: new Date().toISOString(),
  }
  all[key] = next
  saveAll(all)
  return next
}

export function addWater(amountMl = 250) {
  const current = getTodayNutrition()
  return saveTodayNutrition({
    ...current,
    waterMl: Math.max(0, Number(current.waterMl || 0) + Number(amountMl || 0)),
  })
}

export function addMeal({ name, calories = 0, proteinG = 0, time }) {
  const current = getTodayNutrition()
  const meal = {
    id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
    name: String(name || 'Refeição').trim() || 'Refeição',
    calories: Math.max(0, Number(calories) || 0),
    proteinG: Math.max(0, Number(proteinG) || 0),
    time: time || new Date().toTimeString().slice(0, 5),
    createdAt: new Date().toISOString(),
  }

  return saveTodayNutrition({
    ...current,
    calories: Math.max(0, Number(current.calories || 0) + meal.calories),
    proteinG: Math.max(0, Number(current.proteinG || 0) + meal.proteinG),
    meals: [meal, ...(Array.isArray(current.meals) ? current.meals : [])].slice(0, 20),
  })
}

export function removeMeal(mealId) {
  const current = getTodayNutrition()
  const meals = Array.isArray(current.meals) ? current.meals : []
  const meal = meals.find((item) => item.id === mealId)
  const nextMeals = meals.filter((item) => item.id !== mealId)

  return saveTodayNutrition({
    ...current,
    meals: nextMeals,
    calories: Math.max(0, Number(current.calories || 0) - Number(meal?.calories || 0)),
    proteinG: Math.max(0, Number(current.proteinG || 0) - Number(meal?.proteinG || 0)),
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
