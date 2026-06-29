import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Archive,
  Bell,
  BellRing,
  CheckCheck,
  Clock3,
  Eye,
  EyeOff,
  Info,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import ConfirmModal from '../../../components/ui/ConfirmModal'
import EmptyState from '../../../components/ui/EmptyState'
import Toast from '../../../components/ui/Toast'
import { WEEK_DAYS } from '../../../utils/workoutScheduleUtils'
import {
  NOTIFICATION_PREFERENCE_OPTIONS,
  formatDateTime,
  getNotificationMeta,
  getPermissionDescription,
  getPermissionLabel,
  getPermissionTone,
} from '../notificationUtils'
import { NotificationDetailModal, NotificationStatusPill } from './NotificationComponents'

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={checked ? 'ff-premium-switch is-on' : 'ff-premium-switch'}
    >
      <span />
    </button>
  )
}

function PermissionBanner({ permission, onRequestPermission, onTestNotification, testingNotification }) {
  const tone = getPermissionTone(permission)
  const granted = tone === 'success'
  const Icon = granted ? ShieldCheck : ShieldAlert

  return (
    <Card className={`ff-notifications-permission-card is-${tone}`}>
      <div className="ff-notifications-permission-card__icon">
        <Icon size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <span>{granted ? 'Permissão ativada' : 'Permissão necessária'}</span>
        <strong>{getPermissionLabel(permission)}</strong>
        <p>{getPermissionDescription(permission)}</p>
      </div>

      <div className="ff-notifications-permission-card__actions">
        {!granted && (
          <Button type="button" variant="secondary" onClick={onRequestPermission}>
            Verificar novamente
          </Button>
        )}
        <Button type="button" onClick={onTestNotification} disabled={testingNotification}>
          <BellRing size={16} />
          {testingNotification ? 'Enviando...' : 'Testar notificação'}
        </Button>
      </div>
    </Card>
  )
}

function StatsGrid({ summary }) {
  const cards = [
    {
      label: 'Não lidas',
      value: summary.unread,
      detail: 'pedem atenção',
      icon: BellRing,
    },
    {
      label: 'Lembretes ativos',
      value: summary.activeAlerts,
      detail: `${summary.activeReminders} personalizados`,
      icon: Bell,
    },
    {
      label: 'Próximo alerta',
      value: summary.nextAlert,
      detail: 'baseado nos lembretes',
      icon: Clock3,
    },
    {
      label: 'Permissão',
      value: summary.permissionLabel,
      detail: summary.permissionGranted ? 'pronta para usar' : 'requer atenção',
      icon: summary.permissionGranted ? ShieldCheck : ShieldAlert,
    },
  ]

  return (
    <section className="ff-notifications-premium-stats">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.label} className="ff-premium-stat-card">
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.detail}</small>
            </div>
            <Icon size={18} />
          </Card>
        )
      })}
    </section>
  )
}

function Filters({ search, statusFilter, onSearchChange, onStatusFilterChange, onMarkAllAsRead, onOpenSettings }) {
  return (
    <Card className="ff-notifications-toolbar">
      <div className="ff-notifications-search">
        <Search size={18} />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar notificação..."
        />
        {search && (
          <button type="button" onClick={() => onSearchChange('')} aria-label="Limpar busca">
            <X size={16} />
          </button>
        )}
      </div>

      <select
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value)}
        aria-label="Filtrar notificações"
      >
        <option value="">Todas</option>
        <option value="unread">Não lidas</option>
        <option value="read">Lidas</option>
        <option value="archived">Arquivadas</option>
      </select>

      <Button type="button" variant="secondary" onClick={onMarkAllAsRead}>
        <CheckCheck size={16} />
        Marcar lidas
      </Button>

      <Button type="button" onClick={onOpenSettings} data-tutorial="notification-preferences">
        <Settings2 size={16} />
        Configurar lembretes
      </Button>
    </Card>
  )
}

