import { Activity, AlertTriangle, BatteryFull, Flame, HeartPulse, Moon, ShieldCheck, Timer } from 'lucide-react'

export const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Pernas',
  'Quadríceps',
  'Posterior',
  'Glúteos',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Panturrilha',
  'Corpo inteiro',
  'Grupo não identificado',
]

export const SORENESS_LEVELS = [
  { value: 'light', label: 'Leve', penalty: 10 },
  { value: 'moderate', label: 'Moderada', penalty: 22 },
  { value: 'high', label: 'Alta', penalty: 38 },
]

export const RECOVERY_REGIONS = [
  { title: 'Parte superior', groups: ['Peito', 'Costas', 'Ombros'] },
  { title: 'Braços', groups: ['Bíceps', 'Tríceps'] },
  { title: 'Parte inferior', groups: ['Pernas', 'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha'] },
  { title: 'Core', groups: ['Abdômen', 'Corpo inteiro'] },
]

export function clampPercent(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, Math.round(number)))
}

export function normalizeMuscleGroup(name) {
  if (!name) return 'Grupo não identificado'

  const normalized = String(name).trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const aliases = {
    peito: 'Peito',
    peitoral: 'Peito',
    chest: 'Peito',
    costas: 'Costas',
    dorsal: 'Costas',
    back: 'Costas',
    trapezio: 'Costas',
    pernas: 'Pernas',
    leg: 'Pernas',
    legs: 'Pernas',
    quadriceps: 'Quadríceps',
    quads: 'Quadríceps',
    posterior: 'Posterior',
    posteriores: 'Posterior',
    hamstrings: 'Posterior',
    'posterior de coxa': 'Posterior',
    gluteos: 'Glúteos',
    glutes: 'Glúteos',
    ombro: 'Ombros',
    ombros: 'Ombros',
    shoulder: 'Ombros',
    shoulders: 'Ombros',
    deltoide: 'Ombros',
    deltoides: 'Ombros',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
    abdomen: 'Abdômen',
    abdominal: 'Abdômen',
    abs: 'Abdômen',
    core: 'Abdômen',
    panturrilha: 'Panturrilha',
    panturrilhas: 'Panturrilha',
    calves: 'Panturrilha',
    'corpo inteiro': 'Corpo inteiro',
    fullbody: 'Corpo inteiro',
    'full body': 'Corpo inteiro',
  }

  return aliases[normalized] || name || 'Grupo não identificado'
}

export function normalizeSorenessLog(log = {}) {
  const level = SORENESS_LEVELS.some((item) => item.value === log.level) ? log.level : 'light'

  return {
    ...log,
    id: String(log._id || log.id || `local-${Date.now()}`),
    date: String(log.date || log.createdAt || new Date().toISOString()).slice(0, 10),
    muscleGroup: normalizeMuscleGroup(log.muscleGroup),
    level,
    note: String(log.note || '').trim(),
    storage: log.storage || 'database',
    createdAt: log.createdAt || new Date().toISOString(),
  }
}

export function getSorenessLevelLabel(level) {
  return SORENESS_LEVELS.find((item) => item.value === level)?.label || 'Leve'
}

export function getSorenessPenalty(level) {
  return SORENESS_LEVELS.find((item) => item.value === level)?.penalty || 0
}

