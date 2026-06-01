import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronRight, Inbox, X } from 'lucide-react'
import { normalizeNotificationFromApi, formatDateTime, getNotificationMeta } from '../../features/notifications/notificationUtils'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/api'
import { clearLegacyForgeFlowStorage, getUserStorageData } from '../../utils/userStorage'

function getUnreadCountFromCache(user) {
  const cachedNotifications = getUserStorageData(user, 'notifications', [])

  return Array.isArray(cachedNotifications)
    ? cachedNotifications.filter((item) => item.status === 'unread').length
    : 0
}

function NotificationBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [previewNotifications, setPreviewNotifications] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const isLoadingRef = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    setUnreadCount(0)

    if (!user) return undefined

    let isMounted = true

    async function loadNotificationsCount() {
      if (isLoadingRef.current) return

      isLoadingRef.current = true
      clearLegacyForgeFlowStorage(['notifications'])
      setUnreadCount(getUnreadCountFromCache(user))

      try {
        const data = await apiFetch('/notifications?limit=5')

        if (!isMounted) return

        const normalizedNotifications = Array.isArray(data?.notifications)
          ? data.notifications.map(normalizeNotificationFromApi)
          : []

        setUnreadCount(Number(data?.unreadCount) || normalizedNotifications.filter((item) => item.status === 'unread').length)
        setPreviewNotifications(normalizedNotifications)
      } catch (error) {
        const cachedNotifications = getUserStorageData(user, 'notifications', [])
        const normalizedCached = Array.isArray(cachedNotifications)
          ? cachedNotifications.map(normalizeNotificationFromApi).slice(0, 5)
          : []

        setPreviewNotifications(normalizedCached)
        console.error(error)
      } finally {
        isLoadingRef.current = false
      }
    }

    function handleNotificationsChanged() {
      loadNotificationsCount()
    }

    loadNotificationsCount()

    window.addEventListener('focus', handleNotificationsChanged)
    window.addEventListener('forgeflow:notifications-changed', handleNotificationsChanged)

    const intervalId = window.setInterval(loadNotificationsCount, 90000)

    return () => {
      isMounted = false
      window.removeEventListener('focus', handleNotificationsChanged)
      window.removeEventListener('forgeflow:notifications-changed', handleNotificationsChanged)
      window.clearInterval(intervalId)
    }
  }, [user])


  useEffect(() => {
    if (!isMenuOpen) return undefined

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  function openNotificationsPage() {
    setIsMenuOpen(false)
    navigate('/notifications')
  }

  return (
    <div ref={menuRef} className="ff-mobile-notification-menu">
      <button
      type="button"
      onClick={() => setIsMenuOpen((current) => !current)}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)] active:scale-95"
      title="Notificações"
      aria-haspopup="menu"
      aria-expanded={isMenuOpen}
      aria-label={unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'}
    >
      <Bell size={20} />

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ff-accent)] px-1.5 text-center text-[10px] font-black leading-none text-white shadow-[0_0_14px_var(--ff-accent-shadow)]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      </button>

      {isMenuOpen && (
        <div className="ff-mobile-notification-menu__panel" role="menu" aria-label="Menu de notificações">
          <div className="ff-mobile-notification-menu__header">
            <div>
              <span>Notificações</span>
              <strong>{unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}</strong>
            </div>
            <button type="button" onClick={() => setIsMenuOpen(false)} aria-label="Fechar notificações">
              <X size={18} />
            </button>
          </div>

          <div className="ff-mobile-notification-menu__preview-list">
            {previewNotifications.length > 0 ? (
              previewNotifications.map((notification) => {
                const meta = getNotificationMeta(notification.type)
                const Icon = meta.icon
                const isUnread = notification.status === 'unread'

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={`ff-mobile-notification-menu__preview ${isUnread ? 'is-unread' : ''}`}
                    onClick={openNotificationsPage}
                  >
                    <span className="ff-mobile-notification-menu__preview-icon"><Icon size={16} /></span>
                    <span className="ff-mobile-notification-menu__preview-copy">
                      <strong>{notification.title}</strong>
                      <small>{notification.message || meta.label}</small>
                      <em>{isUnread ? 'Não lida' : 'Lida'} · {formatDateTime(notification.createdAt)}</em>
                    </span>
                  </button>
                )
              })
            ) : (
              <button type="button" className="ff-mobile-notification-menu__summary" onClick={openNotificationsPage}>
                <span><Inbox size={18} /></span>
                <div>
                  <strong>Tudo em dia</strong>
                  <small>Sem novas prévias agora.</small>
                </div>
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          <div className="ff-mobile-notification-menu__actions">
            <button type="button" onClick={openNotificationsPage}>Ver todas</button>
            <Link to="/settings" onClick={() => setIsMenuOpen(false)}>Preferências</Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
