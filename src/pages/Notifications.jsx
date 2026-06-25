import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BellRing, Settings2 } from 'lucide-react'

import AppPageIntro from '../components/app/AppPageIntro'
import { useAuth } from '../context/AuthContext'
import NotificationsPageSections from '../features/notifications/components/NotificationsPageSections'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  buildNotificationSummary,
  normalizeNotificationFromApi,
  normalizeNotificationPreferences,
} from '../features/notifications/notificationUtils'
import { apiFetch } from '../services/api'
import {
  DEFAULT_LIFESTYLE_REMINDERS,
  cancelCustomReminder,
  checkNotificationPermission,
  requestNotificationPermission,
  rescheduleCustomReminders,
  scheduleTestNotification,
} from '../services/nativeNotificationService'
import { generateSmartNotifications } from '../utils/notificationUtils'
import {
  clearLegacyForgeFlowStorage,
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

const REMINDER_STORAGE_KEY = 'notification-reminders-v1'
const PREFERENCES_STORAGE_KEY = 'notification-preferences-v2'

function createReminderId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `reminder-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

function normalizeReminder(reminder = {}) {
  return {
    id: reminder.id || createReminderId(),
    title: String(reminder.title || 'Lembrete ForgeFlow').trim(),
    body: String(reminder.body || reminder.title || 'Seu lembrete está na hora.').trim(),
    time: /^\d{2}:\d{2}$/.test(String(reminder.time || '')) ? reminder.time : '18:00',
    days: Array.isArray(reminder.days) ? reminder.days : [],
    enabled: reminder.enabled !== false,
    actionUrl: reminder.actionUrl || '/notifications',
    preset: Boolean(reminder.preset),
  }
}

function getInitialReminderDraft() {
  return {
    title: '',
    body: '',
    time: '18:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    enabled: true,
    actionUrl: '/notifications',
  }
}

function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [notifications, setNotifications] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [visibleCount, setVisibleCount] = useState(12)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('local')
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [customReminders, setCustomReminders] = useState([])
  const [reminderDraft, setReminderDraft] = useState(getInitialReminderDraft)
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES)
  const [permission, setPermission] = useState({ display: 'prompt' })
  const [testingNotification, setTestingNotification] = useState(false)
  const openedNotificationTargetRef = useRef('')

  const showToast = useCallback((type, title, message = '') => {
    setToast({ type, title, message })

    window.setTimeout(() => {
      setToast(null)
    }, 3200)
  }, [])

  const notifyBellToRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent('forgeflow:notifications-changed'))
  }, [])

  const refreshPermissionStatus = useCallback(async () => {
    try {
      const nextPermission = await checkNotificationPermission()
      setPermission(nextPermission || { display: 'prompt' })
      return nextPermission
    } catch {
      setPermission({ display: 'prompt' })
      return { display: 'prompt' }
    }
  }, [])

  const loadNotifications = useCallback(
    async (filter = statusFilter) => {
      if (!user) {
        setNotifications([])
        setLoading(false)
        return
      }

      clearLegacyForgeFlowStorage(['notifications'])

      const cachedNotifications = getUserStorageData(user, 'notifications', [])
      const normalizedCached = Array.isArray(cachedNotifications)
        ? cachedNotifications.map(normalizeNotificationFromApi)
        : []

      setNotifications(normalizedCached)
      setLoading(normalizedCached.length === 0)
      setSource('local')

      try {
        const query = filter ? `?status=${filter}&limit=80` : '?limit=80'
        const data = await apiFetch(`/notifications${query}`)
        const normalizedNotifications = Array.isArray(data?.notifications)
          ? data.notifications.map(normalizeNotificationFromApi)
          : []

        setNotifications(normalizedNotifications)
        saveUserStorageData(user, 'notifications', normalizedNotifications)
        setSource('database')
        notifyBellToRefresh()
      } catch (error) {
        console.warn('[ForgeFlow] Notificações em modo local:', error)
      } finally {
        setLoading(false)
      }
    },
    [notifyBellToRefresh, statusFilter, user],
  )

  useEffect(() => {
    if (!user) return

    const storedPreferences = getUserStorageData(user, PREFERENCES_STORAGE_KEY, DEFAULT_NOTIFICATION_PREFERENCES)
    const normalizedPreferences = normalizeNotificationPreferences(storedPreferences)

    setPreferences(normalizedPreferences)
    saveUserStorageData(user, PREFERENCES_STORAGE_KEY, normalizedPreferences)
  }, [user])

  useEffect(() => {
    if (!user) {
      setCustomReminders([])
      return
    }

    const stored = getUserStorageData(user, REMINDER_STORAGE_KEY, null)
    const reminders = Array.isArray(stored)
      ? stored.map(normalizeReminder)
      : DEFAULT_LIFESTYLE_REMINDERS.map((reminder) => normalizeReminder({ ...reminder, preset: true }))

    setCustomReminders(reminders)
    saveUserStorageData(user, REMINDER_STORAGE_KEY, reminders)

    rescheduleCustomReminders(reminders).catch((error) => console.warn('[ForgeFlow] Lembretes locais:', error))
  }, [user])

  useEffect(() => {
    setNotifications([])
    setSelectedNotification(null)
    openedNotificationTargetRef.current = ''
    loadNotifications()
    refreshPermissionStatus()
  }, [loadNotifications, refreshPermissionStatus, statusFilter])

  useEffect(() => {
    setVisibleCount(12)
  }, [deferredSearch, statusFilter])


  const persistNotifications = useCallback(
    (nextNotifications) => {
      setNotifications(nextNotifications)
      saveUserStorageData(user, 'notifications', nextNotifications)
      notifyBellToRefresh()
    },
    [notifyBellToRefresh, user],
  )

  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      const notification = notifications.find((item) => String(item.id) === String(notificationId))

      if (!notification || notification.status !== 'unread') {
        return notification || null
      }

      try {
        const updatedFromApi = await apiFetch(`/notifications/${notificationId}/read`, {
          method: 'PATCH',
        })

        const updatedNotification = normalizeNotificationFromApi(updatedFromApi)
        const updated = notifications.map((item) =>
          String(item.id) === String(notificationId) ? updatedNotification : item,
        )

        persistNotifications(updated)
        return updatedNotification
      } catch {
        const updatedNotification = {
          ...notification,
          status: 'read',
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const updated = notifications.map((item) =>
          String(item.id) === String(notificationId) ? updatedNotification : item,
        )

        persistNotifications(updated)
        return updatedNotification
      }
    },
    [notifications, persistNotifications],
  )

  useEffect(() => {
    if (!notifications.length) return

    const params = new URLSearchParams(location.search)
    const notificationIdFromUrl = params.get('notification')
    const notificationIdFromState = location.state?.selectedNotificationId || location.state?.openNotificationId
    const notificationIdFromStorage = (() => {
      try {
        return window.sessionStorage.getItem('forgeflow:selected-notification-id') || ''
      } catch {
        return ''
      }
    })()

    const targetId = notificationIdFromUrl || notificationIdFromState || notificationIdFromStorage

    if (!targetId || openedNotificationTargetRef.current === String(targetId)) return

    const targetNotification = notifications.find((item) => String(item.id) === String(targetId))
    if (!targetNotification) return

    openedNotificationTargetRef.current = String(targetId)
    setSelectedNotification(targetNotification)

    if (targetNotification.status === 'unread') {
      markNotificationAsRead(targetNotification.id).then((updatedNotification) => {
        if (updatedNotification) setSelectedNotification(updatedNotification)
      })
    }

    try {
      window.sessionStorage.removeItem('forgeflow:selected-notification-id')
    } catch {
      // Ignora bloqueio do WebView.
    }
  }, [location.search, location.state, markNotificationAsRead, notifications])

  const summary = useMemo(() => {
    return buildNotificationSummary(notifications, preferences, customReminders, permission)
  }, [customReminders, notifications, permission, preferences])

  const filteredNotifications = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim()

    return notifications.filter((notification) => {
      if (statusFilter) {
        if (notification.status !== statusFilter) return false
      } else if (notification.status === 'archived') {
        return false
      }

      if (!term) return true

      return `${notification.title} ${notification.message} ${notification.type} ${notification.status}`
        .toLowerCase()
        .includes(term)
    })
  }, [deferredSearch, notifications, statusFilter])

  const visibleNotifications = useMemo(() => {
    return filteredNotifications.slice(0, visibleCount)
  }, [filteredNotifications, visibleCount])

  async function handleOpenNotification(notification) {
    const updatedNotification = await markNotificationAsRead(notification?.id)
    setSelectedNotification(updatedNotification || notification)
  }

  async function handleMarkAsRead(notificationId) {
    const updatedNotification = await markNotificationAsRead(notificationId)

    if (updatedNotification) {
      showToast('success', 'Notificação lida', 'A notificação foi marcada como lida.')
    }
  }

  async function handleMarkAsUnread(notificationId) {
    const notification = notifications.find((item) => String(item.id) === String(notificationId))
    if (!notification || notification.status === 'unread') return

    const updatedNotification = {
      ...notification,
      status: 'unread',
      readAt: null,
      updatedAt: new Date().toISOString(),
    }

    try {
      const updatedFromApi = await apiFetch(`/notifications/${notificationId}/unread`, {
        method: 'PATCH',
      })
      Object.assign(updatedNotification, normalizeNotificationFromApi(updatedFromApi))
    } catch {
      // Mantém fallback local quando o endpoint não existir.
    }

    const updated = notifications.map((item) =>
      String(item.id) === String(notificationId) ? updatedNotification : item,
    )

    persistNotifications(updated)
    setSelectedNotification((current) => (String(current?.id) === String(notificationId) ? updatedNotification : current))
    showToast('success', 'Notificação marcada', 'A notificação voltou para não lida.')
  }

  async function handleArchiveNotification(notificationId) {
    const notification = notifications.find((item) => String(item.id) === String(notificationId))
    if (!notification) return

    let updatedNotification = {
      ...notification,
      status: 'archived',
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      const updatedFromApi = await apiFetch(`/notifications/${notificationId}/archive`, {
        method: 'PATCH',
      })
      updatedNotification = normalizeNotificationFromApi(updatedFromApi)
    } catch {
      // Mantém fallback local.
    }

    const updated = notifications.map((item) =>
      String(item.id) === String(notificationId) ? updatedNotification : item,
    )

    persistNotifications(updated)
    setSelectedNotification((current) => (String(current?.id) === String(notificationId) ? null : current))
    showToast('success', 'Notificação arquivada', 'Ela saiu da lista principal e pode ser vista no filtro Arquivadas.')
  }

  async function handleUnarchiveNotification(notificationId) {
    const notification = notifications.find((item) => String(item.id) === String(notificationId))
    if (!notification || notification.status !== 'archived') return

    let updatedNotification = {
      ...notification,
      status: 'read',
      archivedAt: null,
      readAt: notification.readAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      const updatedFromApi = await apiFetch(`/notifications/${notificationId}/unarchive`, {
        method: 'PATCH',
      })
      updatedNotification = normalizeNotificationFromApi(updatedFromApi)
    } catch {
      // Mantém fallback local quando o endpoint remoto não existir.
    }

    const updated = notifications.map((item) =>
      String(item.id) === String(notificationId) ? updatedNotification : item,
    )

    persistNotifications(updated)
    setSelectedNotification((current) => (String(current?.id) === String(notificationId) ? null : current))
    showToast('success', 'Notificação desarquivada', 'Ela voltou para a lista principal.')
  }

  function handleDeleteNotification(notificationId) {
    const notification = notifications.find((item) => String(item.id) === String(notificationId))

    setConfirmModal({
      title: 'Excluir notificação?',
      description: `A notificação "${notification?.title || 'selecionada'}" será removida da central.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch(`/notifications/${notificationId}`, { method: 'DELETE' })
        } catch {
          // Remove localmente mesmo sem endpoint remoto.
        }

        const updated = notifications.filter((item) => String(item.id) !== String(notificationId))
        persistNotifications(updated)
        setSelectedNotification((current) => (String(current?.id) === String(notificationId) ? null : current))
        setConfirmModal(null)
        showToast('success', 'Notificação excluída', 'A notificação foi removida.')
      },
    })
  }

  async function handleMarkAllAsRead() {
    const readAt = new Date().toISOString()

    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' })
    } catch {
      // Mantém fallback local.
    }

    const updated = notifications.map((item) =>
      item.status === 'unread'
        ? { ...item, status: 'read', readAt, updatedAt: readAt }
        : item,
    )

    persistNotifications(updated)
    setSelectedNotification((current) =>
      current?.status === 'unread'
        ? { ...current, status: 'read', readAt, updatedAt: readAt }
        : current,
    )
    showToast('success', 'Tudo lido', 'Todas as notificações foram marcadas como lidas.')
  }

  async function handleGenerateNotifications() {
    try {
      const data = await generateSmartNotifications({
        user,
        reason: 'manual-check',
        force: true,
      })

      const normalizedNotifications = Array.isArray(data?.notifications)
        ? data.notifications.map(normalizeNotificationFromApi)
        : notifications

      persistNotifications(normalizedNotifications)

      showToast(
        'success',
        'Notificações verificadas',
        data?.created > 0
          ? `${data.created} nova(s) notificação(ões) criada(s).`
          : 'Nenhuma nova notificação no momento.',
      )
    } catch (error) {
      console.warn('[ForgeFlow] Não foi possível verificar notificações:', error)
      showToast('error', 'Erro ao verificar', error.message || 'Não foi possível verificar notificações.')
    }
  }

  async function handleRequestPermission() {
    try {
      const requested = await requestNotificationPermission()
      setPermission(requested || { display: 'prompt' })

      if (requested?.display === 'granted') {
        showToast('success', 'Permissão ativada', 'Você receberá lembretes deste dispositivo.')
      } else {
        showToast('error', 'Permissão necessária', 'Ative as notificações nas configurações do Android.')
      }
    } catch {
      showToast('error', 'Permissão indisponível', 'Não foi possível verificar as notificações agora.')
    }
  }

  async function handleTestNotification() {
    setTestingNotification(true)

    try {
      const result = await scheduleTestNotification(3)
      await refreshPermissionStatus()

      if (result?.scheduled) {
        showToast('success', 'Notificação de teste enviada', 'O alerta deve aparecer em alguns segundos.')
      } else if (result?.reason === 'not-native') {
        showToast('info', 'Teste salvo', 'No navegador, o envio real acontece pelo app Android.')
      } else {
        showToast('error', 'Não foi possível enviar o teste', 'Verifique as permissões do app.')
      }
    } catch {
      showToast('error', 'Não foi possível enviar a notificação', 'Verifique as permissões do app e tente novamente.')
    } finally {
      setTestingNotification(false)
    }
  }

  function persistReminders(nextReminders) {
    const normalized = nextReminders.map(normalizeReminder)

    setCustomReminders(normalized)
    saveUserStorageData(user, REMINDER_STORAGE_KEY, normalized)
    rescheduleCustomReminders(normalized).catch((error) => console.warn('[ForgeFlow] Lembretes locais:', error))
  }

  function handleReminderDraftChange(field, value) {
    setReminderDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleReminderDayToggle(dayKey) {
    setReminderDraft((current) => {
      const currentDays = Array.isArray(current.days) ? current.days : []
      const days = currentDays.includes(dayKey)
        ? currentDays.filter((item) => item !== dayKey)
        : [...currentDays, dayKey]

      return { ...current, days }
    })
  }

  function handleCreateReminder(event) {
    event.preventDefault()

    const title = String(reminderDraft.title || '').trim()
    const body = String(reminderDraft.body || '').trim()

    if (!title || !reminderDraft.time) {
      showToast('error', 'Lembrete incompleto', 'Informe título e horário.')
      return
    }

    const nextReminder = normalizeReminder({
      ...reminderDraft,
      id: createReminderId(),
      title,
      body: body || title,
      enabled: true,
      preset: false,
    })

    persistReminders([nextReminder, ...customReminders])
    setReminderDraft(getInitialReminderDraft())
    showToast('success', 'Lembrete criado', 'O lembrete foi salvo no app.')
  }

  function handleToggleReminder(reminderId) {
    const nextReminders = customReminders.map((reminder) =>
      String(reminder.id) === String(reminderId)
        ? { ...reminder, enabled: !reminder.enabled }
        : reminder,
    )

    persistReminders(nextReminders)
  }

  function handleDeleteReminder(reminderId) {
    const reminder = customReminders.find((item) => String(item.id) === String(reminderId))
    const nextReminders = customReminders.filter((item) => String(item.id) !== String(reminderId))

    setCustomReminders(nextReminders)
    saveUserStorageData(user, REMINDER_STORAGE_KEY, nextReminders)
    cancelCustomReminder(reminder).catch((error) => console.warn('[ForgeFlow] Cancelamento de lembrete:', error))
    showToast('success', 'Lembrete removido', 'O lembrete foi apagado.')
  }

  function handleTogglePreference(preferenceKey) {
    const nextPreferences = normalizeNotificationPreferences({
      ...preferences,
      [preferenceKey]: !preferences[preferenceKey],
    })

    setPreferences(nextPreferences)
    saveUserStorageData(user, PREFERENCES_STORAGE_KEY, nextPreferences)
    showToast('success', 'Preferência salva', 'A configuração foi atualizada.')
  }

  function handleOpenAction(notification) {
    if (!notification?.actionUrl) return

    setSelectedNotification(null)
    navigate(notification.actionUrl)
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-notifications notifications-page">
      <AppPageIntro
        eyebrow="Central"
        title="Notificações"
        description="Seus alertas, lembretes e avisos importantes."
        metrics={[
          { label: 'Não lidas', value: summary.unread },
          { label: 'Lembretes', value: summary.activeAlerts },
          { label: 'Permissão', value: summary.permissionLabel },
        ]}
        action={
          <div className="ff-page-intro-actions">
            <button type="button" onClick={handleTestNotification} aria-label="Testar notificação">
              <BellRing size={18} />
            </button>
            <button type="button" onClick={handleRequestPermission} aria-label="Verificar permissão">
              <Settings2 size={18} />
            </button>
          </div>
        }
      />

      <div className="ff-notifications-body ff-page-mobile-main-grid">
        <NotificationsPageSections
          source={source}
          loading={loading}
          summary={summary}
          permission={permission}
          testingNotification={testingNotification}
          preferences={preferences}
          search={search}
          statusFilter={statusFilter}
          filteredNotifications={filteredNotifications}
          visibleNotifications={visibleNotifications}
          visibleCount={visibleCount}
          selectedNotification={selectedNotification}
          customReminders={customReminders}
          reminderDraft={reminderDraft}
          confirmModal={confirmModal}
          toast={toast}
          onRefresh={() => loadNotifications()}
          onGenerate={handleGenerateNotifications}
          onRequestPermission={handleRequestPermission}
          onTestNotification={handleTestNotification}
          onTogglePreference={handleTogglePreference}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onMarkAllAsRead={handleMarkAllAsRead}
          onLoadMore={() => setVisibleCount((current) => current + 12)}
          onOpenNotification={handleOpenNotification}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          onArchiveNotification={handleArchiveNotification}
          onUnarchiveNotification={handleUnarchiveNotification}
          onDeleteNotification={handleDeleteNotification}
          onOpenAction={handleOpenAction}
          onReminderDraftChange={handleReminderDraftChange}
          onReminderDayToggle={handleReminderDayToggle}
          onCreateReminder={handleCreateReminder}
          onToggleReminder={handleToggleReminder}
          onDeleteReminder={handleDeleteReminder}
          onCloseDetail={() => setSelectedNotification(null)}
          onCancelConfirm={() => setConfirmModal(null)}
          onCloseToast={() => setToast(null)}
        />
      </div>
    </div>
  )
}

export default Notifications
