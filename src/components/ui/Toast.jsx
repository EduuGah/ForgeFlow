import { CheckCircle2, AlertCircle, X } from 'lucide-react'

function Toast({
  show,
  type = 'success',
  title = 'Tudo certo',
  message = '',
  onClose,
}) {
  if (!show) return null

  const isSuccess = type === 'success'

  return (
    <div className="safe-top fixed left-3 right-3 top-20 z-[10000] rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 text-[var(--ff-text)] shadow-2xl shadow-black/20 sm:left-auto sm:right-4 sm:w-[calc(100%-32px)] sm:max-w-sm">
      <div className="flex items-start gap-3">
        <div
          className={
            isSuccess
              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-[var(--ff-success-text)]'
              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-[var(--ff-danger-text)]'
          }
        >
          {isSuccess ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--ff-text)]">
            {title}
          </p>

          {message && (
            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              {message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
          aria-label="Fechar aviso"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default Toast
