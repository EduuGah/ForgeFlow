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
import ActiveWorkoutMini from '../workout/ActiveWorkoutMini'
import NotificationBell from '../notifications/NotificationBell'

function AppLayout() {
  const { user } = useAuth()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarClosing, setIsSidebarClosing] = useState(false)

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

  function openSidebar() {
    setIsSidebarClosing(false)
    setIsSidebarOpen(true)
  }

  function closeSidebar() {
    setIsSidebarClosing(true)

    setTimeout(() => {
      setIsSidebarOpen(false)
      setIsSidebarClosing(false)
    }, 220)
  }

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
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openSidebar}
              className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
            >
              <Menu
                size={22}
                className="transition group-hover:text-[var(--ff-accent-text)]"
              />
            </button>

            <div>
              <h1 className="text-lg font-black tracking-tight">
                Forge<span className="text-[var(--ff-accent)]">Flow</span>
              </h1>

              <p className="hidden text-xs text-[var(--ff-muted)] sm:block">
                Workout Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />

            <div className="hidden rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--ff-accent-text)] sm:block">
              Beta
            </div>
          </div>
        </div>
      </header>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            onClick={closeSidebar}
            className={
              isSidebarClosing
                ? 'absolute inset-0 animate-[fadeOut_0.22s_ease-in] bg-[var(--ff-overlay)] backdrop-blur-sm'
                : 'absolute inset-0 animate-[fadeIn_0.2s_ease-out] bg-[var(--ff-overlay)] backdrop-blur-sm'
            }
          />

          <div
            className={
              isSidebarClosing
                ? 'animate-[slideOutLeft_0.22s_ease-in_forwards]'
                : 'animate-[slideInLeft_0.24s_ease-out]'
            }
          >
            <Sidebar onClose={closeSidebar} />
          </div>
        </div>
      )}

      <main className="relative px-4 py-6 pb-28">
        <div className="mx-auto max-w-[1280px]">
          <Outlet />
        </div>
      </main>

      <ActiveWorkoutMini />
    </div>
  )
}

export default AppLayout
