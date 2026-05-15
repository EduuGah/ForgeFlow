import { Bell, Camera, CheckCircle2, Dumbbell, Flag, Info, Target, Weight } from 'lucide-react'

export function normalizeNotificationFromApi(notification = {}) {
  return {
    ...notification,
    id: notification._id || notification.id,
    title: notification.title || 'Notificação',
    message: notification.message || '',
    type: notification.type || 'info',
    status: notification.status || 'unread',
    actionUrl: notification.actionUrl || '',
    source: notification.source || 'system',
    dedupeKey: notification.dedupeKey || '',
    readAt: notification.readAt || null,
    createdAt: notification.createdAt || new Date().toISOString(),
    updatedAt: notification.updatedAt || notification.createdAt || new Date().toISOString(),
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatLongDateTime(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleString('pt-BR', {
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
      icon: CheckCircle2,
      tone: 'text-[var(--ff-success-text)]',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
    },
    warning: {
      label: 'Atenção',
      icon: Info,
      tone: 'text-[var(--ff-warning-text)]',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/25',
    },
    danger: {
      label: 'Importante',
      icon: Info,
      tone: 'text-[var(--ff-danger-text)]',
      bg: 'bg-red-500/10',
      border: 'border-red-500/25',
    },
    goal: {
      label: 'Meta',
      icon: Target,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    workout: {
      label: 'Treino',
      icon: Dumbbell,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    weight: {
      label: 'Peso',
      icon: Weight,
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
    recovery: {
      label: 'Recuperação',
      icon: Flag,
      tone: 'text-[var(--ff-accent-text)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      border: 'border-[var(--ff-accent-border)]',
    },
    info: {
      label: 'Informação',
      icon: Bell,
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

