import { apiFetch } from '../services/api'
import { saveUserStorageData } from './userStorage'

const LAST_GENERATE_KEY = 'forgeflow:notifications:last-generate'

function getUserId(user) {
  return user?.id || user?._id || user?.email || 'anonymous'
}

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

function dispatchNotificationsChanged(detail = {}) {
  window.dispatchEvent(
    new CustomEvent('forgeflow:notifications-changed', {
      detail,
    })
  )
}

function dispatchNotificationPopup(detail = {}) {
  window.dispatchEvent(
    new CustomEvent('forgeflow:notification-popup', {
      detail,
    })
  )
}

export function shouldGenerateNotifications(user, minimumMinutes = 60) {
  if (!user) return false

  const userId = getUserId(user)
  const key = `${LAST_GENERATE_KEY}:${userId}`
  const lastGeneratedAt = Number(localStorage.getItem(key) || 0)
  const now = Date.now()
  const diffMinutes = (now - lastGeneratedAt) / 1000 / 60

  return !lastGeneratedAt || diffMinutes >= minimumMinutes
}

export function markNotificationsGeneratedNow(user) {
  if (!user) return

  const userId = getUserId(user)
  const key = `${LAST_GENERATE_KEY}:${userId}`

  localStorage.setItem(key, String(Date.now()))
}

export async function generateSmartNotifications({
  user,
  reason = 'manual',
  minimumMinutes = 0,
  force = false,
  updateLocalStorage = true,
  showPopup = force,
} = {}) {
  if (!user) {
    return {
      created: 0,
      createdNotifications: [],
      notifications: [],
      unreadCount: 0,
      skipped: true,
    }
  }

  if (!force && minimumMinutes > 0 && !shouldGenerateNotifications(user, minimumMinutes)) {
    return {
      created: 0,
      createdNotifications: [],
      notifications: [],
      unreadCount: 0,
      skipped: true,
    }
  }

  const data = await apiFetch('/notifications/generate', {
    method: 'POST',
  })

  const notifications = Array.isArray(data?.notifications)
    ? data.notifications.map(normalizeNotificationFromApi)
    : []

  const createdNotifications = Array.isArray(data?.createdNotifications)
    ? data.createdNotifications.map(normalizeNotificationFromApi)
    : []

  if (updateLocalStorage) {
    saveUserStorageData(user, 'notifications', notifications)
  }

  markNotificationsGeneratedNow(user)

  const detail = {
    reason,
    created: Number(data?.created) || 0,
    createdNotifications,
    unreadCount: Number(data?.unreadCount) || 0,
  }

  dispatchNotificationsChanged(detail)

  if (showPopup && createdNotifications.length > 0) {
    dispatchNotificationPopup(detail)
  }

  return {
    ...data,
    notifications,
    createdNotifications,
    unreadCount: Number(data?.unreadCount) || 0,
    created: Number(data?.created) || 0,
  }
}

export function notifyNotificationsChanged(detail = {}) {
  dispatchNotificationsChanged(detail)
}

export function showNotificationPopup(detail = {}) {
  dispatchNotificationPopup(detail)
}

export { normalizeNotificationFromApi }
