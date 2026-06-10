import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Camera, ChevronRight, Dumbbell, Inbox, Settings, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { normalizeNotificationFromApi, formatDateTime, getNotificationMeta } from '../../features/notifications/notificationUtils'
import { apiFetch } from '../../services/api'
import { clearLegacyForgeFlowStorage, getUserStorageData } from '../../utils/userStorage'
import forgeflowIcon from '../../assets/forgeflow-icon.png'

const MAX_PREVIEW_NOTIFICATIONS = 5

function normalizeUnreadCount(apiUnreadCount, notifications = []) {
  const parsedApiCount = Number(apiUnreadCount)

  if (Number.isFinite(parsedApiCount)) {
    return Math.max(0, parsedApiCount)
  }

  return notifications.filter((item) => item.status === 'unread').length
}

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

function getSafeNotificationIcon(type) {
  const icons = {
    workout: Dumbbell,
    photo: Camera,
    weight: Dumbbell,
    goal: Dumbbell,
    success: Bell,
    warning: Bell,
    danger: Bell,
    recovery: Dumbbell,
    info: Bell,
  }

  return icons[type] || Bell
}


function unlockNotificationMenuScroll() {
  if (typeof document === 'undefined') return

  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  document.body.classList.remove('ff-notification-menu-open')
  document.documentElement.classList.remove('ff-notification-menu-open')
}

function NotificationBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [previewNotifications, setPreviewNotifications] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isLoadingRef = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setUnreadCount(0)
    setPreviewNotifications([])

    if (!user) return undefined

    let isMounted = true

    async function loadNotificationsPreview() {
      if (isLoadingRef.current) return

      isLoadingRef.current = true
      clearLegacyForgeFlowStorage(['notifications'])
      setUnreadCount(getUnreadCountFromCache(user))

      try {
        const data = await apiFetch(`/notifications?limit=${MAX_PREVIEW_NOTIFICATIONS}`)

        if (!isMounted) return

        const normalizedNotifications = Array.isArray(data?.notifications)
          ? data.notifications.map(normalizeNotificationFromApi)
          : []

        setUnreadCount(normalizeUnreadCount(data?.unreadCount, normalizedNotifications))
        setPreviewNotifications(normalizedNotifications.slice(0, MAX_PREVIEW_NOTIFICATIONS))
      } catch (error) {
        if (!isMounted) return

        const cachedNotifications = getUserStorageData(user, 'notifications', [])
        const normalizedCached = Array.isArray(cachedNotifications)
          ? cachedNotifications.map(normalizeNotificationFromApi).slice(0, MAX_PREVIEW_NOTIFICATIONS)
          : []

        setUnreadCount(normalizeUnreadCount(undefined, normalizedCached))
        setPreviewNotifications(normalizedCached)
        console.error(error)
      } finally {
        isLoadingRef.current = false
      }
    }

    function handleNotificationsChanged() {
      loadNotificationsPreview()
    }

    loadNotificationsPreview()

    window.addEventListener('focus', handleNotificationsChanged)
    window.addEventListener('forgeflow:notifications-changed', handleNotificationsChanged)

    const intervalId = window.setInterval(loadNotificationsPreview, 90000)

    return () => {
      isMounted = false
      window.removeEventListener('focus', handleNotificationsChanged)
      window.removeEventListener('forgeflow:notifications-changed', handleNotificationsChanged)
      window.clearInterval(intervalId)
    }
  }, [user])

  useEffect(() => {
    if (!isMenuOpen) {
      unlockNotificationMenuScroll()
      return undefined
    }

    document.body.classList.add('ff-notification-menu-open')
    document.documentElement.classList.add('ff-notification-menu-open')

    function handleEscape(event) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      unlockNotificationMenuScroll()
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  useEffect(() => {
    setIsMenuOpen(false)
    unlockNotificationMenuScroll()
  }, [location.pathname, location.search])

  function getNotificationId(notification) {
    const rawId = notification?.id ?? notification?._id ?? notification?.notificationId

    return rawId == null ? null : String(rawId)
  }

  function openNotificationsPage(notification = null) {
    const selectedNotificationId = getNotificationId(notification)

    setIsMenuOpen(false)
    unlockNotificationMenuScroll()

    if (selectedNotificationId) {
      try {
        window.sessionStorage.setItem('forgeflow:selected-notification-id', selectedNotificationId)
        window.dispatchEvent(new CustomEvent('forgeflow:open-notification-detail', {
          detail: { notificationId: selectedNotificationId },
        }))
      } catch {
        // Navegação continua funcionando mesmo se o WebView bloquear sessionStorage/eventos.
      }

      navigate({
        pathname: '/notifications',
        search: `?notification=${encodeURIComponent(selectedNotificationId)}`,
      }, {
        state: {
          fromNotificationBell: true,
          selectedNotificationId,
          openNotificationId: selectedNotificationId,
        },
      })
      return
    }

    navigate('/notifications', { state: { fromNotificationBell: true } })
  }

  function openNotificationSettings() {
    setIsMenuOpen(false)
    unlockNotificationMenuScroll()
    navigate({
      pathname: '/settings',
      search: '?section=notifications',
      hash: '#notifications',
    }, {
      state: {
        fromNotificationBell: true,
        openSettingsPanel: 'notifications',
        activeSettingsSection: 'notifications',
        scrollTo: 'notifications',
      },
    })
  }

  const previewItems = useMemo(
    () => previewNotifications.slice(0, MAX_PREVIEW_NOTIFICATIONS),
    [previewNotifications]
  )
  const unreadLabel = unreadCount > 0
    ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
    : 'Tudo em dia'

  const menu = isMenuOpen ? (
    <div className="ff-notification-menu" role="presentation">
      <button
        type="button"
        className="ff-notification-menu__backdrop"
        aria-label="Fechar notificações"
        onClick={() => setIsMenuOpen(false)}
      />

      <section
        className="ff-notification-menu__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ff-notification-menu-title"
      >
        <div className="ff-notification-menu__handle" aria-hidden="true" />

        <header className="ff-notification-menu__header">
          <div className="ff-notification-menu__brand-copy">
            <span className="ff-notification-menu__brand-icon" aria-hidden="true">
              <img src={forgeflowIcon} alt="" />
            </span>
            <span id="ff-notification-menu-title">Notificações</span>
            <strong>{unreadLabel}</strong>
            <small>Resumo rapido do ForgeFlow.</small>
          </div>

          <button type="button" onClick={() => setIsMenuOpen(false)} aria-label="Fechar notificações">
            <X size={18} />
          </button>
        </header>

        <main className="ff-notification-menu__content">
          <section className="ff-notification-menu__section" aria-labelledby="ff-notification-menu-recent-title">
            <div className="ff-notification-menu__section-title">
              <span id="ff-notification-menu-recent-title">Recentes</span>
              <em>{previewItems.length > 0 ? `${previewItems.length} item${previewItems.length === 1 ? '' : 's'}` : 'Nada novo'}</em>
            </div>

            {previewItems.length > 0 ? (
              <div className="ff-notification-menu__list">
                {previewItems.map((notification, index) => {
                  const meta = getNotificationMeta(notification.type)
                  const Icon = getSafeNotificationIcon(notification.type)
                  const isUnread = notification.status === 'unread'

                  return (
                    <button
                      key={notification.id ?? `${notification.type}-${index}`}
                      type="button"
                      className={`ff-notification-menu__item ${isUnread ? 'is-unread' : ''}`}
                      onClick={() => openNotificationsPage(notification)}
                    >
                      <span className="ff-notification-menu__icon"><Icon size={17} /></span>
                      <span className="ff-notification-menu__copy">
                        <strong>{notification.title || meta.label || 'Notificação'}</strong>
                        <small>{notification.message || 'Toque para ver detalhes.'}</small>
                        <em>{isUnread ? 'Não lida' : 'Lida'} · {getNotificationDateLabel(notification.createdAt)}</em>
                      </span>
                      <ChevronRight size={17} className="ff-notification-menu__chevron" />
                    </button>
                  )
                })}
              </div>
            ) : (
              <button type="button" className="ff-notification-menu__empty" onClick={() => openNotificationsPage()}>
                <span className="ff-notification-menu__icon"><Inbox size={20} /></span>
                <span className="ff-notification-menu__copy">
                  <strong>Sem notificações recentes</strong>
                  <small>Quando algo importante acontecer, aparece aqui.</small>
                </span>
                <ChevronRight size={18} className="ff-notification-menu__chevron" />
              </button>
            )}
          </section>
        </main>

        <footer className="ff-notification-menu__actions">
          <button type="button" onClick={() => openNotificationsPage()}>Ver todas</button>
          <button type="button" onClick={openNotificationSettings}><Settings size={15} /> Personalizar</button>
        </footer>
      </section>
    </div>
  ) : null

  return (
    <div className="relative">
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

      {typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
    </div>
  )
}

export default NotificationBell