export function getRecoveryStyle(level) {
  const styles = {
    attention: {
      label: 'Atenção',
      text: 'text-[var(--ff-danger-text)]',
      border: 'border-red-500/25',
      bg: 'bg-red-500/10',
      bar: 'bg-[var(--ff-danger-text)]',
      icon: AlertTriangle,
    },
    low: {
      label: 'Em recuperação',
      text: 'text-[var(--ff-warning-text)]',
      border: 'border-yellow-500/25',
      bg: 'bg-yellow-500/10',
      bar: 'bg-[var(--ff-warning-text)]',
      icon: Flame,
    },
    medium: {
      label: 'Quase pronto',
      text: 'text-[var(--ff-accent-text)]',
      border: 'border-[var(--ff-accent-border)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      bar: 'bg-[var(--ff-accent)]',
      icon: Timer,
    },
    good: {
      label: 'Quase pronto',
      text: 'text-[var(--ff-accent-text)]',
      border: 'border-[var(--ff-accent-border)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      bar: 'bg-[var(--ff-accent)]',
      icon: Activity,
    },
    ready: {
      label: 'Recuperado',
      text: 'text-[var(--ff-success-text)]',
      border: 'border-emerald-500/25',
      bg: 'bg-emerald-500/10',
      bar: 'bg-[var(--ff-success-text)]',
      icon: ShieldCheck,
    },
    unknown: {
      label: 'Sem dados',
      text: 'text-[var(--ff-muted)]',
      border: 'border-[var(--ff-border)]',
      bg: 'bg-[var(--ff-surface-2)]',
      bar: 'bg-[var(--ff-muted)]',
      icon: HeartPulse,
    },
  }

  return styles[level] || styles.unknown
}

