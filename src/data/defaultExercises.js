import { chestExercises } from './exercises/chestExercises';
import { backExercises } from './exercises/backExercises';
import { shoulderExercises } from './exercises/shoulderExercises';
import { bicepsExercises } from './exercises/bicepsExercises';
import { tricepsExercises } from './exercises/tricepsExercises';
import { legExercises } from './exercises/legExercises';
import { coreExercises } from './exercises/coreExercises';

export const defaultExercises = [
  ...chestExercises,
  ...backExercises,
  ...shoulderExercises,
  ...bicepsExercises,
  ...tricepsExercises,
  ...legExercises,
  ...coreExercises,
];

export default defaultExercises