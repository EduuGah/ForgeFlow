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
      iconBg: 'bg-emerald-500/10',
      title: 'Conquista desbloqueada',
    }
  }

  if (type === 'goal') {
    return {
      border: 'border-[var(--ff-accent-border)]',
      bg: 'bg-[var(--ff-accent-soft)]',
      text: 'text-[var(--ff-accent-text)]',
      iconBg: 'bg-[var(--ff-accent-soft)]',
      title: 'Progresso de meta',
    }
  }

  return {
    border: 'border-[var(--ff-accent-border)]',
    bg: 'bg-[var(--ff-accent-soft)]',
    text: 'text-[var(--ff-accent-text)]',
    iconBg: 'bg-[var(--ff-accent-soft)]',
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

    const timeoutId = window.setTimeout(() => {
      onClose?.()
    }, 6500)

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(timeoutId)
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
    <div className="safe-top pointer-events-none fixed left-3 right-3 top-20 z-[10050] sm:left-auto sm:right-4 sm:w-[calc(100%-32px)] sm:max-w-md">
      <div className="pointer-events-auto overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-text)] shadow-2xl shadow-black/25 animate-[fadeIn_0.18s_ease-out]">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${tone.border} ${tone.iconBg} ${tone.text} shadow-[0_0_22px_var(--ff-accent-shadow)]/15`}>
              <Icon size={24} />
            </div>

            <div className="min-w-0 flex-1">
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${tone.text}`}>
                {tone.title}
              </p>

              <h2 className="mt-1 line-clamp-2 text-base font-black tracking-tight text-[var(--ff-text)]">
                {notification.title}
              </h2>

              {notification.message && (
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                  {notification.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
              aria-label="Fechar popup"
            >
              <X size={18} />
            </button>
          </div>

          <div className={`mt-4 rounded-2xl border ${tone.border} ${tone.bg} p-3 text-xs leading-relaxed ${tone.text}`}>
            Essa notificação apareceu porque seu progresso atingiu um marco importante.
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full justify-center text-center"
            >
              Fechar
            </Button>

            <Button
              type="button"
              onClick={handleOpenAction}
              className="w-full justify-center text-center"
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
