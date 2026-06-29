import { useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    document.body.classList.add('ff-modal-open')

    return () => {
      document.body.classList.remove('ff-modal-open')
    }
  }, [open])

  if (!open) return null

  const isDanger = variant === 'danger'

  const modal = (
    <div className="ff-confirm-modal-overlay fixed inset-0 z-[2147483645] flex items-end justify-center bg-[var(--ff-overlay)] p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="ff-confirm-modal-panel max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-5 text-center text-[var(--ff-text)] shadow-2xl shadow-[var(--ff-shadow-card)] sm:rounded-3xl sm:p-6">
        <div className="relative flex flex-col items-center text-center">
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

          <h2 className="mt-5 max-w-sm text-center text-xl font-black text-[var(--ff-text)]">
            {title}
          </h2>

          {description && (
            <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-[var(--ff-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="w-full justify-center text-center"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            className="w-full justify-center text-center"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return modal

  return createPortal(modal, document.body)
}

export default ConfirmModal
