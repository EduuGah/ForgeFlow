import { Menu } from 'lucide-react'
import NotificationBell from '../notifications/NotificationBell'

function MobileTopbar({ onOpenSidebar }) {
  return (
    <header className="safe-top fixed left-0 right-0 top-0 z-40 border-b border-[var(--ff-border)] bg-[var(--ff-header)] px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)] active:scale-95"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-base font-black tracking-tight text-[var(--ff-text)]">
            Forge<span className="text-[var(--ff-accent)]">Flow</span>
          </h1>

          <p className="truncate text-xs text-[var(--ff-muted)]">
            Evolução e treino
          </p>
        </div>

        <NotificationBell />
      </div>
    </header>
  )
}

export default MobileTopbar
