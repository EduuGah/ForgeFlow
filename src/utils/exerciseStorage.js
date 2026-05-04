import defaultExercises from '../data/defaultExercises';

const EXERCISES_KEY = 'forgeflow:exercises';
const EXERCISES_VERSION_KEY = 'forgeflow:exercisesVersion';

const CURRENT_EXERCISES_VERSION = '4';

export function getInitialExercises() {
  const savedVersion = localStorage.getItem(EXERCISES_VERSION_KEY);
  const savedExercisesRaw = localStorage.getItem(EXERCISES_KEY);

  if (!savedExercisesRaw) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises));
    localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION);
    return defaultExercises;
  }

  try {
    const savedExercises = JSON.parse(savedExercisesRaw);

    if (savedVersion !== CURRENT_EXERCISES_VERSION) {
      const savedIds = new Set(savedExercises.map((exercise) => exercise.id));

      const newDefaultExercises = defaultExercises.filter(
        (exercise) => !savedIds.has(exercise.id)
      );

      const mergedExercises = [...savedExercises, ...newDefaultExercises];

      localStorage.setItem(EXERCISES_KEY, JSON.stringify(mergedExercises));
      localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION);

      return mergedExercises;
    }

    return savedExercises;
  } catch (error) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises));
    localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION);
    return defaultExercises;
  }
}