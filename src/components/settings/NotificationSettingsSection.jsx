import { useEffect, useMemo, useState } from 'react'
import { Bell, BellRing, CalendarCheck, Clock3, Smartphone, TestTube2, Weight } from 'lucide-react'

import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { SectionTitle, SettingToggleCard } from '../../features/settings/components/SettingsBaseControls'
import {
  cancelDailyWeightReminder,
  cancelWorkoutReminders,
  checkExactNotificationPermission,
  checkNotificationPermission,
  getPendingNotifications,
  requestExactNotificationPermission,
  requestNotificationPermission,
  scheduleTestNotification,
  scheduleDailyWeightReminder,
  scheduleWeeklyWorkoutReminders,
} from '../../services/nativeNotificationService'
import { isNativeApp } from '../../utils/platformUtils'

function getPermissionLabel(permission) {
  if (!isNativeApp()) return 'Modo web'
  if (permission === 'granted') return 'Permitido'
  if (permission === 'denied') return 'Bloqueado'
  if (permission === 'prompt') return 'Pendente'
  return 'Indefinido'
}

function getPermissionTone(permission, nativeApp) {
  if (!nativeApp) return 'neutral'
  if (permission === 'granted') return 'success'
  if (permission === 'denied') return 'danger'
  return 'warning'
}

function getWorkoutDaysCount(schedule = {}) {
  return Object.values(schedule || {}).filter((day) => day?.type === 'workout' && day?.workoutId).length
}

function NativeStatusPill({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className={`ff-reminder-status-pill ff-reminder-status-pill--${tone}`}>
      <span className="ff-reminder-status-icon">
        <Icon size={15} />
      </span>
      <span className="min-w-0">
        <span className="ff-reminder-status-label">{label}</span>
        <strong className="ff-reminder-status-value">{value}</strong>
      </span>
    </div>
  )
}

