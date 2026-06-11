import {
  Archive,
  Bell,
  BellRing,
  CheckCheck,
  Clock3,
  Eye,
  EyeOff,
  Info,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ConfirmModal from '../../../components/ui/ConfirmModal'
import Toast from '../../../components/ui/Toast'
import { formatDateTime, getNotificationMeta } from '../notificationUtils'
import {
  NotificationDetailModal,
  NotificationStatusPill,
} from './NotificationComponents'

function NotificationsHeader({ source, loading, onRefresh, onGenerate }) {
  return (
    <PageHeader
      title="Notificações"
      description="Acompanhe alertas inteligentes sobre treino, metas, peso e evolução."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={source === 'database' ? 'purple' : 'default'}>
            {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Local'}
          </Badge>

          <Button type="button" variant="secondary" onClick={onRefresh}>
            <RefreshCcw size={16} />
            Atualizar
          </Button>

          <Button type="button" onClick={onGenerate}>
            <BellRing size={16} />
            Verificar agora
          </Button>
        </div>
      }
    />
  )
}

function NotificationsStats({ stats }) {
  const cards = [
    {
      label: 'Não lidas',
      value: stats.unread,
      description: 'precisam da sua atenção',
      icon: BellRing,
      valueClass: 'text-[var(--ff-accent-text)]',
      iconClass: 'text-[var(--ff-accent-text)]',
    },
    {
      label: 'Lidas',
      value: stats.read,
      description: 'já foram abertas',
      icon: Eye,
      valueClass: 'text-[var(--ff-text)]',
      iconClass: 'text-[var(--ff-success-text)]',
    },
    {
      label: 'Arquivadas',
      value: stats.archived,
      description: 'guardadas',
      icon: Archive,
      valueClass: 'text-[var(--ff-text)]',
      iconClass: 'text-[var(--ff-muted)]',
    },
    {
      label: 'Total exibido',
      value: stats.total,
      description: 'no filtro atual',
      icon: Bell,
      valueClass: 'text-[var(--ff-text)]',
      iconClass: 'text-[var(--ff-accent-text)]',
    },
  ]

  return (
    <section className="ff-notifications-stats-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.label} className="ff-compact-stat-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--ff-muted)]">{card.label}</p>
              <Icon size={20} className={card.iconClass} />
            </div>
            <h2 className={`mt-2 text-3xl font-black ${card.valueClass}`}>{card.value}</h2>
            <p className="mt-2 text-xs text-[var(--ff-muted)]">{card.description}</p>
          </Card>
        )
      })}
    </section>
  )
}

