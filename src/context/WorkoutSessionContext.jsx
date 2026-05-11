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
const ACTIVE_WORKOUT_ENDPOINT = '/active-workout'
const FINISHED_ACTIVE_SESSION_IDS_KEY = 'forgeflow:finished-active-session-ids'

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getTimestamp(value) {
  const time = new Date(value || 0).getTime()

  return Number.isFinite(time) ? time : 0
}

function stampSession(session) {
  return {
    ...session,
    updatedAt: new Date().toISOString(),
  }
}

export function WorkoutSessionProvider({ children }) {
  const { user } = useAuth()

  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  const syncTimeoutRef = useRef(null)
  const isClearingActiveSessionRef = useRef(false)
  const hasCompletedInitialLoadRef = useRef(false)
  const activeSessionRef = useRef(null)

  useEffect(() => {
    activeSessionRef.current = activeSession
  }, [activeSession])

  function isMongoId(value) {
    return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
  }

  function getCurrentUserId() {
    return user?.id || user?._id || user?.userId || user?.email || 'anonymous'
  }

  function normalizeHistoryFromApi(session) {
    return {
      ...session,
      id: session?._id || session?.id || createId(),
      duration: session?.durationSeconds ?? session?.duration ?? 0,
      workoutName: session?.workoutName || session?.name || 'Treino',
      exercises: Array.isArray(session?.exercises) ? session.exercises : [],
    }
  }

  function normalizeActiveSession(session) {
    if (!session) return null

    const payload = session.session || session.activeSession || session

    if (!payload || !Array.isArray(payload.exercises) || payload.exercises.length === 0) {
      return null
    }

    return {
      ...payload,
      id: payload.id || payload._id || createId(),
      workoutName: payload.workoutName || payload.name || 'Treino em andamento',
      startedAt: payload.startedAt || new Date().toISOString(),
      updatedAt: payload.updatedAt || payload.startedAt || new Date().toISOString(),
      exercises: payload.exercises,
    }
  }

  async function fetchRemoteActiveSession() {
    try {
      const data = await apiFetch(ACTIVE_WORKOUT_ENDPOINT)
      return normalizeActiveSession(data)
    } catch (error) {
      console.warn('Não foi possível buscar treino ativo remoto:', error?.message || error)
      return null
    }
  }

  async function saveRemoteActiveSession(session) {
    if (!session) return false

    try {
      await apiFetch(ACTIVE_WORKOUT_ENDPOINT, {
        method: 'PUT',
        body: JSON.stringify({ session }),
      })

      return true
    } catch (error) {
      console.warn('Não foi possível salvar treino ativo remoto:', error?.message || error)
      return false
    }
  }

  async function clearRemoteActiveSession() {
    try {
      await apiFetch(ACTIVE_WORKOUT_ENDPOINT, {
        method: 'DELETE',
      })

      return true
    } catch (error) {
      console.warn('Não foi possível limpar treino ativo remoto:', error?.message || error)
      return false
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
        userId: getCurrentUserId(),
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
    const nextIds = [sessionId, ...ids.filter((id) => id !== sessionId)].slice(0, 40)

    window.localStorage.setItem(FINISHED_ACTIVE_SESSION_IDS_KEY, JSON.stringify(nextIds))
  }

  function wasActiveSessionFinished(session) {
    if (!session?.id) return false

    return getFinishedActiveSessionIds().includes(session.id)
  }

  function commitActiveSession(updater, { syncImmediately = false } = {}) {
    setActiveSession((current) => {
      const nextValue = typeof updater === 'function' ? updater(current) : updater

      if (!nextValue) return null

      const stampedSession = stampSession(nextValue)

      if (syncImmediately) {
        window.clearTimeout(syncTimeoutRef.current)
        saveRemoteActiveSession(stampedSession)
      }

      return stampedSession
    })
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
      hasCompletedInitialLoadRef.current = false
      setIsLoaded(false)

      if (!user) {
        setActiveSession(null)
        setIsLoaded(true)
        hasCompletedInitialLoadRef.current = true
        return
      }

      const localSession = normalizeActiveSession(
        getUserStorageData(user, ACTIVE_SESSION_STORAGE_KEY, null)
      )
      const remoteSession = await fetchRemoteActiveSession()

      if (!isMounted) return

      let nextSession = null

      if (remoteSession && !wasActiveSessionFinished(remoteSession)) {
        nextSession = remoteSession
      } else if (localSession && !wasActiveSessionFinished(localSession)) {
        nextSession = localSession
      }

      setActiveSession(nextSession)
      persistActiveSessionLocally(nextSession)
      hasCompletedInitialLoadRef.current = true
      setIsLoaded(true)
    }

    loadActiveSession()

    return () => {
      isMounted = false
      hasCompletedInitialLoadRef.current = false
      window.clearTimeout(syncTimeoutRef.current)
    }
  }, [user])

  useEffect(() => {
    if (!isLoaded || !hasCompletedInitialLoadRef.current || !user) return undefined

    window.clearTimeout(syncTimeoutRef.current)

    if (!activeSession) {
      persistActiveSessionLocally(null)
      return undefined
    }

    if (isClearingActiveSessionRef.current || wasActiveSessionFinished(activeSession)) {
      persistActiveSessionLocally(null)
      return undefined
    }

    persistActiveSessionLocally(activeSession)

    syncTimeoutRef.current = window.setTimeout(() => {
      if (!isClearingActiveSessionRef.current) {
        saveRemoteActiveSession(activeSession)
      }
    }, 500)

    return () => {
      window.clearTimeout(syncTimeoutRef.current)
    }
  }, [activeSession, isLoaded, user])

  useEffect(() => {
    if (!isLoaded || !user) return undefined

    let isMounted = true

    async function syncFromRemote() {
      if (isClearingActiveSessionRef.current) return

      const remoteSession = await fetchRemoteActiveSession()

      if (!isMounted || !remoteSession || wasActiveSessionFinished(remoteSession)) return

      setActiveSession((current) => {
        if (!current) {
          persistActiveSessionLocally(remoteSession)
          return remoteSession
        }

        if (current.id !== remoteSession.id) {
          persistActiveSessionLocally(remoteSession)
          return remoteSession
        }

        if (getTimestamp(remoteSession.updatedAt) > getTimestamp(current.updatedAt)) {
          persistActiveSessionLocally(remoteSession)
          return remoteSession
        }

        return current
      })
    }

    function handleFocusSync() {
      syncFromRemote()
    }

    function handleVisibilitySync() {
      if (document.visibilityState === 'visible') {
        syncFromRemote()
      }
    }

    syncFromRemote()

    const intervalId = window.setInterval(syncFromRemote, 5000)

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

        if (payload.userId !== getCurrentUserId()) return
        if (!payload.session || wasActiveSessionFinished(payload.session)) return

        setActiveSession((current) => {
          if (!current) return payload.session

          return getTimestamp(payload.session.updatedAt) > getTimestamp(current.updatedAt)
            ? payload.session
            : current
        })
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
      return undefined
    }

    const updateTimer = () => {
      const startedAt = new Date(activeSession.startedAt).getTime()
      const now = Date.now()

      setElapsedSeconds(Math.max(0, Math.floor((now - startedAt) / 1000)))
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
    const session = stampSession({
      id: createId(),
      workoutId: workout.id || workout._id || null,
      workoutName: workout.name || workout.workoutName || 'Treino',
      startedAt: new Date().toISOString(),
      notes: '',
      exercises: (workout.exercises || []).map((item) => {
        const exerciseData = item.exercise || item
        const plannedSets = Array.isArray(item.sets) ? item.sets : []
        let workingSetNumber = 0

        return {
          id: createId(),
          originalExerciseId: exerciseData.id || exerciseData._id || item.exerciseId || '',
          exercise: exerciseData,
          skipped: false,
          restTimer: item.restTimer || 'Desligado',
          sets: plannedSets.map((set) => {
            const type = set.type || 'working'

            if (type !== 'warmup') {
              workingSetNumber += 1
            }

            return {
              id: createId(),
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
    })

    rememberFinishedActiveSession(null)
    commitActiveSession(session, { syncImmediately: true })
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

    commitActiveSession((current) => {
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
    commitActiveSession((current) => {
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
    commitActiveSession((current) => {
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
                id: createId(),
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
    commitActiveSession((current) => {
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
    commitActiveSession((current) => {
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
    commitActiveSession((current) => {
      if (!current) return current

      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === sessionExerciseId
            ? {
              ...exercise,
              originalExerciseId: newExercise.id || newExercise._id || '',
              exercise: newExercise,
            }
            : exercise
        ),
      }
    })
  }

  function updateNotes(notes) {
    commitActiveSession((current) => {
      if (!current) return current

      return {
        ...current,
        notes,
      }
    })
  }

  async function clearActiveSessionEverywhere(sessionToClear = activeSessionRef.current) {
    const sessionId = sessionToClear?.id

    isClearingActiveSessionRef.current = true
    window.clearTimeout(syncTimeoutRef.current)

    rememberFinishedActiveSession(sessionId)
    persistActiveSessionLocally(null)
    setActiveSession(null)

    await clearRemoteActiveSession()

    window.setTimeout(() => {
      isClearingActiveSessionRef.current = false
    }, 1200)
  }

  function cancelSession() {
    clearActiveSessionEverywhere(activeSessionRef.current)
  }

  async function finishSession() {
    const sessionSnapshot = activeSessionRef.current

    if (!sessionSnapshot) return null

    const history = getUserStorageData(user, 'history', [])

    const finishedSession = {
      ...sessionSnapshot,
      finishedAt: new Date().toISOString(),
      duration: elapsedSeconds,
      durationSeconds: elapsedSeconds,
      exercises: (sessionSnapshot.exercises || []).map((sessionExercise) => {
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
