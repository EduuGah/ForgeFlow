import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    Flame,
    Timer,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
    getUserStorageData,
    saveUserStorageData,
} from '../utils/userStorage'

function normalizeHistoryFromApi(session) {
    return {
        ...session,
        id: session._id || session.id,
        duration: session.durationSeconds ?? session.duration ?? 0,
        workoutName: session.workoutName || session.name || 'Treino',
        exercises: Array.isArray(session.exercises) ? session.exercises : [],
        finishedAt: session.finishedAt || session.createdAt,
    }
}

function getDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function formatMonthTitle(date) {
    return date.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    })
}

function formatShortDate(dateString) {
    if (!dateString) return 'Sem data'

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [, month, day] = dateString.split('-')

        return `${day}/${month}`
    }

    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
    })
}

function formatDuration(seconds) {
    const totalSeconds = Number(seconds) || 0
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (hours > 0) return `${hours}h ${minutes}min`

    return `${minutes}min`
}

function getMonthDays(currentDate) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startWeekDay = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days = []

    for (let index = 0; index < startWeekDay; index += 1) {
        days.push(null)
    }

    for (let day = 1; day <= totalDays; day += 1) {
        days.push(new Date(year, month, day))
    }

    return days
}

function getCompletedSetsFromSession(session) {
    return session.exercises.flatMap((exercise) =>
        exercise.sets?.filter((set) => {
            return (
                set.type !== 'warmup' &&
                set.completed &&
                Number(set.weight) > 0 &&
                Number(set.reps) > 0
            )
        }) || []
    )
}

function getSessionVolume(session) {
    return getCompletedSetsFromSession(session).reduce((total, set) => {
        return total + Number(set.weight || 0) * Number(set.reps || 0)
    }, 0)
}

function WorkoutCalendar() {
    const { user } = useAuth()

    const [history, setHistory] = useState([])
    const [currentMonth, setCurrentMonth] = useState(() => new Date())
    const [selectedDate, setSelectedDate] = useState(getDateKey(new Date()))
    const [source, setSource] = useState('local')
    const [loading, setLoading] = useState(true)
    const [consistencyStats, setConsistencyStats] = useState({
        currentStreak: 0,
        bestStreak: 0,
        workoutsLast7Days: 0,
        workoutsLast30Days: 0,
        totalWorkoutDays: 0,
        lastWorkoutDate: null,
    })

    useEffect(() => {
        if (!user) return

        async function loadCalendarData() {
            setLoading(true)

            const cachedHistory = getUserStorageData(user, 'history', [])

            try {
                const [historyFromApi, consistencyFromApi] = await Promise.all([
                    apiFetch('/workout-history'),
                    apiFetch('/stats/consistency'),
                ])

                const normalizedHistory = Array.isArray(historyFromApi)
                    ? historyFromApi.map(normalizeHistoryFromApi)
                    : []

                const normalizedConsistency = {
                    currentStreak: Number(consistencyFromApi?.currentStreak) || 0,
                    bestStreak: Number(consistencyFromApi?.bestStreak) || 0,
                    workoutsLast7Days: Number(consistencyFromApi?.workoutsLast7Days) || 0,
                    workoutsLast30Days: Number(consistencyFromApi?.workoutsLast30Days) || 0,
                    totalWorkoutDays: Number(consistencyFromApi?.totalWorkoutDays) || 0,
                    lastWorkoutDate: consistencyFromApi?.lastWorkoutDate || null,
                }

                setHistory(normalizedHistory)
                setConsistencyStats(normalizedConsistency)

                saveUserStorageData(user, 'history', normalizedHistory)
                setSource('database')
            } catch (error) {
                console.error(error)

                setHistory(cachedHistory)
                setConsistencyStats({
                    currentStreak: 0,
                    bestStreak: 0,
                    workoutsLast7Days: 0,
                    workoutsLast30Days: 0,
                    totalWorkoutDays: 0,
                    lastWorkoutDate: null,
                })

                setSource('local')
            } finally {
                setLoading(false)
            }
        }

        loadCalendarData()
    }, [user])

    const sessionsByDate = useMemo(() => {
        const map = new Map()

        history.forEach((session) => {
            if (!session.finishedAt) return

            const date = new Date(session.finishedAt)

            if (Number.isNaN(date.getTime())) return

            const key = getDateKey(date)
            const current = map.get(key) || []

            map.set(key, [...current, session])
        })

        return map
    }, [history])

    const monthDays = useMemo(() => {
        return getMonthDays(currentMonth)
    }, [currentMonth])

    const selectedSessions = sessionsByDate.get(selectedDate) || []

    const monthSessions = useMemo(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()

        return history.filter((session) => {
            if (!session.finishedAt) return false

            const date = new Date(session.finishedAt)

            return date.getFullYear() === year && date.getMonth() === month
        })
    }, [history, currentMonth])

    const monthStats = useMemo(() => {
        const totalWorkouts = monthSessions.length

        const totalDuration = monthSessions.reduce((total, session) => {
            return total + Number(session.duration || session.durationSeconds || 0)
        }, 0)

        const totalVolume = monthSessions.reduce((total, session) => {
            return total + getSessionVolume(session)
        }, 0)

        return {
            totalWorkouts,
            totalDuration,
            totalVolume,
        }
    }, [monthSessions])

    function goToPreviousMonth() {
        setCurrentMonth((date) => {
            return new Date(date.getFullYear(), date.getMonth() - 1, 1)
        })
    }

    function goToNextMonth() {
        setCurrentMonth((date) => {
            return new Date(date.getFullYear(), date.getMonth() + 1, 1)
        })
    }

    function goToCurrentMonth() {
        const today = new Date()

        setCurrentMonth(today)
        setSelectedDate(getDateKey(today))
    }

    return (
        <>
            <PageHeader
                title="Calendário"
                description="Veja seus treinos finalizados organizados por dia."
                action={
                    <Badge variant={source === 'database' ? 'purple' : 'default'}>
                        {loading
                            ? 'Carregando...'
                            : source === 'database'
                                ? 'Sincronizado'
                                : 'Local'}
                    </Badge>
                }
            />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Treinos no mês</p>
                        <Dumbbell size={20} className="text-[var(--ff-accent-text)]" />
                    </div>

                    <h2 className="mt-2 text-3xl font-black">
                        {monthStats.totalWorkouts}
                    </h2>

                    <p className="mt-2 text-xs text-zinc-500">
                        finalizados
                    </p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Tempo no mês</p>
                        <Timer size={20} className="text-[var(--ff-accent-text)]" />
                    </div>

                    <h2 className="mt-2 text-2xl font-black">
                        {formatDuration(monthStats.totalDuration)}
                    </h2>

                    <p className="mt-2 text-xs text-zinc-500">
                        treinando
                    </p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Volume no mês</p>
                        <Flame size={20} className="text-orange-400" />
                    </div>

                    <h2 className="mt-2 text-2xl font-black text-orange-300">
                        {monthStats.totalVolume.toLocaleString('pt-BR')}kg
                    </h2>

                    <p className="mt-2 text-xs text-zinc-500">
                        peso × reps
                    </p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Streak atual</p>
                        <Flame size={20} className="text-orange-400" />
                    </div>

                    <h2 className="mt-2 text-3xl font-black text-orange-300">
                        {consistencyStats.currentStreak}
                    </h2>

                    <p className="mt-2 text-xs text-zinc-500">
                        {consistencyStats.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
                    </p>
                </Card>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <Card>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                                    <CalendarDays size={22} />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-black capitalize">
                                        {formatMonthTitle(currentMonth)}
                                    </h2>

                                    <p className="text-sm text-zinc-500">
                                        Clique em um dia para ver os treinos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:flex">
                            <button
                                type="button"
                                onClick={goToPreviousMonth}
                                className="flex h-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-zinc-300 transition hover:bg-zinc-900"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <button
                                type="button"
                                onClick={goToCurrentMonth}
                                className="flex h-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900"
                            >
                                Hoje
                            </button>

                            <button
                                type="button"
                                onClick={goToNextMonth}
                                className="flex h-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-zinc-300 transition hover:bg-zinc-900"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wide text-zinc-500">
                        <span>Dom</span>
                        <span>Seg</span>
                        <span>Ter</span>
                        <span>Qua</span>
                        <span>Qui</span>
                        <span>Sex</span>
                        <span>Sáb</span>
                    </div>

                    <div className="mt-3 grid grid-cols-7 gap-2">
                        {monthDays.map((date, index) => {
                            if (!date) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className="min-h-[64px] sm:min-h-[86px] rounded-2xl border border-transparent"
                                    />
                                )
                            }

                            const key = getDateKey(date)
                            const sessions = sessionsByDate.get(key) || []
                            const isSelected = selectedDate === key
                            const isToday = key === getDateKey(new Date())

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSelectedDate(key)}
                                    className={
                                        isSelected
                                            ? 'min-h-[64px] sm:min-h-[86px] rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]/15 p-2 text-left shadow-[0_0_18px_var(--ff-accent-shadow)]/20'
                                            : sessions.length > 0
                                                ? 'min-h-[64px] sm:min-h-[86px] rounded-2xl border border-zinc-800 bg-[#18181b] p-2 text-left transition hover:border-[var(--ff-accent-border)]/40 hover:bg-[#1f1f23]'
                                                : 'min-h-[64px] sm:min-h-[86px] rounded-2xl border border-zinc-900 bg-zinc-950/60 p-2 text-left transition hover:border-zinc-800 hover:bg-zinc-950'
                                    }
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={
                                                isToday
                                                    ? 'flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ff-accent)] text-sm font-black text-white'
                                                    : 'text-sm font-bold text-zinc-300'
                                            }
                                        >
                                            {date.getDate()}
                                        </span>

                                        {sessions.length > 0 && (
                                            <span className="rounded-full bg-[var(--ff-accent)] px-2 py-0.5 text-[10px] font-black text-white">
                                                {sessions.length}
                                            </span>
                                        )}
                                    </div>

                                    {sessions.length > 0 && (
                                        <div className="mt-3 hidden space-y-1 sm:block">
                                            {sessions.slice(0, 2).map((session) => (
                                                <div
                                                    key={session.id}
                                                    className="truncate rounded-lg bg-black/30 px-2 py-1 text-[10px] font-bold text-zinc-300"
                                                >
                                                    {session.workoutName}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold">
                                    Consistência
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Resumo geral da sua frequência.
                                </p>
                            </div>

                            <Badge>
                                {consistencyStats.totalWorkoutDays} dias
                            </Badge>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                                <p className="text-xs text-orange-100/70">
                                    Atual
                                </p>

                                <p className="mt-1 text-2xl font-black text-orange-300">
                                    {consistencyStats.currentStreak}
                                </p>

                                <p className="mt-1 text-xs text-orange-100/60">
                                    dia(s)
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-xs text-zinc-500">
                                    Melhor
                                </p>

                                <p className="mt-1 text-2xl font-black text-[var(--ff-accent-text)]">
                                    {consistencyStats.bestStreak}
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    dia(s)
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-xs text-zinc-500">
                                    Últimos 7 dias
                                </p>

                                <p className="mt-1 text-2xl font-black">
                                    {consistencyStats.workoutsLast7Days}
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    treino(s)
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-xs text-zinc-500">
                                    Últimos 30 dias
                                </p>

                                <p className="mt-1 text-2xl font-black">
                                    {consistencyStats.workoutsLast30Days}
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    treino(s)
                                </p>
                            </div>
                        </div>

                        {consistencyStats.lastWorkoutDate && (
                            <p className="mt-4 text-xs text-zinc-500">
                                Último treino em {formatShortDate(consistencyStats.lastWorkoutDate)}
                            </p>
                        )}
                    </Card>

                    <Card>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold">
                                    Dia selecionado
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {formatShortDate(selectedDate)}
                                </p>
                            </div>

                            <Badge>
                                {selectedSessions.length} treino(s)
                            </Badge>
                        </div>

                        <div className="mt-5 space-y-3">
                            {selectedSessions.length === 0 ? (
                                <EmptyState
                                    title="Nenhum treino nesse dia"
                                    description="Finalize um treino para ele aparecer no calendário."
                                    action={
                                        <Link to="/workouts">
                                            <Button>
                                                Ir para treinos
                                            </Button>
                                        </Link>
                                    }
                                />
                            ) : (
                                selectedSessions.map((session) => {
                                    const volume = getSessionVolume(session)

                                    return (
                                        <div
                                            key={session.id}
                                            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4"
                                        >
                                            <h3 className="line-clamp-2 font-black text-white">
                                                {session.workoutName}
                                            </h3>

                                            <p className="mt-2 text-sm text-zinc-500">
                                                {session.exercises.length} exercícios • {formatDuration(session.duration)}
                                            </p>

                                            <div className="mt-4 grid grid-cols-2 gap-2">
                                                <div className="rounded-2xl border border-zinc-800 bg-[#18181b] p-3">
                                                    <p className="text-xs text-zinc-500">
                                                        Volume
                                                    </p>

                                                    <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
                                                        {volume.toLocaleString('pt-BR')}kg
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-zinc-800 bg-[#18181b] p-3">
                                                    <p className="text-xs text-zinc-500">
                                                        Horário
                                                    </p>

                                                    <p className="mt-1 font-bold">
                                                        {new Date(session.finishedAt).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </Card>
                </div>
            </section>
        </>
    )
}

export default WorkoutCalendar
