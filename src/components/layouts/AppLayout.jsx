import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Download, Dumbbell, Menu } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'

import forgeflowIcon from '../../assets/forgeflow-icon.png'
import { useAuth } from '../../context/AuthContext'
import { useWorkoutSession } from '../../context/WorkoutSessionContext'
import { apiFetch } from '../../services/api'
import { cancelActiveWorkoutNotification, updateActiveWorkoutNotification } from '../../services/nativeNotificationService'

import {
  applyAppSettingsToDocument,
  getUserAppSettings,
  saveUserAppSettings,
  watchSystemThemeChanges,
} from '../../utils/settingsUtils'

import MobileBottomNav from './MobileBottomNav'
import NotificationBell from '../notifications/NotificationBell'
import { generateSmartNotifications } from '../../utils/notificationUtils'
import { isStandalonePwaMode } from '../../utils/pwaUtils'
import { isNativeApp } from '../../utils/platformUtils'

const Sidebar = lazy(() => import('./Sidebar'))
const ActiveWorkoutMini = lazy(() => import('../workout/ActiveWorkoutMini'))
const SmartNotificationPopup = lazy(() =>
  import('../notifications/SmartNotificationPopup')
)
const PwaInstallButton = lazy(() => import('../pwa/PwaInstallButton'))
const GuidedTutorial = lazy(() => import('../tutorial/GuidedTutorial'))

function runWhenBrowserIsIdle(callback) {
  if (typeof window === 'undefined') return undefined

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, { timeout: 2500 })
    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = window.setTimeout(callback, 900)
  return () => window.clearTimeout(timeoutId)
}



