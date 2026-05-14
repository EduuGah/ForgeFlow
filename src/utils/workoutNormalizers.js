export function getWorkoutId(workout) {
    return workout?._id || workout?.id
}

export function normalizeHistoryFromApi(session) {
    return {
        ...session,
        id: session._id || session.id,
        duration: session.durationSeconds ?? session.duration ?? 0,
        workoutName: session.workoutName || session.name || 'Treino',
        exercises: Array.isArray(session.exercises) ? session.exercises : [],
        finishedAt: session.finishedAt || session.createdAt,
    }
}

export function normalizeWorkoutTemplateFromApi(template) {
    return {
        ...template,
        id: template._id || template.id,
        exercises: Array.isArray(template.exercises) ? template.exercises : [],
        isFavorite: Boolean(template.isFavorite),
    }
}

export function normalizeWorkoutFromApi(workout) {
    return {
        ...workout,
        id: workout._id || workout.id,
        folderId: workout.folderId || null,
        exercises: Array.isArray(workout.exercises) ? workout.exercises : [],
    }
}
