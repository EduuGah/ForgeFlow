import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/api'

import {
  applyAppSettingsToDocument,
  getUserAppSettings,
  saveUserAppSettings,
  watchSystemThemeChanges,
} from '../../utils/settingsUtils'

import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import ActiveWorkoutMini from '../workout/ActiveWorkoutMini'
import NotificationBell from '../notifications/NotificationBell'
import { generateSmartNotifications } from '../../utils/notificationUtils'

function AppLayout() {
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    const cachedSettings = getUserAppSettings(user)
    applyAppSettingsToDocument(cachedSettings)

    async function loadAccountSettings() {
      try {
        const settingsFromDatabase = await apiFetch('/settings')

        const mergedSettings = saveUserAppSettings(user, {
          ...cachedSettings,
          ...settingsFromDatabase,
        })

        applyAppSettingsToDocument(mergedSettings)
      } catch {
        applyAppSettingsToDocument(cachedSettings)
      }
    }

    loadAccountSettings()

    function handleSettingsChanged(event) {
      applyAppSettingsToDocument(event.detail)
    }

    const stopWatchingSystemTheme = watchSystemThemeChanges()

    window.addEventListener('forgeflow:settings-changed', handleSettingsChanged)

    return () => {
      window.removeEventListener('forgeflow:settings-changed', handleSettingsChanged)
      stopWatchingSystemTheme()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    generateSmartNotifications({
      user,
      reason: 'app-open',
      minimumMinutes: 60,
    }).catch((error) => {
      console.error(error)
    })
  }, [user])

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  return (
    <div className="min-h-screen bg-[var(--ff-bg)] text-[var(--ff-text)] transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,var(--ff-accent-shadow),transparent_34%),radial-gradient(circle_at_bottom_right,var(--ff-accent-soft),transparent_32%)] opacity-80" />

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
              >
                <Menu
                  size={22}
                  className="transition group-hover:text-[var(--ff-accent-text)]"
                />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-tight leading-tight">
                  Forge<span className="text-[var(--ff-accent)]">Flow</span>
                </h1>

                <p className="hidden truncate text-xs text-[var(--ff-muted)] sm:block">
                  Workout Tracker
                </p>
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
      <ActiveWorkoutMini />
    </div>
  )
}

export default AppLayout
