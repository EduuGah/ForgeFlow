import { getCompletedSets, getTotalVolume } from '../../utils/analyticsUtils'

const AUTOMATIC_GOAL_TYPES = new Set([
  'daily_workouts',
  'weekly_workouts',
  'monthly_workouts',
  'body_weight',
  'exercise_pr_weight',
  'monthly_volume',
  'streak_days',
  'progress_photos',
])

const BASELINE_GOAL_TYPES = new Set([
  'daily_workouts',
  'weekly_workouts',
  'monthly_workouts',
  'monthly_volume',
  'progress_photos',
])

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function parseLocalDate(value) {
  if (!value) return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0)
  }

  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0, 0)
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null

  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
}

export function getLocalDateKey(value) {
  const date = parseLocalDate(value)
  if (!date) return ''

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function getGoalDeadlineState(goal = {}, today = new Date()) {
  const deadline = parseLocalDate(goal.deadline)
  if (!deadline || goal.status === 'archived') return 'none'

  const todayDate = parseLocalDate(today)
  const progress = Number(goal.progressPercent || 0)
  const isCompleted = goal.status === 'completed' || goal.isCompleted || progress >= 100

  if (isCompleted) return 'completed'
  if (deadline < todayDate) return 'overdue'

  const msLeft = deadline.getTime() - todayDate.getTime()
  const daysLeft = Math.ceil(msLeft / 86400000)

  if (daysLeft <= 2) return 'soon'
  return 'scheduled'
}

export function normalizeGoal(goal = {}) {
  const status = goal.status || (goal.isCompleted ? 'completed' : 'active')
  const targetValue = toNumber(goal.targetValue)
  const currentValue = toNumber(goal.currentValue)
  const progressPercent = toNumber(goal.progressPercent)

  return {
    ...goal,
    id: goal._id || goal.id,
    title: goal.title || goal.name || 'Meta sem título',
    description: goal.description || '',
    type: goal.type || 'custom',
    targetValue,
    currentValue,
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
    unit: goal.unit || '',
    status,
    direction: goal.direction || 'increase',
    period: goal.period || 'none',
    exerciseName: goal.exerciseName || '',
    exerciseId: goal.exerciseId || '',
    deadline: goal.deadline ? String(goal.deadline).slice(0, 10) : '',
    completedAt: goal.completedAt || null,
    baselineValue: toNumber(goal.baselineValue),
    baselineAt: goal.baselineAt || null,
    baselinePeriodKey: goal.baselinePeriodKey || '',
    manualPeriodKey: goal.manualPeriodKey || '',
    isCompleted: Boolean(goal.isCompleted || status === 'completed' || progressPercent >= 100),
  }
}

function getSessionDate(session = {}) {
  return session.finishedAt || session.completedAt || session.date || session.createdAt || session.startedAt || null
}

function getStartOfDay(date = new Date()) {
  const copy = parseLocalDate(date) || new Date()
  return new Date(copy.getFullYear(), copy.getMonth(), copy.getDate(), 12, 0, 0, 0)
}

function getStartOfWeek(date = new Date()) {
  const copy = parseLocalDate(date) || new Date()
  const day = copy.getDay() || 7
  copy.setDate(copy.getDate() - day + 1)
  return copy
}

function getStartOfMonth(date = new Date()) {
  const copy = parseLocalDate(date) || new Date()
  return new Date(copy.getFullYear(), copy.getMonth(), 1, 12, 0, 0, 0)
}

function getPeriodStart(period = 'none', date = new Date()) {
  if (period === 'daily') return getStartOfDay(date)
  if (period === 'weekly') return getStartOfWeek(date)
  if (period === 'monthly') return getStartOfMonth(date)
  return null
}

function getWorkoutCountPeriod(goal = {}) {
  if (goal.period && goal.period !== 'none') return goal.period
  if (goal.type === 'daily_workouts') return 'daily'
  if (goal.type === 'monthly_workouts') return 'monthly'
  return 'weekly'
}

function isOnOrAfter(value, startDate) {
  const date = parseLocalDate(value)
  if (!date || !startDate) return false
  return date >= startDate
}

function calculateGoalPercent(currentValue, targetValue, direction = 'increase') {
  const current = toNumber(currentValue)
  const target = toNumber(targetValue)

  if (target <= 0) return 0

  if (direction === 'decrease') {
    if (current <= target) return 100
    return Math.max(0, Math.min(100, Math.round((target / Math.max(current, 1)) * 100)))
  }

  if (direction === 'reach') {
    return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
  }

  return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
}

export function getGoalPeriodKey(goal = {}, date = new Date()) {
  const localDate = parseLocalDate(date) || new Date()

  if (goal.period === 'daily') {
    return getLocalDateKey(localDate)
  }

  if (goal.period === 'monthly') {
    return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}`
  }

  if (goal.period === 'weekly') {
    const startOfYear = new Date(localDate.getFullYear(), 0, 1, 12, 0, 0, 0)
    const week = Math.ceil((((localDate - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7)
    return `${localDate.getFullYear()}-W${week}`
  }

  return 'once'
}

export function shouldUseGoalBaseline(goal = {}) {
  return BASELINE_GOAL_TYPES.has(goal.type)
}

function getWorkoutCountForPeriod(history = [], period = 'weekly') {
  const periodStart = getPeriodStart(period, new Date())
  if (!periodStart) return history.length

  return history.filter((session) => isOnOrAfter(getSessionDate(session), periodStart)).length
}

function getActiveWorkoutStreak(history = []) {
  const trainedDays = new Set(history.map((session) => getLocalDateKey(getSessionDate(session))).filter(Boolean))
  let cursor = parseLocalDate(new Date())
  let streak = 0

  while (cursor) {
    const key = getLocalDateKey(cursor)
    if (!trainedDays.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function getVolumeForPeriod(history = [], period = 'monthly') {
  const periodStart = getPeriodStart(period, new Date())
  const periodHistory = periodStart
    ? history.filter((session) => isOnOrAfter(getSessionDate(session), periodStart))
    : history
  const completedSets = getCompletedSets(periodHistory)
  const calculatedVolume = getTotalVolume(completedSets)

  if (calculatedVolume > 0) return calculatedVolume

  return periodHistory.reduce((total, session) => total + toNumber(session.totalVolume), 0)
}

function getLatestBodyWeight(bodyWeight = []) {
  if (!Array.isArray(bodyWeight) || bodyWeight.length === 0) return 0

  const latest = bodyWeight
    .slice()
    .sort((a, b) => {
      const dateA = parseLocalDate(a.date || a.createdAt)?.getTime() || 0
      const dateB = parseLocalDate(b.date || b.createdAt)?.getTime() || 0
      return dateB - dateA
    })[0]

  return toNumber(latest?.weight)
}

function getProgressPhotoCountForPeriod(progressPhotos = [], period = 'monthly') {
  const periodStart = getPeriodStart(period, new Date())
  if (!periodStart) return progressPhotos.length

  return progressPhotos.filter((photo) => isOnOrAfter(photo.date || photo.createdAt, periodStart)).length
}

function getExerciseBestWeight(history = [], exerciseName = '', exerciseId = '') {
  const completedSets = getCompletedSets(history)
  const normalizedName = String(exerciseName || '').trim().toLowerCase()
  const normalizedId = String(exerciseId || '').trim()

  return completedSets.reduce((best, set) => {
    const matchesById = normalizedId && String(set.exerciseId || set.exercise?._id || set.exercise?.id || '') === normalizedId
    const matchesByName = normalizedName && String(set.exerciseName || '').trim().toLowerCase() === normalizedName

    if (!matchesById && !matchesByName) return best

    const weight = toNumber(set.weight)
    if (weight > best) return weight

    return best
  }, 0)
}

function calculateGoalRawValue(goal, context = {}) {
  const history = Array.isArray(context.history) ? context.history : []
  const bodyWeight = Array.isArray(context.bodyWeight) ? context.bodyWeight : []
  const progressPhotos = Array.isArray(context.progressPhotos) ? context.progressPhotos : []

  if (['daily_workouts', 'weekly_workouts', 'monthly_workouts'].includes(goal.type)) {
    return getWorkoutCountForPeriod(history, getWorkoutCountPeriod(goal))
  }
  if (goal.type === 'body_weight') return getLatestBodyWeight(bodyWeight)
  if (goal.type === 'exercise_pr_weight') return getExerciseBestWeight(history, goal.exerciseName, goal.exerciseId)
  if (goal.type === 'monthly_volume') return getVolumeForPeriod(history, goal.period && goal.period !== 'none' ? goal.period : 'monthly')
  if (goal.type === 'streak_days') return getActiveWorkoutStreak(history)
  if (goal.type === 'progress_photos') return getProgressPhotoCountForPeriod(progressPhotos, goal.period && goal.period !== 'none' ? goal.period : 'monthly')

  return toNumber(goal.currentValue)
}

function calculateGoalCurrentValue(goal, context = {}) {
  const rawValue = calculateGoalRawValue(goal, context)

  if (!shouldUseGoalBaseline(goal)) return rawValue

  const currentPeriodKey = getGoalPeriodKey(goal, new Date())
  const baselinePeriodKey = goal.baselinePeriodKey || ''
  const baselineValue = toNumber(goal.baselineValue)

  if (baselinePeriodKey && baselinePeriodKey !== currentPeriodKey) return rawValue

  return Math.max(0, rawValue - baselineValue)
}

function getEffectiveGoalStatus(goal = {}) {
  if (goal.status !== 'completed') return goal.status
  if (!['daily', 'weekly', 'monthly'].includes(goal.period)) return goal.status

  const completedAt = goal.completedAt || goal.updatedAt
  if (!completedAt) return 'active'

  const completedPeriodKey = getGoalPeriodKey(goal, completedAt)
  const currentPeriodKey = getGoalPeriodKey(goal, new Date())

  return completedPeriodKey === currentPeriodKey ? 'completed' : 'active'
}

function getManualCurrentValueForPeriod(goal = {}) {
  if (!['daily', 'weekly', 'monthly'].includes(goal.period)) return goal.currentValue

  const currentPeriodKey = getGoalPeriodKey(goal, new Date())
  const savedPeriodKey = goal.manualPeriodKey || goal.baselinePeriodKey || getGoalPeriodKey(goal, goal.updatedAt || goal.createdAt || new Date())

  if (savedPeriodKey && savedPeriodKey !== currentPeriodKey) return 0

  return goal.currentValue
}

export function enrichGoalWithLocalProgress(goal, context = {}) {
  const normalizedGoal = normalizeGoal(goal)

  const effectiveStatus = getEffectiveGoalStatus(normalizedGoal)

  if (!AUTOMATIC_GOAL_TYPES.has(normalizedGoal.type)) {
    const currentValue = getManualCurrentValueForPeriod(normalizedGoal)
    const progressPercent = calculateGoalPercent(
      currentValue,
      normalizedGoal.targetValue,
      normalizedGoal.direction
    )

    return {
      ...normalizedGoal,
      status: effectiveStatus,
      currentValue,
      progressPercent,
      isCompleted: effectiveStatus === 'completed' || progressPercent >= 100,
    }
  }

  const currentValue = calculateGoalCurrentValue(normalizedGoal, context)
  const progressPercent = calculateGoalPercent(
    currentValue,
    normalizedGoal.targetValue,
    normalizedGoal.direction
  )

  return {
    ...normalizedGoal,
    status: effectiveStatus,
    currentValue,
    progressPercent,
    isCompleted: effectiveStatus === 'completed' || progressPercent >= 100,
  }
}

export function formatGoalValue(value, unit = '') {
  const number = toNumber(value)
  const compact = Math.abs(number) >= 10000
    ? new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(number)
    : number.toLocaleString('pt-BR')

  return unit ? `${compact} ${unit}` : compact
}