function NotificationsFilters({ search, statusFilter, onSearchChange, onStatusFilterChange, onMarkAllAsRead }) {
  return (
    <Card className="mt-6">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
        <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[var(--ff-muted)]">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por título, mensagem, tipo ou status..."
            className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
          />
          {search && (
            <button type="button" onClick={() => onSearchChange('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="h-12 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none"
        >
          <option value="">Todas</option>
          <option value="unread">Não lidas</option>
          <option value="read">Lidas</option>
          <option value="archived">Arquivadas</option>
        </select>

        <Button type="button" variant="secondary" onClick={onMarkAllAsRead}>
          <CheckCheck size={16} />
          Marcar todas como lidas
        </Button>
      </div>
    </Card>
  )
}

function NotificationCard({ notification, onOpen, onMarkAsRead, onArchive, onDelete }) {
  const meta = getNotificationMeta(notification.type)
  const Icon = meta.icon
  const isUnread = notification.status === 'unread'

  return (
    <article
      className={
        isUnread
          ? 'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-card)] p-4 shadow-[0_0_28px_var(--ff-accent-shadow)]/10 transition hover:-translate-y-0.5 hover:bg-[var(--ff-card-hover)]'
          : 'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 opacity-85 transition hover:-translate-y-0.5 hover:opacity-100 hover:bg-[var(--ff-card-hover)]'
      }
    >
      {isUnread && <div className="absolute left-0 top-0 h-full w-1.5 bg-[var(--ff-accent)]" />}

      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="flex w-full flex-col gap-4 text-left sm:flex-row sm:items-start"
      >
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${meta.border} ${meta.bg} ${meta.tone}`}>
          <Icon size={23} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <NotificationStatusPill status={notification.status} />
            <Badge>{meta.label}</Badge>

            {isUnread && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ff-accent-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--ff-accent-text)]">
                <EyeOff size={12} />
                Clique para abrir
              </span>
            )}
          </div>

          <h2 className={isUnread ? 'mt-3 text-lg font-black text-[var(--ff-text)]' : 'mt-3 text-lg font-bold text-[var(--ff-text)]'}>
            {notification.title}
          </h2>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--ff-muted)]">
            {notification.message || 'Sem mensagem detalhada.'}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--ff-muted)]">
            <span className="inline-flex items-center gap-1">
              <Clock3 size={13} />
              {formatDateTime(notification.createdAt)}
            </span>

            {notification.readAt && (
              <span className="inline-flex items-center gap-1">
                <Eye size={13} />
                Lida em {formatDateTime(notification.readAt)}
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[var(--ff-border)] pt-4">
        {notification.status === 'unread' && (
          <Button type="button" variant="secondary" onClick={() => onMarkAsRead(notification.id)}>
            <Eye size={16} />
            Marcar como lida
          </Button>
        )}

        <Button type="button" variant="secondary" onClick={() => onOpen(notification)}>
          <Info size={16} />
          Detalhes
        </Button>

        {notification.status !== 'archived' && (
          <Button type="button" variant="secondary" onClick={() => onArchive(notification.id)}>
            <Archive size={16} />
            Arquivar
          </Button>
        )}

        <Button type="button" variant="danger" onClick={() => onDelete(notification.id)}>
          <Trash2 size={16} />
          Excluir
        </Button>
      </div>
    </article>
  )
}

function NotificationsList({
  filteredNotifications,
  visibleNotifications,
  visibleCount,
  onLoadMore,
  onGenerate,
  onOpen,
  onMarkAsRead,
  onArchive,
  onDelete,
}) {
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
      {filteredNotifications.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma notificação encontrada"
            description="Clique em verificar agora ou altere o filtro para ver outros alertas."
            action={
              <Button type="button" onClick={onGenerate}>
                <BellRing size={16} />
                Verificar agora
              </Button>
            }
          />
        </Card>
      ) : (
        visibleNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onOpen={onOpen}
            onMarkAsRead={onMarkAsRead}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))
      )}

      {visibleCount < filteredNotifications.length && (
        <Button type="button" variant="secondary" onClick={onLoadMore} className="w-full">
          Carregar mais notificações
        </Button>
      )}
    </section>
  )
}

export default function NotificationsPageSections({
  source,
  loading,
  stats,
  search,
  statusFilter,
  filteredNotifications,
  visibleNotifications,
  visibleCount,
  selectedNotification,
  confirmModal,
  toast,
  onRefresh,
  onGenerate,
  onSearchChange,
  onStatusFilterChange,
  onMarkAllAsRead,
  onLoadMore,
  onOpenNotification,
  onMarkAsRead,
  onArchiveNotification,
  onDeleteNotification,
  onOpenAction,
  onCloseDetail,
  onCancelConfirm,
  onCloseToast,
}) {
  return (
    <>
      <NotificationsHeader source={source} loading={loading} onRefresh={onRefresh} onGenerate={onGenerate} />
      <NotificationsStats stats={stats} />
      <NotificationsFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={onSearchChange}
        onStatusFilterChange={onStatusFilterChange}
        onMarkAllAsRead={onMarkAllAsRead}
      />
      <NotificationsList
        filteredNotifications={filteredNotifications}
        visibleNotifications={visibleNotifications}
        visibleCount={visibleCount}
        onLoadMore={onLoadMore}
        onGenerate={onGenerate}
        onOpen={onOpenNotification}
        onMarkAsRead={onMarkAsRead}
        onArchive={onArchiveNotification}
        onDelete={onDeleteNotification}
      />

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={onCloseDetail}
        onArchive={onArchiveNotification}
        onDelete={onDeleteNotification}
        onOpenAction={onOpenAction}
      />

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={onCancelConfirm}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={onCloseToast}
      />
    </>
  )
}
