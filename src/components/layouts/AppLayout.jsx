import { lazy, Suspense, useEffect, useState } from 'react'
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

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)
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
    if (isMobileSidebarOpen) {
      document.body.classList.add('ff-scroll-lock')
    } else {
      document.body.classList.remove('ff-scroll-lock')
    }

    return () => {
      document.body.classList.remove('ff-scroll-lock')
    }
  }, [isMobileSidebarOpen])

  return (
    <div className="relative min-h-screen bg-[var(--ff-bg)] text-[var(--ff-text)] transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,var(--ff-accent-shadow),transparent_34%),radial-gradient(circle_at_bottom_right,var(--ff-accent-soft),transparent_32%)] opacity-80" />

      <Suspense fallback={null}>
        <Sidebar
          mode="desktop"
          collapsed={isDesktopSidebarCollapsed}
          onToggleCollapse={() => setIsDesktopSidebarCollapsed((current) => !current)}
        />
      </Suspense>

      <MobileTopbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />

      <Suspense fallback={null}>
        <Sidebar
          mode="mobile"
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </Suspense>

      <main
        className={[
          'relative z-10 min-h-dvh px-4 pb-[calc(7.25rem+env(safe-area-inset-bottom))] pt-[calc(5.75rem+env(safe-area-inset-top))]',
          'sm:px-6',
          'lg:px-8 lg:pb-10 lg:pt-8',
          'transition-[padding] duration-300 ease-out',
          isDesktopSidebarCollapsed ? 'lg:pl-[7rem]' : 'lg:pl-[20rem]',
        ].join(' ')}
      >
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
