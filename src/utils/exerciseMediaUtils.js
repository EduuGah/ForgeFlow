export function getExerciseMedia(exercise) {
  if (!exercise) {
    return '/exercise-media/fallback/default.png'
  }

  if (exercise.media?.gif) return exercise.media.gif
  if (exercise.media?.image) return exercise.media.image

  if (exercise.gifUrl) return exercise.gifUrl
  if (exercise.mediaUrl) return exercise.mediaUrl

  const fallbackByGroup = {
    Peito: '/exercise-media/fallback/chest.png',
    Costas: '/exercise-media/fallback/back.png',
    Pernas: '/exercise-media/fallback/legs.png',
    Ombros: '/exercise-media/fallback/shoulders.png',
    Bíceps: '/exercise-media/fallback/arms.png',
    Tríceps: '/exercise-media/fallback/arms.png',
    Abdômen: '/exercise-media/fallback/core.png',
  }

  return fallbackByGroup[exercise.muscleGroup] || '/exercise-media/fallback/default.png'
}