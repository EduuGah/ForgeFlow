import { X } from 'lucide-react'

function MobileFilterSheet({ open, title = 'Filtros', description, children, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10020] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ff-overlay)] backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar filtros"
      />

      <div className="safe-bottom absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-hidden rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] shadow-2xl shadow-[var(--ff-shadow-card)]">
        <div className="sticky top-0 z-10 border-b border-[var(--ff-border)] bg-[var(--ff-card)]/95 p-4 backdrop-blur-xl">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--ff-border-strong)]" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[var(--ff-text)]">{title}</h2>
              {description && <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">{description}</p>}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(86dvh-92px)] overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  )
}

export default MobileFilterSheet
