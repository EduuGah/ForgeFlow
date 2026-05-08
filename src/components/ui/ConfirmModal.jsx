import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'

function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const isDanger = variant === 'danger'

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[var(--ff-overlay)] px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-6 text-[var(--ff-text)] shadow-2xl shadow-black/20">
        <div className="flex items-start gap-4">
          <div
            className={
              isDanger
                ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-[var(--ff-danger-text)]'
                : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]'
            }
          >
            <AlertTriangle size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-[var(--ff-text)]">
              {title}
            </h2>

            {description && (
              <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:bg-[var(--ff-card-hover)] hover:text-[var(--ff-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
