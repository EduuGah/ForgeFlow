import { Archive, BellRing, Eye, Trash2, X } from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import {
  formatLongDateTime,
  getNotificationMeta,
  getStatusDescription,
  getStatusLabel,
} from '../notificationUtils'

export function NotificationStatusPill({ status }) {
  const isUnread = status === 'unread'
  const isRead = status === 'read'
  const isArchived = status === 'archived'

  return (
    <span
      className={
        isUnread
          ? 'inline-flex items-center gap-1.5 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent)] px-2.5 py-1 text-[11px] font-black text-white shadow-[0_0_16px_var(--ff-accent-shadow)]'
          : isRead
            ? 'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-[var(--ff-success-text)]'
            : 'inline-flex items-center gap-1.5 rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2.5 py-1 text-[11px] font-black text-[var(--ff-muted)]'
      }
    >
      {isUnread && <BellRing size={12} />}
      {isRead && <Eye size={12} />}
      {isArchived && <Archive size={12} />}
      {getStatusLabel(status)}
    </span>
  )
}

export function NotificationDetailModal({
  notification,
  onClose,
  onArchive,
  onDelete,
  onOpenAction,
}) {
  if (!notification) return null

  const meta = getNotificationMeta(notification.type)
  const Icon = meta.icon

  return (
    <div className="ff-notification-detail-modal fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="ff-notification-detail-modal__panel flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] shadow-2xl sm:rounded-[2rem]">
        <div className="ff-notification-detail-modal__header flex items-start justify-between gap-4 border-b border-[var(--ff-border)] p-5">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${meta.border} ${meta.bg} ${meta.tone}`}
            >
              <Icon size={24} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{meta.label}</Badge>
                <NotificationStatusPill status={notification.status} />
              </div>

              <h2 className="ff-notification-detail-modal__title mt-3 text-2xl font-black text-[var(--ff-text)]">
                {notification.title}
              </h2>

              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                Criada em {formatLongDateTime(notification.createdAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]"
            aria-label="Fechar detalhes"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ff-notification-detail-modal__body space-y-5 overflow-y-auto p-5">
          <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
              Mensagem completa
            </p>

            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-[var(--ff-text)]">
              {notification.message || 'Essa notificação não possui mensagem detalhada.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                Status
              </p>

              <div className="mt-2">
                <NotificationStatusPill status={notification.status} />
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[var(--ff-muted)]">
                {getStatusDescription(notification.status)}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                Leitura
              </p>

              <p className="mt-2 font-bold text-[var(--ff-text)]">
                {notification.readAt
                  ? formatLongDateTime(notification.readAt)
                  : 'Ainda não tinha sido lida'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                Origem
              </p>

              <p className="mt-2 font-bold text-[var(--ff-text)]">
                {notification.source || 'system'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                Destino sugerido
              </p>

              <p className="mt-2 font-bold text-[var(--ff-text)]">
                {notification.actionUrl || 'Nenhum'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {notification.actionUrl && (
              <Button
                type="button"
                onClick={() => onOpenAction(notification)}
              >
                Abrir destino
              </Button>
            )}

            {notification.status !== 'archived' && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onArchive(notification.id)}
              >
                <Archive size={16} />
                Arquivar
              </Button>
            )}

            <Button
              type="button"
              variant="danger"
              onClick={() => onDelete(notification.id)}
            >
              <Trash2 size={16} />
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

