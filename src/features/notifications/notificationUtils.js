import {
  Activity,
  BellRing,
  CalendarDays,
  Camera,
  Droplets,
  Dumbbell,
  Flag,
  Info,
  Moon,
  ShieldCheck,
  Target,
} from 'lucide-react'

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  workouts: true,
  agenda: true,
  goals: true,
  water: false,
  recovery: true,
  progressPhotos: false,
  dailySummary: false,
  weeklySummary: true,
  system: true,
}

export const NOTIFICATION_PREFERENCE_OPTIONS = [
  {
    key: 'workouts',
    label: 'Treinos',
    description: 'Avisos antes dos treinos planejados.',
    icon: Dumbbell,
  },
  {
    key: 'agenda',
    label: 'Agenda',
    description: 'Lembretes da rotina semanal e compromissos.',
    icon: CalendarDays,
  },
  {
    key: 'goals',
    label: 'Metas',
    description: 'Alertas de progresso e metas quase concluídas.',
    icon: Target,
  },
  {
    key: 'water',
    label: 'Água',
    description: 'Lembretes simples para manter hidratação.',
    icon: Droplets,
  },
  {
    key: 'recovery',
    label: 'Recuperação muscular',
    description: 'Avisos para revisar descanso e fadiga.',
    icon: Moon,
  },
  {
    key: 'progressPhotos',
    label: 'Fotos de progresso',
    description: 'Lembretes para registrar evolução visual.',
    icon: Camera,
  },
  {
    key: 'dailySummary',
    label: 'Resumo diário',
    description: 'Um fechamento curto do seu dia.',
    icon: BellRing,
  },
  {
    key: 'weeklySummary',
    label: 'Resumo semanal',
    description: 'Seu desempenho da semana em um aviso.',
    icon: Flag,
  },
  {
    key: 'system',
    label: 'Avisos do sistema',
    description: 'Mensagens importantes sobre sua conta e app.',
    icon: ShieldCheck,
  },
]

function toDate(value) {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizeNotificationFromApi(notification = {}) {
  const createdAt = notification.createdAt || notification.date || new Date().toISOString()
  const rawStatus = notification.status || (notification.readAt ? 'read' : 'unread')
  const status = ['unread', 'read', 'archived'].includes(rawStatus) ? rawStatus : 'unread'

  return {
    ...notification,
    id:
      notification._id ||
      notification.id ||
      notification.dedupeKey ||
      `local-${createdAt}-${notification.title || 'notification'}`,
    title: String(notification.title || 'Notificação').trim(),
    message: String(notification.message || notification.body || '').trim(),
    type: notification.type || notification.category || 'info',
    status,
    actionUrl: notification.actionUrl || notification.route || '',
    source: notification.source || 'ForgeFlow',
    dedupeKey: notification.dedupeKey || '',
    readAt: notification.readAt || (status === 'read' ? notification.updatedAt || createdAt : null),
    archivedAt: notification.archivedAt || null,
    createdAt,
    updatedAt: notification.updatedAt || createdAt,
    metadata: notification.metadata || {},
  }
}

export function normalizeNotificationPreferences(preferences = {}) {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...Object.keys(DEFAULT_NOTIFICATION_PREFERENCES).reduce((next, key) => {
      if (typeof preferences?.[key] === 'boolean') {
        next[key] = preferences[key]
      }
      return next
    }, {}),
  }
}

export function buildNotificationSummary(notifications = [], preferences = {}, reminders = [], permission = {}) {
  const normalizedNotifications = Array.isArray(notifications)
    ? notifications.map(normalizeNotificationFromApi)
    : []
  const normalizedPreferences = normalizeNotificationPreferences(preferences)
  const activePreferences = Object.values(normalizedPreferences).filter(Boolean).length
  const activeReminders = Array.isArray(reminders)
    ? reminders.filter((reminder) => reminder?.enabled !== false).length
    : 0
  const nextReminder = getNextReminderLabel(reminders)

  return {
    total: normalizedNotifications.length,
    unread: normalizedNotifications.filter((item) => item.status === 'unread').length,
    read: normalizedNotifications.filter((item) => item.status === 'read').length,
    archived: normalizedNotifications.filter((item) => item.status === 'archived').length,
    activePreferences,
    activeReminders,
    activeAlerts: activePreferences + activeReminders,
    nextAlert: nextReminder,
    permissionLabel: getPermissionLabel(permission),
    permissionTone: getPermissionTone(permission),
    permissionGranted: isPermissionGranted(permission),
  }
}

