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
import { normalizeNotificationFromApi, formatDateTime, getNotificationMeta } from '../../features/notifications/notificationUtils'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/api'
import { getUserAppSettings } from '../../utils/settingsUtils'
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
        : 'Configure a agenda semanal para ativar este aviso.',
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
  const menuRef = useRef(null)
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

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

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
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
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

  const previewItems = useMemo(() => previewNotifications.slice(0, 4), [previewNotifications])
  const reminderPreview = useMemo(() => buildReminderPreview(settingsSnapshot), [settingsSnapshot])
  const activeReminderCount = reminderPreview.filter((item) => item.enabled).length

  return (
    <div ref={menuRef} className="relative">
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
        <div className="fixed inset-0 z-[12000]">
          <button
            type="button"
            className="absolute inset-0 border-0 bg-black/70 p-0 backdrop-blur-[6px]"
            aria-label="Fechar notificações"
            onClick={() => setIsMenuOpen(false)}
          />

          <section
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[82dvh] w-full max-w-[560px] flex-col rounded-t-[28px] border border-[var(--ff-border)] bg-[#151619] shadow-[0_-18px_50px_rgba(0,0,0,.65)] md:bottom-auto md:right-4 md:top-[calc(env(safe-area-inset-top)+72px)] md:mx-0 md:w-[420px] md:max-h-[680px] md:rounded-[24px]"
            role="dialog"
            aria-modal="true"
            aria-label="Prévia de notificações"
          >
            <div className="mx-auto mt-3 h-1.5 w-11 rounded-full bg-white/15 md:hidden" aria-hidden="true" />

            <div className="flex items-start justify-between gap-3 border-b border-[var(--ff-border)] px-4 pb-3 pt-4">
              <div className="min-w-0">
                <span className="block text-[0.7rem] font-black uppercase tracking-[0.18em] text-[var(--ff-muted)]">
                  Notificações
                </span>
                <strong className="mt-1 block text-[1.2rem] font-black leading-tight text-[var(--ff-text)]">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : `${activeReminderCount} lembrete${activeReminderCount === 1 ? '' : 's'} ativo${activeReminderCount === 1 ? '' : 's'}`}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Fechar notificações"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-text-soft)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <div className="grid gap-4">
                <section className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">
                      Recentes
                    </span>
                    <span className="text-[0.68rem] font-black text-[var(--ff-muted-2)]">
                      {previewItems.length > 0 ? `${previewItems.length} prévia(s)` : 'Nada novo'}
                    </span>
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
                          className={`grid w-full grid-cols-[46px_minmax(0,1fr)] items-start gap-3 rounded-[20px] border p-3 text-left ${
                            isUnread
                              ? 'border-[color:var(--ff-accent-border)] bg-[color:var(--ff-accent-soft)]/20'
                              : 'border-[var(--ff-border)] bg-white/[0.03]'
                          }`}
                          onClick={openNotificationsPage}
                        >
                          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                            <Icon size={18} />
                          </span>

                          <span className="min-w-0">
                            <strong className="block truncate text-[0.95rem] font-black leading-tight text-[var(--ff-text)]">
                              {notification.title || meta.label || 'Notificação'}
                            </strong>
                            <small
                              className="mt-1 block text-[0.78rem] font-medium leading-[1.28] text-[var(--ff-muted)]"
                              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                            >
                              {notification.message || 'Toque para ver detalhes.'}
                            </small>
                            <em className="mt-2 block text-[0.68rem] not-italic font-bold tracking-[0.02em] text-[var(--ff-muted-2)]">
                              {isUnread ? 'Não lida' : 'Lida'} · {getNotificationDateLabel(notification.createdAt)}
                            </em>
                          </span>
                        </button>
                      )
                    })
                  ) : (
                    <button
                      type="button"
                      className="grid w-full grid-cols-[46px_minmax(0,1fr)_18px] items-center gap-3 rounded-[20px] border border-[var(--ff-border)] bg-white/[0.03] p-3 text-left"
                      onClick={openNotificationsPage}
                    >
                      <span className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                        <Inbox size={20} />
                      </span>
                      <div className="min-w-0">
                        <strong className="block text-[0.95rem] font-black text-[var(--ff-text)]">Sem notificações recentes</strong>
                        <small className="mt-1 block text-[0.78rem] font-medium text-[var(--ff-muted)]">
                          Seus lembretes configurados aparecem abaixo com horário.
                        </small>
                      </div>
                      <ChevronRight size={18} className="text-[var(--ff-muted)]" />
                    </button>
                  )}
                </section>

                <section className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">
                      Lembretes configurados
                    </span>
                    <button
                      type="button"
                      onClick={openNotificationSettings}
                      className="text-[0.72rem] font-black text-[var(--ff-accent-text)]"
                    >
                      Personalizar
                    </button>
                  </div>

                  {reminderPreview.map((reminder) => {
                    const Icon = reminder.icon
                    return (
                      <button
                        key={reminder.key}
                        type="button"
                        onClick={openNotificationSettings}
                        className={`grid w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border p-3 text-left ${
                          reminder.enabled
                            ? 'border-[color:var(--ff-accent-border)] bg-[color:var(--ff-accent-soft)]/18'
                            : 'border-[var(--ff-border)] bg-white/[0.025] opacity-75'
                        }`}
                      >
                        <span className="flex h-[42px] w-[42px] items-center justify-center rounded-2xl bg-black/25 text-[var(--ff-accent-text)]">
                          <Icon size={17} />
                        </span>

                        <span className="min-w-0">
                          <strong className="block truncate text-[0.9rem] font-black text-[var(--ff-text)]">
                            {reminder.title}
                          </strong>
                          <small className="mt-1 block truncate text-[0.74rem] font-semibold text-[var(--ff-muted)]">
                            {reminder.description}
                          </small>
                        </span>

                        <span className="grid justify-items-end gap-1">
                          <strong className="rounded-full border border-[var(--ff-border)] bg-black/25 px-2.5 py-1 text-[0.72rem] font-black text-[var(--ff-text)]">
                            {reminder.time}
                          </strong>
                          <em className={`text-[0.62rem] not-italic font-black uppercase tracking-[0.08em] ${reminder.enabled ? 'text-emerald-300' : 'text-[var(--ff-muted-2)]'}`}>
                            {reminder.enabled ? 'Ativo' : 'Off'}
                          </em>
                        </span>
                      </button>
                    )
                  })}
                </section>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[var(--ff-border)] px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                onClick={openNotificationsPage}
                className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent)] px-4 text-[0.82rem] font-black text-white shadow-[0_10px_30px_rgba(10,132,255,.28)]"
              >
                Ver todas
              </button>
              <button
                type="button"
                onClick={openNotificationSettings}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[0.82rem] font-black text-[var(--ff-text)]"
              >
                <Settings size={15} />
                Preferências
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
