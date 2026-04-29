import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import ActiveWorkoutMini from '../workout/ActiveWorkoutMini'

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-zinc-800 bg-zinc-950/90 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl transition hover:bg-zinc-800"
        >
          ☰
        </button>

        <h1 className="font-bold">
          Forge<span className="text-violet-400">Flow</span>
        </h1>
      </header>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
      )}

      <main className="p-6 pb-28">
        <Outlet />
      </main>

      <ActiveWorkoutMini />
    </div>
  )
}

export default AppLayout