export function formatDateTime(dateString) {
  const date = toDate(dateString)
  if (!date) return 'Sem data'

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatLongDateTime(dateString) {
  const date = toDate(dateString)
  if (!date) return 'Sem data'

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getNotificationMeta(type) {
  const metas = {
    success: {
      label: 'Sucesso',
      icon: Activity,
      tone: 'text-[var(--ff-success-text)]',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
    },
    warning: {
      label: 'Atenção',
      icon: Activity,
      tone: 'text-[var(--ff-warning-text)]',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/25',
    },
    danger: {
      label: 'Importante',
      icon: Activity,
      tone: 'text-[var(--ff-danger-text)]',
      bg: 'bg-red-500/10',
      border: 'border-red-500/25',
    },
    workout: {
      label: 'Treino',
      icon: Dumbbell,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    workouts: {
      label: 'Treino',
      icon: Dumbbell,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    agenda: {
      label: 'Agenda',
      icon: CalendarDays,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    goal: {
      label: 'Meta',
      icon: Target,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    goals: {
      label: 'Meta',
      icon: Target,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    water: {
      label: 'Água',
      icon: Droplets,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    hydration: {
      label: 'Água',
      icon: Droplets,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    weight: {
      label: 'Peso',
      icon: Activity,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    photo: {
      label: 'Foto',
      icon: Camera,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    progressPhotos: {
      label: 'Fotos',
      icon: Camera,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    recovery: {
      label: 'Recuperação',
      icon: Moon,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    system: {
      label: 'Sistema',
      icon: ShieldCheck,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    info: {
      label: 'Informação',
      icon: Info,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
  }

  return metas[type] || metas.info
}

export function getStatusLabel(status) {
  if (status === 'unread') return 'Não lida'
  if (status === 'read') return 'Lida'
  if (status === 'archived') return 'Arquivada'

  return 'Notificação'
}

export function getStatusDescription(status) {
  if (status === 'unread') return 'Você ainda não abriu essa notificação.'
  if (status === 'read') return 'Você já abriu essa notificação.'
  if (status === 'archived') return 'Essa notificação está arquivada.'

  return ''
}

export function isPermissionGranted(permission = {}) {
  return permission?.display === 'granted' || permission?.receive === 'granted'
}

export function getPermissionLabel(permission = {}) {
  if (isPermissionGranted(permission)) return 'Ativada'
  if (permission?.display === 'denied' || permission?.receive === 'denied') return 'Bloqueada'
  return 'Necessária'
}

export function getPermissionTone(permission = {}) {
  if (isPermissionGranted(permission)) return 'success'
  if (permission?.display === 'denied' || permission?.receive === 'denied') return 'danger'
  return 'warning'
}

export function getPermissionDescription(permission = {}) {
  if (isPermissionGranted(permission)) {
    return 'Você receberá lembretes deste dispositivo.'
  }

  if (permission?.display === 'denied' || permission?.receive === 'denied') {
    return 'Ative as notificações nas configurações do Android para receber alertas.'
  }

  return 'Ative as notificações para receber lembretes de treino, água e metas.'
}

export function getNextReminderLabel(reminders = []) {
  if (!Array.isArray(reminders)) return 'Nenhum'

  const enabled = reminders
    .filter((reminder) => reminder?.enabled !== false && reminder?.time)
    .sort((a, b) => String(a.time).localeCompare(String(b.time)))

  if (enabled.length === 0) return 'Nenhum'

  return `Hoje às ${enabled[0].time}`
}
