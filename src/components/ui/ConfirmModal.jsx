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
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-[var(--ff-overlay)] p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-5 text-center text-[var(--ff-text)] shadow-2xl shadow-black/20 sm:rounded-3xl sm:p-6">
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:bg-[var(--ff-card-hover)] hover:text-[var(--ff-text)]"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>

          <div
            className={
              isDanger
                ? 'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-[var(--ff-danger-text)]'
                : 'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]'
            }
          >
            <AlertTriangle size={27} />
          </div>

          <h2 className="mt-5 max-w-sm text-xl font-black text-[var(--ff-text)]">
            {title}
          </h2>

          {description && (
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--ff-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="w-full"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            className="w-full"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
