import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  CalendarCheck,
  Camera,
  ChevronRight,
  Droplets,
  Inbox,
  Moon,
  Settings,
  Utensils,
  Weight,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { normalizeNotificationFromApi, formatDateTime, getNotificationMeta } from '../../features/notifications/notificationUtils'
import { apiFetch } from '../../services/api'
import { getUserAppSettings } from '../../utils/settingsUtils'
import { clearLegacyForgeFlowStorage, getUserStorageData } from '../../utils/userStorage'

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

function getWorkoutDaysCount(schedule = {}) {
  return Object.values(schedule || {}).filter((day) => day?.type === 'workout' && day?.workoutId).length
}

function formatTimeLabel(value, fallback = '--:--') {
  const time = String(value || '').trim()
  return /^\d{2}:\d{2}$/.test(time) ? time : fallback
}

function buildReminderPreview(settings = {}) {
  const workoutDays = getWorkoutDaysCount(settings.weeklySchedule)

  return [
    {
      key: 'workout',
      icon: CalendarCheck,
      title: 'Treino do dia',
      time: formatTimeLabel(settings.workoutReminderTime, '18:00'),
      enabled: Boolean(settings.workoutReminderEnabled),
      description: workoutDays > 0
        ? `${workoutDays} dia(s) configurado(s) na agenda semanal.`
        : 'Configure sua agenda semanal para ativar este aviso.',
    },
    {
      key: 'weight',
      icon: Weight,
      title: 'Registrar peso',
      time: formatTimeLabel(settings.weightReminderTime, '08:00'),
      enabled: Boolean(settings.weightReminderEnabled),
      description: 'Lembrete diário para acompanhar evolução corporal.',
    },
    {
      key: 'hydration',
      icon: Droplets,
      title: 'Beber água',
      time: formatTimeLabel(settings.hydrationReminderTime, '10:00'),
      enabled: Boolean(settings.hydrationReminderEnabled),
      description: 'Aviso de hidratação durante o dia.',
    },
    {
      key: 'preWorkoutMeal',
      icon: Utensils,
      title: 'Refeição pré-treino',
      time: formatTimeLabel(settings.preWorkoutMealReminderTime, '16:30'),
      enabled: Boolean(settings.preWorkoutMealReminderEnabled),
      description: 'Ajuda a lembrar de comer antes do treino.',
    },
    {
      key: 'postWorkoutMeal',
      icon: Utensils,
      title: 'Refeição pós-treino',
      time: formatTimeLabel(settings.postWorkoutMealReminderTime, '20:30'),
      enabled: Boolean(settings.postWorkoutMealReminderEnabled),
      description: 'Ajuda na rotina de recuperação depois do treino.',
    },
    {
      key: 'progressPhoto',
      icon: Camera,
      title: 'Foto de progresso',
      time: formatTimeLabel(settings.progressPhotoReminderTime, '09:00'),
      enabled: Boolean(settings.progressPhotoReminderEnabled),
      description: 'Lembrete para registrar evolução visual.',
    },
    {
      key: 'sleep',
      icon: Moon,
      title: 'Dormir bem',
      time: formatTimeLabel(settings.sleepReminderTime, '22:30'),
      enabled: Boolean(settings.sleepReminderEnabled),
      description: 'Lembra que descanso também faz parte da evolução.',
    },
  ]
}

function NotificationBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [previewNotifications, setPreviewNotifications] = useState([])
  const [settingsSnapshot, setSettingsSnapshot] = useState(() => getUserAppSettings(user))
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const panelRef = useRef(null)
  const isLoadingRef = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    setSettingsSnapshot(getUserAppSettings(user))

    function handleSettingsChanged(event) {
      setSettingsSnapshot(event.detail || getUserAppSettings(user))
    }

    window.addEventListener('forgeflow:settings-changed', handleSettingsChanged)

    return () => {
      window.removeEventListener('forgeflow:settings-changed', handleSettingsChanged)
    }
  }, [user])

  useEffect(() => {
    setUnreadCount(0)
    setPreviewNotifications([])

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

        setUnreadCount(normalizeUnreadCount(data?.unreadCount, normalizedNotifications))
        setPreviewNotifications(normalizedNotifications.slice(0, 6))
      } catch (error) {
        const cachedNotifications = getUserStorageData(user, 'notifications', [])
        const normalizedCached = Array.isArray(cachedNotifications)
          ? cachedNotifications.map(normalizeNotificationFromApi).slice(0, 6)
          : []

        setUnreadCount(normalizeUnreadCount(undefined, normalizedCached))
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

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    function handleEscape(event) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
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

  const previewItems = useMemo(() => previewNotifications.slice(0, 4), [previewNotifications])
  const reminderPreview = useMemo(() => buildReminderPreview(settingsSnapshot), [settingsSnapshot])
  const activeReminderCount = reminderPreview.filter((item) => item.enabled).length

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

      {isMenuOpen && (
        <div className="ff-notifications-v2" role="presentation">
          <button
            type="button"
            className="ff-notifications-v2__backdrop"
            aria-label="Fechar notificações"
            onClick={() => setIsMenuOpen(false)}
          />

          <section
            ref={panelRef}
            className="ff-notifications-v2__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Prévia de notificações"
          >
            <div className="ff-notifications-v2__handle" aria-hidden="true" />

            <header className="ff-notifications-v2__header">
              <div>
                <span>Notificações</span>
                <strong>
                  {unreadCount > 0
                    ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                    : `${activeReminderCount} lembrete${activeReminderCount === 1 ? '' : 's'} ativo${activeReminderCount === 1 ? '' : 's'}`}
                </strong>
              </div>

              <button type="button" onClick={() => setIsMenuOpen(false)} aria-label="Fechar notificações">
                <X size={18} />
              </button>
            </header>

            <main className="ff-notifications-v2__content">
              <section className="ff-notifications-v2__section">
                <div className="ff-notifications-v2__section-title">
                  <span>Recentes</span>
                  <em>{previewItems.length > 0 ? `${previewItems.length} prévia(s)` : 'Nada novo'}</em>
                </div>

                {previewItems.length > 0 ? (
                  previewItems.map((notification, index) => {
                    const meta = getNotificationMeta(notification.type)
                    const Icon = meta.icon
                    const isUnread = notification.status === 'unread'

                    return (
                      <button
                        key={notification.id ?? `${notification.type}-${index}`}
                        type="button"
                        className={`ff-notifications-v2__item ${isUnread ? 'is-unread' : ''}`}
                        onClick={openNotificationsPage}
                      >
                        <span className="ff-notifications-v2__icon"><Icon size={18} /></span>
                        <span className="ff-notifications-v2__copy">
                          <strong>{notification.title || meta.label || 'Notificação'}</strong>
                          <small>{notification.message || 'Toque para ver detalhes.'}</small>
                          <em>{isUnread ? 'Não lida' : 'Lida'} · {getNotificationDateLabel(notification.createdAt)}</em>
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <button type="button" className="ff-notifications-v2__empty" onClick={openNotificationsPage}>
                    <span className="ff-notifications-v2__icon"><Inbox size={20} /></span>
                    <span className="ff-notifications-v2__copy">
                      <strong>Sem notificações recentes</strong>
                      <small>Seus lembretes configurados aparecem abaixo com horário.</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                )}
              </section>

              <section className="ff-notifications-v2__section">
                <div className="ff-notifications-v2__section-title">
                  <span>Lembretes configurados</span>
                  <button type="button" onClick={openNotificationSettings}>Personalizar</button>
                </div>

                {reminderPreview.map((reminder) => {
                  const Icon = reminder.icon
                  return (
                    <button
                      key={reminder.key}
                      type="button"
                      onClick={openNotificationSettings}
                      className={`ff-notifications-v2__reminder ${reminder.enabled ? 'is-enabled' : ''}`}
                    >
                      <span className="ff-notifications-v2__icon"><Icon size={17} /></span>
                      <span className="ff-notifications-v2__copy">
                        <strong>{reminder.title}</strong>
                        <small>{reminder.description}</small>
                      </span>
                      <span className="ff-notifications-v2__time">
                        <strong>{reminder.time}</strong>
                        <em>{reminder.enabled ? 'Ativo' : 'Off'}</em>
                      </span>
                    </button>
                  )
                })}
              </section>
            </main>

            <footer className="ff-notifications-v2__actions">
              <button type="button" onClick={openNotificationsPage}>Ver todas</button>
              <button type="button" onClick={openNotificationSettings}><Settings size={15} /> Preferências</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
