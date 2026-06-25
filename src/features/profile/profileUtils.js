import { getUserStorageData } from '../../utils/userStorage'

export const DEFAULT_PROFILE_PREFERENCES = {
  privacyMode: false,
  hideProgressPhotos: false,
  confirmBeforeOpeningPhotos: true,
  hideShareSensitiveData: false,
}

function cleanText(value) {
  return String(value || '').trim()
}

function toNumber(value) {
  const normalized = String(value || '').replace(',', '.')
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}

function safeDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function localDateKey(value) {
  const date = safeDate(value)
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function normalizeProfilePreferences(preferences = {}) {
  return {
    ...DEFAULT_PROFILE_PREFERENCES,
    ...Object.keys(DEFAULT_PROFILE_PREFERENCES).reduce((next, key) => {
      if (typeof preferences?.[key] === 'boolean') next[key] = preferences[key]
      return next
    }, {}),
  }
}

export function normalizeUserProfile({ user = {}, storedProfile = {} } = {}) {
  const safeStoredProfile = storedProfile || {}
  const userProfile = user?.profile || {}
  const preferences = normalizeProfilePreferences(safeStoredProfile.preferences || userProfile.preferences)
  const name = cleanText(safeStoredProfile.name) || cleanText(user?.name)
  const email = cleanText(safeStoredProfile.email) || cleanText(user?.email)
  const username = cleanText(safeStoredProfile.username) || cleanText(user?.username) || (email ? `@${email.split('@')[0]}` : '')

  return {
    id: user?._id || user?.id || safeStoredProfile.id || '',
    name,
    username,
    email,
    avatarUrl: safeStoredProfile.avatarUrl || user?.avatarUrl || userProfile.avatarUrl || '',
    height: safeStoredProfile.height || userProfile.height || '',
    weight: safeStoredProfile.weight || safeStoredProfile.currentWeight || userProfile.currentWeight || '',
    goal: safeStoredProfile.goal || userProfile.mainGoal || '',
    trainingLevel: safeStoredProfile.trainingLevel || userProfile.trainingLevel || safeStoredProfile.experience || '',
    weeklyTarget: safeStoredProfile.weeklyTarget || (userProfile.trainingFrequency ? `${userProfile.trainingFrequency} treinos` : ''),
    preferredSplit: safeStoredProfile.preferredSplit || userProfile.preferredSplit || '',
    notes: safeStoredProfile.notes || userProfile.notes || '',
    preferences,
  }
}

export function validateProfileFields(values = {}) {
  const errors = {}
  const height = toNumber(values.height)
  const weight = toNumber(values.weight)

  if (values.height && (!height || height < 80 || height > 240)) {
    errors.height = 'Informe uma altura válida em cm.'
  }

  if (values.weight && (!weight || weight < 25 || weight > 350)) {
    errors.weight = 'Informe um peso válido em kg.'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}

export function buildProfilePayload(profile = {}) {
  const weeklyFrequency = profile.weeklyTarget
    ? Number(String(profile.weeklyTarget).replace(/\D/g, '')) || ''
    : ''

  return {
    name: cleanText(profile.name),
    username: cleanText(profile.username),
    avatarUrl: profile.avatarUrl || '',
    height: cleanText(profile.height),
    currentWeight: cleanText(profile.weight),
    mainGoal: cleanText(profile.goal),
    trainingLevel: cleanText(profile.trainingLevel),
    trainingFrequency: weeklyFrequency,
    preferredSplit: cleanText(profile.preferredSplit),
    notes: cleanText(profile.notes),
    preferences: normalizeProfilePreferences(profile.preferences),
  }
}

function getCompletedSets(history = []) {
  return history.flatMap((session) => {
    const exercises = Array.isArray(session?.exercises) ? session.exercises : []

    return exercises.flatMap((exercise) => {
      const sets = Array.isArray(exercise?.sets) ? exercise.sets : []
      const exerciseName = exercise?.exercise?.name || exercise?.exerciseName || exercise?.name || 'Exercício'

      return sets
        .filter((set) => set?.completed !== false)
        .map((set) => ({
          exerciseName,
          weight: toNumber(set.weight) || 0,
          reps: toNumber(set.reps) || 0,
          date: session.finishedAt || session.createdAt || session.date,
        }))
    })
  })
}

function calculateBestStreak(history = []) {
  const days = Array.from(
    new Set(
      history
        .map((session) => localDateKey(session.finishedAt || session.createdAt || session.date))
        .filter(Boolean),
    ),
  ).sort()

  if (!days.length) return { current: 0, best: 0 }

  const todayKey = localDateKey(new Date())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = localDateKey(yesterday)
  let best = 1
  let currentRun = 1

  for (let index = 1; index < days.length; index += 1) {
    const previous = safeDate(`${days[index - 1]}T12:00:00`)
    const current = safeDate(`${days[index]}T12:00:00`)
    const difference = Math.round((current - previous) / 86400000)

    if (difference === 1) {
      currentRun += 1
    } else {
      currentRun = 1
    }

    best = Math.max(best, currentRun)
  }

  let current = 0
  if (days.includes(todayKey) || days.includes(yesterdayKey)) {
    current = 1

    for (let index = days.length - 1; index > 0; index -= 1) {
      const previous = safeDate(`${days[index - 1]}T12:00:00`)
      const currentDate = safeDate(`${days[index]}T12:00:00`)
      const difference = Math.round((currentDate - previous) / 86400000)

      if (difference === 1) current += 1
      else break
    }
  }

  return { current, best }
}

export function calculateProfileStats(history = [], progressPhotos = [], bodyWeight = []) {
  const safeHistory = Array.isArray(history) ? history : []
  const safePhotos = Array.isArray(progressPhotos) ? progressPhotos : []
  const safeBodyWeight = Array.isArray(bodyWeight) ? bodyWeight : []
  const completedSets = getCompletedSets(safeHistory)
  const totalVolume = completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0)
  const prsByExercise = new Map()

  completedSets.forEach((set) => {
    const currentBest = prsByExercise.get(set.exerciseName) || 0
    const score = set.weight * Math.max(1, set.reps)
    if (score > currentBest) prsByExercise.set(set.exerciseName, score)
  })

  const lastSession = safeHistory
    .slice()
    .sort((a, b) => {
      const dateA = safeDate(a.finishedAt || a.createdAt || a.date)?.getTime() || 0
      const dateB = safeDate(b.finishedAt || b.createdAt || b.date)?.getTime() || 0
      return dateB - dateA
    })[0]

  const streak = calculateBestStreak(safeHistory)
  const lastWeight = safeBodyWeight
    .slice()
    .sort((a, b) => {
      const dateA = safeDate(a.date || a.createdAt)?.getTime() || 0
      const dateB = safeDate(b.date || b.createdAt)?.getTime() || 0
      return dateB - dateA
    })[0]

  return {
    totalWorkouts: safeHistory.length,
    totalSets: completedSets.length,
    totalVolume,
    prs: prsByExercise.size,
    currentStreak: streak.current,
    bestStreak: streak.best,
    progressPhotos: safePhotos.length,
    lastWorkout: lastSession?.workoutName || lastSession?.name || (lastSession ? 'Último treino' : ''),
    lastWorkoutDate: lastSession ? localDateKey(lastSession.finishedAt || lastSession.createdAt || lastSession.date) : '',
    currentWeight: lastWeight?.weight || '',
  }
}

export function formatCompactNumber(value, suffix = '') {
  const number = Number(value) || 0
  const formatted = new Intl.NumberFormat('pt-BR', {
    notation: Math.abs(number) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(number) >= 10000 ? 1 : 0,
  }).format(number)

  return suffix ? `${formatted} ${suffix}` : formatted
}

export function getSafeProfileStorage(user) {
  return getUserStorageData(user, 'user-profile-v2', null)
}

export function getSafeUserArray(user, key) {
  const value = getUserStorageData(user, key, [])
  return Array.isArray(value) ? value : []
}
