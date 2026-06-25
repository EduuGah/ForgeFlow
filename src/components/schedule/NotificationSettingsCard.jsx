import { AlertTriangle, BellOff, BellRing, Clock3, Smartphone, Sparkles } from 'lucide-react'

import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'

const LEAD_OPTIONS = [0, 5, 10, 15, 30, 45, 60, 90, 120]

function getPermissionCopy(permission) {
  if (permission?.display === 'denied') {
    return {
      tone: 'blocked',
      title: 'Notificações bloqueadas',
      message: 'As notificações estão bloqueadas no aparelho. Abra as configurações do app para permitir os alertas.',
    }
  }

  if (permission?.display === 'granted') {
    return {
      tone: 'ok',
      title: permission?.source === 'web-fallback' ? 'Preferência salva' : 'Notificações permitidas',
      message: permission?.source === 'web-fallback'
        ? 'No navegador, o ForgeFlow salva a preferência. No APK Android, ele agenda notificações locais.'
        : 'O ForgeFlow pode enviar lembretes de treino no APK.',
    }
  }

  return {
    tone: 'attention',
    title: 'Permissão pendente',
    message: 'Ative os alertas para receber lembretes antes do treino.',
  }
}

function NotificationSettingsCard({
  settings,
  summary,
  permission,
  pendingWorkoutNotifications,
  isBusy,
  isTesting,
  onToggleEnabled,
  onDefaultTimeChange,
  onLeadChange,
  onRequestPermission,
  onTestNotification,
}) {
  const enabled = Boolean(settings.workoutReminderEnabled)
  const lead = Number(settings.workoutReminderLeadMinutes) || 0
  const permissionCopy = getPermissionCopy(permission)

  return (
    <section className="ff-schedule-v2-notifications" aria-label="Alertas de treino">
      <div className="ff-schedule-v2-section-title">
        <div>
          <span>Alertas de treino</span>
          <h2>Receba um lembrete antes do horário planejado.</h2>
        </div>
        <span className={`ff-schedule-v2-status-dot ${enabled ? 'is-on' : ''}`} aria-hidden="true" />
      </div>

      <div className="ff-schedule-v2-notifications__status">
        <span>
          {permissionCopy.tone === 'blocked' ? <AlertTriangle size={19} /> : enabled ? <BellRing size={19} /> : <BellOff size={19} />}
        </span>
        <div>
          <strong>{enabled ? 'Status: Ativado' : 'Status: Desativado'}</strong>
          <small>{permissionCopy.message}</small>
        </div>
      </div>

      <div className="ff-schedule-v2-notifications__meta">
        <div>
          <span>Treinos</span>
          <strong>{summary.workoutDays}</strong>
        </div>
        <div>
          <span>Antecedência</span>
          <strong>{lead} min</strong>
        </div>
        <div>
          <span>No APK</span>
          <strong>{pendingWorkoutNotifications}</strong>
        </div>
      </div>

      <div className="ff-schedule-v2-notifications__form">
        <Input
          label="Horário padrão do treino"
          type="time"
          value={settings.workoutReminderTime || '18:00'}
          onChange={(event) => onDefaultTimeChange(event.target.value)}
        />

        <Select
          label="Avisar antes"
          value={String(lead)}
          onChange={(event) => onLeadChange(Number(event.target.value))}
        >
          {LEAD_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes === 0 ? 'Na hora do treino' : `${minutes} min antes`}
            </option>
          ))}
        </Select>
      </div>

      <div className="ff-schedule-v2-notifications__actions">
        <Button
          type="button"
          onClick={() => onToggleEnabled(!enabled)}
          disabled={isBusy}
          variant={enabled ? 'danger' : 'primary'}
        >
          {enabled ? <BellOff size={17} /> : <BellRing size={17} />}
          {enabled ? 'Desativar alertas' : 'Ativar alertas'}
        </Button>

        <Button type="button" variant="secondary" onClick={onRequestPermission} disabled={isBusy}>
          <Smartphone size={17} /> Permitir no aparelho
        </Button>

        <Button type="button" variant="secondary" onClick={onTestNotification} disabled={isTesting || isBusy}>
          <Sparkles size={17} /> {isTesting ? 'Testando...' : 'Testar notificação'}
        </Button>
      </div>

      <p className={`ff-schedule-v2-notifications__note is-${permissionCopy.tone}`}>
        <Clock3 size={15} /> {permissionCopy.title}
      </p>
    </section>
  )
}

export default NotificationSettingsCard