function NotificationCard({ notification, onOpen, onMarkAsRead, onMarkAsUnread, onArchive, onUnarchive, onDelete }) {
  const meta = getNotificationMeta(notification.type)
  const Icon = meta.icon
  const isUnread = notification.status === 'unread'

  return (
    <article className={isUnread ? 'ff-notification-premium-card is-unread' : 'ff-notification-premium-card'}>
      <button type="button" className="ff-notification-premium-card__main" onClick={() => onOpen(notification)}>
        <div className={`ff-notification-premium-card__icon ${meta.border} ${meta.bg} ${meta.tone}`}>
          <Icon size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="ff-notification-premium-card__meta">
            <NotificationStatusPill status={notification.status} />
            <Badge>{meta.label}</Badge>
            <span>{formatDateTime(notification.createdAt)}</span>
          </div>

          <h2>{notification.title}</h2>
          <p>{notification.message || 'Sem mensagem detalhada.'}</p>
        </div>
      </button>

      <div className="ff-notification-premium-card__actions">
        {notification.status === 'unread' ? (
          <Button type="button" variant="secondary" onClick={() => onMarkAsRead(notification.id)}>
            <Eye size={15} />
            Lida
          </Button>
        ) : notification.status !== 'archived' ? (
          <Button type="button" variant="secondary" onClick={() => onMarkAsUnread(notification.id)}>
            <EyeOff size={15} />
            Não lida
          </Button>
        ) : null}

        <Button type="button" variant="secondary" onClick={() => onOpen(notification)}>
          <Info size={15} />
          Detalhes
        </Button>

        {notification.status === 'archived' ? (
          <Button type="button" variant="secondary" onClick={() => onUnarchive(notification.id)}>
            <Archive size={15} />
            Desarquivar
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={() => onArchive(notification.id)}>
            <Archive size={15} />
            Arquivar
          </Button>
        )}

        <Button type="button" variant="danger" onClick={() => onDelete(notification.id)}>
          <Trash2 size={15} />
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
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  onDelete,
}) {
  return (
    <Card className="ff-notifications-list-card" data-tutorial="notifications-list">
      <div className="ff-section-title-row">
        <div>
          <span>Recentes</span>
          <h2>Central de avisos</h2>
        </div>
        <Button type="button" variant="secondary" onClick={onGenerate}>
          <RefreshCcw size={15} />
          Verificar
        </Button>
      </div>

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhuma notificação por enquanto"
          description="Seus lembretes e avisos importantes aparecerão aqui."
          action={
            <Button type="button" onClick={onGenerate}>
              <BellRing size={16} />
              Verificar agora
            </Button>
          }
        />
      ) : (
        <div className="ff-notifications-feed">
          {visibleNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onOpen={onOpen}
              onMarkAsRead={onMarkAsRead}
              onMarkAsUnread={onMarkAsUnread}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {visibleCount < filteredNotifications.length && (
        <Button type="button" variant="secondary" onClick={onLoadMore} className="mt-4 w-full">
          Ver mais notificações
        </Button>
      )}
    </Card>
  )
}

function ReminderForm({ draft, onDraftChange, onDayToggle, onCreateReminder }) {
  return (
    <form className="ff-reminder-form-premium" onSubmit={onCreateReminder}>
      <label>
        <span>Título</span>
        <input
          type="text"
          value={draft.title || ''}
          onChange={(event) => onDraftChange('title', event.target.value)}
          placeholder="Ex: Beber água"
        />
      </label>

      <label>
        <span>Horário</span>
        <input
          type="time"
          value={draft.time || '18:00'}
          onChange={(event) => onDraftChange('time', event.target.value)}
        />
      </label>

      <label className="ff-reminder-form-premium__wide">
        <span>Mensagem opcional</span>
        <input
          type="text"
          value={draft.body || ''}
          onChange={(event) => onDraftChange('body', event.target.value)}
          placeholder="Mensagem curta para aparecer no alerta"
        />
      </label>

      <div className="ff-reminder-days ff-reminder-form-premium__wide" aria-label="Dias do lembrete">
        {WEEK_DAYS.map((day) => (
          <button
            key={day.key}
            type="button"
            className={draft.days?.includes(day.key) ? 'is-active' : ''}
            onClick={() => onDayToggle(day.key)}
          >
            {day.short}
          </button>
        ))}
      </div>

      <Button type="submit" className="ff-reminder-form-premium__wide">
        <Plus size={16} />
        Criar lembrete
      </Button>
    </form>
  )
}

function ReminderList({ reminders, onToggleReminder, onDeleteReminder }) {
  if (!reminders.length) {
    return (
      <div className="ff-mini-empty">
        <Bell size={18} />
        <span>Nenhum lembrete personalizado ainda.</span>
      </div>
    )
  }

  return (
    <div className="ff-reminder-list-premium">
      {reminders.map((reminder) => (
        <article key={reminder.id} className={reminder.enabled ? 'is-enabled' : ''}>
          <div className="min-w-0">
            <strong>{reminder.title}</strong>
            <span>
              {reminder.time} · {(reminder.days || []).length === WEEK_DAYS.length
                ? 'Todos os dias'
                : `${(reminder.days || []).length || 0} dia(s)`}
            </span>
          </div>

          <div className="ff-reminder-list-premium__actions">
            <ToggleSwitch
              checked={reminder.enabled !== false}
              onChange={() => onToggleReminder(reminder.id)}
              label={reminder.enabled !== false ? 'Desativar lembrete' : 'Ativar lembrete'}
            />
            <button type="button" onClick={() => onDeleteReminder(reminder.id)} aria-label="Excluir lembrete">
              <Trash2 size={16} />
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function PreferencesSheet({
  open,
  onClose,
  preferences,
  reminders,
  draft,
  onTogglePreference,
  onDraftChange,
  onDayToggle,
  onCreateReminder,
  onToggleReminder,
  onDeleteReminder,
}) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    document.body.classList.add('ff-modal-open')

    return () => {
      document.body.classList.remove('ff-modal-open')
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  const sheet = (
    <div className="ff-premium-sheet" role="dialog" aria-modal="true">
      <button type="button" className="ff-premium-sheet__backdrop" aria-label="Fechar preferências" onClick={onClose} />

      <section className="ff-premium-sheet__panel" data-tutorial="notification-preferences">
        <header className="ff-premium-sheet__header">
          <div>
            <span>Preferências</span>
            <h2>Notificações e lembretes</h2>
            <p>Escolha quais alertas aparecem e crie lembretes com horário.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar preferências">
            <X size={20} />
          </button>
        </header>

        <div className="ff-premium-sheet__body">
          <div className="ff-preference-grid">
            {NOTIFICATION_PREFERENCE_OPTIONS.map((option) => {
              const Icon = option.icon
              const checked = Boolean(preferences?.[option.key])

              return (
                <article key={option.key} className={checked ? 'is-on' : ''}>
                  <div className="ff-preference-grid__icon">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </div>
                  <ToggleSwitch
                    checked={checked}
                    onChange={() => onTogglePreference(option.key)}
                    label={`${checked ? 'Desativar' : 'Ativar'} ${option.label}`}
                  />
                </article>
              )
            })}
          </div>

          <div className="ff-sheet-section">
            <div className="ff-section-title-row">
              <div>
                <span>Horários</span>
                <h2>Lembretes personalizados</h2>
              </div>
            </div>

            <ReminderForm
              draft={draft}
              onDraftChange={onDraftChange}
              onDayToggle={onDayToggle}
              onCreateReminder={onCreateReminder}
            />

            <ReminderList
              reminders={reminders}
              onToggleReminder={onToggleReminder}
              onDeleteReminder={onDeleteReminder}
            />
          </div>
        </div>
      </section>
    </div>
  )

  return createPortal(sheet, document.body)
}

export default function NotificationsPageSections({
  source,
  loading,
  summary,
  permission,
  testingNotification,
  preferences,
  search,
  statusFilter,
  filteredNotifications,
  visibleNotifications,
  visibleCount,
  selectedNotification,
  customReminders,
  reminderDraft,
  confirmModal,
  toast,
  onRefresh,
  onGenerate,
  onRequestPermission,
  onTestNotification,
  onTogglePreference,
  onSearchChange,
  onStatusFilterChange,
  onMarkAllAsRead,
  onLoadMore,
  onOpenNotification,
  onMarkAsRead,
  onMarkAsUnread,
  onArchiveNotification,
  onUnarchiveNotification,
  onDeleteNotification,
  onOpenAction,
  onReminderDraftChange,
  onReminderDayToggle,
  onCreateReminder,
  onToggleReminder,
  onDeleteReminder,
  onCloseDetail,
  onCancelConfirm,
  onCloseToast,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <div className="ff-notifications-source-row">
        <Badge variant={source === 'database' ? 'purple' : 'default'}>
          {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Dados locais'}
        </Badge>
        <Button type="button" variant="secondary" onClick={onRefresh}>
          <RefreshCcw size={15} />
          Atualizar
        </Button>
      </div>

      <PermissionBanner
        permission={permission}
        onRequestPermission={onRequestPermission}
        onTestNotification={onTestNotification}
        testingNotification={testingNotification}
      />

      <StatsGrid summary={summary} />

      <Filters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={onSearchChange}
        onStatusFilterChange={onStatusFilterChange}
        onMarkAllAsRead={onMarkAllAsRead}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <NotificationsList
        filteredNotifications={filteredNotifications}
        visibleNotifications={visibleNotifications}
        visibleCount={visibleCount}
        onLoadMore={onLoadMore}
        onGenerate={onGenerate}
        onOpen={onOpenNotification}
        onMarkAsRead={onMarkAsRead}
        onMarkAsUnread={onMarkAsUnread}
        onArchive={onArchiveNotification}
        onUnarchive={onUnarchiveNotification}
        onDelete={onDeleteNotification}
      />

      <PreferencesSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        reminders={customReminders || []}
        draft={reminderDraft || {}}
        onTogglePreference={onTogglePreference}
        onDraftChange={onReminderDraftChange}
        onDayToggle={onReminderDayToggle}
        onCreateReminder={onCreateReminder}
        onToggleReminder={onToggleReminder}
        onDeleteReminder={onDeleteReminder}
      />

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={onCloseDetail}
        onArchive={onArchiveNotification}
        onUnarchive={onUnarchiveNotification}
        onMarkAsUnread={onMarkAsUnread}
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
