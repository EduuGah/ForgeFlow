import { lazy, Suspense, useEffect, useRef, useState } from 'react'
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
    const idleId = window.requestIdleCallback(callback, { timeout: 2500 })
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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)
  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)

  useEffect(() => {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }, [])

  useEffect(() => {
    function handleScrollDirection() {
      const currentScrollY = window.scrollY || 0
      const lastScrollY = lastScrollYRef.current
      const difference = currentScrollY - lastScrollY

      setIsHeaderCompact(currentScrollY > 16)

      if (currentScrollY < 24) {
        setIsHeaderVisible(true)
      } else if (difference > 8) {
        setIsHeaderVisible(false)
      } else if (difference < -8) {
        setIsHeaderVisible(true)
      }

      lastScrollYRef.current = currentScrollY
      tickingRef.current = false
    }

    function handleScroll() {
      if (tickingRef.current) return
      tickingRef.current = true
      window.requestAnimationFrame(handleScrollDirection)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleScroll, { passive: true })
    window.addEventListener('touchmove', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('touchmove', handleScroll)
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
        if (isMounted) applyAppSettingsToDocument(cachedSettings)
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
      }).catch((error) => console.error(error))
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

      if (priorityNotification) setPopupNotification(priorityNotification)
    }

    window.addEventListener('forgeflow:notification-popup', handleNotificationPopup)
    return () => window.removeEventListener('forgeflow:notification-popup', handleNotificationPopup)
  }, [])

  return (
    <div className="min-h-dvh bg-[var(--ff-bg)] text-[var(--ff-text)] transition-colors duration-300">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,var(--ff-accent-shadow),transparent_34%),radial-gradient(circle_at_bottom_right,var(--ff-accent-soft),transparent_32%)] opacity-80" />

      <header
        id="app-header"
        className={[
          'fixed inset-x-0 top-0 z-40 border-b border-[var(--ff-border)] bg-[var(--ff-header)] backdrop-blur-xl transition-all duration-300 ease-out',
          isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
          isHeaderCompact ? 'shadow-lg shadow-black/10' : '',
        ].join(' ')}
      >
        <div className="safe-top">
          <div className={['flex items-center justify-between gap-3 px-4 transition-all duration-300 sm:px-6', isHeaderCompact ? 'h-14' : 'h-16'].join(' ')}>
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)] active:scale-95"
                aria-label="Abrir menu"
                aria-expanded={isSidebarOpen}
              >
                <Menu size={22} className="transition group-hover:text-[var(--ff-accent-text)]" />
              </button>

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] shadow-[0_0_18px_var(--ff-accent-shadow)]">
                  <img src={forgeflowIcon} alt="ForgeFlow" className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black leading-tight tracking-tight">
                    Forge<span className="text-[var(--ff-accent)]">Flow</span>
                  </h1>
                  <p className="hidden truncate text-xs text-[var(--ff-muted)] sm:block">Workout Tracker</p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--ff-accent-text)] sm:block">Beta</div>
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      {isSidebarOpen && (
        <Suspense fallback={null}>
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </Suspense>
      )}

      <main className="relative min-h-0 overflow-visible px-4 pb-36 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:px-6 lg:px-8 lg:pb-10 lg:pt-[calc(5.75rem+env(safe-area-inset-top))]">
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
          <SmartNotificationPopup notification={popupNotification} onClose={() => setPopupNotification(null)} />
        </Suspense>
      )}
    </div>
  )
}

export default AppLayout
