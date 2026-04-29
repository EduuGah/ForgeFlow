import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isNewPR } from '../utils/prUtils'

const WorkoutSessionContext = createContext(null)

export function WorkoutSessionProvider({ children }) {
    const [activeSession, setActiveSession] = useState(null)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    useEffect(() => {
        const savedSession = localStorage.getItem('forgeflow:active-session')

        if (savedSession) {
            setActiveSession(JSON.parse(savedSession))
        }
    }, [])

    useEffect(() => {
        if (!activeSession) return

        localStorage.setItem(
            'forgeflow:active-session',
            JSON.stringify(activeSession)
        )
    }, [activeSession])

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

    function startSession(workout) {
        const session = {
            id: crypto.randomUUID(),
            workoutId: workout.id,
            workoutName: workout.name,
            startedAt: new Date().toISOString(),
            notes: '',
            exercises: workout.exercises.map((item) => ({
                id: crypto.randomUUID(),
                originalExerciseId: item.exercise.id,
                exercise: item.exercise,
                skipped: false,
                sets: item.sets.map((set, index) => ({
                    id: crypto.randomUUID(),
                    plannedDescription: set.description,
                    setNumber: index + 1,
                    weight: '',
                    reps: '',
                    completed: false,
                    isPR: false,
                })),
            })),
        }

        setActiveSession(session)
    }

    function updateSet(exerciseId, setId, field, value) {
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
                                        [field]: value,
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
                exercises: current.exercises.map((exercise) =>
                    exercise.id === exerciseId
                        ? {
                            ...exercise,
                            sets: [
                                ...exercise.sets,
                                {
                                    id: crypto.randomUUID(),
                                    plannedDescription: 'Extra',
                                    setNumber: exercise.sets.length + 1,
                                    weight: '',
                                    reps: '',
                                    completed: false,
                                    isPR: false,
                                },
                            ],
                        }
                        : exercise
                ),
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
        localStorage.removeItem('forgeflow:active-session')
    }

    function finishSession() {
        if (!activeSession) return

        const history = JSON.parse(
            localStorage.getItem('forgeflow:history') || '[]'
        )

        const finishedSession = {
            ...activeSession,
            finishedAt: new Date().toISOString(),
            duration: elapsedSeconds,
            exercises: activeSession.exercises.map((exercise) => ({
                ...exercise,
                sets: exercise.sets.map((set) => {
                    const hasValidData = set.weight && set.reps && set.completed

                    return {
                        ...set,
                        isPR: hasValidData
                            ? isNewPR(
                                exercise.exercise.name,
                                set.weight,
                                set.reps
                            )
                            : false,
                    }
                }),
            })),
        }

        localStorage.setItem(
            'forgeflow:history',
            JSON.stringify([finishedSession, ...history])
        )

        setActiveSession(null)
        localStorage.removeItem('forgeflow:active-session')
    }

    const completedSets = useMemo(() => {
        if (!activeSession) return 0

        return activeSession.exercises.reduce((total, exercise) => {
            return total + exercise.sets.filter((set) => set.completed).length
        }, 0)
    }, [activeSession])

    const totalSets = useMemo(() => {
        if (!activeSession) return 0

        return activeSession.exercises.reduce((total, exercise) => {
            return total + exercise.sets.length
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