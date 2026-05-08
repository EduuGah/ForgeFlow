import {
  AlertCircle,
  Bell,
  CalendarDays,
  Camera,
  ClipboardList,
  Dumbbell,
  Flag,
  HeartPulse,
  History,
  Home,
  LineChart,
  LogOut,
  Settings,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import forgeflowIcon from '../../assets/forgeflow-icon.png'
import { useAuth } from '../../context/AuthContext'

function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean)

  if (parts.length === 0) return 'FF'

  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''

  return `${first}${last}`.toUpperCase()
}

const linkGroups = [
  {
    title: 'Principal',
    links: [
      { name: 'Dashboard', path: '/', icon: Home },
      { name: 'Treinos', path: '/workouts', icon: ClipboardList },
      { name: 'Exercícios', path: '/exercises', icon: Dumbbell },
    ],
  },
  {
    title: 'Progresso',
    links: [
      { name: 'Histórico', path: '/history', icon: History },
      { name: 'Calendário', path: '/calendar', icon: CalendarDays },
      { name: 'Evolução', path: '/progress', icon: TrendingUp },
      { name: 'Por exercício', path: '/exercise-progress', icon: LineChart },
      { name: 'Fotos', path: '/progress-photos', icon: Camera },
      { name: 'Recuperação', path: '/recovery', icon: HeartPulse },
      { name: 'Metas', path: '/goals', icon: Flag },
    ],
  },
  {
    title: 'Sistema',
    links: [
      { name: 'Notificações', path: '/notifications', icon: Bell },
      { name: 'Perfil', path: '/profile', icon: UserRound },
      { name: 'Definições', path: '/settings', icon: Settings },
    ],
  },
]

function Sidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth()

  function handleLogout() {
    onClose?.()
    logout()
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-50 bg-[var(--ff-overlay)] backdrop-blur-sm"
          aria-label="Fechar menu"
        />
      )}

      <aside
        className={[
          'fixed left-0 top-0 z-[60] flex h-dvh w-[86vw] max-w-[320px] flex-col overflow-hidden border-r border-[var(--ff-border)] bg-[var(--ff-sidebar)] text-[var(--ff-text)] shadow-2xl shadow-black/20 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--ff-accent-soft),transparent_36%)]" />

        <div className="relative flex h-full flex-col">
          <div className="safe-top p-4">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] shadow-[0_0_20px_var(--ff-accent-shadow)]">
                  <img
                    src={forgeflowIcon}
                    alt="ForgeFlow"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-xl font-black tracking-tight text-[var(--ff-text)]">
                    Forge<span className="text-[var(--ff-accent)]">Flow</span>
                  </h1>

                  <p className="truncate text-xs text-[var(--ff-muted)]">
                    Workout Tracker
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)] hover:text-[var(--ff-text)]"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ff-muted-2)]">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.links.map((link) => {
                    const Icon = link.icon

                    return (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.path === '/'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          isActive
                            ? 'group flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-3 text-[var(--ff-accent-text)] shadow-[0_0_18px_var(--ff-accent-shadow)]'
                            : 'group flex min-h-12 items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-[var(--ff-muted)] transition hover:border-[var(--ff-border)] hover:bg-[var(--ff-card-hover)] hover:text-[var(--ff-text)]'
                        }
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition group-hover:bg-[var(--ff-accent-soft)] group-hover:text-[var(--ff-accent-text)]">
                          <Icon size={21} />
                        </span>

                        <span className="truncate text-sm font-bold">
                          {link.name}
                        </span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="safe-bottom border-t border-[var(--ff-border)] p-3">
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3">
              <Link
                to="/profile"
                onClick={onClose}
                className="group flex min-h-12 items-center gap-3 rounded-xl transition hover:bg-[var(--ff-card-hover)]"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'Usuário'}
                    className="h-10 w-10 shrink-0 rounded-xl border border-[var(--ff-accent-border)]/25 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-xs font-black text-[var(--ff-accent-text)]">
                    {getInitials(user?.name)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--ff-text)] transition group-hover:text-[var(--ff-accent-text)]">
                    {user?.name || 'Usuário'}
                  </p>

                  <p className="truncate text-xs text-[var(--ff-muted)]">
                    {user?.email || 'Sem e-mail'}
                  </p>
                </div>
              </Link>

              {!user?.profileCompleted && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <AlertCircle
                      size={15}
                      className="shrink-0 text-[var(--ff-warning-text)]"
                    />

                    <span className="truncate text-xs font-bold text-[var(--ff-warning-text)]">
                      Perfil incompleto
                    </span>
                  </div>

                  <Link
                    to="/complete-profile"
                    onClick={onClose}
                    className="shrink-0 text-xs font-bold text-[var(--ff-accent-text)] transition hover:underline"
                  >
                    Completar
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-bold text-[var(--ff-danger-text)] transition hover:bg-red-500/15"
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
