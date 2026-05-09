import { Menu } from 'lucide-react'

import forgeflowIcon from '../../assets/forgeflow-icon.png'
import NotificationBell from '../notifications/NotificationBell'

function MobileTopbar({ onOpenSidebar }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-[var(--ff-border)] bg-[var(--ff-header)] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.85rem)] backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)] active:scale-95"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <div className="flex min-w-0 items-center justify-center gap-2 text-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_16px_var(--ff-accent-shadow)]">
            <img
              src={forgeflowIcon}
              alt="ForgeFlow"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 text-left">
            <h1 className="truncate text-base font-black leading-tight tracking-tight text-[var(--ff-text)]">
              Forge<span className="text-[var(--ff-accent)]">Flow</span>
            </h1>

            <p className="truncate text-[11px] font-semibold leading-tight text-[var(--ff-muted)]">
              Evolução e treino
            </p>
          </div>
        </div>

        <NotificationBell />
      </div>
    </header>
  )
}

export default MobileTopbar
