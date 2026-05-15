import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import MuscleRecoveryPageSections from '../features/muscleRecovery/components/MuscleRecoveryPageSections'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'

import {
    getCalendarDayDiff,
    getRecoveryStateByDayDiff,
} from '../features/muscleRecovery/muscleRecoveryUtils'

function MuscleRecovery() {
    const { user } = useAuth()

    const [recovery, setRecovery] = useState([])
    const [loading, setLoading] = useState(true)
    const [source, setSource] = useState('database')
    const [search, setSearch] = useState('')
    const deferredSearch = useDeferredValue(search)
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        if (!user) return undefined

        let isMounted = true

        async function loadRecovery() {
            setLoading(true)

            try {
                const data = await apiFetch('/stats/muscle-recovery')

                if (!isMounted) return

                const normalizedRecovery = Array.isArray(data?.recovery)
                    ? data.recovery.map((item) => {
                        const state = getRecoveryStateByDayDiff(getCalendarDayDiff(item.lastTrainedAt))
                        return {
                            ...item,
                            level: item.lastTrainedAt ? state.level : (item.level || 'unknown'),
                            recoveryPercent: item.lastTrainedAt ? state.recoveryPercent : Number(item.recoveryPercent || 0),
                        }
                    })
                    : []

                setRecovery(normalizedRecovery)
                setSource('database')
            } catch (error) {
                console.error(error)

                if (isMounted) {
                    setRecovery([])
                    setSource('local')
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadRecovery()

        return () => {
            isMounted = false
        }
    }, [user])

    const filteredRecovery = useMemo(() => {
        const term = deferredSearch.toLowerCase().trim()

        return recovery
            .filter((item) => {
                const matchesSearch = term
                    ? String(item.muscleGroup || '').toLowerCase().includes(term)
                    : true

                const matchesStatus = statusFilter
                    ? item.level === statusFilter
                    : true

                return matchesSearch && matchesStatus
            })
            .sort((a, b) => {
                if (a.level === 'unknown' && b.level !== 'unknown') return 1
                if (a.level !== 'unknown' && b.level === 'unknown') return -1

                return a.recoveryPercent - b.recoveryPercent
            })
    }, [recovery, deferredSearch, statusFilter])

    const readyMuscles = useMemo(() => {
        return recovery.filter((item) => item.level === 'ready')
    }, [recovery])

    const recoveringMuscles = useMemo(() => {
        return recovery.filter((item) => item.level === 'low' || item.level === 'medium')
    }, [recovery])

    const averageRecovery = useMemo(() => {
        if (recovery.length === 0) return 0

        const total = recovery.reduce((sum, item) => {
            return sum + Number(item.recoveryPercent || 0)
        }, 0)

        return Math.round(total / recovery.length)
    }, [recovery])

    const nextSuggestedMuscles = useMemo(() => {
        return recovery
            .filter((item) => item.level === 'ready' || item.level === 'good')
            .slice()
            .sort((a, b) => b.recoveryPercent - a.recoveryPercent)
            .slice(0, 5)
    }, [recovery])

    function clearFilters() {
        setSearch('')
        setStatusFilter('')
    }

    return (
        <MuscleRecoveryPageSections
            source={source}
            loading={loading}
            recovery={recovery}
            averageRecovery={averageRecovery}
            readyMuscles={readyMuscles}
            recoveringMuscles={recoveringMuscles}
            nextSuggestedMuscles={nextSuggestedMuscles}
            filteredRecovery={filteredRecovery}
            search={search}
            statusFilter={statusFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onClearFilters={clearFilters}
        />
    )
}

export default MuscleRecovery
