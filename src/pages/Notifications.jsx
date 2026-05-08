import { useEffect, useMemo, useState } from 'react'
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
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] shadow-2xl">
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

  async function loadNotifications(filter = statusFilter) {
    if (!user) return

    setLoading(true)

    const cachedNotifications = getUserStorageData(user, 'notifications', [])

    try {
      const query = filter ? `?status=${filter}&limit=60` : '?limit=60'
      const data = await apiFetch(`/notifications${query}`)

      const normalizedNotifications = Array.isArray(data?.notifications)
        ? data.notifications.map(normalizeNotificationFromApi)
        : []

      setNotifications(normalizedNotifications)
      setUnreadCount(Number(data?.unreadCount) || 0)
      saveUserStorageData(user, 'notifications', normalizedNotifications)
      setSource('database')
    } catch (error) {
      console.error(error)

      const normalizedCached = Array.isArray(cachedNotifications)
        ? cachedNotifications.map(normalizeNotificationFromApi)
        : []

      setNotifications(normalizedCached)
      setUnreadCount(
        normalizedCached.filter((item) => item.status === 'unread').length
      )
      setSource('local')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter])

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
    const term = search.toLowerCase().trim()

    if (!term) return notifications

    return notifications.filter((notification) => {
      return `${notification.title} ${notification.message} ${notification.type} ${notification.status}`
        .toLowerCase()
        .includes(term)
    })
  }, [notifications, search])

  async function handleGenerateNotifications() {
    try {
      const data = await apiFetch('/notifications/generate', {
        method: 'POST',
      })

      const normalizedNotifications = Array.isArray(data?.notifications)
        ? data.notifications.map(normalizeNotificationFromApi)
        : []

      setNotifications(normalizedNotifications)
      setUnreadCount(Number(data?.unreadCount) || 0)
      saveUserStorageData(user, 'notifications', normalizedNotifications)

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

      <section className="mt-6 space-y-4">
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
          filteredNotifications.map((notification) => {
            const meta = getNotificationMeta(notification.type)
            const Icon = meta.icon
            const isUnread = notification.status === 'unread'

            return (
              <article
                key={notification.id}
                className={
                  isUnread
                    ? 'group relative overflow-hidden rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-card)] p-4 shadow-[0_0_28px_var(--ff-accent-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--ff-card-hover)]'
                    : 'group relative overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 opacity-80 transition hover:-translate-y-0.5 hover:opacity-100 hover:bg-[var(--ff-card-hover)]'
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
      </section>

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
