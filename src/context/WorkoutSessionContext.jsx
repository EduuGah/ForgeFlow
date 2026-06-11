import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { getSessionPRTypes } from '../utils/prUtils'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
  removeUserStorageData,
} from '../utils/userStorage'
import {
  ACTIVE_SESSION_ENDPOINT,
  ACTIVE_SESSION_FINISH_ENDPOINT,
  ACTIVE_SESSION_STORAGE_KEY,
  countCompletedWorkingSets,
  countTotalWorkingSets,
  createWorkoutSession,
  getExerciseNameFromSessionExercise,
  getSessionPrs,
  getSessionSyncHash,
  getTimestamp,
  isMongoId,
  isWarmupSet,
  isWorkingSet,
  markSessionUpdated,
  normalizeActiveSession,
  normalizeHistoryFromApi,
  normalizeSessionExerciseForHistory,
  nowIso,
  rememberFinishedActiveSession,
  renumberExerciseSets,
  safeCryptoId,
  wasActiveSessionFinished,
} from './workoutSession/workoutSessionUtils'

import { WorkoutSessionContext } from './workoutSession/WorkoutSessionContextValue'
export { useWorkoutSession } from './useWorkoutSession'

export function WorkoutSessionProvider({ children }) {
  const { user } = useAuth()

  const [activeSession, setActiveSession] = useState(null)
  const [timerTick, setTimerTick] = useState(() => Date.now())
  const [isLoaded, setIsLoaded] = useState(false)

  const syncTimeoutRef = useRef(null)
  const isFinishingRef = useRef(false)
  const hasCompletedInitialLoadRef = useRef(false)
  const lastRemotePollRef = useRef(0)
  const lastRemoteSaveHashRef = useRef('')

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

    const nextHash = getSessionSyncHash(session)

    if (nextHash && nextHash === lastRemoteSaveHashRef.current) {
      return true
    }

    try {
      await apiFetch(ACTIVE_SESSION_ENDPOINT, {
        method: 'PUT',
        body: JSON.stringify({ session }),
      })

      lastRemoteSaveHashRef.current = nextHash

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

      if (!user) {
        setActiveSession(null)
        hasCompletedInitialLoadRef.current = true
        setIsLoaded(true)
        return
      }

      const savedSession = getUserStorageData(user, ACTIVE_SESSION_STORAGE_KEY, null)
      const remoteState = await fetchActiveSessionState()

      if (!isMounted) return

      const nextSession = remoteState.ok
        ? remoteState.session && !wasActiveSessionFinished(remoteState.session)
          ? remoteState.session
          : null
        : savedSession && !wasActiveSessionFinished(savedSession)
          ? savedSession
          : null

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
    }, 1500)

    return () => {
      window.clearTimeout(syncTimeoutRef.current)
    }
  }, [activeSession, isLoaded, user])

  useEffect(() => {
    if (!isLoaded || !user) return undefined

    let isMounted = true

    async function pollRemoteActiveSession({ force = false } = {}) {
      if (isFinishingRef.current) return
      if (document.visibilityState === 'hidden') return

      const now = Date.now()
      const minDelay = activeSession ? 30000 : 120000

      if (!force && now - lastRemotePollRef.current < minDelay) {
        return
      }

      lastRemotePollRef.current = now

      const remoteState = await fetchActiveSessionState()

      if (!isMounted || !remoteState.ok) return

      applyRemoteSession(remoteState.session)
    }

    function handleFocusSync() {
      pollRemoteActiveSession({ force: true })
    }

    function handleVisibilitySync() {
      if (document.visibilityState === 'visible') {
        pollRemoteActiveSession({ force: true })
      }
    }

    pollRemoteActiveSession({ force: true })

    const intervalId = window.setInterval(() => {
      pollRemoteActiveSession()
    }, activeSession ? 30000 : 120000)

    window.addEventListener('focus', handleFocusSync)
    document.addEventListener('visibilitychange', handleVisibilitySync)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocusSync)
      document.removeEventListener('visibilitychange', handleVisibilitySync)
    }
  }, [activeSession, isLoaded, user])

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
    if (!activeSession?.startedAt) return undefined

    const interval = window.setInterval(() => {
      setTimerTick(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [activeSession?.startedAt])

  const elapsedSeconds = activeSession?.startedAt
    ? Math.max(
      0,
      Math.floor((timerTick - new Date(activeSession.startedAt).getTime()) / 1000)
    )
    : 0

  function startSession(workout) {
    const session = createWorkoutSession(workout)

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

  function addExerciseToSession(newExercise) {
    if (!newExercise) return null

    const sessionExerciseId = safeCryptoId()

    setActiveSession((current) => {
      if (!current) return current

      const baseSets = Array.isArray(newExercise.sets) && newExercise.sets.length > 0
        ? newExercise.sets
        : [
          { type: 'working', description: 'Série 1' },
          { type: 'working', description: 'Série 2' },
          { type: 'working', description: 'Série 3' },
        ]

      let workingSetNumber = 0

      return markSessionUpdated({
        ...current,
        exercises: [
          ...current.exercises,
          {
            id: sessionExerciseId,
            originalExerciseId: newExercise.id || newExercise._id || '',
            exercise: newExercise,
            skipped: false,
            restTimer: 'Desligado',
            sets: baseSets.map((set) => {
              const type = set.type === 'warmup' ? 'warmup' : 'working'

              if (type !== 'warmup') {
                workingSetNumber += 1
              }

              return {
                id: safeCryptoId(),
                plannedDescription: set.description || (type === 'warmup' ? 'Aquecimento' : `Série ${workingSetNumber}`),
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
          },
        ],
      })
    })

    return sessionExerciseId
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

  async function finishSession(options = {}) {
    if (!activeSession) return null

    isFinishingRef.current = true
    window.clearTimeout(syncTimeoutRef.current)

    const history = getUserStorageData(user, 'history', [])
    const finishedDurationSeconds = Math.max(
      0,
      Math.round(Number(options.durationSeconds ?? elapsedSeconds) || 0)
    )

    const finishedSession = {
      ...activeSession,
      finishedAt: nowIso(),
      duration: finishedDurationSeconds,
      durationSeconds: finishedDurationSeconds,
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
        location: options.location || null,
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
      location: options.location || null,
      session: {
        ...finishedSession,
        location: options.location || null,
      },
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

      saveUserStorageData(user, 'history', [{ ...finishedSession, location: options.location || null }, ...history])

      rememberFinishedActiveSession(finishedSession.id)
      persistActiveSessionLocally(null)
      setActiveSession(null)

      await clearActiveSessionFromApi()

      return { ...finishedSession, location: options.location || null }
    } finally {
      window.setTimeout(() => {
        isFinishingRef.current = false
      }, 1200)
    }
  }

  const completedSets = useMemo(() => {
    return countCompletedWorkingSets(activeSession)
  }, [activeSession])

  const totalSets = useMemo(() => {
    return countTotalWorkingSets(activeSession)
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
        addExerciseToSession,
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
