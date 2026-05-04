import defaultExercises from '../data/defaultExercises';

const EXERCISES_KEY = 'forgeflow:exercises';
const EXERCISES_VERSION_KEY = 'forgeflow:exercisesVersion';

const CURRENT_EXERCISES_VERSION = '3';

export function getInitialExercises() {
  const savedVersion = localStorage.getItem(EXERCISES_VERSION_KEY);

  if (savedVersion !== CURRENT_EXERCISES_VERSION) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises));
    localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION);

    return defaultExercises;
  }

  const savedExercisesRaw = localStorage.getItem(EXERCISES_KEY);

  if (!savedExercisesRaw) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises));
    localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION);

    return defaultExercises;
  }

  try {
    return JSON.parse(savedExercisesRaw);
  } catch (error) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises));
    localStorage.setItem(EXERCISES_VERSION_KEY, CURRENT_EXERCISES_VERSION);

    return defaultExercises;
  }
}