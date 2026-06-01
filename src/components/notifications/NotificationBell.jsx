import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronRight } from 'lucide-react'
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

function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [recentNotifications, setRecentNotifications] = useState([])
  const isLoadingRef = useRef(false)
  const menuRef = useRef(null)

  useEffect(() => {
    setUnreadCount(0)

    if (!user) return undefined

    let isMounted = true

    async function loadNotificationsCount() {
      if (isLoadingRef.current) return

      isLoadingRef.current = true
      clearLegacyForgeFlowStorage(['notifications'])
      const cachedNotifications = getUserStorageData(user, 'notifications', [])
      setUnreadCount(getUnreadCountFromCache(user))
      setRecentNotifications(Array.isArray(cachedNotifications) ? cachedNotifications.slice(0, 4) : [])

      try {
        const data = await apiFetch('/notifications?status=unread&limit=1')

        if (!isMounted) return

        setUnreadCount(Number(data?.unreadCount) || 0)
      } catch (error) {
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

    function handleClickOutside(event) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target)) setIsMenuOpen(false)
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  function openNotificationsPage() {
    setIsMenuOpen(false)
    navigate('/notifications')
  }

  return (
    <div ref={menuRef} className="ff-notification-bell">
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
        <div className="ff-notification-menu" role="menu" aria-label="Menu de notificações">
          <div className="ff-notification-menu__header">
            <div>
              <span>Central</span>
              <strong>Notificações</strong>
            </div>
            {unreadCount > 0 && <b>{unreadCount > 9 ? '9+' : unreadCount}</b>}
          </div>

          <div className="ff-notification-menu__list">
            {recentNotifications.length === 0 ? (
              <p>Nenhuma notificação recente.</p>
            ) : (
              recentNotifications.map((notification, index) => (
                <button
                  key={notification.id || `${notification.title || 'notificacao'}-${index}`}
                  type="button"
                  onClick={openNotificationsPage}
                  className={notification.status === 'unread' ? 'is-unread' : ''}
                >
                  <span>{notification.title || 'Notificação'}</span>
                  <small>{notification.message || notification.description || 'Toque para ver detalhes.'}</small>
                </button>
              ))
            )}
          </div>

          <button type="button" onClick={openNotificationsPage} className="ff-notification-menu__all">
            Ver todas
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
