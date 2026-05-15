import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { generateSmartNotifications } from '../utils/notificationUtils'
import {
  clearLegacyForgeFlowStorage,
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

import { normalizeNotificationFromApi } from '../features/notifications/notificationUtils'
import NotificationsPageSections from '../features/notifications/components/NotificationsPageSections'

function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [, setUnreadCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [visibleCount, setVisibleCount] = useState(30)
  const [, setSyncing] = useState(false)
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
    queueMicrotask(() => {
      setNotifications([])
      setUnreadCount(0)
      setSelectedNotification(null)
      loadNotifications()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter])

  useEffect(() => {
    queueMicrotask(() => setVisibleCount(30))
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
    } catch {
      const updatedNotification = {
        ...notification,
        status: 'read',
        readAt: new Date().toISOString(),
      }

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
    } catch {
      const notificationBeforeUpdate = notifications.find((item) => item.id === notificationId)
      const updatedNotification = {
        ...notificationBeforeUpdate,
        status: 'archived',
        archivedAt: new Date().toISOString(),
      }

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
      showToast('success', 'Notificação arquivada', 'A notificação foi arquivada localmente.')
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
        } catch {
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
            'A notificação foi removida localmente.'
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
    <NotificationsPageSections
      source={source}
      loading={loading}
      stats={stats}
      search={search}
      statusFilter={statusFilter}
      filteredNotifications={filteredNotifications}
      visibleNotifications={visibleNotifications}
      visibleCount={visibleCount}
      selectedNotification={selectedNotification}
      confirmModal={confirmModal}
      toast={toast}
      onRefresh={() => loadNotifications()}
      onGenerate={handleGenerateNotifications}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      onMarkAllAsRead={handleMarkAllAsRead}
      onLoadMore={() => setVisibleCount((current) => current + 30)}
      onOpenNotification={handleOpenNotification}
      onMarkAsRead={handleMarkAsRead}
      onArchiveNotification={handleArchiveNotification}
      onDeleteNotification={handleDeleteNotification}
      onOpenAction={handleOpenAction}
      onCloseDetail={() => setSelectedNotification(null)}
      onCancelConfirm={() => setConfirmModal(null)}
      onCloseToast={() => setToast(null)}
    />
  )
}

export default Notifications
