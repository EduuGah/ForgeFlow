import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  Bell,
  BellRing,
  Camera,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Eye,
  EyeOff,
  Flag,
  Info,
  RefreshCcw,
  Search,
  Target,
  Trash2,
  Weight,
  X,
,
  Trophy,
  AlertTriangle,
  AlertCircle} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { generateSmartNotifications, notifyNotificationsChanged } from '../utils/notificationUtils'
import {
  clearLegacyForgeFlowStorage,
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

function normalizeNotificationFromApi(notification = {}) {
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


function getNotificationIcon(type) {
  if (type === 'success') return <Trophy size={18} />
  if (type === 'goal') return <CheckCircle2 size={18} />
  if (type === 'warning') return <AlertTriangle size={18} />
  if (type === 'error' || type === 'danger') return <AlertCircle size={18} />
  return <BellRing size={18} />
}

function formatDateTime(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLongDateTime(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getNotificationMeta(type) {
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

function getStatusLabel(status) {
  if (status === 'unread') return 'Não lida'
  if (status === 'read') return 'Lida'
  if (status === 'archived') return 'Arquivada'

  return 'Notificação'
}

function getStatusDescription(status) {
  if (status === 'unread') return 'Você ainda não abriu essa notificação.'
  if (status === 'read') return 'Você já abriu essa notificação.'
  if (status === 'archived') return 'Essa notificação está arquivada.'

  return ''
}

function NotificationStatusPill({ status }) {
  const isUnread = status === 'unread'
  const isRead = status === 'read'
  const isArchived = status === 'archived'

  return (
    <span
      className={
        isUnread
          ? 'inline-flex items-center gap-1.5 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent)] px-2.5 py-1 text-[11px] font-black text-white shadow-[0_0_16px_var(--ff-accent-shadow)]'
          : isRead
            ? 'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-[var(--ff-success-text)]'
            : 'inline-flex items-center gap-1.5 rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2.5 py-1 text-[11px] font-black text-[var(--ff-muted)]'
      }
    >
      {isUnread && <BellRing size={12} />}
      {isRead && <Eye size={12} />}
      {isArchived && <Archive size={12} />}
      {getStatusLabel(status)}
    </span>
  )
}

function NotificationDetailModal({
  notification,
  onClose,
  onArchive,
  onDelete,
  onOpenAction,
}) {
  if (!notification) return null

  const meta = getNotificationMeta(notification.type)
  const Icon = meta.icon

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] shadow-2xl sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--ff-border)] p-5">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${meta.border} ${meta.bg} ${meta.tone}`}
            >
              <Icon size={24} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{meta.label}</Badge>
                <NotificationStatusPill status={notification.status} />
              </div>

              <h2 className="mt-3 text-2xl font-black text-[var(--ff-text)]">
                {notification.title}
              </h2>

              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                Criada em {formatLongDateTime(notification.createdAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]"
            aria-label="Fechar detalhes"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
              Mensagem completa
            </p>

            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-[var(--ff-text)]">
              {notification.message || 'Essa notificação não possui mensagem detalhada.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                Status
              </p>

              <div className="mt-2">
                <NotificationStatusPill status={notification.status} />
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[var(--ff-muted)]">
                {getStatusDescription(notification.status)}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                Leitura
              </p>

              <p className="mt-2 font-bold text-[var(--ff-text)]">
                {notification.readAt
                  ? formatLongDateTime(notification.readAt)
                  : 'Ainda não tinha sido lida'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                Origem
              </p>

              <p className="mt-2 font-bold text-[var(--ff-text)]">
                {notification.source || 'system'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                Destino sugerido
              </p>

              <p className="mt-2 font-bold text-[var(--ff-text)]">
                {notification.actionUrl || 'Nenhum'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {notification.actionUrl && (
              <Button
                type="button"
                onClick={() => onOpenAction(notification)}
              >
                Abrir destino
              </Button>
            )}

            {notification.status !== 'archived' && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onArchive(notification.id)}
              >
                <Archive size={16} />
                Arquivar
              </Button>
            )}

            <Button
              type="button"
              variant="danger"
              onClick={() => onDelete(notification.id)}
            >
              <Trash2 size={16} />
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [visibleCount, setVisibleCount] = useState(30)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('local')
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [selectedNotification, setSelectedNotification] = useState(null)

  function showToast(type, title, message = '') {
    setToast({
      type,
      title,
      message,
    })

    setTimeout(() => {
      setToast(null)
    }, 3200)
  }


  function notifyBellToRefresh() {
    window.dispatchEvent(new CustomEvent('forgeflow:notifications-changed'))
  }

  async function loadNotifications(filter = statusFilter) {
    if (!user) return

    clearLegacyForgeFlowStorage(['notifications'])

    const cachedNotifications = getUserStorageData(user, 'notifications', [])
    const normalizedCached = Array.isArray(cachedNotifications)
      ? cachedNotifications.map(normalizeNotificationFromApi)
      : []

    setNotifications(normalizedCached)
    setUnreadCount(normalizedCached.filter((item) => item.status === 'unread').length)
    setLoading(normalizedCached.length === 0)
    setSyncing(true)

    try {
      const query = filter ? `?status=${filter}&limit=80` : '?limit=80'
      const data = await apiFetch(`/notifications${query}`)

      const normalizedNotifications = Array.isArray(data?.notifications)
        ? data.notifications.map(normalizeNotificationFromApi)
        : []

      setNotifications(normalizedNotifications)
      setUnreadCount(Number(data?.unreadCount) || 0)
      saveUserStorageData(user, 'notifications', normalizedNotifications)
      notifyBellToRefresh()
      setSource('database')
    } catch (error) {
      console.error(error)
      setSource('local')
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  useEffect(() => {
    setNotifications([])
    setUnreadCount(0)
    setSelectedNotification(null)
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter])

  useEffect(() => {
    setVisibleCount(30)
  }, [deferredSearch, statusFilter])

  const stats = useMemo(() => {
    const unread = notifications.filter((item) => item.status === 'unread').length
    const read = notifications.filter((item) => item.status === 'read').length
    const archived = notifications.filter((item) => item.status === 'archived').length

    return {
      unread,
      read,
      archived,
      total: notifications.length,
    }
  }, [notifications])

  const filteredNotifications = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim()

    if (!term) return notifications

    return notifications.filter((notification) => {
      return `${notification.title} ${notification.message} ${notification.type} ${notification.status}`
        .toLowerCase()
        .includes(term)
    })
  }, [notifications, deferredSearch])

  const visibleNotifications = useMemo(() => {
    return filteredNotifications.slice(0, visibleCount)
  }, [filteredNotifications, visibleCount])

  async function handleGenerateNotifications() {
    try {
      const data = await generateSmartNotifications({
        user,
        reason: 'manual-check',
        force: true,
      })

      const normalizedNotifications = Array.isArray(data?.notifications)
        ? data.notifications.map(normalizeNotificationFromApi)
        : []

      setNotifications(normalizedNotifications)
      setUnreadCount(Number(data?.unreadCount) || 0)
      saveUserStorageData(user, 'notifications', normalizedNotifications)
      notifyBellToRefresh()

      showToast(
        'success',
        'Notificações verificadas',
        data?.created > 0
          ? `${data.created} nova(s) notificação(ões) criada(s).`
          : 'Nenhuma nova notificação no momento.'
      )
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao verificar',
        error.message || 'Não foi possível gerar notificações.'
      )
    }
  }

  async function markNotificationAsRead(notificationId) {
    const notification = notifications.find((item) => item.id === notificationId)

    if (!notification || notification.status !== 'unread') {
      return notification || null
    }

    try {
      const updatedFromApi = await apiFetch(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })

      const updatedNotification = normalizeNotificationFromApi(updatedFromApi)

      setNotifications((current) => {
        const updated = current.map((item) =>
          item.id === notificationId ? updatedNotification : item
        )

        saveUserStorageData(user, 'notifications', updated)

        return updated
      })

      setUnreadCount((current) => Math.max(0, current - 1))
      notifyBellToRefresh()

      return updatedNotification
    } catch (error) {
      console.error(error)
      showToast(
        'error',
        'Erro ao marcar como lida',
        error.message || 'Não foi possível marcar a notificação como lida.'
      )

      return notification
    }
  }

  async function handleOpenNotification(notification) {
    const updatedNotification = await markNotificationAsRead(notification.id)

    setSelectedNotification(updatedNotification || notification)
  }

  async function handleMarkAsRead(notificationId) {
    const updatedNotification = await markNotificationAsRead(notificationId)

    if (updatedNotification) {
      showToast('success', 'Notificação lida', 'A notificação foi marcada como lida.')
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await apiFetch('/notifications/read-all', {
        method: 'PATCH',
      })

      const updatedNotifications = notifications.map((item) => ({
        ...item,
        status: item.status === 'unread' ? 'read' : item.status,
        readAt: item.status === 'unread' ? new Date().toISOString() : item.readAt,
      }))

      setNotifications(updatedNotifications)
      saveUserStorageData(user, 'notifications', updatedNotifications)
      setUnreadCount(0)
      notifyBellToRefresh()

      if (selectedNotification?.status === 'unread') {
        setSelectedNotification({
          ...selectedNotification,
          status: 'read',
          readAt: new Date().toISOString(),
        })
      }

      showToast(
        'success',
        'Notificações lidas',
        'Todas as notificações foram marcadas como lidas.'
      )
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao marcar todas',
        error.message || 'Não foi possível marcar todas como lidas.'
      )
    }
  }

  async function handleArchiveNotification(notificationId) {
    try {
      const notificationBeforeUpdate = notifications.find((item) => item.id === notificationId)

      const updatedFromApi = await apiFetch(
        `/notifications/${notificationId}/archive`,
        {
          method: 'PATCH',
        }
      )

      const updatedNotification = normalizeNotificationFromApi(updatedFromApi)

      setNotifications((current) => {
        const updated = current.map((item) =>
          item.id === notificationId ? updatedNotification : item
        )

        saveUserStorageData(user, 'notifications', updated)

        return updated
      })

      setSelectedNotification((current) =>
        current?.id === notificationId ? updatedNotification : current
      )

      if (notificationBeforeUpdate?.status === 'unread') {
        setUnreadCount((current) => Math.max(0, current - 1))
      }

      notifyBellToRefresh()

      showToast('success', 'Notificação arquivada', 'A notificação foi arquivada.')
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao arquivar',
        error.message || 'Não foi possível arquivar a notificação.'
      )
    }
  }

  function handleDeleteNotification(notificationId) {
    const notification = notifications.find((item) => item.id === notificationId)

    setConfirmModal({
      title: 'Excluir notificação?',
      description: `A notificação "${notification?.title || 'selecionada'}" será removida.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch(`/notifications/${notificationId}`, {
            method: 'DELETE',
          })

          const updatedNotifications = notifications.filter(
            (item) => item.id !== notificationId
          )

          setNotifications(updatedNotifications)
          saveUserStorageData(user, 'notifications', updatedNotifications)
          setUnreadCount(
            updatedNotifications.filter((item) => item.status === 'unread').length
          )
          notifyBellToRefresh()
          setSelectedNotification((current) =>
            current?.id === notificationId ? null : current
          )
          setConfirmModal(null)

          showToast(
            'success',
            'Notificação excluída',
            'A notificação foi removida.'
          )
        } catch (error) {
          console.error(error)

          showToast(
            'error',
            'Erro ao excluir',
            error.message || 'Não foi possível excluir a notificação.'
          )
        }
      },
    })
  }

  function handleOpenAction(notification) {
    if (!notification?.actionUrl) return

    setSelectedNotification(null)
    navigate(notification.actionUrl)
  }

  return (
    <>

      <section className="lg:hidden">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--ff-accent-border)]/25 bg-gradient-to-br from-[var(--ff-accent-soft)]/25 via-[var(--ff-card)] to-[var(--ff-surface-2)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Badge variant={source === 'database' ? 'purple' : 'default'}>
                  {loading ? 'Carregando' : source === 'database' ? 'Sincronizado' : 'Local'}
                </Badge>

                <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[var(--ff-text)]">
                  Notificações
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                  Alertas de metas, treinos, peso e evolução em formato compacto.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateNotifications}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent)] text-white shadow-[0_0_18px_var(--ff-accent-shadow)] active:scale-95"
                aria-label="Verificar notificações"
              >
                <BellRing size={21} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 text-center">
                <p className="text-2xl font-black text-[var(--ff-accent-text)]">{stats.unread}</p>
                <p className="mt-1 text-[11px] text-[var(--ff-muted)]">não lidas</p>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 text-center">
                <p className="text-2xl font-black text-[var(--ff-text)]">{stats.read}</p>
                <p className="mt-1 text-[11px] text-[var(--ff-muted)]">lidas</p>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 text-center">
                <p className="text-2xl font-black text-[var(--ff-muted)]">{stats.archived}</p>
                <p className="mt-1 text-[11px] text-[var(--ff-muted)]">arquivadas</p>
              </div>
            </div>

            {stats.unread > 0 && (
              <Button
                type="button"
                onClick={handleMarkAllAsRead}
                className="mt-4 w-full"
              >
                <CheckCheck size={17} />
                Marcar todas como lidas
              </Button>
            )}
          </div>

          <div className="sticky top-[72px] z-20 -mx-4 border-y border-[var(--ff-border)] bg-[var(--ff-bg)]/95 px-4 py-3 backdrop-blur-xl">
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[var(--ff-muted)]">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar notificação..."
                className="w-full bg-transparent text-sm font-medium text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {[
                ['Todas', ''],
                ['Não lidas', 'unread'],
                ['Lidas', 'read'],
                ['Arquivadas', 'archived'],
              ].map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={
                    statusFilter === value
                      ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]'
                      : 'shrink-0 rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 py-2 text-xs font-black text-[var(--ff-text-soft)]'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <section className="space-y-3">
            {loading && notifications.length === 0 && (
              <Card className="p-4">
                <EmptyState title="Carregando notificações" description="Buscando alertas da sua conta." />
              </Card>
            )}

            {!loading && visibleNotifications.length === 0 && (
              <Card className="p-4">
                <EmptyState title="Nenhuma notificação" description="Não há notificações para o filtro atual." />
              </Card>
            )}

            {visibleNotifications.map((notification) => (
              <article
                key={notification.id}
                className={
                  notification.status === 'unread'
                    ? 'rounded-[1.7rem] border border-[var(--ff-accent-border)] bg-[var(--ff-card)] p-4 shadow-[0_0_24px_var(--ff-accent-shadow)]/10'
                    : 'rounded-[1.7rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 opacity-90'
                }
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 text-sm font-black leading-tight text-[var(--ff-text)]">
                        {notification.title}
                      </h2>

                      {notification.status === 'unread' && (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ff-accent)]" />
                      )}
                    </div>

                    {notification.message && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--ff-muted)]">
                        {notification.message}
                      </p>
                    )}

                    <p className="mt-2 text-[11px] text-[var(--ff-muted-2)]">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleOpenNotification(notification)}
                    className="w-full"
                  >
                    <Info size={15} />
                    Detalhes
                  </Button>

                  {notification.status === 'unread' ? (
                    <Button
                      type="button"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="w-full"
                    >
                      <CheckCircle2 size={15} />
                      Lida
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleOpenAction(notification)}
                      className="w-full"
                    >
                      Abrir
                    </Button>
                  )}
                </div>
              </article>
            ))}

            {visibleCount < filteredNotifications.length && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setVisibleCount((current) => current + 20)}
                className="w-full"
              >
                Carregar mais
              </Button>
            )}
          </section>
        </div>
      </section>

      <div className="hidden lg:block">
        <PageHeader
        title="Notificações"
        description="Acompanhe alertas inteligentes sobre treino, metas, peso e evolução."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source === 'database' ? 'purple' : 'default'}>
              {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Local'}
            </Badge>

            <Button type="button" variant="secondary" onClick={() => loadNotifications()}>
              <RefreshCcw size={16} />
              Atualizar
            </Button>

            <Button type="button" onClick={handleGenerateNotifications}>
              <BellRing size={16} />
              Verificar agora
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ff-muted)]">Não lidas</p>
            <BellRing size={20} className="text-[var(--ff-accent-text)]" />
          </div>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-accent-text)]">{stats.unread}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">precisam da sua atenção</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ff-muted)]">Lidas</p>
            <Eye size={20} className="text-[var(--ff-success-text)]" />
          </div>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.read}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">já foram abertas</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ff-muted)]">Arquivadas</p>
            <Archive size={20} className="text-[var(--ff-muted)]" />
          </div>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.archived}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">guardadas</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ff-muted)]">Total exibido</p>
            <Bell size={20} className="text-[var(--ff-accent-text)]" />
          </div>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.total}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">no filtro atual</p>
        </Card>
      </section>

      <Card className="mt-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[var(--ff-muted)]">
            <Search size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, mensagem, tipo ou status..."
              className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none"
          >
            <option value="">Todas</option>
            <option value="unread">Não lidas</option>
            <option value="read">Lidas</option>
            <option value="archived">Arquivadas</option>
          </select>

          <Button type="button" variant="secondary" onClick={handleMarkAllAsRead}>
            <CheckCheck size={16} />
            Marcar todas como lidas
          </Button>
        </div>
      </Card>

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filteredNotifications.length === 0 ? (
          <Card>
            <EmptyState
              title="Nenhuma notificação encontrada"
              description="Clique em verificar agora ou altere o filtro para ver outros alertas."
              action={
                <Button type="button" onClick={handleGenerateNotifications}>
                  <BellRing size={16} />
                  Verificar agora
                </Button>
              }
            />
          </Card>
        ) : (
          visibleNotifications.map((notification) => {
            const meta = getNotificationMeta(notification.type)
            const Icon = meta.icon
            const isUnread = notification.status === 'unread'

            return (
              <article
                key={notification.id}
                className={
                  isUnread
                    ? 'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-card)] p-4 shadow-[0_0_28px_var(--ff-accent-shadow)]/10 transition hover:-translate-y-0.5 hover:bg-[var(--ff-card-hover)]'
                    : 'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 opacity-85 transition hover:-translate-y-0.5 hover:opacity-100 hover:bg-[var(--ff-card-hover)]'
                }
              >
                {isUnread && (
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-[var(--ff-accent)]" />
                )}

                <button
                  type="button"
                  onClick={() => handleOpenNotification(notification)}
                  className="flex w-full flex-col gap-4 text-left sm:flex-row sm:items-start"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${meta.border} ${meta.bg} ${meta.tone}`}
                  >
                    <Icon size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <NotificationStatusPill status={notification.status} />

                      <Badge>{meta.label}</Badge>

                      {isUnread && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ff-accent-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--ff-accent-text)]">
                          <EyeOff size={12} />
                          Clique para abrir
                        </span>
                      )}
                    </div>

                    <h2
                      className={
                        isUnread
                          ? 'mt-3 text-lg font-black text-[var(--ff-text)]'
                          : 'mt-3 text-lg font-bold text-[var(--ff-text)]'
                      }
                    >
                      {notification.title}
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                      {notification.message || 'Sem mensagem detalhada.'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--ff-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={13} />
                        {formatDateTime(notification.createdAt)}
                      </span>

                      {notification.readAt && (
                        <span className="inline-flex items-center gap-1">
                          <Eye size={13} />
                          Lida em {formatDateTime(notification.readAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[var(--ff-border)] pt-4">
                  {notification.status === 'unread' && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <Eye size={16} />
                      Marcar como lida
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleOpenNotification(notification)}
                  >
                    <Info size={16} />
                    Detalhes
                  </Button>

                  {notification.status !== 'archived' && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleArchiveNotification(notification.id)}
                    >
                      <Archive size={16} />
                      Arquivar
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleDeleteNotification(notification.id)}
                  >
                    <Trash2 size={16} />
                    Excluir
                  </Button>
                </div>
              </article>
            )
          })
        )}

        {visibleCount < filteredNotifications.length && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setVisibleCount((current) => current + 30)}
            className="w-full"
          >
            Carregar mais notificações
          </Button>
        )}
      </section>

      </div>

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onArchive={handleArchiveNotification}
        onDelete={handleDeleteNotification}
        onOpenAction={handleOpenAction}
      />

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </>
  )
}

export default Notifications
