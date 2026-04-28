import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition flex items-center justify-center text-xl"
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

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout