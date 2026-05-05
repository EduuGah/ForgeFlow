import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import {
  applyAppSettingsToDocument,
  getAppSettings,
} from '../../utils/settingsUtils'

import Sidebar from './Sidebar'
import ActiveWorkoutMini from '../workout/ActiveWorkoutMini'

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarClosing, setIsSidebarClosing] = useState(false)

  useEffect(() => {
    applyAppSettingsToDocument(getAppSettings())

    function handleSettingsChanged(event) {
      applyAppSettingsToDocument(event.detail)
    }

    window.addEventListener('forgeflow:settings-changed', handleSettingsChanged)

    return () => {
      window.removeEventListener('forgeflow:settings-changed', handleSettingsChanged)
    }
  }, [])

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
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,shadow-[0_0_20px_var(--ff-accent-shadow)],transparent_34%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.08),transparent_32%)]" />

      <header
        id="app-header"
        className="sticky top-0 z-40 border-b border-zinc-900/90 bg-black/75 backdrop-blur-xl"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openSidebar}
              className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-[#18181b] text-zinc-300 transition hover:border-[var(--ff-accent-border)] hover:bg-zinc-900 hover:text-white"
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

              <p className="hidden text-xs text-zinc-500 sm:block">
                Workout Tracker
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] px-3 py-1 text-xs font-bold text-[var(--ff-accent-text)] sm:block">
            Beta
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
                ? 'absolute inset-0 animate-[fadeOut_0.22s_ease-in] bg-black/75 backdrop-blur-sm'
                : 'absolute inset-0 animate-[fadeIn_0.2s_ease-out] bg-black/75 backdrop-blur-sm'
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