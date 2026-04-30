import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import ActiveWorkoutMini from '../workout/ActiveWorkoutMini'

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-900 bg-black/80 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <Menu size={22} />
          </button>

          <h1 className="text-lg font-black">
            Forge<span className="text-violet-500">Flow</span>
          </h1>
        </div>
      </header>

      {/* SIDEBAR (DRAWER) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50">
          {/* overlay */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* sidebar */}
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
      )}

      {/* CONTEÚDO */}
      <main className="px-4 py-6 pb-28">
        <div className="mx-auto max-w-[1200px]">
          <Outlet />
        </div>
      </main>

      <ActiveWorkoutMini />
    </div>
  )
}

export default AppLayout