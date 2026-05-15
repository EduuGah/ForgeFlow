export function getExerciseMedia(exercise) {
  if (exercise?.media?.gif) return exercise.media.gif
  if (exercise?.media?.image) return exercise.media.image
  if (exercise?.gifUrl) return exercise.gifUrl
  if (exercise?.mediaUrl) return exercise.mediaUrl

  return ''
}

export function normalizeList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return [value]

  return []
}

