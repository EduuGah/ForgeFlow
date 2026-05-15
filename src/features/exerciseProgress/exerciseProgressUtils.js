export function getExerciseMedia(exercise = {}) {
  return (
    exercise.imageUrl ||
    exercise.gifUrl ||
    exercise.mediaUrl ||
    exercise.media?.image ||
    exercise.media?.gif ||
    exercise.image ||
    exercise.gif ||
    ''
  )
}

export function normalizeExerciseName(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function formatLongDate(value) {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function formatWeight(value) { return `${Number(value || 0).toLocaleString('pt-BR')} kg` }
export function formatVolume(value) { return `${Number(value || 0).toLocaleString('pt-BR')} kg` }

