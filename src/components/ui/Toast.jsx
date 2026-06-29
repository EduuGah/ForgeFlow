import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

function getToastTone(type) {
  if (type === 'error' || type === 'danger') {
    return {
      icon: AlertCircle,
      iconBox: 'bg-red-500/10 text-[var(--ff-danger-text)] border-red-500/20',
      bar: 'bg-red-500',
    }
  }

  if (type === 'info') {
    return {
      icon: Info,
      iconBox: 'bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] border-[var(--ff-accent-border)]',
      bar: 'bg-[var(--ff-accent)]',
    }
  }

  return {
    icon: CheckCircle2,
    iconBox: 'bg-emerald-500/10 text-[var(--ff-success-text)] border-emerald-500/20',
    bar: 'bg-emerald-500',
  }
}

function Toast({
  show,
  type = 'success',
  title = 'Tudo certo',
  message = '',
  onClose,
}) {
  if (!show) return null

  const tone = getToastTone(type)
  const Icon = tone.icon

  return (
    <div className="pointer-events-none safe-top fixed left-3 right-3 top-20 z-[10000] flex justify-center sm:left-auto sm:right-4 sm:justify-end">
      <div className="pointer-events-auto relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-text)] shadow-2xl shadow-[var(--ff-shadow-card)] backdrop-blur-xl animate-[fadeIn_0.16s_ease-out]">
        <div className={`absolute inset-x-0 top-0 h-1 ${tone.bar}`} />

        <div className="flex items-start gap-3 px-4 py-4 pr-12">
          <div
            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${tone.iconBox}`}
          >
            <Icon size={22} />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-left text-base font-black leading-snug tracking-tight text-[var(--ff-text)]">
              {title}
            </p>

            {message && (
              <p className="mt-1.5 text-left text-sm leading-relaxed text-[var(--ff-muted)]">
                {message}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
          aria-label="Fechar aviso"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default Toast
