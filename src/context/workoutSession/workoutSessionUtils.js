export const ACTIVE_SESSION_STORAGE_KEY = 'active-session'
export const ACTIVE_SESSION_ENDPOINT = '/active-workout'
export const ACTIVE_SESSION_FINISH_ENDPOINT = '/active-workout/finish'
export const FINISHED_ACTIVE_SESSION_IDS_KEY = 'forgeflow:finished-active-session-ids'

export function nowIso() {
  return new Date().toISOString()
}

export function getTimestamp(value) {
  const timestamp = new Date(value || 0).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

export function safeCryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function isMongoId(value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
}

export function getSessionSyncHash(session) {
  if (!session) return ''

  try {
    return JSON.stringify({
      id: session.id,
      workoutId: session.workoutId,
      name: session.workoutName || session.name,
      exercises: (session.exercises || []).map((exercise) => ({
        id: exercise.id || exercise.exercise?.id || exercise.exercise?._id,
        name: exercise.exercise?.name || exercise.name,
        sets: (exercise.sets || []).map((set) => ({
          id: set.id,
          weight: set.weight,
          reps: set.reps,
          completed: set.completed,
          type: set.type,
          notes: set.notes || set.note || '',
        })),
      })),
      notes: session.notes || '',
    })
  } catch {
    return `${Date.now()}`
  }
}

export function getFinishedActiveSessionIds() {
  try {
    const rawValue = window.localStorage.getItem(FINISHED_ACTIVE_SESSION_IDS_KEY)
    const ids = JSON.parse(rawValue || '[]')

    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

export function rememberFinishedActiveSession(sessionId) {
  if (!sessionId) return

  const ids = getFinishedActiveSessionIds()
  const nextIds = [sessionId, ...ids.filter((id) => id !== sessionId)].slice(0, 30)

  window.localStorage.setItem(FINISHED_ACTIVE_SESSION_IDS_KEY, JSON.stringify(nextIds))
}

export function wasActiveSessionFinished(session) {
  if (!session?.id) return false

  return getFinishedActiveSessionIds().includes(session.id)
}

export function normalizeHistoryFromApi(session) {
  const payload = session?.session || session

  return {
    ...payload,
    id: payload?._id || payload?.id || safeCryptoId(),
    duration: payload?.durationSeconds ?? payload?.duration ?? 0,
    workoutName: payload?.workoutName || payload?.name || 'Treino',
    exercises: Array.isArray(payload?.exercises) ? payload.exercises : [],
  }
}

export function normalizeActiveSession(response) {
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

export function markSessionUpdated(session) {
  if (!session) return session

  return {
    ...session,
    updatedAt: nowIso(),
  }
}

export function getExerciseDataFromSessionExercise(sessionExercise = {}) {
  if (sessionExercise.exercise && typeof sessionExercise.exercise === 'object') {
    return sessionExercise.exercise
  }

  return sessionExercise
}

export function getExerciseNameFromSessionExercise(sessionExercise = {}) {
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

export function getExerciseMuscleGroupFromSessionExercise(sessionExercise = {}) {
  const exercise = getExerciseDataFromSessionExercise(sessionExercise)

  return (
    exercise.muscleGroup ||
    exercise.group ||
    sessionExercise.muscleGroup ||
    sessionExercise.group ||
    ''
  )
}

export function normalizeSessionExerciseForHistory(sessionExercise = {}) {
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

export function getSessionPrs(session) {
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

export function isWarmupSet(set) {
  return set.type === 'warmup'
}

export function isWorkingSet(set) {
  return set.type !== 'warmup'
}

export function renumberExerciseSets(sets = []) {
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

export function createWorkoutSession(workout) {
  return markSessionUpdated({
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
}



function getHistoryExerciseData(historyExercise = {}) {
  if (historyExercise.exercise && typeof historyExercise.exercise === 'object') {
    return historyExercise.exercise
  }

  return historyExercise
}

export function createWorkoutSessionFromHistory(historySession = {}) {
  const sessionExercises = Array.isArray(historySession.exercises)
    ? historySession.exercises
    : []

  return markSessionUpdated({
    id: safeCryptoId(),
    workoutId: historySession.workoutId || historySession.id || '',
    workoutName: `${historySession.workoutName || historySession.name || 'Treino'} novamente`,
    repeatedFromSessionId: historySession.id || historySession._id || '',
    startedAt: nowIso(),
    notes: '',
    exercises: sessionExercises.map((historyExercise) => {
      const exerciseData = getHistoryExerciseData(historyExercise)
      let workingSetNumber = 0
      const sets = Array.isArray(historyExercise.sets) ? historyExercise.sets : []

      return {
        id: safeCryptoId(),
        originalExerciseId:
          exerciseData.id ||
          exerciseData._id ||
          historyExercise.originalExerciseId ||
          historyExercise.exerciseId ||
          '',
        exercise: {
          ...exerciseData,
          id:
            exerciseData.id ||
            exerciseData._id ||
            historyExercise.originalExerciseId ||
            historyExercise.exerciseId ||
            '',
          name:
            exerciseData.name ||
            exerciseData.exerciseName ||
            historyExercise.exerciseName ||
            historyExercise.name ||
            'Exercício sem nome',
          muscleGroup:
            exerciseData.muscleGroup ||
            exerciseData.group ||
            historyExercise.muscleGroup ||
            historyExercise.group ||
            '',
        },
        skipped: false,
        restTimer: historyExercise.restTimer || 'Desligado',
        sets: sets.map((previousSet) => {
          const type = previousSet.type || 'working'

          if (type !== 'warmup') {
            workingSetNumber += 1
          }

          return {
            id: safeCryptoId(),
            plannedDescription: previousSet.plannedDescription || previousSet.description || '',
            type,
            setNumber: type === 'warmup' ? null : workingSetNumber,
            weight: previousSet.weight || '',
            reps: previousSet.reps || '',
            completed: false,
            isPR: false,
            isWeightPR: false,
            isVolumePR: false,
          }
        }),
      }
    }),
  })
}

export function countCompletedWorkingSets(session) {
  if (!session) return 0

  return session.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter((set) => set.completed && isWorkingSet(set)).length
  }, 0)
}

export function countTotalWorkingSets(session) {
  if (!session) return 0

  return session.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter((set) => isWorkingSet(set)).length
  }, 0)
}
