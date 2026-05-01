import {
  Home,
  ClipboardList,
  Dumbbell,
  History,
  TrendingUp,
  UserRound,
  Settings,
  Search,
  X,
  LogOut,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import forgeflowIcon from '../../assets/forgeflow-icon.png'

function Sidebar({ onClose }) {
  const links = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Treinos', path: '/workouts', icon: ClipboardList },
    { name: 'Exercícios', path: '/exercises', icon: Dumbbell },
    { name: 'Histórico', path: '/history', icon: History },
    { name: 'Evolução', path: '/progress', icon: TrendingUp },
    { name: 'Perfil', path: '/profile', icon: UserRound },
    { name: 'Definições', path: '/settings', icon: Settings },
  ]

  return (
<aside className="fixed left-0 top-0 z-50 flex h-dvh w-[282px] max-w-[86vw] flex-col overflow-hidden border-r border-zinc-800 bg-[#121212] text-white shadow-2xl shadow-black/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_36%)]" />

      <div className="relative flex h-full flex-col">
        <div className="p-4">
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-zinc-800 bg-[#18181b] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.22)]">
                <img
                  src={forgeflowIcon}
                  alt="ForgeFlow"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight">
                  Forge<span className="text-violet-500">Flow</span>
                </h1>

                <p className="text-xs text-zinc-500">
                  Workout Tracker
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-violet-500/40 hover:bg-zinc-900 hover:text-white hover:shadow-[0_0_16px_rgba(139,92,246,0.22)]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {links.map((link) => {
            const Icon = link.icon

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive
                    ? 'group flex items-center gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-violet-300 shadow-[0_0_18px_rgba(139,92,246,0.22)]'
                    : 'group flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-zinc-400 transition hover:border-zinc-800 hover:bg-[#18181b] hover:text-white hover:shadow-[0_0_14px_rgba(139,92,246,0.12)]'
                }
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-zinc-400 transition group-hover:bg-violet-500/10 group-hover:text-violet-300">
                  <Icon size={21} />
                </span>

                <span className="text-sm font-bold">
                  {link.name}
                </span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <div className="rounded-3xl border border-zinc-800 bg-[#18181b] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-sm font-black text-violet-300">
                CE
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  Carlos Eduardo
                </p>

                <p className="truncate text-xs text-zinc-500">
                  ForgeFlow user
                </p>
              </div>

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              >
                <LogOut size={20} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
              <p className="text-xs font-bold text-violet-300">
                ForgeFlow Beta
              </p>

              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Sistema em evolução para controle completo de treinos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar