import {
  Home,
  ClipboardList,
  History,
  Dumbbell,
  UserRound,
  Settings,
  TrendingUp,
  LogOut,
  Search,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import forgeflowIcon from '../../assets/forgeflow-icon.png'

function Sidebar({ onClose }) {
  const links = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Treinos', path: '/workouts', icon: ClipboardList },
    { name: 'Exercícios', path: '/exercises', icon: Dumbbell },
    { name: 'Evolução', path: '/progress', icon: TrendingUp },
    { name: 'Perfil', path: '/profile', icon: UserRound },
    { name: 'Definições', path: '/settings', icon: Settings },
    { name: 'Histórico', path: '/history', icon: History },
  ]

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-[252px] bg-[#121212] text-white border-r border-zinc-800 flex flex-col">      <div className="flex h-full flex-col">
      <div className="px-4 pt-6">
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={forgeflowIcon}
              alt="ForgeFlow"
              className="h-9 w-9 rounded-xl object-cover"
            />

            <h1 className="text-2xl font-black tracking-tight">
              Forge<span className="text-violet-500">Flow</span>
            </h1>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-800 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#2a2a2c] px-3 py-2.5 text-zinc-400">
          <Search size={20} />

          <input
            type="text"
            placeholder="Procurar"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-400"
          />
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive
                    ? 'group flex items-center gap-3 rounded-lg px-3 py-3 text-violet-400 bg-violet-500/10 border border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                    : 'group flex items-center gap-3 rounded-lg px-3 py-3 text-zinc-300 transition hover:bg-zinc-800 hover:text-white hover:shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                }
              >
                <Icon
                  size={22}
                  strokeWidth={2}
                  className="transition group-hover:text-violet-400"
                />

                <span className="text-sm font-bold">
                  {link.name}
                </span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold">
            CE
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">
              Carlos Eduardo
            </p>

            <p className="truncate text-xs text-zinc-400">
              ForgeFlow user
            </p>
          </div>

          <button
            type="button"
            className="text-zinc-400 transition hover:text-white"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>
    </div>
    </aside>
  )
}

export default Sidebar