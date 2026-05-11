import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { getSessionPRTypes } from '../utils/prUtils'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
  removeUserStorageData,
} from '../utils/userStorage'

const WorkoutSessionContext = createContext(null)

const ACTIVE_SESSION_STORAGE_KEY = 'active-session'
const ACTIVE_SESSION_API_ENDPOINTS = [
  '/active-workout',
]

const FINISHED_ACTIVE_SESSION_IDS_KEY = 'forgeflow:finished-active-session-ids'


export function WorkoutSessionProvider({ children }) {
  const { user } = useAuth()

  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const syncTimeoutRef = useRef(null)
  const isClearingActiveSessionRef = useRef(false)
  const hasCompletedInitialActiveLoadRef = useRef(false)
  const lastActiveSessionSyncRef = useRef(0)

  function isMongoId(value) {
    return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
  }

  function normalizeHistoryFromApi(session) {
    return {
      ...session,
      id: session._id || session.id,
      duration: session.durationSeconds ?? session.duration ?? 0,
      workoutName: session.workoutName || session.name || 'Treino',
      exercises: Array.isArray(session.exercises) ? session.exercises : [],
    }
  }

  function normalizeActiveSession(session) {
    if (!session) return null

    const payload = session.session || session.activeSession || session

    if (!payload || !Array.isArray(payload.exercises)) return null

    return {
      ...payload,
      id: payload.id || payload._id || crypto.randomUUID(),
      workoutName: payload.workoutName || payload.name || 'Treino em andamento',
      exercises: payload.exercises,
    }
  }

  async function tryFetchActiveSessionFromApi() {
    for (const endpoint of ACTIVE_SESSION_API_ENDPOINTS) {
      try {
        const data = await apiFetch(endpoint)
        const normalizedSession = normalizeActiveSession(data)

        if (normalizedSession) return normalizedSession
      } catch {
        // Alguns backends ainda não têm endpoint de treino ativo. Nesse caso, seguimos com cache local.
      }
    }

    return null
  }

  async function trySaveActiveSessionToApi(session) {
    if (!session) return

    for (const endpoint of ACTIVE_SESSION_API_ENDPOINTS) {
      try {
        await apiFetch(endpoint, {
          method: 'PUT',
          body: JSON.stringify({ session }),
        })
        return
      } catch {
        // Fallback local quando o backend não oferece endpoint de treino ativo.
      }
    }
  }

  async function tryClearActiveSessionFromApi() {
    for (const endpoint of ACTIVE_SESSION_API_ENDPOINTS) {
      try {
        await apiFetch(endpoint, {
          method: 'DELETE',
        })
        return
      } catch {
        // Fallback local quando o backend não oferece endpoint de treino ativo.
      }
    }
  }

  function persistActiveSessionLocally(session) {
    if (!session) {
      removeUserStorageData(user, ACTIVE_SESSION_STORAGE_KEY)
      window.localStorage.removeItem('forgeflow:active-session-sync')
      return
    }

    saveUserStorageData(user, ACTIVE_SESSION_STORAGE_KEY, session)

    window.localStorage.setItem(
      'forgeflow:active-session-sync',
      JSON.stringify({
        userId: user?.id || user?._id || user?.email || 'anonymous',
        session,
        updatedAt: Date.now(),
      })
    )
  }

  function getFinishedActiveSessionIds() {
    try {
      const rawValue = window.localStorage.getItem(FINISHED_ACTIVE_SESSION_IDS_KEY)
      const ids = JSON.parse(rawValue || '[]')

      return Array.isArray(ids) ? ids : []
    } catch {
      return []
    }
  }

  function rememberFinishedActiveSession(sessionId) {
    if (!sessionId) return

    const ids = getFinishedActiveSessionIds()
    const nextIds = [sessionId, ...ids.filter((id) => id !== sessionId)].slice(0, 20)

    window.localStorage.setItem(FINISHED_ACTIVE_SESSION_IDS_KEY, JSON.stringify(nextIds))
  }

  function wasActiveSessionFinished(session) {
    if (!session?.id) return false

    return getFinishedActiveSessionIds().includes(session.id)
  }

  async function clearActiveSessionEverywhere(sessionToClear = activeSession) {
    const sessionId = sessionToClear?.id

    isClearingActiveSessionRef.current = true
    window.clearTimeout(syncTimeoutRef.current)

    rememberFinishedActiveSession(sessionId)
    persistActiveSessionLocally(null)

    try {
      await tryClearActiveSessionFromApi()
    } finally {
      setActiveSession(null)

      window.setTimeout(() => {
        isClearingActiveSessionRef.current = false
      }, 1000)
    }
  }

  function getExerciseDataFromSessionExercise(sessionExercise = {}) {
    if (sessionExercise.exercise && typeof sessionExercise.exercise === 'object') {
      return sessionExercise.exercise
    }

    return sessionExercise
  }

  function getExerciseNameFromSessionExercise(sessionExercise = {}) {
    const exercise = getExerciseDataFromSessionExercise(sessionExercise)

    return (
      exercise.name ||
      exercise.exerciseName ||
      exercise.title ||
      sessionExercise.exerciseName ||
      sessionExercise.name ||
      'Exercício sem nome'
    )
  }

  function getExerciseMuscleGroupFromSessionExercise(sessionExercise = {}) {
    const exercise = getExerciseDataFromSessionExercise(sessionExercise)

    return (
      exercise.muscleGroup ||
      exercise.group ||
      sessionExercise.muscleGroup ||
      sessionExercise.group ||
      ''
    )
  }

  function normalizeSessionExerciseForHistory(sessionExercise = {}) {
    const exerciseData = getExerciseDataFromSessionExercise(sessionExercise)

    return {
      ...sessionExercise,
      exercise: {
        ...exerciseData,
        id:
          exerciseData.id ||
          exerciseData._id ||
          sessionExercise.originalExerciseId ||
          sessionExercise.exerciseId ||
          '',
        name: getExerciseNameFromSessionExercise(sessionExercise),
        muscleGroup: getExerciseMuscleGroupFromSessionExercise(sessionExercise),
      },
      sets: Array.isArray(sessionExercise.sets) ? sessionExercise.sets : [],
    }
  }

  function getSessionPrs(session) {
    return (session.exercises || []).flatMap((exercise) =>
      (exercise.sets || [])
        .filter((set) => set.isPR || set.isWeightPR || set.isVolumePR)
        .map((set) => ({
          ...set,
          exerciseName: getExerciseNameFromSessionExercise(exercise),
          muscleGroup: getExerciseMuscleGroupFromSessionExercise(exercise),
        }))
    )
  }

  useEffect(() => {
    let isMounted = true

    async function loadActiveSession() {
      hasCompletedInitialActiveLoadRef.current = false
      setIsLoaded(false)

      const savedSession = getUserStorageData(user, ACTIVE_SESSION_STORAGE_KEY, null)
      const remoteSession = await tryFetchActiveSessionFromApi()

      if (!isMounted) return

      const nextSession =
        remoteSession && !wasActiveSessionFinished(remoteSession)
          ? remoteSession
          : savedSession && !wasActiveSessionFinished(savedSession)
            ? savedSession
            : null

      setActiveSession(nextSession)

      if (nextSession) {
        persistActiveSessionLocally(nextSession)
      } else {
        persistActiveSessionLocally(null)
      }

      hasCompletedInitialActiveLoadRef.current = true
      setIsLoaded(true)
    }

    loadActiveSession()

    return () => {
      isMounted = false
      hasCompletedInitialActiveLoadRef.current = false
    }
  }, [user])

  useEffect(() => {
    if (!isLoaded || !hasCompletedInitialActiveLoadRef.current) return

    window.clearTimeout(syncTimeoutRef.current)

    if (!activeSession) {
      persistActiveSessionLocally(null)

      if (isClearingActiveSessionRef.current) {
        return
      }

      return
    }

    if (isClearingActiveSessionRef.current || wasActiveSessionFinished(activeSession)) {
      persistActiveSessionLocally(null)
      return
    }

    persistActiveSessionLocally(activeSession)

    syncTimeoutRef.current = window.setTimeout(() => {
      if (!isClearingActiveSessionRef.current) {
        lastActiveSessionSyncRef.current = Date.now()
        trySaveActiveSessionToApi(activeSession)
      }
    }, 700)

    return () => {
      window.clearTimeout(syncTimeoutRef.current)
    }
  }, [activeSession, isLoaded, user])

  useEffect(() => {
    if (!isLoaded || !user) return undefined

    let isMounted = true

    async function pollRemoteActiveSession() {
      if (isClearingActiveSessionRef.current) return

      const remoteSession = await tryFetchActiveSessionFromApi()

      if (!isMounted) return

      setActiveSession((current) => {
        if (!remoteSession || wasActiveSessionFinished(remoteSession)) {
          return current
        }

        if (!current) {
          persistActiveSessionLocally(remoteSession)
          return remoteSession
        }

        if (current.id !== remoteSession.id) {
          persistActiveSessionLocally(remoteSession)
          return remoteSession
        }

        return current
      })
    }

    function handleFocusSync() {
      pollRemoteActiveSession()
    }

    function handleVisibilitySync() {
      if (document.visibilityState === 'visible') {
        pollRemoteActiveSession()
      }
    }

    pollRemoteActiveSession()

    const intervalId = window.setInterval(pollRemoteActiveSession, 8000)

    window.addEventListener('focus', handleFocusSync)
    document.addEventListener('visibilitychange', handleVisibilitySync)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocusSync)
      document.removeEventListener('visibilitychange', handleVisibilitySync)
    }
  }, [isLoaded, user])

  useEffect(() => {
    function handleActiveSessionStorage(event) {
      if (event.key !== 'forgeflow:active-session-sync') return
      if (!event.newValue) return

      try {
        const payload = JSON.parse(event.newValue)
        const currentUserId = user?.id || user?._id || user?.email || 'anonymous'

        if (payload.userId !== currentUserId) return

        if (!payload.session || wasActiveSessionFinished(payload.session)) return

        setActiveSession(payload.session)
      } catch {
        // Ignora eventos inválidos.
      }
    }

    window.addEventListener('storage', handleActiveSessionStorage)

    return () => {
      window.removeEventListener('storage', handleActiveSessionStorage)
    }
  }, [user])

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
    clearActiveSessionEverywhere(activeSession)
  }

  async function finishSession() {
    if (!activeSession) return null

    const history = getUserStorageData(user, 'history', [])

    const finishedSession = {
      ...activeSession,
      finishedAt: new Date().toISOString(),
      duration: elapsedSeconds,
      durationSeconds: elapsedSeconds,
      exercises: activeSession.exercises.map((sessionExercise) => {
        const exercise = normalizeSessionExerciseForHistory(sessionExercise)
        const sets = Array.isArray(exercise.sets) ? exercise.sets : []
        const workingSets = sets.filter((set) => isWorkingSet(set))
        const exerciseName = getExerciseNameFromSessionExercise(exercise)

        const { weightPRSetId, volumePRSetId } = getSessionPRTypes(
          exerciseName,
          workingSets,
          user
        )

        return {
          ...exercise,
          sets: sets.map((set) => {
            const isWarmup = isWarmupSet(set)

            return {
              ...set,
              completed: Boolean(set.completed),
              weight: set.weight === undefined || set.weight === null ? '' : set.weight,
              reps: set.reps === undefined || set.reps === null ? '' : set.reps,
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

    try {
      const payload = {
        workoutId: isMongoId(finishedSession.workoutId)
          ? finishedSession.workoutId
          : null,
        workoutName: finishedSession.workoutName,
        exercises: finishedSession.exercises,
        durationSeconds: finishedSession.durationSeconds,
        startedAt: finishedSession.startedAt,
        finishedAt: finishedSession.finishedAt,
        prs: getSessionPrs(finishedSession),
        notes: finishedSession.notes || '',
      }

      const savedSessionFromApi = await apiFetch('/workout-history', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const savedSession = normalizeHistoryFromApi(savedSessionFromApi)

      saveUserStorageData(user, 'history', [savedSession, ...history])

      await clearActiveSessionEverywhere(finishedSession)

      return savedSession
    } catch (error) {
      console.error(error)

      saveUserStorageData(user, 'history', [finishedSession, ...history])

      await clearActiveSessionEverywhere(finishedSession)

      return finishedSession
    }
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
