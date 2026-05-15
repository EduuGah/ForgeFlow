export function normalizeProgressPhotoFromApi(photo) {
  const rawDate = photo.date || photo.createdAt

  return {
    ...photo,
    id: photo._id || photo.id,
    imageUrl: photo.imageUrl || '',
    publicId: photo.publicId || '',
    date: rawDate ? String(rawDate).slice(0, 10) : '',
    angle: photo.angle || 'front',
    weight: photo.weight ?? '',
    note: photo.note || '',
    createdAt: photo.createdAt || rawDate || '',
  }
}

export function getAngleLabel(angle) {
  const labels = {
    front: 'Frente',
    side: 'Lado',
    back: 'Costas',
    other: 'Outro',
  }

  return labels[angle] || 'Outro'
}

export function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(`${String(dateString).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function formatLongDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(`${String(dateString).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function getDateKey(dateString) {
  return String(dateString || '').slice(0, 10) || 'sem-data'
}

export function getDateGroupTitle(dateString) {
  if (!dateString || dateString === 'sem-data') return 'Sem data'

  const date = new Date(`${dateString}T12:00:00`)
  const today = new Date()
  const yesterday = new Date()

  yesterday.setDate(today.getDate() - 1)

  const key = date.toISOString().slice(0, 10)
  const todayKey = today.toISOString().slice(0, 10)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)

  if (key === todayKey) return 'Hoje'
  if (key === yesterdayKey) return 'Ontem'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function getDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return null

  const start = new Date(`${String(startDate).slice(0, 10)}T12:00:00`)
  const end = new Date(`${String(endDate).slice(0, 10)}T12:00:00`)
  const diff = Math.round((end - start) / 86400000)

  return Number.isFinite(diff) ? diff : null
}

export function sortPhotosByDateDesc(a, b) {
  const dateA = new Date(a.date || a.createdAt || 0)
  const dateB = new Date(b.date || b.createdAt || 0)

  return dateB - dateA
}