function formatActiveWorkoutTime(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function getRouteShellClass(pathname = '/') {
  if (pathname === '/') return 'ff-page-dashboard'
  if (pathname.startsWith('/workouts')) return 'ff-page-workouts'
  if (pathname.startsWith('/exercises')) return 'ff-page-exercises'
  if (pathname.startsWith('/start-workout')) return 'ff-page-start-workout'
  if (pathname.startsWith('/history')) return 'ff-page-history'
  if (pathname.startsWith('/schedule')) return 'ff-page-schedule'
  if (pathname.startsWith('/progress-photos')) return 'ff-page-progress-photos'
  if (pathname.startsWith('/progress')) return 'ff-page-progress'
  if (pathname.startsWith('/exercise-progress')) return 'ff-page-exercise-progress'
  if (pathname.startsWith('/profile')) return 'ff-page-profile'
  if (pathname.startsWith('/notifications')) return 'ff-page-notifications'
  if (pathname.startsWith('/settings')) return 'ff-page-settings'
  if (pathname.startsWith('/nutrition')) return 'ff-page-nutrition'
  if (pathname.startsWith('/calendar')) return 'ff-page-calendar'
  if (pathname.startsWith('/admin')) return 'ff-page-admin'

  return 'ff-page-default'
}

function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const { activeSession, elapsedSeconds, completedSets, totalSets } = useWorkoutSession()
  const isActiveWorkoutRoute = location.pathname.startsWith('/start-workout')

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [popupNotification, setPopupNotification] = useState(null)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)
  const [isPwaStandalone, setIsPwaStandalone] = useState(() => isStandalonePwaMode())
  const [isRunningNativeApp, setIsRunningNativeApp] = useState(() => isNativeApp())
  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)
  const pageScrollRef = useRef(null)

  useEffect(() => {
    const native = isNativeApp()
    setIsRunningNativeApp(native)
    document.body.classList.toggle('is-native-app', native)
    document.documentElement.classList.toggle('is-native-app', native)

    return () => {
      document.body.classList.remove('is-native-app')
      document.documentElement.classList.remove('is-native-app')
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('ff-sidebar-open', isSidebarOpen)
    document.documentElement.classList.toggle('ff-sidebar-open', isSidebarOpen)

    if (!isSidebarOpen) {
      return () => {
        document.body.classList.remove('ff-sidebar-open')
        document.documentElement.classList.remove('ff-sidebar-open')
      }
    }

    // No APK/Capacitor o scroll real fica dentro de .ff-page-scroll-shell.
    // Não podemos colocar o body como fixed aqui, porque isso quebra o scroller
    // interno do Android WebView e faz o toque rolar header/footer em vez da página.
    if (isRunningNativeApp) {
      return () => {
        document.body.classList.remove('ff-sidebar-open')
        document.documentElement.classList.remove('ff-sidebar-open')
      }
    }

    const scrollY = window.scrollY || document.documentElement.scrollTop || 0
    const previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    }

    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.classList.remove('ff-sidebar-open')
      document.documentElement.classList.remove('ff-sidebar-open')
      document.body.style.position = previousBodyStyles.position
      document.body.style.top = previousBodyStyles.top
      document.body.style.left = previousBodyStyles.left
      document.body.style.right = previousBodyStyles.right
      document.body.style.width = previousBodyStyles.width
      document.body.style.overflow = previousBodyStyles.overflow
      window.scrollTo(0, scrollY)
    }
  }, [isSidebarOpen, isRunningNativeApp])

  useEffect(() => {
    const nativeScroller = pageScrollRef.current

    if (isRunningNativeApp && nativeScroller) {
      nativeScroller.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      })
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      })
    }

    lastScrollYRef.current = 0
    setIsHeaderVisible(true)
    setIsHeaderCompact(false)

    window.dispatchEvent(new CustomEvent('forgeflow:route-scroll-top'))
  }, [location.pathname, isRunningNativeApp])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const media = window.matchMedia?.('(display-mode: standalone)')

    function handleStandaloneChange() {
      setIsPwaStandalone(isStandalonePwaMode())
    }

    handleStandaloneChange()

    media?.addEventListener?.('change', handleStandaloneChange)
    window.addEventListener('appinstalled', handleStandaloneChange)

    return () => {
      media?.removeEventListener?.('change', handleStandaloneChange)
      window.removeEventListener('appinstalled', handleStandaloneChange)
    }
  }, [])


  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    // No APK o header deve ficar estável. O auto-hide estava deixando um
    // espaço vazio no topo porque o header saía visualmente, mas o layout flex
    // continuava reservando sua altura.
    if (isRunningNativeApp) {
      setIsHeaderVisible(true)
      setIsHeaderCompact(false)
      return undefined
    }

    const scrollContainer = window

    function getCurrentScrollY() {
      if (scrollContainer === window) {
        return window.scrollY || document.documentElement.scrollTop || 0
      }

      return scrollContainer.scrollTop || 0
    }

    function handleScrollDirection() {
      const currentScrollY = getCurrentScrollY()
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

    scrollContainer?.addEventListener?.('scroll', handleScroll, { passive: true })
    scrollContainer?.addEventListener?.('wheel', handleScroll, { passive: true })
    scrollContainer?.addEventListener?.('touchmove', handleScroll, { passive: true })

    return () => {
      scrollContainer?.removeEventListener?.('scroll', handleScroll)
      scrollContainer?.removeEventListener?.('wheel', handleScroll)
      scrollContainer?.removeEventListener?.('touchmove', handleScroll)
    }
  }, [isRunningNativeApp])

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
    if (!isRunningNativeApp) return undefined

    if (!activeSession) {
      cancelActiveWorkoutNotification().catch(() => {})
      return undefined
    }

    const progressPercent = totalSets
      ? Math.min(100, Math.round((completedSets / totalSets) * 100))
      : 0

    function syncActiveWorkoutNotification() {
      const sessionExercises = Array.isArray(activeSession.exercises) ? activeSession.exercises : []
      const currentExercise = sessionExercises.find((exercise) =>
        Array.isArray(exercise.sets) && exercise.sets.some((set) => !set.completed && set.type !== 'warmup')
      ) || sessionExercises[0]
      const completedExercises = sessionExercises.filter((exercise) => {
        const workingSets = Array.isArray(exercise.sets) ? exercise.sets.filter((set) => set.type !== 'warmup') : []
        return workingSets.length > 0 && workingSets.every((set) => set.completed)
      }).length

      updateActiveWorkoutNotification({
        workoutName: activeSession.workoutName,
        elapsedLabel: formatActiveWorkoutTime(elapsedSeconds),
        completedSets,
        totalSets,
        progressPercent,
        startedAt: activeSession.startedAt,
        currentExerciseName: currentExercise?.exercise?.name || currentExercise?.name || currentExercise?.exerciseName || '',
        completedExercises,
        totalExercises: sessionExercises.length,
      }).catch(() => {})
    }

    syncActiveWorkoutNotification()
    const intervalId = window.setInterval(syncActiveWorkoutNotification, 60000)

    return () => window.clearInterval(intervalId)
  }, [activeSession, activeSession?.startedAt, activeSession?.workoutName, completedSets, elapsedSeconds, isRunningNativeApp, totalSets])

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
    <div className="ff-app-layout min-h-dvh bg-[var(--ff-bg)] text-[var(--ff-text)] transition-colors duration-300">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,var(--ff-accent-shadow),transparent_34%),radial-gradient(circle_at_bottom_right,var(--ff-accent-soft),transparent_32%)] opacity-80" />

      <header
        id="app-header"
        className={[
          'fixed inset-x-0 top-0 z-40 border-b border-[var(--ff-border)] bg-[var(--ff-header)] backdrop-blur-xl transition-all duration-300 ease-out',
          isRunningNativeApp || isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
          !isRunningNativeApp && isHeaderCompact ? 'shadow-lg shadow-black/10' : '',
        ].join(' ')}
      >
        <div className="safe-top">
          <div className={['flex items-center justify-between gap-3 px-4 transition-all duration-300 sm:px-6', !isRunningNativeApp && isHeaderCompact ? 'h-14' : 'h-16'].join(' ')}>
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
                <div className="ff-header-brand-icon flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-accent)] shadow-[0_0_18px_var(--ff-accent-shadow)]">
                  <Dumbbell className="ff-header-brand-icon__fallback" size={22} aria-hidden="true" />
                  <img
                    src={forgeflowIcon}
                    alt="ForgeFlow"
                    className="ff-header-brand-icon__img"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
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
              {!isPwaStandalone && !isRunningNativeApp && (
                <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('forgeflow:show-install-app'))}
                className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] px-3 text-xs font-black text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)] sm:flex"
                aria-label="Instalar APP"
                title="Instalar APP"
              >
                <Download size={16} />
                App
              </button>
              )}

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

      <main ref={pageScrollRef} className={`ff-page-scroll-shell ff-hevy-shell ff-mobile-app-shell ${getRouteShellClass(location.pathname)} relative z-0 min-h-0 px-4 pb-36 pt-[calc(6.25rem+env(safe-area-inset-top))] sm:px-6 lg:px-8 lg:pb-10 lg:pt-[calc(6.25rem+env(safe-area-inset-top))]`}>
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav />

      {activeSession && !isActiveWorkoutRoute && (
        <Suspense fallback={null}>
          <ActiveWorkoutMini variant="floating" />
        </Suspense>
      )}

      {popupNotification && (
        <Suspense fallback={null}>
          <SmartNotificationPopup notification={popupNotification} onClose={() => setPopupNotification(null)} />
        </Suspense>
      )}
      <Suspense fallback={null}>
        {!isRunningNativeApp && <PwaInstallButton />}
      </Suspense>

      <Suspense fallback={null}>
        <GuidedTutorial />
      </Suspense>
    </div>
  )
}

export default AppLayout
