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
const ACTIVE_SESSION_ENDPOINT = '/active-workout'
const ACTIVE_SESSION_FINISH_ENDPOINT = '/active-workout/finish'
const FINISHED_ACTIVE_SESSION_IDS_KEY = 'forgeflow:finished-active-session-ids'

function nowIso() {
  return new Date().toISOString()
}

function getTimestamp(value) {
  const timestamp = new Date(value || 0).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

function safeCryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function WorkoutSessionProvider({ children }) {
  const { user } = useAuth()

  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  const syncTimeoutRef = useRef(null)
  const isFinishingRef = useRef(false)
  const hasCompletedInitialLoadRef = useRef(false)

  function isMongoId(value) {
    return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
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
    const nextIds = [sessionId, ...ids.filter((id) => id !== sessionId)].slice(0, 30)

    window.localStorage.setItem(FINISHED_ACTIVE_SESSION_IDS_KEY, JSON.stringify(nextIds))
  }

  function wasActiveSessionFinished(session) {
    if (!session?.id) return false

    return getFinishedActiveSessionIds().includes(session.id)
  }

  function normalizeHistoryFromApi(session) {
    const payload = session?.session || session

    return {
      ...payload,
      id: payload?._id || payload?.id || safeCryptoId(),
      duration: payload?.durationSeconds ?? payload?.duration ?? 0,
      workoutName: payload?.workoutName || payload?.name || 'Treino',
      exercises: Array.isArray(payload?.exercises) ? payload.exercises : [],
    }
  }

  function normalizeActiveSession(response) {
    if (!response) return null

    const payload = response.session || response.activeSession || response

    if (!payload || !Array.isArray(payload.exercises)) return null

    return {
      ...payload,
      id: payload.id || payload._id || safeCryptoId(),
      workoutName: payload.workoutName || payload.name || 'Treino em andamento',
      startedAt: payload.startedAt || nowIso(),
      updatedAt: payload.updatedAt || payload.savedAt || payload.startedAt || nowIso(),
      exercises: payload.exercises,
    }
  }

  function markSessionUpdated(session) {
    if (!session) return session

    return {
      ...session,
      updatedAt: nowIso(),
    }
  }

  function persistActiveSessionLocally(session) {
    if (!session) {
      removeUserStorageData(user, ACTIVE_SESSION_STORAGE_KEY)

      window.localStorage.setItem(
        'forgeflow:active-session-sync',
        JSON.stringify({
          userId: user?.id || user?._id || user?.email || 'anonymous',
          session: null,
          updatedAt: Date.now(),
        })
      )

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

  async function fetchActiveSessionState() {
    try {
      const data = await apiFetch(ACTIVE_SESSION_ENDPOINT)
      const session = normalizeActiveSession(data)

      return {
        ok: true,
        session,
      }
    } catch (error) {
      if (error?.status !== 401) {
        console.error('Erro ao buscar treino ativo remoto:', error)
      }

      return {
        ok: false,
        session: null,
        error,
      }
    }
  }

  async function saveActiveSessionToApi(session) {
    if (!session || isFinishingRef.current) return false

    try {
      await apiFetch(ACTIVE_SESSION_ENDPOINT, {
        method: 'PUT',
        body: JSON.stringify({ session }),
      })

      return true
    } catch (error) {
      console.error('Erro ao salvar treino ativo remoto:', error)

      return false
    }
  }

  async function clearActiveSessionFromApi() {
    try {
      await apiFetch(ACTIVE_SESSION_ENDPOINT, {
        method: 'DELETE',
      })

      return true
    } catch (error) {
      console.error('Erro ao limpar treino ativo remoto:', error)

      return false
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

  function isWarmupSet(set) {
    return set.type === 'warmup'
  }

  function isWorkingSet(set) {
    return set.type !== 'warmup'
  }

  function renumberExerciseSets(sets = []) {
    let workingSetNumber = 0

    return sets.map((set) => {
      if (set.type === 'warmup') {
        return {
          ...set,
          setNumber: null,
        }
      }

      workingSetNumber += 1

      return {
        ...set,
        setNumber: workingSetNumber,
      }
    })
  }

  function applyRemoteSession(remoteSession) {
    setActiveSession((current) => {
      if (isFinishingRef.current) return current

      if (!remoteSession) {
        if (current) {
          persistActiveSessionLocally(null)
        }

        return null
      }

      if (wasActiveSessionFinished(remoteSession)) {
        persistActiveSessionLocally(null)
        return null
      }

      if (!current) {
        persistActiveSessionLocally(remoteSession)
        return remoteSession
      }

      if (current.id !== remoteSession.id) {
        persistActiveSessionLocally(remoteSession)
        return remoteSession
      }

      const remoteUpdatedAt = getTimestamp(remoteSession.updatedAt)
      const currentUpdatedAt = getTimestamp(current.updatedAt)

      if (remoteUpdatedAt > currentUpdatedAt) {
        persistActiveSessionLocally(remoteSession)
        return remoteSession
      }

      return current
    })
  }

  async function clearActiveSessionEverywhere(sessionToClear = activeSession) {
    const sessionId = sessionToClear?.id

    isFinishingRef.current = true
    window.clearTimeout(syncTimeoutRef.current)

    rememberFinishedActiveSession(sessionId)
    persistActiveSessionLocally(null)
    setActiveSession(null)

    await clearActiveSessionFromApi()

    window.setTimeout(() => {
      isFinishingRef.current = false
    }, 1200)
  }

  useEffect(() => {
    let isMounted = true

    async function loadActiveSession() {
      hasCompletedInitialLoadRef.current = false
      setIsLoaded(false)

      const savedSession = getUserStorageData(user, ACTIVE_SESSION_STORAGE_KEY, null)
      const remoteState = await fetchActiveSessionState()

      if (!isMounted) return

      let nextSession = null

      if (remoteState.ok) {
        nextSession =
          remoteState.session && !wasActiveSessionFinished(remoteState.session)
            ? remoteState.session
            : null
      } else {
        nextSession =
          savedSession && !wasActiveSessionFinished(savedSession)
            ? savedSession
            : null
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
    if (!isLoaded || !hasCompletedInitialLoadRef.current) return

    window.clearTimeout(syncTimeoutRef.current)

    if (!activeSession) {
      persistActiveSessionLocally(null)
      return
    }

    if (isFinishingRef.current || wasActiveSessionFinished(activeSession)) {
      persistActiveSessionLocally(null)
      return
    }

    persistActiveSessionLocally(activeSession)

    syncTimeoutRef.current = window.setTimeout(() => {
      if (!isFinishingRef.current) {
        saveActiveSessionToApi(activeSession)
      }
    }, 500)

    return () => {
      window.clearTimeout(syncTimeoutRef.current)
    }
  }, [activeSession, isLoaded, user])

  useEffect(() => {
    if (!isLoaded || !user) return undefined

    let isMounted = true

    async function pollRemoteActiveSession() {
      if (isFinishingRef.current) return

      const remoteState = await fetchActiveSessionState()

      if (!isMounted || !remoteState.ok) return

      applyRemoteSession(remoteState.session)
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

    const intervalId = window.setInterval(pollRemoteActiveSession, 5000)

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

        if (!payload.session) {
          setActiveSession(null)
          return
        }

        if (wasActiveSessionFinished(payload.session)) {
          setActiveSession(null)
          return
        }

        applyRemoteSession(payload.session)
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

      setElapsedSeconds(Math.max(0, Math.floor((now - startedAt) / 1000)))
    }

    updateTimer()

    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [activeSession?.startedAt])

  function startSession(workout) {
    const session = markSessionUpdated({
      id: safeCryptoId(),
      workoutId: workout.id,
      workoutName: workout.name,
      isTutorial: Boolean(workout.isTutorial || workout.tutorialOnly),
      tutorialOnly: Boolean(workout.isTutorial || workout.tutorialOnly),
      startedAt: nowIso(),
      notes: '',
      exercises: workout.exercises.map((item) => {
        let workingSetNumber = 0

        return {
          id: safeCryptoId(),
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
              id: safeCryptoId(),
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

    setActiveSession(session)
    saveActiveSessionToApi(session)
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

      return markSessionUpdated({
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
                    ...(field === 'weight' || field === 'reps'
                      ? {
                        isPR: false,
                        isWeightPR: false,
                        isVolumePR: false,
                      }
                      : {}),
                  }
                  : set
              ),
            }
            : exercise
        ),
      })
    })
  }

  function toggleSetCompleted(exerciseId, setId) {
    setActiveSession((current) => {
      if (!current) return current

      return markSessionUpdated({
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
      })
    })
  }

  function addSet(exerciseId, options = {}) {
    setActiveSession((current) => {
      if (!current) return current

      return markSessionUpdated({
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise

          const type = options.type === 'warmup' ? 'warmup' : 'working'
          const nextWorkingSetNumber =
            exercise.sets.filter((set) => isWorkingSet(set)).length + 1

          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: safeCryptoId(),
                plannedDescription: type === 'warmup' ? 'Aquecimento' : 'Extra',
                type,
                setNumber: type === 'warmup' ? null : nextWorkingSetNumber,
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
      })
    })
  }

  function removeSet(exerciseId, setId) {
    setActiveSession((current) => {
      if (!current) return current

      return markSessionUpdated({
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise

          const nextSets = exercise.sets.filter((set) => set.id !== setId)

          return {
            ...exercise,
            sets: renumberExerciseSets(nextSets),
          }
        }),
      })
    })
  }

  function toggleSetWarmup(exerciseId, setId) {
    setActiveSession((current) => {
      if (!current) return current

      return markSessionUpdated({
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise

          const nextSets = exercise.sets.map((set) =>
            set.id === setId
              ? {
                ...set,
                type: set.type === 'warmup' ? 'working' : 'warmup',
                completed: false,
                isPR: false,
                isWeightPR: false,
                isVolumePR: false,
              }
              : set
          )

          return {
            ...exercise,
            sets: renumberExerciseSets(nextSets),
          }
        }),
      })
    })
  }

  function moveSet(exerciseId, setId, direction) {
    setActiveSession((current) => {
      if (!current) return current

      return markSessionUpdated({
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise

          const currentIndex = exercise.sets.findIndex((set) => set.id === setId)
          if (currentIndex === -1) return exercise

          const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
          if (nextIndex < 0 || nextIndex >= exercise.sets.length) return exercise

          const nextSets = [...exercise.sets]
          const [movedSet] = nextSets.splice(currentIndex, 1)
          nextSets.splice(nextIndex, 0, movedSet)

          return {
            ...exercise,
            sets: renumberExerciseSets(nextSets),
          }
        }),
      })
    })
  }

  function removeExercise(exerciseId) {
    setActiveSession((current) => {
      if (!current) return current

      return markSessionUpdated({
        ...current,
        exercises: current.exercises.filter(
          (exercise) => exercise.id !== exerciseId
        ),
      })
    })
  }

  function skipExercise(exerciseId) {
    setActiveSession((current) => {
      if (!current) return current

      return markSessionUpdated({
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
              ...exercise,
              skipped: !exercise.skipped,
            }
            : exercise
        ),
      })
    })
  }

  function replaceExercise(sessionExerciseId, newExercise) {
    setActiveSession((current) => {
      if (!current) return current

      return markSessionUpdated({
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
      })
    })
  }

  function updateNotes(notes) {
    setActiveSession((current) => {
      if (!current) return current

      return markSessionUpdated({
        ...current,
        notes,
      })
    })
  }

  function cancelSession() {
    clearActiveSessionEverywhere(activeSession)
  }

  async function finishSession() {
    if (!activeSession) return null

    isFinishingRef.current = true
    window.clearTimeout(syncTimeoutRef.current)

    const history = getUserStorageData(user, 'history', [])

    const finishedSession = {
      ...activeSession,
      finishedAt: nowIso(),
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

    if (finishedSession.isTutorial || finishedSession.tutorialOnly) {
      rememberFinishedActiveSession(finishedSession.id)
      persistActiveSessionLocally(null)
      setActiveSession(null)

      try {
        await clearActiveSessionFromApi()
      } catch (error) {
        console.error(error)
      }

      window.setTimeout(() => {
        isFinishingRef.current = false
      }, 600)

      return {
        ...finishedSession,
        skippedHistorySave: true,
      }
    }

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
      session: finishedSession,
    }

    try {
      let savedSession = null

      try {
        const savedFromFinishEndpoint = await apiFetch(ACTIVE_SESSION_FINISH_ENDPOINT, {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        savedSession = normalizeHistoryFromApi(savedFromFinishEndpoint)
      } catch {
        const savedSessionFromApi = await apiFetch('/workout-history', {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        savedSession = normalizeHistoryFromApi(savedSessionFromApi)

        await clearActiveSessionFromApi()
      }

      saveUserStorageData(user, 'history', [savedSession, ...history])

      rememberFinishedActiveSession(finishedSession.id)
      persistActiveSessionLocally(null)
      setActiveSession(null)

      return savedSession
    } catch (error) {
      console.error(error)

      saveUserStorageData(user, 'history', [finishedSession, ...history])

      rememberFinishedActiveSession(finishedSession.id)
      persistActiveSessionLocally(null)
      setActiveSession(null)

      await clearActiveSessionFromApi()

      return finishedSession
    } finally {
      window.setTimeout(() => {
        isFinishingRef.current = false
      }, 1200)
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
        removeSet,
        toggleSetWarmup,
        moveSet,
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
