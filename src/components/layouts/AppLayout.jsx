import { lazy, Suspense, useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import forgeflowIcon from '../../assets/forgeflow-icon.png'
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
import Sidebar from './Sidebar'
import NotificationBell from '../notifications/NotificationBell'
import { generateSmartNotifications } from '../../utils/notificationUtils'

const ActiveWorkoutMini = lazy(() => import('../workout/ActiveWorkoutMini'))
const SmartNotificationPopup = lazy(() =>
  import('../notifications/SmartNotificationPopup')
)
const PwaInstallPrompt = lazy(() => import('../pwa/PwaInstallPrompt'))

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
    function handleOpenSidebar() {
      setIsSidebarOpen(true)
    }

    function handleCloseSidebar() {
      setIsSidebarOpen(false)
    }

    function handleToggleSidebar() {
      setIsSidebarOpen((current) => !current)
    }

    window.addEventListener('forgeflow:open-sidebar', handleOpenSidebar)
    window.addEventListener('forgeflow:close-sidebar', handleCloseSidebar)
    window.addEventListener('forgeflow:toggle-sidebar', handleToggleSidebar)

    return () => {
      window.removeEventListener('forgeflow:open-sidebar', handleOpenSidebar)
      window.removeEventListener('forgeflow:close-sidebar', handleCloseSidebar)
      window.removeEventListener('forgeflow:toggle-sidebar', handleToggleSidebar)
    }
  }, [])

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

      <header
        id="app-header"
        className="sticky top-0 z-40 border-b border-[var(--ff-border)] bg-[var(--ff-header)] backdrop-blur-xl transition-colors duration-300"
      >
        <div className="safe-top">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)] active:scale-95"
                aria-label="Abrir menu"
                aria-expanded={isSidebarOpen}
              >
                <Menu
                  size={22}
                  className="transition group-hover:text-[var(--ff-accent-text)]"
                />
              </button>

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] shadow-[0_0_18px_var(--ff-accent-shadow)]">
                  <img
                    src={forgeflowIcon}
                    alt="ForgeFlow"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black leading-tight tracking-tight">
                    Forge<span className="text-[var(--ff-accent)]">Flow</span>
                  </h1>

                  <p className="hidden truncate text-xs text-[var(--ff-muted)] sm:block">
                    Workout Tracker
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--ff-accent-text)] sm:block">
                Beta
              </div>

              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="relative px-4 py-6 pb-36 sm:px-6 lg:px-8 lg:pb-10">
        <div className="mx-auto w-full max-w-[1600px]">
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

      <Suspense fallback={null}>
        <PwaInstallPrompt />
      </Suspense>
    </div>
  )
}

export default AppLayout
