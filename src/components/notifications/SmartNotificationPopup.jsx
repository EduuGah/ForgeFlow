import { useEffect } from 'react'
import { BellRing, CheckCircle2, Trophy, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Button from '../ui/Button'

function getNotificationIcon(type) {
  if (type === 'success') return Trophy
  if (type === 'goal') return CheckCircle2

  return BellRing
}

function getNotificationTone(type) {
  if (type === 'success') {
    return {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-[var(--ff-success-text)]',
      title: 'Conquista desbloqueada',
    }
  }

  if (type === 'goal') {
    return {
      border: 'border-[var(--ff-accent-border)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      text: 'text-[var(--ff-accent-text)]',
      title: 'Progresso de meta',
    }
  }

  return {
    border: 'border-[var(--ff-accent-border)]',
    bg: 'bg-[var(--ff-accent-soft)]',
    text: 'text-[var(--ff-accent-text)]',
    title: 'Nova notificação',
  }
}

function SmartNotificationPopup({ notification, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!notification) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [notification, onClose])

  if (!notification) return null

  const Icon = getNotificationIcon(notification.type)
  const tone = getNotificationTone(notification.type)

  function handleOpenAction() {
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }

    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[10050] flex items-end justify-center bg-[var(--ff-overlay)] p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] text-center text-[var(--ff-text)] shadow-2xl shadow-black/25 animate-[fadeIn_0.18s_ease-out]">
        <div className="relative p-6 sm:p-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:bg-[var(--ff-card-hover)] hover:text-[var(--ff-text)]"
            aria-label="Fechar popup"
          >
            <X size={18} />
          </button>

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_26px_var(--ff-accent-shadow)]">
            <Icon size={32} />
          </div>

          <p className={`mt-5 text-xs font-black uppercase tracking-[0.22em] ${tone.text}`}>
            {tone.title}
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ff-text)]">
            {notification.title}
          </h2>

          {notification.message && (
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--ff-muted)]">
              {notification.message}
            </p>
          )}

          <div className={`mx-auto mt-5 rounded-3xl border ${tone.border} ${tone.bg} p-4 text-sm leading-relaxed ${tone.text}`}>
            Essa notificação apareceu agora porque seu progresso acabou de atingir um marco importante.
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full"
            >
              Fechar
            </Button>

            <Button
              type="button"
              onClick={handleOpenAction}
              className="w-full"
            >
              Ver detalhes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartNotificationPopup
