import { useContext } from 'react'
import { WorkoutSessionContext } from './workoutSession/WorkoutSessionContextValue'

export function useWorkoutSession() {
  return useContext(WorkoutSessionContext)
}
