import { useDeferredValue, useMemo } from 'react'

import { getWorkoutId } from '../../../utils/workoutNormalizers'

const MAX_QUICK_EXERCISES_VISIBLE = 80

function getComparableDateValue(item) {
    const date = new Date(item?.updatedAt || item?.createdAt || 0)

    return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

function formatRecentExerciseDate(dateString) {
    if (!dateString) return ''

    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
    })
}

export function useWorkoutDerivedData({
    exercises,
    history,
    workoutTemplates,
    workouts,
    workoutExercises,
    quickSearch,
    quickGroupFilter,
    quickEquipmentFilter,
    quickFavoritesOnly,
    selectedFolderId,
    showAllWorkouts,
    workoutsVisibleLimit,
}) {
    const exerciseLibraryStats = useMemo(() => {
        const groups = new Set()
        const equipment = new Set()
        let favorites = 0
        let hasForgeFlowSource = false

        exercises.forEach((exercise) => {
            if (exercise.muscleGroup) groups.add(exercise.muscleGroup)
            if (exercise.equipment) equipment.add(exercise.equipment)
            if (exercise.isFavorite) favorites += 1
            if (exercise.source === 'ForgeFlow') hasForgeFlowSource = true
        })

        return {
            muscleGroups: Array.from(groups).sort(),
            equipmentList: Array.from(equipment).sort(),
            favoriteExercisesCount: favorites,
            hasImportedLibrary: hasForgeFlowSource,
        }
    }, [exercises])

    const sortedWorkoutTemplates = useMemo(() => {
        return workoutTemplates
            .slice()
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1

                return getComparableDateValue(b) - getComparableDateValue(a)
            })
    }, [workoutTemplates])

    const hasEmptyDefaultTemplates = useMemo(() => {
        return workoutTemplates.some((template) => {
            return (
                template.source === 'ForgeFlow' &&
                (!template.exercises || template.exercises.length === 0)
            )
        })
    }, [workoutTemplates])

    const hasDefaultTemplates = useMemo(() => {
        return workoutTemplates.some((template) => template.source === 'ForgeFlow')
    }, [workoutTemplates])

    const recentExerciseMap = useMemo(() => {
        const map = new Map()

        history.forEach((session) => {
            const finishedAt = session.finishedAt || session.createdAt

            session.exercises?.forEach((item) => {
                const exercise = item.exercise

                if (!exercise?.name) return

                const key = String(exercise.id || exercise._id || exercise.name)
                const current = map.get(key)

                const totalUses = (current?.totalUses || 0) + 1
                const currentDate = current?.lastUsedAt
                    ? new Date(current.lastUsedAt)
                    : null
                const nextDate = finishedAt ? new Date(finishedAt) : null

                map.set(key, {
                    totalUses,
                    lastUsedAt:
                        !currentDate || (nextDate && nextDate > currentDate)
                            ? finishedAt
                            : current?.lastUsedAt,
                })

                const nameKey = String(exercise.name).toLowerCase()
                const currentByName = map.get(nameKey)

                map.set(nameKey, {
                    totalUses: (currentByName?.totalUses || 0) + 1,
                    lastUsedAt:
                        !currentByName?.lastUsedAt ||
                            (nextDate && nextDate > new Date(currentByName.lastUsedAt))
                            ? finishedAt
                            : currentByName.lastUsedAt,
                })
            })
        })

        return map
    }, [history])

    const deferredQuickSearch = useDeferredValue(quickSearch)

    const indexedExercises = useMemo(() => {
        return exercises.map((exercise) => {
            const recentInfo =
                recentExerciseMap.get(String(exercise.id || exercise._id)) ||
                recentExerciseMap.get(String(exercise.name || '').toLowerCase()) ||
                null
            const recentTime = recentInfo?.lastUsedAt
                ? new Date(recentInfo.lastUsedAt).getTime()
                : 0

            return {
                ...exercise,
                __recentInfo: recentInfo,
                __recentTime: Number.isNaN(recentTime) ? 0 : recentTime,
                __searchText: normalizeSearchText(
                    `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment} ${exercise.originalName || ''}`
                ),
                __sortName: String(exercise.name || '').toLocaleLowerCase('pt-BR'),
            }
        })
    }, [exercises, recentExerciseMap])

    const sortedExercisesForSelect = useMemo(() => {
        return indexedExercises
            .slice()
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1

                return a.__sortName.localeCompare(b.__sortName, 'pt-BR')
            })
    }, [indexedExercises])

    const filteredQuickExercises = useMemo(() => {
        const normalizedSearch = normalizeSearchText(deferredQuickSearch)

        return indexedExercises
            .filter((exercise) => {
                const matchesSearch = normalizedSearch
                    ? exercise.__searchText.includes(normalizedSearch)
                    : true

                const matchesGroup = quickGroupFilter
                    ? exercise.muscleGroup === quickGroupFilter
                    : true

                const matchesEquipment = quickEquipmentFilter
                    ? exercise.equipment === quickEquipmentFilter
                    : true

                const matchesFavorite = quickFavoritesOnly
                    ? exercise.isFavorite === true
                    : true

                return (
                    matchesSearch &&
                    matchesGroup &&
                    matchesEquipment &&
                    matchesFavorite
                )
            })
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1

                if (a.__recentTime !== b.__recentTime) {
                    return b.__recentTime - a.__recentTime
                }

                return a.__sortName.localeCompare(b.__sortName, 'pt-BR')
            })
    }, [
        indexedExercises,
        deferredQuickSearch,
        quickGroupFilter,
        quickEquipmentFilter,
        quickFavoritesOnly,
    ])

    const visibleQuickExercises = useMemo(() => {
        return filteredQuickExercises.slice(0, MAX_QUICK_EXERCISES_VISIBLE)
    }, [filteredQuickExercises])

    const workoutListMetaMap = useMemo(() => {
        const map = new Map()

        workouts.forEach((workout) => {
            const workoutId = getWorkoutId(workout)
            const groups = new Set()
            const exerciseNames = []

            ;(workout.exercises || []).forEach((item) => {
                const exercise = item.exercise || {}

                if (exercise.muscleGroup) groups.add(exercise.muscleGroup)
                if (exercise.name) {
                    exerciseNames.push(`${exercise.name} (${exercise.equipment || 'sem equipamento'})`)
                }
            })

            map.set(workoutId, {
                muscleGroups: Array.from(groups),
                exerciseNames: exerciseNames.join(', '),
            })
        })

        return map
    }, [workouts])

    const folderWorkoutCounts = useMemo(() => {
        const counts = new Map()

        workouts.forEach((workout) => {
            if (!workout.folderId) return

            counts.set(workout.folderId, (counts.get(workout.folderId) || 0) + 1)
        })

        return counts
    }, [workouts])

    const totalExercisesInSavedWorkouts = useMemo(() => {
        return workouts.reduce((total, workout) => total + (workout.exercises?.length || 0), 0)
    }, [workouts])

    const totalSetsInCurrentWorkout = useMemo(() => {
        return workoutExercises.reduce((total, item) => total + (item.sets?.length || 0), 0)
    }, [workoutExercises])

    const filteredWorkouts = useMemo(() => {
        return workouts
            .filter((workout) =>
                selectedFolderId ? workout.folderId === selectedFolderId : true
            )
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1

                return getComparableDateValue(b) - getComparableDateValue(a)
            })
    }, [workouts, selectedFolderId])

    const visibleWorkouts = useMemo(() => {
        const limit = Number(workoutsVisibleLimit) || 5

        if (showAllWorkouts) return filteredWorkouts

        return filteredWorkouts.slice(0, limit)
    }, [filteredWorkouts, showAllWorkouts, workoutsVisibleLimit])

    return {
        ...exerciseLibraryStats,
        sortedWorkoutTemplates,
        hasEmptyDefaultTemplates,
        hasDefaultTemplates,
        sortedExercisesForSelect,
        filteredQuickExercises,
        visibleQuickExercises,
        workoutListMetaMap,
        folderWorkoutCounts,
        totalExercisesInSavedWorkouts,
        totalSetsInCurrentWorkout,
        filteredWorkouts,
        visibleWorkouts,
        formatRecentExerciseDate,
    }
}
