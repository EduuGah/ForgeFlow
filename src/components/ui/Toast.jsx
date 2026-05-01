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
    <div className="fixed right-4 top-20 z-[10000] w-[calc(100%-32px)] max-w-sm rounded-3xl border border-zinc-800 bg-[#121212] p-4 text-white shadow-2xl shadow-black/50">
      <div className="flex items-start gap-3">
        <div
          className={
            isSuccess
              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400'
              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400'
          }
        >
          {isSuccess ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold">
            {title}
          </p>

          {message && (
            <p className="mt-1 text-sm text-zinc-500">
              {message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 transition hover:text-white"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default Toast