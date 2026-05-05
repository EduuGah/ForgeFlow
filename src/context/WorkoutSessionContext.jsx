import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { getSessionPRTypes } from '../utils/prUtils'
import {
  getUserStorageData,
  saveUserStorageData,
  removeUserStorageData,
} from '../utils/userStorage'

const WorkoutSessionContext = createContext(null)

export function WorkoutSessionProvider({ children }) {
  const { user } = useAuth()

  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedSession = getUserStorageData(user, 'active-session', null)

    setActiveSession(savedSession)
    setIsLoaded(true)
  }, [user])

  useEffect(() => {
    if (!isLoaded) return

    if (!activeSession) {
      removeUserStorageData(user, 'active-session')
      return
    }

    saveUserStorageData(user, 'active-session', activeSession)
  }, [activeSession, isLoaded, user])

  useEffect(() => {
    if (!activeSession?.startedAt) {
      setElapsedSeconds(0)
      return
    }

    const updateTimer = () => {
      const startedAt = new Date(activeSession.startedAt).getTime()
      const now = Date.now()

      setElapsedSeconds(Math.floor((now - startedAt) / 1000))
    }

    updateTimer()

    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [activeSession?.startedAt])

  function isWarmupSet(set) {
    return set.type === 'warmup'
  }

  function isWorkingSet(set) {
    return set.type !== 'warmup'
  }

  function startSession(workout) {
    const session = {
      id: crypto.randomUUID(),
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: new Date().toISOString(),
      notes: '',
      exercises: workout.exercises.map((item) => {
        let workingSetNumber = 0

        return {
          id: crypto.randomUUID(),
          originalExerciseId: item.exercise.id,
          exercise: item.exercise,
          skipped: false,
          restTimer: item.restTimer || 'Desligado',
          sets: item.sets.map((set) => {
            const type = set.type || 'working'

            if (type !== 'warmup') {
              workingSetNumber += 1
            }

            return {
              id: crypto.randomUUID(),
              plannedDescription: set.description,
              type,
              setNumber: type === 'warmup' ? null : workingSetNumber,
              weight: '',
              reps: '',
              completed: false,
              isPR: false,
              isWeightPR: false,
              isVolumePR: false,
            }
          }),
        }
      }),
    }

    setActiveSession(session)
  }

  function updateSet(exerciseId, setId, field, value) {
    let safeValue = value

    if (field === 'weight' || field === 'reps') {
      const number = Number(value)

      if (value === '') {
        safeValue = ''
      } else if (Number.isNaN(number)) {
        safeValue = ''
      } else if (number < 0) {
        safeValue = '0'
      } else {
        safeValue = value
      }
    }

    setActiveSession((current) => {
      if (!current) return current

      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.map((set) =>
                  set.id === setId
                    ? {
                        ...set,
                        [field]: safeValue,
                      }
                    : set
                ),
              }
            : exercise
        ),
      }
    })
  }

  function toggleSetCompleted(exerciseId, setId) {
    setActiveSession((current) => {
      if (!current) return current

      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.map((set) =>
                  set.id === setId
                    ? {
                        ...set,
                        completed: !set.completed,
                      }
                    : set
                ),
              }
            : exercise
        ),
      }
    })
  }

  function addSet(exerciseId) {
    setActiveSession((current) => {
      if (!current) return current

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise

          const nextWorkingSetNumber =
            exercise.sets.filter((set) => isWorkingSet(set)).length + 1

          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: crypto.randomUUID(),
                plannedDescription: 'Extra',
                type: 'working',
                setNumber: nextWorkingSetNumber,
                weight: '',
                reps: '',
                completed: false,
                isPR: false,
                isWeightPR: false,
                isVolumePR: false,
              },
            ],
          }
        }),
      }
    })
  }

  function removeExercise(exerciseId) {
    setActiveSession((current) => {
      if (!current) return current

      return {
        ...current,
        exercises: current.exercises.filter(
          (exercise) => exercise.id !== exerciseId
        ),
      }
    })
  }

  function skipExercise(exerciseId) {
    setActiveSession((current) => {
      if (!current) return current

      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                skipped: !exercise.skipped,
              }
            : exercise
        ),
      }
    })
  }

  function replaceExercise(sessionExerciseId, newExercise) {
    setActiveSession((current) => {
      if (!current) return current

      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === sessionExerciseId
            ? {
                ...exercise,
                originalExerciseId: newExercise.id,
                exercise: newExercise,
              }
            : exercise
        ),
      }
    })
  }

  function updateNotes(notes) {
    setActiveSession((current) => {
      if (!current) return current

      return {
        ...current,
        notes,
      }
    })
  }

  function cancelSession() {
    setActiveSession(null)
    removeUserStorageData(user, 'active-session')
  }

  function finishSession() {
    if (!activeSession) return

    const history = getUserStorageData(user, 'history', [])

    const finishedSession = {
      ...activeSession,
      finishedAt: new Date().toISOString(),
      duration: elapsedSeconds,
      exercises: activeSession.exercises.map((exercise) => {
        const workingSets = exercise.sets.filter((set) => isWorkingSet(set))

        const { weightPRSetId, volumePRSetId } = getSessionPRTypes(
          exercise.exercise.name,
          workingSets,
          user
        )

        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            const isWarmup = isWarmupSet(set)

            return {
              ...set,
              isWeightPR: !isWarmup && set.id === weightPRSetId,
              isVolumePR: !isWarmup && set.id === volumePRSetId,
              isPR:
                !isWarmup &&
                (set.id === weightPRSetId || set.id === volumePRSetId),
            }
          }),
        }
      }),
    }

    saveUserStorageData(user, 'history', [finishedSession, ...history])

    setActiveSession(null)
    removeUserStorageData(user, 'active-session')
  }

  const completedSets = useMemo(() => {
    if (!activeSession) return 0

    return activeSession.exercises.reduce((total, exercise) => {
      return (
        total +
        exercise.sets.filter(
          (set) => set.completed && isWorkingSet(set)
        ).length
      )
    }, 0)
  }, [activeSession])

  const totalSets = useMemo(() => {
    if (!activeSession) return 0

    return activeSession.exercises.reduce((total, exercise) => {
      return total + exercise.sets.filter((set) => isWorkingSet(set)).length
    }, 0)
  }, [activeSession])

  return (
    <WorkoutSessionContext.Provider
      value={{
        activeSession,
        elapsedSeconds,
        completedSets,
        totalSets,
        startSession,
        updateSet,
        toggleSetCompleted,
        addSet,
        removeExercise,
        skipExercise,
        replaceExercise,
        updateNotes,
        cancelSession,
        finishSession,
      }}
    >
      {children}
    </WorkoutSessionContext.Provider>
  )
}

export function useWorkoutSession() {
  return useContext(WorkoutSessionContext)
}
