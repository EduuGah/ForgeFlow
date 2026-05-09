import { lazy, Suspense, useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { useWorkoutSession } from '../../context/WorkoutSessionContext'
import { apiFetch } from '../../services/api'

import {
  applyAppSettingsToDocument,
  getUserAppSettings,
  saveUserAppSettings,
  watchSystemThemeChanges,
} from '../../utils/settingsUtils'

import MobileBottomNav from './MobileBottomNav'
import MobileTopbar from './MobileTopbar'
import NotificationBell from '../notifications/NotificationBell'
import { generateSmartNotifications } from '../../utils/notificationUtils'

const Sidebar = lazy(() => import('./Sidebar'))
const ActiveWorkoutMini = lazy(() => import('../workout/ActiveWorkoutMini'))
const SmartNotificationPopup = lazy(() =>
  import('../notifications/SmartNotificationPopup')
)

function runWhenBrowserIsIdle(callback) {
  if (typeof window === 'undefined') return undefined

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, {
      timeout: 2500,
    })

    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = window.setTimeout(callback, 900)

  return () => window.clearTimeout(timeoutId)
}

function AppLayout() {
  const { user } = useAuth()
  const { activeSession } = useWorkoutSession()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [popupNotification, setPopupNotification] = useState(null)

  useEffect(() => {
    if (!user) return undefined

    const cachedSettings = getUserAppSettings(user)
    applyAppSettingsToDocument(cachedSettings)

    let isMounted = true

    async function loadAccountSettings() {
      try {
        const settingsFromDatabase = await apiFetch('/settings')

        if (!isMounted) return

        const mergedSettings = saveUserAppSettings(user, {
          ...cachedSettings,
          ...settingsFromDatabase,
        })

        applyAppSettingsToDocument(mergedSettings)
      } catch {
        if (isMounted) {
          applyAppSettingsToDocument(cachedSettings)
        }
      }
    }

    loadAccountSettings()

    function handleSettingsChanged(event) {
      applyAppSettingsToDocument(event.detail)
    }

    const stopWatchingSystemTheme = watchSystemThemeChanges()

    window.addEventListener('forgeflow:settings-changed', handleSettingsChanged)

    return () => {
      isMounted = false
      window.removeEventListener('forgeflow:settings-changed', handleSettingsChanged)
      stopWatchingSystemTheme()
    }
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    return runWhenBrowserIsIdle(() => {
      generateSmartNotifications({
        user,
        reason: 'app-open',
        minimumMinutes: 60,
        showPopup: false,
      }).catch((error) => {
        console.error(error)
      })
    })
  }, [user])

  useEffect(() => {
    function handleNotificationPopup(event) {
      const createdNotifications = Array.isArray(event.detail?.createdNotifications)
        ? event.detail.createdNotifications
        : []

      const priorityNotification =
        createdNotifications.find((notification) => notification.type === 'success') ||
        createdNotifications.find((notification) => notification.type === 'goal') ||
        createdNotifications[0]

      if (priorityNotification) {
        setPopupNotification(priorityNotification)
      }
    }

    window.addEventListener('forgeflow:notification-popup', handleNotificationPopup)

    return () => {
      window.removeEventListener('forgeflow:notification-popup', handleNotificationPopup)
    }
  }, [])

  useEffect(() => {
    if (isSidebarOpen || popupNotification) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen, popupNotification])

  return (
    <div className="min-h-screen bg-[var(--ff-bg)] text-[var(--ff-text)] transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,var(--ff-accent-shadow),transparent_34%),radial-gradient(circle_at_bottom_right,var(--ff-accent-soft),transparent_32%)] opacity-80" />

      <MobileTopbar onOpenSidebar={() => setIsSidebarOpen(true)} />

      <Suspense fallback={null}>
        <Sidebar variant="desktop" />
      </Suspense>

      {isSidebarOpen && (
        <Suspense fallback={null}>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </Suspense>
      )}

      <main className="relative px-4 pb-36 pt-[calc(5.25rem+env(safe-area-inset-top))] sm:px-6 lg:ml-[292px] lg:px-8 lg:py-8 lg:pb-10">
        <div className="mx-auto w-full max-w-[1760px]">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav />

      {activeSession && (
        <Suspense fallback={null}>
          <ActiveWorkoutMini />
        </Suspense>
      )}

      {popupNotification && (
        <Suspense fallback={null}>
          <SmartNotificationPopup
            notification={popupNotification}
            onClose={() => setPopupNotification(null)}
          />
        </Suspense>
      )}
    </div>
  )
}

export default AppLayout