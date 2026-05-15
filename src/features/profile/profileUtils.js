import { getUserStorageData } from '../../utils/userStorage'

export function getTodayDateInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function normalizeBodyWeightFromApi(item) {
  const rawDate = item.date || item.createdAt

  return {
    ...item,
    id: item._id || item.id,
    weight: Number(item.weight) || 0,
    date: rawDate ? String(rawDate).slice(0, 10) : '',
    note: item.note || '',
  }
}

export function normalizeHistoryFromApi(session) {
  return {
    ...session,
    id: session._id || session.id,
    duration: session.durationSeconds ?? session.duration ?? 0,
    workoutName: session.workoutName || session.name || 'Treino',
    exercises: Array.isArray(session.exercises) ? session.exercises : [],
    finishedAt: session.finishedAt || session.createdAt,
  }
}

export function isFutureDate(dateString) {
  if (!dateString) return false
  return dateString > getTodayDateInputValue()
}

export function parseWeightValue(value) {
  if (!value) return null

  const normalized = String(value).trim().replace(',', '.')
  const number = Number(normalized)

  return Number.isFinite(number) && number > 0 ? number : null
}

export function formatShortDate(dateString) {
  if (!dateString) return 'Sem data'

  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year.slice(2)}`
  }

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function getSafeBodyWeightList(user) {
  const savedWeights = getUserStorageData(user, 'bodyweight', [])

  return savedWeights
    .filter((item) => item?.date && !isFutureDate(item.date))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}
