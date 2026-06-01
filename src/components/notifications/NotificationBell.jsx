import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronRight, Inbox, Settings, X } from 'lucide-react'
import { normalizeNotificationFromApi, formatDateTime, getNotificationMeta } from '../../features/notifications/notificationUtils'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/api'
import { clearLegacyForgeFlowStorage, getUserStorageData } from '../../utils/userStorage'

function getUnreadCountFromCache(user) {
  const cachedNotifications = getUserStorageData(user, 'notifications', [])

  return Array.isArray(cachedNotifications)
    ? cachedNotifications.filter((item) => item.status === 'unread').length
    : 0
}

function getNotificationDateLabel(value) {
  if (!value) return 'Agora'

  try {
    return formatDateTime(value)
  } catch {
    return 'Agora'
  }
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
        const data = await apiFetch('/notifications?limit=6')

        if (!isMounted) return

        const normalizedNotifications = Array.isArray(data?.notifications)
          ? data.notifications.map(normalizeNotificationFromApi)
          : []

        setUnreadCount(Number(data?.unreadCount) || normalizedNotifications.filter((item) => item.status === 'unread').length)
        setPreviewNotifications(normalizedNotifications.slice(0, 6))
      } catch (error) {
        const cachedNotifications = getUserStorageData(user, 'notifications', [])
        const normalizedCached = Array.isArray(cachedNotifications)
          ? cachedNotifications.map(normalizeNotificationFromApi).slice(0, 6)
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

  function openNotificationSettings() {
    setIsMenuOpen(false)
    navigate('/settings', { state: { openSettingsPanel: 'notifications' } })
  }

  const hasPreview = previewNotifications.length > 0

  return (
    <div ref={menuRef} className="ff-mobile-notification-menu">
      <button
        type="button"
        onClick={() => setIsMenuOpen((current) => !current)}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)] active:scale-95"
        title="Notificações"
        aria-haspopup="dialog"
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
        <div className="ff-notification-popover" role="dialog" aria-label="Prévia de notificações">
          <div className="ff-notification-popover__header">
            <div>
              <span>Notificações</span>
              <strong>{unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}</strong>
            </div>
            <button type="button" onClick={() => setIsMenuOpen(false)} aria-label="Fechar notificações">
              <X size={18} />
            </button>
          </div>

          <div className="ff-notification-popover__list">
            {hasPreview ? (
              previewNotifications.map((notification) => {
                const meta = getNotificationMeta(notification.type)
                const Icon = meta.icon
                const isUnread = notification.status === 'unread'

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={`ff-notification-popover__item ${isUnread ? 'is-unread' : ''}`}
                    onClick={openNotificationsPage}
                  >
                    <span className="ff-notification-popover__icon"><Icon size={16} /></span>
                    <span className="ff-notification-popover__copy">
                      <strong>{notification.title || meta.label || 'Notificação'}</strong>
                      <small>{notification.message || 'Toque para ver detalhes.'}</small>
                      <em>{isUnread ? 'Não lida' : 'Lida'} · {getNotificationDateLabel(notification.createdAt)}</em>
                    </span>
                  </button>
                )
              })
            ) : (
              <button type="button" className="ff-notification-popover__empty" onClick={openNotificationsPage}>
                <span><Inbox size={20} /></span>
                <div>
                  <strong>Sem notificações recentes</strong>
                  <small>Quando algo importante acontecer, aparece aqui.</small>
                </div>
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          <div className="ff-notification-popover__actions">
            <button type="button" onClick={openNotificationsPage}>Ver todas</button>
            <button type="button" onClick={openNotificationSettings}><Settings size={15} /> Preferências</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
