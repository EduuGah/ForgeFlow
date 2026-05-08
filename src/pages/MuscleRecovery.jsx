import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Activity,
    Dumbbell,
    Flame,
    HeartPulse,
    Search,
    ShieldCheck,
    Timer,
    X,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'

function getRecoveryStyle(level) {
    const styles = {
        low: {
            label: 'Recuperando',
            text: 'text-red-300',
            border: 'border-red-500/20',
            bg: 'bg-red-500/10',
            bar: 'bg-red-400',
            icon: Flame,
        },
        medium: {
            label: 'Parcial',
            text: 'text-yellow-300',
            border: 'border-yellow-500/20',
            bg: 'bg-yellow-500/10',
            bar: 'bg-yellow-400',
            icon: Timer,
        },
        good: {
            label: 'Quase pronto',
            text: 'text-blue-300',
            border: 'border-blue-500/20',
            bg: 'bg-blue-500/10',
            bar: 'bg-blue-400',
            icon: Activity,
        },
        ready: {
            label: 'Recuperado',
            text: 'text-emerald-300',
            border: 'border-emerald-500/20',
            bg: 'bg-emerald-500/10',
            bar: 'bg-emerald-400',
            icon: ShieldCheck,
        },
        unknown: {
            label: 'Sem dados',
            text: 'text-zinc-400',
            border: 'border-zinc-800',
            bg: 'bg-zinc-950',
            bar: 'bg-zinc-500',
            icon: HeartPulse,
        },
    }

    return styles[level] || styles.unknown
}

