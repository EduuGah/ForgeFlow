import { Activity, Flame, HeartPulse, ShieldCheck, Timer } from 'lucide-react'

export function getRecoveryStyle(level) {
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

export function formatDate(dateString) {
    if (!dateString) return 'Sem registro'

    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export function getCalendarDayDiff(dateString) {
    if (!dateString) return null

    const now = new Date()
    const date = new Date(dateString)

    const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    return Math.max(0, Math.floor((startNow - startDate) / 86400000))
}

export function getRecoveryStateByDayDiff(dayDiff) {
    if (dayDiff === null || Number.isNaN(dayDiff)) {
        return { level: 'unknown', recoveryPercent: 0 }
    }

    if (dayDiff <= 0) return { level: 'low', recoveryPercent: 25 }
    if (dayDiff === 1) return { level: 'medium', recoveryPercent: 55 }
    if (dayDiff === 2) return { level: 'good', recoveryPercent: 82 }

    return { level: 'ready', recoveryPercent: 100 }
}

export function formatHour(dateString) {
    if (!dateString) return 'Sem horário'

    return new Date(dateString).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatRelativeDate(dateString) {
    if (!dateString) return 'Sem registro'

    const dayDiff = getCalendarDayDiff(dateString)
    const now = new Date()
    const date = new Date(dateString)
    const diffHours = Math.floor((now - date) / 1000 / 60 / 60)

    if (dayDiff === 0) {
        if (diffHours < 1) return 'Hoje • agora há pouco'
        return `Hoje • ${diffHours}h atrás`
    }

    if (dayDiff == 1) return 'Ontem'
    return `${dayDiff} dias atrás`
}

export function formatVolume(value) {
    return `${Number(value || 0).toLocaleString('pt-BR')}kg`
}

