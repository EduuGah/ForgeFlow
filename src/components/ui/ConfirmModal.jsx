import { AlertTriangle, X } from 'lucide-react'

import Button from './Button'

function ConfirmModal({
  open,
  title = 'Confirmar ação',
  description = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div
              className={
                variant === 'danger'
                  ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400'
                  : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400'
              }
            >
              <AlertTriangle size={24} />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            variant={variant}
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