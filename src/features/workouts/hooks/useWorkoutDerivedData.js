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


function parseWorkoutNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value

    const normalized = String(value || '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '')

    const parsed = Number(normalized)

    return Number.isFinite(parsed) ? parsed : 0
}

function getSessionSets(session) {
    const directSets = parseWorkoutNumber(session?.totalSets)
    if (directSets > 0) return directSets

    return (session?.exercises || []).reduce((exerciseTotal, item) => {
        const sets = Array.isArray(item?.sets) ? item.sets : []
        return exerciseTotal + sets.length
    }, 0)
}

function calculateSessionVolume(session) {
    const directVolume = parseWorkoutNumber(session?.totalVolume)
    if (directVolume > 0) return directVolume

    return (session?.exercises || []).reduce((exerciseTotal, item) => {
        const sets = Array.isArray(item?.sets) ? item.sets : []

        return exerciseTotal + sets.reduce((setTotal, set) => {
            const weight = parseWorkoutNumber(set?.weight ?? set?.kg ?? set?.load)
            const reps = parseWorkoutNumber(set?.reps ?? set?.repetitions)

            return setTotal + weight * reps
        }, 0)
    }, 0)
}

function buildWorkoutPerformanceEntry(sessions) {
    if (!sessions.length) return null

    const orderedSessions = sessions
        .slice()
        .sort((a, b) => getComparableDateValue(b) - getComparableDateValue(a))

    const totals = sessions.reduce(
        (acc, session) => {
            const duration = parseWorkoutNumber(session?.durationSeconds ?? session?.duration)
            const volume = calculateSessionVolume(session)
            const sets = getSessionSets(session)

            acc.duration += duration
            acc.volume += volume
            acc.sets += sets
            acc.bestVolume = Math.max(acc.bestVolume, volume)

            return acc
        },
        { duration: 0, volume: 0, sets: 0, bestVolume: 0 }
    )

    const totalSessions = sessions.length
    const lastSession = orderedSessions[0]

    return {
        totalSessions,
        lastFinishedAt: lastSession?.finishedAt || lastSession?.createdAt || null,
        avgDurationSeconds: Math.round(totals.duration / totalSessions),
        avgVolume: Math.round(totals.volume / totalSessions),
        avgSets: Math.round(totals.sets / totalSessions),
        bestVolume: Math.round(totals.bestVolume),
    }
}

function getWorkoutVolumeSignal({ totalSets, groupsCount, dominantGroupSets }) {
    if (totalSets >= 28) {
        return {
            tone: 'danger',
            label: 'Muito volumoso',
            detail: 'Considere dividir ou reduzir séries se a recuperação estiver ruim.',
        }
    }

    if (totalSets >= 22 || dominantGroupSets >= 14) {
        return {
            tone: 'warning',
            label: 'Volume alto',
            detail: 'Bom treino, mas fique atento à fadiga do músculo principal.',
        }
    }

    if (groupsCount >= 4 && totalSets >= 16) {
        return {
            tone: 'balanced',
            label: 'Bem distribuído',
            detail: 'Rotina com grupos variados e volume moderado.',
        }
    }

    return {
        tone: 'good',
        label: 'Volume ok',
        detail: 'Rotina enxuta para executar sem muito atrito.',
    }
}

export function useWorkoutDerivedData({
    exercises,
    history,
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

    const workoutPerformanceMap = useMemo(() => {
        const groupedSessions = new Map()

        function addSessionToKey(key, session) {
            if (!key) return

            const normalizedKey = String(key)
            const current = groupedSessions.get(normalizedKey) || []
            current.push(session)
            groupedSessions.set(normalizedKey, current)
        }

        history.forEach((session) => {
            addSessionToKey(session?.workoutId, session)
            addSessionToKey(normalizeSearchText(session?.workoutName || session?.name), session)
        })

        const map = new Map()

        groupedSessions.forEach((sessions, key) => {
            map.set(key, buildWorkoutPerformanceEntry(sessions))
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
            const groupSetCounts = new Map()
            let totalSets = 0

            ;(workout.exercises || []).forEach((item) => {
                const exercise = item.exercise || {}
                const setsCount = Array.isArray(item.sets) ? item.sets.length : 0
                const muscleGroup = exercise.muscleGroup || 'Sem grupo'

                totalSets += setsCount

                if (exercise.muscleGroup) groups.add(exercise.muscleGroup)
                if (exercise.name) {
                    exerciseNames.push(`${exercise.name} (${exercise.equipment || 'sem equipamento'})`)
                }

                groupSetCounts.set(
                    muscleGroup,
                    (groupSetCounts.get(muscleGroup) || 0) + setsCount
                )
            })

            const dominantGroup = Array.from(groupSetCounts.entries())
                .sort((a, b) => b[1] - a[1])[0]
            const performance =
                workoutPerformanceMap.get(String(workoutId || '')) ||
                workoutPerformanceMap.get(normalizeSearchText(workout.name)) ||
                null
            const volumeSignal = getWorkoutVolumeSignal({
                totalSets,
                groupsCount: groups.size,
                dominantGroupSets: dominantGroup?.[1] || 0,
            })

            map.set(workoutId, {
                muscleGroups: Array.from(groups),
                exerciseNames: exerciseNames.join(', '),
                totalSets,
                estimatedMinutes: Math.max(15, Math.round(totalSets * 2.4)),
                dominantGroup: dominantGroup?.[0] || '',
                dominantGroupSets: dominantGroup?.[1] || 0,
                performance,
                volumeSignal,
            })
        })

        return map
    }, [workouts, workoutPerformanceMap])

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

    const workoutSpotlight = useMemo(() => {
        if (workouts.length === 0) return null

        return workouts
            .slice()
            .sort((a, b) => {
                const aId = getWorkoutId(a)
                const bId = getWorkoutId(b)
                const aPerformance =
                    workoutPerformanceMap.get(String(aId || '')) ||
                    workoutPerformanceMap.get(normalizeSearchText(a.name))
                const bPerformance =
                    workoutPerformanceMap.get(String(bId || '')) ||
                    workoutPerformanceMap.get(normalizeSearchText(b.name))

                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1
                if (!aPerformance && bPerformance) return -1
                if (aPerformance && !bPerformance) return 1

                const aLast = aPerformance?.lastFinishedAt ? new Date(aPerformance.lastFinishedAt).getTime() : 0
                const bLast = bPerformance?.lastFinishedAt ? new Date(bPerformance.lastFinishedAt).getTime() : 0

                return (Number.isNaN(aLast) ? 0 : aLast) - (Number.isNaN(bLast) ? 0 : bLast)
            })[0]
    }, [workouts, workoutPerformanceMap])

    const workoutHighlights = useMemo(() => {
        return workouts
            .slice()
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1

                return getComparableDateValue(b) - getComparableDateValue(a)
            })
            .slice(0, 5)
    }, [workouts])

    return {
        ...exerciseLibraryStats,
        sortedExercisesForSelect,
        filteredQuickExercises,
        visibleQuickExercises,
        workoutListMetaMap,
        workoutPerformanceMap,
        workoutSpotlight,
        workoutHighlights,
        folderWorkoutCounts,
        totalExercisesInSavedWorkouts,
        totalSetsInCurrentWorkout,
        filteredWorkouts,
        visibleWorkouts,
        formatRecentExerciseDate,
    }
}