function NotificationSettingsSection({ settings, workouts = [], onUpdateSetting, onShowToast }) {
  const [permission, setPermission] = useState('prompt')
  const [pendingCount, setPendingCount] = useState(0)
  const [exactAlarm, setExactAlarm] = useState('unknown')
  const [isBusy, setIsBusy] = useState(false)
  const nativeApp = useMemo(() => isNativeApp(), [])
  const scheduledWorkoutDays = getWorkoutDaysCount(settings.weeklySchedule)

  async function refreshNativeStatus() {
    const [permissionStatus, exactStatus, pending] = await Promise.all([
      checkNotificationPermission(),
      checkExactNotificationPermission(),
      getPendingNotifications(),
    ])

    setPermission(permissionStatus?.display || 'prompt')
    setExactAlarm(exactStatus?.exact_alarm || exactStatus?.value || 'unknown')
    setPendingCount(Array.isArray(pending?.notifications) ? pending.notifications.length : 0)
  }

  useEffect(() => {
    refreshNativeStatus()
  }, [])

  async function ensurePermission() {
    if (!nativeApp) return { display: 'web' }

    const current = await checkNotificationPermission()
    if (current?.display === 'granted') return current

    const requested = await requestNotificationPermission()
    setPermission(requested?.display || 'prompt')
    return requested
  }

  async function handleRequestPermission() {
    setIsBusy(true)
    try {
      const result = await requestNotificationPermission()
      setPermission(result?.display || 'prompt')

      if (result?.display === 'granted') {
        onShowToast?.('success', 'Permissão liberada', 'Agora o ForgeFlow pode agendar lembretes no celular.')
        return
      }

      if (!nativeApp) {
        onShowToast?.('success', 'Preferência web', 'No navegador as preferências ficam salvas, mas a notificação real depende do APK.')
        return
      }

      onShowToast?.('error', 'Permissão não liberada', 'Ative as notificações do ForgeFlow nas configurações do Android.')
    } finally {
      setIsBusy(false)
      refreshNativeStatus()
    }
  }

  async function handleExactAlarmSettings() {
    if (!nativeApp) return

    setIsBusy(true)
    try {
      await requestExactNotificationPermission()
      onShowToast?.('success', 'Configuração aberta', 'Confira se alarmes/lembretes exatos estão permitidos para o ForgeFlow.')
    } finally {
      setIsBusy(false)
      refreshNativeStatus()
    }
  }

  async function handleTestNotification() {
    setIsBusy(true)
    try {
      const permissionResult = await ensurePermission()
      if (nativeApp && permissionResult?.display !== 'granted') {
        onShowToast?.('error', 'Notificação bloqueada', 'Permita notificações do ForgeFlow no Android antes do teste.')
        return
      }

      const result = await scheduleTestNotification(10)
      if (result?.reason === 'not-native') {
        onShowToast?.('success', 'Teste salvo', 'O teste real de notificação só aparece no APK Android.')
      } else {
        onShowToast?.('success', 'Teste agendado', 'Uma notificação deve aparecer em aproximadamente 10 segundos.')
      }
    } finally {
      setIsBusy(false)
      refreshNativeStatus()
    }
  }

  async function handleWeightReminderToggle(value) {
    setIsBusy(true)
    try {
      await onUpdateSetting('weightReminderEnabled', value)

      if (value) {
        const permissionResult = await ensurePermission()
        if (nativeApp && permissionResult?.display !== 'granted') {
          onShowToast?.('error', 'Notificação bloqueada', 'Permita notificações do ForgeFlow no Android para ativar o lembrete.')
          return
        }

        const result = await scheduleDailyWeightReminder(settings.weightReminderTime)
        if (result?.reason === 'not-native') {
          onShowToast?.('success', 'Preferência salva', 'No navegador o lembrete fica salvo; no APK ele vira notificação real.')
        } else {
          onShowToast?.('success', 'Lembrete ativado', `Peso: todo dia às ${settings.weightReminderTime}.`)
        }
      } else {
        await cancelDailyWeightReminder()
        onShowToast?.('success', 'Lembrete desativado', 'O lembrete diário de peso foi cancelado.')
      }
    } finally {
      setIsBusy(false)
      refreshNativeStatus()
    }
  }

  async function handleWorkoutReminderToggle(value) {
    setIsBusy(true)
    try {
      await onUpdateSetting('workoutReminderEnabled', value)

      if (value) {
        if (scheduledWorkoutDays === 0) {
          await onUpdateSetting('workoutReminderEnabled', false)
          onShowToast?.('error', 'Agenda vazia', 'Configure pelo menos um treino semanal antes de ativar o lembrete.')
          return
        }

        const permissionResult = await ensurePermission()
        if (nativeApp && permissionResult?.display !== 'granted') {
          onShowToast?.('error', 'Notificação bloqueada', 'Permita notificações do ForgeFlow no Android para ativar o lembrete.')
          return
        }

        const result = await scheduleWeeklyWorkoutReminders({
          schedule: settings.weeklySchedule,
          workouts,
          time: settings.workoutReminderTime,
        })

        if (result?.reason === 'not-native') {
          onShowToast?.('success', 'Preferência salva', 'No navegador o lembrete fica salvo; no APK ele vira notificação real.')
        } else {
          onShowToast?.('success', 'Lembretes ativados', `${result?.count || scheduledWorkoutDays} treino(s) serão lembrados semanalmente.`)
        }
      } else {
        await cancelWorkoutReminders()
        onShowToast?.('success', 'Lembretes desativados', 'Os lembretes de treino foram cancelados.')
      }
    } finally {
      setIsBusy(false)
      refreshNativeStatus()
    }
  }

  async function handleWeightTimeChange(value) {
    await onUpdateSetting('weightReminderTime', value)
    if (settings.weightReminderEnabled) await scheduleDailyWeightReminder(value)
    refreshNativeStatus()
  }

  async function handleWorkoutTimeChange(value) {
    await onUpdateSetting('workoutReminderTime', value)
    if (settings.workoutReminderEnabled) {
      await scheduleWeeklyWorkoutReminders({
        schedule: settings.weeklySchedule,
        workouts,
        time: value,
      })
    }
    refreshNativeStatus()
  }

  return (
    <Card className="ff-reminders-card">
      <SectionTitle
        icon={BellRing}
        title="Lembretes no celular"
        description="Configure avisos de peso e treino com uma interface melhor para APK Android."
      />

      <div className="ff-reminder-status-grid mt-5">
        <NativeStatusPill
          icon={Smartphone}
          label="Ambiente"
          value={nativeApp ? 'APK Android' : 'Navegador'}
          tone={nativeApp ? 'success' : 'neutral'}
        />
        <NativeStatusPill
          icon={Bell}
          label="Permissão"
          value={getPermissionLabel(permission)}
          tone={getPermissionTone(permission, nativeApp)}
        />
        <NativeStatusPill
          icon={Clock3}
          label="Alarme exato"
          value={nativeApp ? (exactAlarm === 'granted' ? 'Permitido' : exactAlarm === 'denied' ? 'Bloqueado' : 'Verificar') : 'Modo web'}
          tone={!nativeApp ? 'neutral' : exactAlarm === 'granted' ? 'success' : exactAlarm === 'denied' ? 'warning' : 'neutral'}
        />
        <NativeStatusPill
          icon={CalendarCheck}
          label="Treinos na agenda"
          value={`${scheduledWorkoutDays} dia(s)`}
          tone={scheduledWorkoutDays > 0 ? 'success' : 'warning'}
        />
        <NativeStatusPill
          icon={Clock3}
          label="Pendentes"
          value={`${pendingCount}`}
          tone={pendingCount > 0 ? 'success' : 'neutral'}
        />
      </div>

      <div className="ff-reminder-permission-panel mt-5">
        <div className="min-w-0">
          <Badge>{nativeApp ? 'APK' : 'Web'}</Badge>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
            {nativeApp
              ? 'Toque em solicitar permissão se o Android ainda não liberou notificações para o ForgeFlow.'
              : 'No navegador as preferências ficam salvas, mas a notificação real só dispara no APK instalado.'}
          </p>
        </div>

        <div className="ff-reminder-action-stack">
          <Button
            type="button"
            variant={permission === 'granted' ? 'secondary' : 'primary'}
            onClick={handleRequestPermission}
            disabled={isBusy}
            className="ff-reminder-primary-action"
          >
            {permission === 'granted' ? 'Verificar permissão' : 'Solicitar permissão'}
          </Button>
          {nativeApp && exactAlarm !== 'granted' && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleExactAlarmSettings}
              disabled={isBusy}
              className="ff-reminder-primary-action"
            >
              Ajustar alarme exato
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestNotification}
            disabled={isBusy}
            className="ff-reminder-primary-action"
          >
            <TestTube2 size={16} /> Testar em 10s
          </Button>
        </div>
      </div>

      <div className="ff-reminder-list mt-6">
        <section className="ff-reminder-item">
          <div className="ff-reminder-item-head">
            <span className="ff-reminder-item-icon"><Weight size={18} /></span>
            <div className="min-w-0">
              <h3>Lembrete de peso</h3>
              <p>Receba um aviso diário para registrar seu peso.</p>
            </div>
          </div>

          <div className="ff-reminder-item-control">
            <SettingToggleCard
              title="Ativar peso diário"
              description="Ideal para acompanhar evolução sem esquecer registros."
              active={settings.weightReminderEnabled}
              disabled={isBusy}
              onChange={handleWeightReminderToggle}
            />

            <Input
              label="Horário"
              type="time"
              value={settings.weightReminderTime}
              disabled={!settings.weightReminderEnabled || isBusy}
              onChange={(event) => handleWeightTimeChange(event.target.value)}
            />
          </div>
        </section>

        <section className="ff-reminder-item">
          <div className="ff-reminder-item-head">
            <span className="ff-reminder-item-icon"><CalendarCheck size={18} /></span>
            <div className="min-w-0">
              <h3>Lembrete de treino</h3>
              <p>Avisa somente nos dias que têm treino na agenda semanal.</p>
            </div>
          </div>

          <div className="ff-reminder-item-control">
            <SettingToggleCard
              title="Ativar treino do dia"
              description={scheduledWorkoutDays > 0
                ? `${scheduledWorkoutDays} dia(s) com treino configurado.`
                : 'Configure a agenda semanal antes de ativar.'}
              active={settings.workoutReminderEnabled}
              disabled={isBusy}
              onChange={handleWorkoutReminderToggle}
            />

            <Input
              label="Horário"
              type="time"
              value={settings.workoutReminderTime}
              disabled={!settings.workoutReminderEnabled || isBusy || scheduledWorkoutDays === 0}
              onChange={(event) => handleWorkoutTimeChange(event.target.value)}
            />
          </div>
        </section>
      </div>
    </Card>
  )
}

export default NotificationSettingsSection
