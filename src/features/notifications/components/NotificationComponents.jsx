import { Archive, BellRing, Eye, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'

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
  if (typeof document === 'undefined') return null

  const meta = getNotificationMeta(notification.type)
  const Icon = meta.icon

  const modal = (
    <div className="ff-notification-detail-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="ff-notification-detail-modal__backdrop"
        aria-label="Fechar detalhes da notificação"
        onClick={onClose}
      />

      <div className="ff-notification-detail-modal__panel">
        <div className="ff-notification-detail-modal__header">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${meta.border} ${meta.bg} ${meta.tone}`}
            >
              <Icon size={24} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{meta.label}</Badge>
                <NotificationStatusPill status={notification.status} />
              </div>

              <h2 className="ff-notification-detail-modal__title">
                {notification.title}
              </h2>

              <p className="ff-notification-detail-modal__date">
                Criada em {formatLongDateTime(notification.createdAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ff-notification-detail-modal__close"
            aria-label="Fechar detalhes"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ff-notification-detail-modal__body">
          <div className="ff-notification-detail-modal__info-card">
            <p className="ff-notification-detail-modal__label">
              Mensagem completa
            </p>

            <p className="ff-notification-detail-modal__message">
              {notification.message || 'Essa notificação não possui mensagem detalhada.'}
            </p>
          </div>

          <div className="ff-notification-detail-modal__grid">
            <div className="ff-notification-detail-modal__info-card">
              <p className="ff-notification-detail-modal__label">
                Status
              </p>

              <div className="mt-2">
                <NotificationStatusPill status={notification.status} />
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[var(--ff-muted)]">
                {getStatusDescription(notification.status)}
              </p>
            </div>

            <div className="ff-notification-detail-modal__info-card">
              <p className="ff-notification-detail-modal__label">
                Leitura
              </p>

              <p className="ff-notification-detail-modal__value">
                {notification.readAt
                  ? formatLongDateTime(notification.readAt)
                  : 'Ainda não tinha sido lida'}
              </p>
            </div>

            <div className="ff-notification-detail-modal__info-card">
              <p className="ff-notification-detail-modal__label">
                Origem
              </p>

              <p className="ff-notification-detail-modal__value">
                {notification.source || 'system'}
              </p>
            </div>

            <div className="ff-notification-detail-modal__info-card">
              <p className="ff-notification-detail-modal__label">
                Destino sugerido
              </p>

              <p className="ff-notification-detail-modal__value break-all">
                {notification.actionUrl || 'Nenhum'}
              </p>
            </div>
          </div>

          <div className="ff-notification-detail-modal__actions">
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

  return createPortal(modal, document.body)
}