export function formatDate(dateString) {
  if (!dateString) return 'Sem registro'

  const date = new Date(`${String(dateString).slice(0, 10)}T12:00:00`)

  if (Number.isNaN(date.getTime())) return 'Sem registro'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatLongDate(dateString) {
  if (!dateString) return 'Sem registro'

  const date = new Date(`${String(dateString).slice(0, 10)}T12:00:00`)

  if (Number.isNaN(date.getTime())) return 'Sem registro'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function getCalendarDayDiff(dateString) {
  if (!dateString) return null

  const now = new Date()
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return null

  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return Math.max(0, Math.floor((startNow - startDate) / 86400000))
}

export function getRecoveryStateByDayDiff(dayDiff) {
  if (dayDiff === null || Number.isNaN(dayDiff)) {
    return { level: 'unknown', recoveryPercent: 100, status: 'Sem dados' }
  }

  if (dayDiff <= 0) return { level: 'attention', recoveryPercent: 35, status: 'Atenção' }
  if (dayDiff === 1) return { level: 'low', recoveryPercent: 55, status: 'Em recuperação' }
  if (dayDiff === 2) return { level: 'medium', recoveryPercent: 72, status: 'Quase pronto' }
  if (dayDiff === 3) return { level: 'good', recoveryPercent: 86, status: 'Quase pronto' }

  return { level: 'ready', recoveryPercent: 94, status: 'Recuperado' }
}

export function calculateRecoveryScore({ dayDiff, totalSets = 0, totalVolume = 0, sorenessLevel = '' }) {
  const base = getRecoveryStateByDayDiff(dayDiff)
  let score = base.recoveryPercent

  const setPenalty = Math.min(18, Math.floor(Number(totalSets || 0) / 8) * 3)
  const volumePenalty = Math.min(10, Math.floor(Number(totalVolume || 0) / 6000) * 2)
  const sorenessPenalty = getSorenessPenalty(sorenessLevel)

  score = clampPercent(score - setPenalty - volumePenalty - sorenessPenalty)

  if (sorenessLevel === 'high') {
    return { recoveryPercent: Math.min(score, 42), level: 'attention', status: 'Atenção' }
  }

  if (score < 45) return { recoveryPercent: score, level: 'attention', status: 'Atenção' }
  if (score < 62) return { recoveryPercent: score, level: 'low', status: 'Em recuperação' }
  if (score < 78) return { recoveryPercent: score, level: 'medium', status: 'Quase pronto' }
  if (score < 90) return { recoveryPercent: score, level: 'good', status: 'Quase pronto' }

  return { recoveryPercent: score, level: 'ready', status: 'Recuperado' }
}

export function formatRelativeDate(dateString) {
  if (!dateString) return 'Sem registro'

  const dayDiff = getCalendarDayDiff(dateString)
  const now = new Date()
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return 'Sem registro'

  const diffHours = Math.max(0, Math.floor((now - date) / 1000 / 60 / 60))

  if (dayDiff === 0) {
    if (diffHours < 1) return 'Hoje • agora há pouco'
    return `Hoje • ${diffHours}h atrás`
  }

  if (dayDiff === 1) return 'Ontem'
  return `${dayDiff} dias atrás`
}

export function formatVolume(value) {
  const number = Number(value || 0)
  return `${number.toLocaleString('pt-BR')} kg`
}

export function applySorenessToRecovery(recovery = [], sorenessLogs = []) {
  const logs = sorenessLogs.map(normalizeSorenessLog)
  const latestByGroup = new Map()

  logs
    .slice()
    .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
    .forEach((log) => {
      if (!latestByGroup.has(log.muscleGroup)) {
        latestByGroup.set(log.muscleGroup, log)
      }
    })

  const normalizedRecovery = recovery.map((item) => {
    const muscleGroup = normalizeMuscleGroup(item.muscleGroup)
    const dayDiff = getCalendarDayDiff(item.lastTrainedAt)
    const soreness = latestByGroup.get(muscleGroup) || null
    const score = calculateRecoveryScore({
      dayDiff,
      totalSets: item.totalSets,
      totalVolume: item.totalVolume,
      sorenessLevel: soreness?.level || '',
    })

    const message = buildRecoveryMessage({
      ...item,
      muscleGroup,
      ...score,
      soreness,
      dayDiff,
    })

    return {
      ...item,
      muscleGroup,
      dayDiff,
      soreness,
      recoveryPercent: score.recoveryPercent,
      level: item.lastTrainedAt ? score.level : (soreness ? score.level : 'unknown'),
      status: item.lastTrainedAt || soreness ? score.status : 'Sem dados',
      message,
      totalSets: Number(item.totalSets || 0),
      totalSessions: Number(item.totalSessions || 0),
      totalVolume: Number(item.totalVolume || 0),
    }
  })

  latestByGroup.forEach((soreness, muscleGroup) => {
    const alreadyMapped = normalizedRecovery.some((item) => item.muscleGroup === muscleGroup)
    if (alreadyMapped) return

    const score = calculateRecoveryScore({
      dayDiff: null,
      totalSets: 0,
      totalVolume: 0,
      sorenessLevel: soreness.level,
    })

    normalizedRecovery.push({
      muscleGroup,
      lastTrainedAt: null,
      dayDiff: null,
      soreness,
      recoveryPercent: score.recoveryPercent,
      level: score.level,
      status: score.status,
      message: buildRecoveryMessage({ muscleGroup, soreness, dayDiff: null, ...score }),
      totalSets: 0,
      totalSessions: 0,
      totalVolume: 0,
      source: 'manual',
    })
  })

  return normalizedRecovery.sort((a, b) => {
    if (a.level === 'unknown' && b.level !== 'unknown') return 1
    if (a.level !== 'unknown' && b.level === 'unknown') return -1
    return a.recoveryPercent - b.recoveryPercent
  })
}

export function buildRecoveryMessage(item) {
  if (!item.lastTrainedAt && !item.soreness) {
    return 'Ainda não há dados suficientes para esse grupo.'
  }

  if (item.soreness?.level === 'high') {
    return 'Você marcou fadiga alta. Considere reduzir intensidade ou trocar o foco do treino hoje.'
  }

  if (item.soreness?.level === 'moderate') {
    return 'Existe fadiga moderada registrada. Treine com cautela e ajuste o volume se necessário.'
  }

  if (item.dayDiff === 0) return 'Treinado hoje. Pode ser melhor priorizar outro grupo ou fazer um treino leve.'
  if (item.dayDiff === 1) return 'Treinado ontem. Ainda pode estar em recuperação.'
  if (item.dayDiff === 2) return 'Já passou uma boa janela de descanso, mas observe sua sensação antes de forçar.'
  if (item.dayDiff >= 3) return 'Boa janela de descanso registrada para esse grupo.'

  return 'Estimativa baseada nos seus treinos registrados.'
}

export function buildRecoveryInsights(recovery = [], sorenessLogs = []) {
  if (recovery.length === 0) {
    return ['Finalize alguns treinos para o ForgeFlow estimar melhor sua recuperação.']
  }

  const sorted = recovery.slice().sort((a, b) => b.recoveryPercent - a.recoveryPercent)
  const mostReady = sorted.find((item) => item.level !== 'unknown')
  const attention = recovery.find((item) => item.level === 'attention' || item.soreness?.level === 'high')
  const recentSoreness = sorenessLogs.map(normalizeSorenessLog).slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  const insights = []

  if (mostReady) insights.push(`${mostReady.muscleGroup} parece ser um dos grupos mais recuperados hoje.`)
  if (attention) insights.push(`${attention.muscleGroup} merece atenção pelo treino recente ou fadiga registrada.`)
  if (recentSoreness) insights.push(`Último registro manual: ${recentSoreness.muscleGroup} — dor/fadiga ${getSorenessLevelLabel(recentSoreness.level).toLowerCase()}.`)

  insights.push('A recuperação é uma estimativa baseada nos seus registros, não uma avaliação médica.')

  return insights
}

export function buildTodayTrainingSuggestions(recovery = []) {
  if (recovery.length === 0) {
    return ['Finalize alguns treinos para o ForgeFlow estimar melhor sua recuperação.']
  }

  const ready = recovery
    .filter((item) => ['ready', 'good'].includes(item.level) && item.recoveryPercent >= 78)
    .sort((a, b) => b.recoveryPercent - a.recoveryPercent)
    .slice(0, 3)

  const attention = recovery
    .filter((item) => item.level === 'attention' || item.soreness?.level === 'high')
    .slice(0, 2)

  const suggestions = []

  if (ready.length > 0) {
    suggestions.push(`${ready.map((item) => item.muscleGroup).join(', ')} parecem bem recuperados.`)
  }

  if (attention.length > 0) {
    suggestions.push(`${attention.map((item) => item.muscleGroup).join(', ')} ainda pedem cautela hoje.`)
  }

  if (suggestions.length === 0) {
    suggestions.push('Considere alternar o foco do treino se estiver sentindo fadiga.')
  }

  return suggestions
}

export function buildRecoveryRegions(recovery = []) {
  const byGroup = new Map(recovery.map((item) => [normalizeMuscleGroup(item.muscleGroup), item]))

  return RECOVERY_REGIONS.map((region) => ({
    ...region,
    items: region.groups
      .map((group) => byGroup.get(group))
      .filter(Boolean),
  })).filter((region) => region.items.length > 0)
}

export function getRecoverySummary(recovery = []) {
  const available = recovery.filter((item) => item.level !== 'unknown')
  const ready = available.filter((item) => ['ready', 'good'].includes(item.level))
  const attention = available.filter((item) => item.level === 'attention' || item.level === 'low')
  const average = available.length
    ? Math.round(available.reduce((sum, item) => sum + Number(item.recoveryPercent || 0), 0) / available.length)
    : 0

  const mostReady = available.slice().sort((a, b) => b.recoveryPercent - a.recoveryPercent)[0] || null
  const mostTired = available.slice().sort((a, b) => a.recoveryPercent - b.recoveryPercent)[0] || null
  const lastWorkout = available
    .filter((item) => item.lastTrainedAt)
    .sort((a, b) => new Date(b.lastTrainedAt) - new Date(a.lastTrainedAt))[0] || null

  return {
    total: recovery.length,
    available: available.length,
    average,
    readyCount: ready.length,
    attentionCount: attention.length,
    mostReady,
    mostTired,
    lastWorkout,
  }
}

export const RECOVERY_INFO_STEPS = [
  { icon: Moon, title: 'Mesmo dia', description: 'recuperação baixa após treino recente' },
  { icon: Timer, title: '1 a 2 dias', description: 'recuperação parcial, depende do volume' },
  { icon: BatteryFull, title: '3+ dias', description: 'tende a ficar mais pronto, se não houver dor alta' },
]
