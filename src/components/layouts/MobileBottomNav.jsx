import { NavLink } from 'react-router-dom'
import { ClipboardList, Download, Dumbbell, Home, TrendingUp, UserRound } from 'lucide-react'

const links = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Treinos', path: '/workouts', icon: ClipboardList },
  { name: 'Exercícios', path: '/exercises', icon: Dumbbell },
  { name: 'Evolução', path: '/progress', icon: TrendingUp },
  { name: 'Perfil', path: '/profile', icon: UserRound },
]

function MobileBottomNav() {
  return (
    <>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('forgeflow:show-install-app'))}
        className="fixed bottom-[calc(5.3rem+env(safe-area-inset-bottom))] right-3 z-50 flex h-11 items-center gap-2 rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-card)] px-3 text-xs font-black text-[var(--ff-accent-text)] shadow-xl shadow-black/25 backdrop-blur-xl lg:hidden"
        aria-label="Instalar APP"
      >
        <Download size={15} />
        App
      </button>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--ff-border)] bg-[var(--ff-header)] px-2 pt-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {links.map((link) => {
          const Icon = link.icon

          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                isActive
                  ? 'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--ff-accent-soft)] px-2 py-2 text-[var(--ff-accent-text)]'
                  : 'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]'
              }
            >
              <Icon size={20} />
              <span className="truncate text-[10px] font-bold">
                {link.name}
              </span>
            </NavLink>
          )
        })}
      </div>
      </nav>
    </>
  )
}

export default MobileBottomNav
