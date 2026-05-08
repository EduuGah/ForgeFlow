import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  Bell,
  CheckCheck,
  CheckCircle2,
  Dumbbell,
  Flag,
  ImagePlus,
  RefreshCcw,
  Search,
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

function normalizeNotification(item) {
  return {
    ...item,
    id: item._id || item.id,
    title: item.title || 'Notificação',
    message: item.message || '',
    type: item.type || 'info',
    status: item.status || 'unread',
    actionUrl: item.actionUrl || '',
    createdAt: item.createdAt || new Date().toISOString(),
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getNotificationIcon(type) {
  const icons = {
    goal: Flag,
    success: CheckCircle2,
    workout: Dumbbell,
    weight: Weight,
    photo: ImagePlus,
    warning: Bell,
    danger: Bell,
    recovery: Bell,
    info: Bell,
  }

  return icons[type] || Bell
}

function getNotificationLabel(type) {
  const labels = {
    goal: 'Meta',
    success: 'Conquista',
    workout: 'Treino',
    weight: 'Peso',
    photo: 'Foto',
    warning: 'Aviso',
    danger: 'Atenção',
    recovery: 'Recuperação',
    info: 'Info',
  }

  return labels[type] || 'Info'
}

function Notifications() {
  const { user } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('local')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return

    async function loadNotifications() {
      setLoading(true)

      const cachedNotifications = getUserStorageData(user, 'notifications', [])

      try {
        const data = await apiFetch('/notifications?limit=50')

        const normalized = Array.isArray(data?.notifications)
          ? data.notifications.map(normalizeNotification)
          : []

        setNotifications(normalized)
        setUnreadCount(Number(data?.unreadCount) || 0)
        saveUserStorageData(user, 'notifications', normalized)
        setSource('database')
      } catch (error) {
        console.error(error)

        const normalized = Array.isArray(cachedNotifications)
          ? cachedNotifications.map(normalizeNotification)
          : []

        setNotifications(normalized)
        setUnreadCount(normalized.filter((item) => item.status === 'unread').length)
        setSource('local')
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user, refreshKey])

  function showToast(type, title, message = '') {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 3200)
  }

  const filteredNotifications = useMemo(() => {
    const term = search.toLowerCase().trim()

    return notifications
      .filter((notification) => {
        const matchesStatus = statusFilter === 'all'
          ? notification.status !== 'archived'
          : notification.status === statusFilter

        const matchesSearch = term
          ? `${notification.title} ${notification.message} ${notification.type}`
              .toLowerCase()
              .includes(term)
          : true

        return matchesStatus && matchesSearch
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }, [notifications, search, statusFilter])

  async function handleGenerate() {
    try {
      const data = await apiFetch('/notifications/generate', {
        method: 'POST',
      })

      const normalized = Array.isArray(data?.notifications)
        ? data.notifications.map(normalizeNotification)
        : []

      setNotifications(normalized)
      setUnreadCount(Number(data?.unreadCount) || 0)
      saveUserStorageData(user, 'notifications', normalized)

      showToast(
        'success',
        'Notificações atualizadas',
        data?.created > 0
          ? `${data.created} nova(s) notificação(ões) criada(s).`
          : 'Nenhuma nova notificação necessária agora.'
      )
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao gerar notificações', error.message || 'Tente novamente.')
    }
  }

  async function handleRead(notification) {
    if (notification.status !== 'unread') return

    try {
      const itemFromApi = await apiFetch(`/notifications/${notification.id}/read`, {
        method: 'PATCH',
      })

      const normalized = normalizeNotification(itemFromApi)
      const updated = notifications.map((item) => item.id === normalized.id ? normalized : item)

      setNotifications(updated)
      setUnreadCount(Math.max(0, unreadCount - 1))
      saveUserStorageData(user, 'notifications', updated)
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao marcar como lida', error.message || 'Tente novamente.')
    }
  }

  async function handleReadAll() {
    try {
      await apiFetch('/notifications/read-all', {
        method: 'PATCH',
      })

      const updated = notifications.map((item) => ({
        ...item,
        status: item.status === 'unread' ? 'read' : item.status,
      }))

      setNotifications(updated)
      setUnreadCount(0)
      saveUserStorageData(user, 'notifications', updated)
      showToast('success', 'Tudo lido', 'Todas as notificações foram marcadas como lidas.')
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao marcar tudo', error.message || 'Tente novamente.')
    }
  }

  function handleArchive(notification) {
    setConfirmModal({
      title: 'Arquivar notificação?',
      description: `A notificação "${notification.title}" será movida para arquivadas.`,
      confirmText: 'Arquivar',
      onConfirm: async () => {
        try {
          const itemFromApi = await apiFetch(`/notifications/${notification.id}/archive`, {
            method: 'PATCH',
          })

          const normalized = normalizeNotification(itemFromApi)
          const updated = notifications.map((item) => item.id === normalized.id ? normalized : item)

          setNotifications(updated)
          setUnreadCount(updated.filter((item) => item.status === 'unread').length)
          saveUserStorageData(user, 'notifications', updated)
          setConfirmModal(null)
          showToast('success', 'Notificação arquivada', 'Ela saiu da lista principal.')
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao arquivar', error.message || 'Tente novamente.')
        }
      },
    })
  }

  function handleDelete(notification) {
    setConfirmModal({
      title: 'Excluir notificação?',
      description: `A notificação "${notification.title}" será removida permanentemente.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch(`/notifications/${notification.id}`, {
            method: 'DELETE',
          })

          const updated = notifications.filter((item) => item.id !== notification.id)

          setNotifications(updated)
          setUnreadCount(updated.filter((item) => item.status === 'unread').length)
          saveUserStorageData(user, 'notifications', updated)
          setConfirmModal(null)
          showToast('success', 'Notificação excluída', 'Ela foi removida.')
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao excluir', error.message || 'Tente novamente.')
        }
      },
    })
  }

  const stats = useMemo(() => {
    return {
      unread: notifications.filter((item) => item.status === 'unread').length,
      read: notifications.filter((item) => item.status === 'read').length,
      archived: notifications.filter((item) => item.status === 'archived').length,
      total: notifications.length,
    }
  }, [notifications])

  return (
    <>
      <PageHeader
        title="Notificações"
        description="Alertas internos inteligentes sobre metas, treinos, peso corporal e fotos."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source === 'database' ? 'purple' : 'default'}>
              {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Local'}
            </Badge>

            <Button type="button" variant="secondary" onClick={() => setRefreshKey((key) => key + 1)}>
              <RefreshCcw size={16} />
              Atualizar
            </Button>

            <Button type="button" onClick={handleGenerate}>
              <Bell size={16} />
              Gerar alertas
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-[var(--ff-muted)]">Não lidas</p>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-accent-text)]">{stats.unread}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">pedem atenção</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-[var(--ff-muted)]">Lidas</p>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.read}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">já visualizadas</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-[var(--ff-muted)]">Arquivadas</p>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.archived}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">guardadas</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-[var(--ff-muted)]">Total</p>
          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.total}</h2>
          <p className="mt-2 text-xs text-[var(--ff-muted)]">criadas pelo app</p>
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
              placeholder="Buscar por título, mensagem ou tipo..."
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
            <option value="all">Todas principais</option>
            <option value="unread">Não lidas</option>
            <option value="read">Lidas</option>
            <option value="archived">Arquivadas</option>
          </select>

          <Button type="button" variant="secondary" onClick={handleReadAll}>
            <CheckCheck size={16} />
            Marcar tudo lido
          </Button>
        </div>
      </Card>

      <section className="mt-6 space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <EmptyState
              title="Nenhuma notificação encontrada"
              description="Gere alertas inteligentes ou ajuste os filtros para visualizar outras notificações."
              action={
                <Button type="button" onClick={handleGenerate}>
                  <Bell size={16} />
                  Gerar alertas
                </Button>
              }
            />
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type)
            const isUnread = notification.status === 'unread'

            return (
              <Card key={notification.id} className={isUnread ? 'border-[var(--ff-accent-border)]/50' : ''}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                      <Icon size={22} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isUnread ? 'purple' : 'default'}>
                          {isUnread ? 'Não lida' : notification.status === 'archived' ? 'Arquivada' : 'Lida'}
                        </Badge>

                        <Badge>{getNotificationLabel(notification.type)}</Badge>

                        <span className="text-xs font-bold text-[var(--ff-muted)]">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-black text-[var(--ff-text)]">
                        {notification.title}
                      </h2>

                      {notification.message && (
                        <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                          {notification.message}
                        </p>
                      )}

                      {notification.actionUrl && (
                        <Link
                          to={notification.actionUrl}
                          onClick={() => handleRead(notification)}
                          className="mt-3 inline-flex text-sm font-black text-[var(--ff-accent-text)] transition hover:underline"
                        >
                          Abrir relacionado
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleRead(notification)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]"
                        title="Marcar como lida"
                      >
                        <CheckCircle2 size={17} />
                      </button>
                    )}

                    {notification.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => handleArchive(notification)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]"
                        title="Arquivar"
                      >
                        <Archive size={17} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(notification)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-[var(--ff-danger-text)] transition hover:bg-red-500/15"
                      title="Excluir"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </section>

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
