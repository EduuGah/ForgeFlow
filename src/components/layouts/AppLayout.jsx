import { useEffect, useState } from 'react'
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
import MobileTopbar from './MobileTopbar'
import MobileBottomNav from './MobileBottomNav'
import ActiveWorkoutMini from '../workout/ActiveWorkoutMini'

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

      <MobileTopbar onOpenSidebar={() => setIsSidebarOpen(true)} />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="relative min-h-screen px-4 pb-36 pt-24 sm:px-6 lg:ml-[282px] lg:px-8 lg:pb-10 lg:pt-8">
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
