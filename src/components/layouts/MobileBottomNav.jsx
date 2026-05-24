import { NavLink } from 'react-router-dom'
import { CalendarCheck, ClipboardList, Home, TrendingUp, UserRound } from 'lucide-react'

const links = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Treino', path: '/workouts', icon: ClipboardList },
  { name: 'Agenda', path: '/schedule', icon: CalendarCheck },
  { name: 'Evolução', path: '/progress', icon: TrendingUp },
  { name: 'Perfil', path: '/profile', icon: UserRound },
]

function MobileBottomNav() {
  return (
    <nav
      aria-label="Navegação inferior"
      className="mobile-bottom-nav safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--ff-border)] bg-[var(--ff-header)] px-2 pt-1.5 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-[560px] grid-cols-5 gap-1">
        {links.map((link) => {
          const Icon = link.icon

          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                [
                  'flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 transition active:scale-95',
                  isActive
                    ? 'text-[var(--ff-accent-text)]'
                    : 'text-[var(--ff-muted)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]',
                ].join(' ')
              }
            >
              <Icon size={21} strokeWidth={2.1} />
              <span className="truncate text-[10px] font-bold leading-none">
                {link.name}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav
