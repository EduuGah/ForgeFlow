import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../../utils/userStorage'

function NotificationBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    async function loadNotificationsCount() {
      const cachedNotifications = getUserStorageData(user, 'notifications', [])

      setUnreadCount(
        cachedNotifications.filter((item) => item.status === 'unread').length
      )

      try {
        const data = await apiFetch('/notifications?status=unread&limit=10')

        const notifications = Array.isArray(data?.notifications)
          ? data.notifications.map((item) => ({
              ...item,
              id: item._id || item.id,
            }))
          : []

        setUnreadCount(Number(data?.unreadCount) || 0)
        saveUserStorageData(user, 'notifications', notifications)
      } catch (error) {
        console.error(error)
      }
    }

    loadNotificationsCount()
  }, [user])

  return (
    <Link
      to="/notifications"
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
      title="Notificações"
    >
      <Bell size={20} />

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ff-accent)] px-1.5 text-[10px] font-black text-white shadow-[0_0_14px_var(--ff-accent-shadow)]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

export default NotificationBell
