import { NavLink } from 'react-router-dom'
import { CalendarCheck, ClipboardList, Home, TrendingUp, UserRound } from 'lucide-react'

const links = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Treinos', path: '/workouts', icon: ClipboardList },
  { name: 'Agenda', path: '/schedule', icon: CalendarCheck },
  { name: 'Evolução', path: '/progress', icon: TrendingUp },
  { name: 'Perfil', path: '/profile', icon: UserRound },
]

function MobileBottomNav() {
  return (
    <>

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