function formatDate(dateString) {
    if (!dateString) return 'Sem registro'

    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function formatRelativeDate(dateString) {
    if (!dateString) return 'Sem registro'

    const now = new Date()
    const date = new Date(dateString)

    const diffHours = Math.floor((now - date) / 1000 / 60 / 60)

    if (diffHours < 1) return 'Agora há pouco'
    if (diffHours < 24) return `${diffHours}h atrás`

    const diffDays = Math.floor(diffHours / 24)

    if (diffDays === 1) return 'Ontem'
    return `${diffDays} dias atrás`
}

function formatVolume(value) {
    return `${Number(value || 0).toLocaleString('pt-BR')}kg`
}

function MuscleRecovery() {
    const { user } = useAuth()

    const [recovery, setRecovery] = useState([])
    const [loading, setLoading] = useState(true)
    const [source, setSource] = useState('database')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        if (!user) return

        async function loadRecovery() {
            setLoading(true)

            try {
                const data = await apiFetch('/stats/muscle-recovery')

                const normalizedRecovery = Array.isArray(data?.recovery)
                    ? data.recovery
                    : []

                setRecovery(normalizedRecovery)
                setSource('database')
            } catch (error) {
                console.error(error)

                setRecovery([])
                setSource('local')
            } finally {
                setLoading(false)
            }
        }

        loadRecovery()
    }, [user])

    const filteredRecovery = useMemo(() => {
        const term = search.toLowerCase().trim()

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
    }, [recovery, search, statusFilter])

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
        <>
            <PageHeader
                title="Recuperação muscular"
                description="Acompanhe quais grupos musculares foram treinados recentemente e quais já estão mais recuperados."
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
                        <p className="text-sm text-zinc-500">Grupos analisados</p>
                        <Dumbbell size={20} className="text-[var(--ff-accent-text)]" />
                    </div>

                    <h2 className="mt-2 text-3xl font-black">
                        {recovery.length}
                    </h2>

                    <p className="mt-2 text-xs text-zinc-500">
                        com histórico recente
                    </p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Recuperação média</p>
                        <HeartPulse size={20} className="text-[var(--ff-accent-text)]" />
                    </div>

                    <h2 className="mt-2 text-3xl font-black text-[var(--ff-accent-text)]">
                        {averageRecovery}%
                    </h2>

                    <p className="mt-2 text-xs text-zinc-500">
                        estimativa geral
                    </p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Prontos</p>
                        <ShieldCheck size={20} className="text-emerald-400" />
                    </div>

                    <h2 className="mt-2 text-3xl font-black text-emerald-300">
                        {readyMuscles.length}
                    </h2>

                    <p className="mt-2 text-xs text-zinc-500">
                        grupos recuperados
                    </p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Atenção</p>
                        <Flame size={20} className="text-yellow-400" />
                    </div>

                    <h2 className="mt-2 text-3xl font-black text-yellow-300">
                        {recoveringMuscles.length}
                    </h2>

                    <p className="mt-2 text-xs text-zinc-500">
                        ainda recuperando
                    </p>
                </Card>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
                <aside className="space-y-6">
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                                <Search size={22} />
                            </div>

                            <div>
                                <h2 className="text-lg font-black">
                                    Filtros
                                </h2>

                                <p className="text-sm text-zinc-500">
                                    Refine por grupo ou status.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <div className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-zinc-400">
                                <Search size={19} />

                                <input
                                    type="text"
                                    placeholder="Buscar grupo..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="text-zinc-500 transition hover:text-white"
                                    >
                                        <X size={17} />
                                    </button>
                                )}
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)]"
                            >
                                <option value="">Todos os status</option>
                                <option value="low">Recuperando</option>
                                <option value="medium">Parcial</option>
                                <option value="good">Quase pronto</option>
                                <option value="ready">Recuperado</option>
                            </select>

                            {(search || statusFilter) && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={clearFilters}
                                    className="w-full"
                                >
                                    Limpar filtros
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-black">
                            Sugestão para hoje
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            Grupos com maior recuperação.
                        </p>

                        <div className="mt-5 space-y-2">
                            {nextSuggestedMuscles.length === 0 ? (
                                <p className="text-sm text-zinc-500">
                                    Ainda não há dados suficientes para sugerir.
                                </p>
                            ) : (
                                nextSuggestedMuscles.map((item) => {
                                    const style = getRecoveryStyle(item.level)

                                    return (
                                        <div
                                            key={item.muscleGroup}
                                            className={`rounded-2xl border ${style.border} ${style.bg} p-3`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-bold text-white">
                                                    {item.muscleGroup}
                                                </p>

                                                <span className={`text-sm font-black ${style.text}`}>
                                                    {item.recoveryPercent}%
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-zinc-500">
                                                {item.status}
                                            </p>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <Link to="/workouts">
                            <button
                                type="button"
                                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)]"
                            >
                                <Dumbbell size={18} />
                                Montar treino
                            </button>
                        </Link>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-black">
                            Como funciona?
                        </h2>

                        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                            A recuperação é estimada pelo tempo desde o último treino de cada grupo muscular.
                            Por enquanto, o cálculo usa uma regra simples de 24h, 48h e 72h.
                        </p>

                        <div className="mt-4 space-y-2 text-sm">
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-200">
                                0–24h: recuperando
                            </div>

                            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-yellow-200">
                                24–48h: parcial
                            </div>

                            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-200">
                                48–72h: quase pronto
                            </div>

                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
                                72h+: recuperado
                            </div>
                        </div>
                    </Card>
                </aside>

                <main>
                    <Card>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-black">
                                    Grupos musculares
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {filteredRecovery.length} grupo(s) encontrados.
                                </p>
                            </div>

                            <Badge>
                                Recuperação
                            </Badge>
                        </div>

                        <div className="mt-5">
                            {filteredRecovery.length === 0 ? (
                                <EmptyState
                                    title="Nenhum grupo encontrado"
                                    description="Finalize alguns treinos ou ajuste os filtros para ver a recuperação muscular."
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    {filteredRecovery.map((item) => {
                                        const style = getRecoveryStyle(item.level)
                                        const Icon = style.icon

                                        return (
                                            <div
                                                key={item.muscleGroup}
                                                className={`rounded-3xl border ${style.border} ${style.bg} p-5`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.bg} ${style.text}`}>
                                                            <Icon size={22} />
                                                        </div>

                                                        <div>
                                                            <h3 className="text-xl font-black text-white">
                                                                {item.muscleGroup}
                                                            </h3>

                                                            <p className={`mt-1 text-sm font-bold ${style.text}`}>
                                                                {item.status}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span className={`text-2xl font-black ${style.text}`}>
                                                        {item.recoveryPercent}%
                                                    </span>
                                                </div>

                                                <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/30">
                                                    <div
                                                        className={`h-full rounded-full ${style.bar}`}
                                                        style={{
                                                            width: `${item.recoveryPercent}%`,
                                                        }}
                                                    />
                                                </div>

                                                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                                                    {item.message}
                                                </p>

                                                <div className="mt-5 grid grid-cols-2 gap-3">
                                                    <div className="rounded-2xl border border-black/20 bg-black/20 p-4">
                                                        <p className="text-xs text-zinc-500">
                                                            Último treino
                                                        </p>

                                                        <p className="mt-1 text-sm font-bold text-white">
                                                            {formatRelativeDate(item.lastTrainedAt)}
                                                        </p>

                                                        <p className="mt-1 text-xs text-zinc-500">
                                                            {formatDate(item.lastTrainedAt)}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-black/20 bg-black/20 p-4">
                                                        <p className="text-xs text-zinc-500">
                                                            Séries recentes
                                                        </p>

                                                        <p className="mt-1 text-lg font-black text-white">
                                                            {item.totalSets}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-black/20 bg-black/20 p-4">
                                                        <p className="text-xs text-zinc-500">
                                                            Sessões
                                                        </p>

                                                        <p className="mt-1 text-lg font-black text-white">
                                                            {item.totalSessions}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-black/20 bg-black/20 p-4">
                                                        <p className="text-xs text-zinc-500">
                                                            Volume
                                                        </p>

                                                        <p className="mt-1 text-sm font-black text-[var(--ff-accent-text)]">
                                                            {formatVolume(item.totalVolume)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </main>
            </section>
        </>
    )
}

export default MuscleRecovery