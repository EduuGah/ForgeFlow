function sanitizeString(value, maxLength = 160) {
    if (typeof value !== 'string') return ''

    return value
        .trim()
        .replace(/[<>]/g, '')
        .slice(0, maxLength)
}

function safeNumber(value, fallback = 0, { min = 0, max = 1000000 } = {}) {
    const number = Number(value)

    if (!Number.isFinite(number)) return fallback

    return Math.min(max, Math.max(min, number))
}

function safeDate(value, fallback = null) {
    if (!value) return fallback

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return fallback

    return date
}

function normalizeSet(set = {}, index = 0) {
    const weight = safeNumber(set.weight ?? set.load ?? 0, 0, {
        min: 0,
        max: 2000,
    })

    const reps = safeNumber(set.reps ?? set.repetitions ?? 0, 0, {
        min: 0,
        max: 10000,
    })

    const completed = Boolean(set.completed || set.isCompleted || set.done)
    const type = set.type === 'warmup' || set.isWarmup || set.warmup
        ? 'warmup'
        : 'working'

    return {
        ...set,
        id: sanitizeString(String(set.id || set._id || `set-${index + 1}`), 80),
        description: sanitizeString(set.description || set.label || '', 80),
        weight,
        reps,
        completed,
        type,
        volume: completed ? weight * reps : 0,
    }
}

function getExerciseName(exercise = {}, fallback = '') {
    return sanitizeString(
        exercise.exercise?.name ||
        exercise.exerciseName ||
        exercise.name ||
        exercise.title ||
        fallback,
        120
    )
}

function normalizeExercise(exercise = {}, index = 0) {
    const name = getExerciseName(exercise, `Exercício ${index + 1}`)
    const sets = Array.isArray(exercise.sets)
        ? exercise.sets.slice(0, 100).map(normalizeSet)
        : []

    const safeExercise = typeof exercise.exercise === 'object' && exercise.exercise
        ? {
            ...exercise.exercise,
            id: sanitizeString(String(exercise.exercise.id || exercise.exercise._id || ''), 80),
            name,
            muscleGroup: sanitizeString(exercise.exercise.muscleGroup || '', 80),
            equipment: sanitizeString(exercise.exercise.equipment || '', 80),
            instructions: sanitizeString(exercise.exercise.instructions || '', 1500),
            tips: sanitizeString(exercise.exercise.tips || '', 1500),
        }
        : {
            name,
        }

    return {
        ...exercise,
        id: sanitizeString(String(exercise.id || exercise._id || `exercise-${index + 1}`), 80),
        exerciseName: name,
        exercise: safeExercise,
        note: sanitizeString(exercise.note || exercise.notes || '', 1000),
        restTimer: sanitizeString(String(exercise.restTimer || ''), 40),
        sets,
    }
}


function normalizeWorkoutLocation(input = null) {
    if (!input || typeof input !== 'object') return null

    const latitude = Number(input.latitude)
    const longitude = Number(input.longitude)

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null

    const accuracy = Number(input.accuracy)

    return {
        enabled: true,
        label: sanitizeString(input.label || input.name || '', 60),
        latitude,
        longitude,
        accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null,
        capturedAt: safeDate(input.capturedAt, new Date()),
    }
}

export function normalizeWorkoutHistoryPayload(input = {}) {
    const exercises = Array.isArray(input.exercises)
        ? input.exercises.slice(0, 80).map(normalizeExercise)
        : []

    const workoutName = sanitizeString(
        input.workoutName || input.name || 'Treino',
        120
    )

    return {
        workoutId: input.workoutId || null,
        workoutName,
        name: workoutName,
        exercises,
        durationSeconds: safeNumber(input.durationSeconds || input.duration || 0, 0, {
            min: 0,
            max: 60 * 60 * 12,
        }),
        startedAt: safeDate(input.startedAt, null),
        finishedAt: safeDate(input.finishedAt, new Date()),
        notes: sanitizeString(input.notes || '', 2000),
        location: normalizeWorkoutLocation(input.location || input.session?.location || null),
    }
}

export function validateWorkoutHistoryPayload(input = {}) {
    const normalized = normalizeWorkoutHistoryPayload(input)

    if (!normalized.workoutName) {
        return {
            valid: false,
            message: 'Informe o nome do treino.',
        }
    }

    if (!Array.isArray(normalized.exercises) || normalized.exercises.length === 0) {
        return {
            valid: false,
            message: 'O treino precisa ter pelo menos um exercício.',
        }
    }

    const hasValidSet = normalized.exercises.some((exercise) =>
        exercise.sets.some((set) => set.completed && set.reps > 0)
    )

    if (!hasValidSet) {
        return {
            valid: false,
            message: 'Finalize pelo menos uma série com repetições.',
        }
    }

    return {
        valid: true,
        value: normalized,
    }
}

export function normalizeActiveWorkoutPayload(input = {}) {
    const normalized = normalizeWorkoutHistoryPayload(input)

    return {
        ...input,
        ...normalized,
        id: sanitizeString(String(input.id || ''), 80),
        workoutName: normalized.workoutName || sanitizeString(input.name || 'Treino em andamento', 120),
        startedAt: safeDate(input.startedAt, new Date()),
        updatedAt: safeDate(input.updatedAt || input.savedAt, new Date()),
    }
}

export function normalizeBackupPayload(backup = {}) {
    if (!backup || backup.app !== 'ForgeFlow' || !backup.data) {
        return {
            valid: false,
            message: 'Arquivo de backup inválido.',
        }
    }

    const data = backup.data || {}

    return {
        valid: true,
        value: {
            ...backup,
            data: {
                exercises: Array.isArray(data.exercises) ? data.exercises.slice(0, 1000) : [],
                workouts: Array.isArray(data.workouts) ? data.workouts.slice(0, 1000) : [],
                workoutHistory: Array.isArray(data.workoutHistory)
                    ? data.workoutHistory.slice(0, 3000).map(normalizeWorkoutHistoryPayload)
                    : [],
                bodyWeight: Array.isArray(data.bodyWeight) ? data.bodyWeight.slice(0, 3000) : [],
                workoutTemplates: Array.isArray(data.workoutTemplates) ? data.workoutTemplates.slice(0, 1000) : [],
                progressPhotos: Array.isArray(data.progressPhotos) ? data.progressPhotos.slice(0, 1000) : [],
                goals: Array.isArray(data.goals) ? data.goals.slice(0, 1000) : [],
                notifications: Array.isArray(data.notifications) ? data.notifications.slice(0, 2000) : [],
            },
        },
    }
}
