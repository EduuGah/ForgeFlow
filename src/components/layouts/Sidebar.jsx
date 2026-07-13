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
  ShieldCheck,
  Utensils,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import ForgeFlowIcon from '../brand/ForgeFlowIcon'
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
      { name: 'Agenda', path: '/schedule', icon: CalendarDays },
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
      { name: 'Recuperação', path: '/muscle-recovery', icon: HeartPulse },
      { name: 'Metas', path: '/goals', icon: Flag },
    ],
  },
  {
    title: 'Sistema',
    links: [
      { name: 'Notificações', path: '/notifications', icon: Bell },
      { name: 'Perfil', path: '/profile', icon: UserRound },
      { name: 'Nutrição', path: '/nutrition', icon: Utensils },
      { name: 'Definições', path: '/settings', icon: Settings },
    ],
  },
]


function Sidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth()

  const visibleLinkGroups = linkGroups

  function handleLogout() {
    logout()
    onClose?.()
  }

  function stopBackgroundScroll(event) {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        onTouchMove={stopBackgroundScroll}
        onWheel={stopBackgroundScroll}
        className={[
          'fixed inset-0 z-50 bg-[var(--ff-overlay)] backdrop-blur-sm transition-opacity duration-300 ease-out',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        aria-label="Fechar menu"
        tabIndex={isOpen ? 0 : -1}
      />

      <aside
        className={[
          'ff-app-sidebar fixed left-0 top-0 z-[60] flex h-dvh w-[86vw] max-w-[300px] touch-pan-y flex-col overflow-hidden overscroll-contain border-r border-[var(--ff-border)] bg-[var(--ff-sidebar)] text-[var(--ff-text)] shadow-2xl shadow-[var(--ff-shadow-card)] transition-transform duration-300 ease-out will-change-transform',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--ff-accent-soft),transparent_36%)]" />

        <div className="relative flex h-full flex-col">
          <div className="safe-top p-4">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] shadow-[0_0_20px_var(--ff-accent-shadow)]">
                  <ForgeFlowIcon size="100%" className="ff-brand-app-icon--soft" />
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
            {visibleLinkGroups.map((group) => (
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

            {user?.role === 'admin' && (
              <div>
                <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ff-muted-2)]">
                  Administração
                </p>

                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) =>
                    [
                      'ff-sidebar-admin-link group flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 transition',
                      isActive ? 'is-active' : '',
                    ].filter(Boolean).join(' ')
                  }
                >
                  <span className="ff-sidebar-admin-link__icon flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition">
                    <ShieldCheck size={21} />
                  </span>

                  <span className="truncate text-sm font-bold">
                    Admin
                  </span>
                </NavLink>
              </div>
            )}

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
                className="group mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 text-sm font-black text-red-200 shadow-[0_0_0_rgba(239,68,68,0)] transition duration-200 hover:border-red-400/70 hover:bg-red-500/25 hover:text-[var(--ff-text)] hover:shadow-[0_0_22px_rgba(239,68,68,0.18)] active:scale-[0.98]"
              >
                <LogOut size={16} className="transition group-hover:-translate-x-0.5" />
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
