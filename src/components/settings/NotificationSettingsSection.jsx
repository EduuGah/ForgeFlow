import { useEffect, useMemo, useState } from 'react'
import { Bell, BellRing, Smartphone } from 'lucide-react'

import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { SectionTitle, SettingToggleCard } from '../../features/settings/components/SettingsBaseControls'
import {
  cancelDailyWeightReminder,
  cancelWorkoutReminders,
  checkNotificationPermission,
  getPendingNotifications,
  requestNotificationPermission,
  scheduleDailyWeightReminder,
  scheduleWeeklyWorkoutReminders,
} from '../../services/nativeNotificationService'
import { isNativeApp } from '../../utils/platformUtils'

function getPermissionLabel(permission) {
  if (!isNativeApp()) return 'Fallback web'
  if (permission === 'granted') return 'Permitido'
  if (permission === 'denied') return 'Bloqueado'
  if (permission === 'prompt') return 'Pendente'
  return 'Indefinido'
}

function NotificationSettingsSection({ settings, workouts = [], onUpdateSetting, onShowToast }) {
  const [permission, setPermission] = useState('prompt')
  const [pendingCount, setPendingCount] = useState(0)
  const nativeApp = useMemo(() => isNativeApp(), [])

  async function refreshNativeStatus() {
    const permissionStatus = await checkNotificationPermission()
    const pending = await getPendingNotifications()

    setPermission(permissionStatus?.display || 'prompt')
    setPendingCount(Array.isArray(pending?.notifications) ? pending.notifications.length : 0)
  }

  useEffect(() => {
    refreshNativeStatus()
  }, [])

  async function handleRequestPermission() {
    const result = await requestNotificationPermission()
    setPermission(result?.display || 'prompt')

    if (result?.display === 'granted') {
      onShowToast?.('success', 'Permissão liberada', 'As notificações do ForgeFlow podem ser agendadas no celular.')
      return
    }

    onShowToast?.('error', 'Permissão não liberada', 'Ative as notificações do ForgeFlow nas configurações do Android.')
  }

  async function handleWeightReminderToggle(value) {
    await onUpdateSetting('weightReminderEnabled', value)

    if (value) {
      const result = await scheduleDailyWeightReminder(settings.weightReminderTime)
      if (result?.reason === 'permission-denied') {
        onShowToast?.('error', 'Notificação bloqueada', 'Permita notificações do ForgeFlow no Android.')
      } else if (result?.reason === 'not-native') {
        onShowToast?.('success', 'Preferência salva', 'No navegador a configuração fica salva, mas a notificação real só roda no APK.')
      } else {
        onShowToast?.('success', 'Lembrete ativado', 'O lembrete diário de peso foi agendado.')
      }
    } else {
      await cancelDailyWeightReminder()
      onShowToast?.('success', 'Lembrete desativado', 'O lembrete diário de peso foi cancelado.')
    }

    refreshNativeStatus()
  }

  async function handleWorkoutReminderToggle(value) {
    await onUpdateSetting('workoutReminderEnabled', value)

    if (value) {
      const result = await scheduleWeeklyWorkoutReminders({
        schedule: settings.weeklySchedule,
        workouts,
        time: settings.workoutReminderTime,
      })

      if (result?.reason === 'empty-schedule') {
        onShowToast?.('error', 'Agenda vazia', 'Configure pelo menos um treino semanal antes de ativar o lembrete.')
      } else if (result?.reason === 'permission-denied') {
        onShowToast?.('error', 'Notificação bloqueada', 'Permita notificações do ForgeFlow no Android.')
      } else if (result?.reason === 'not-native') {
        onShowToast?.('success', 'Preferência salva', 'No navegador a configuração fica salva, mas a notificação real só roda no APK.')
      } else {
        onShowToast?.('success', 'Lembretes ativados', `${result?.count || 0} lembrete(s) semanal(is) foram agendados.`)
      }
    } else {
      await cancelWorkoutReminders()
      onShowToast?.('success', 'Lembretes desativados', 'Os lembretes de treino foram cancelados.')
    }

    refreshNativeStatus()
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
    <Card>
      <SectionTitle
        icon={BellRing}
        title="Notificações e lembretes"
        description="Configure lembretes reais no APK Android, com fallback seguro para navegador."
      />

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">
            <Smartphone size={14} /> Ambiente
          </p>
          <p className="mt-2 text-sm font-black text-[var(--ff-text)]">
            {nativeApp ? 'APK Android' : 'Navegador/Web'}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">
            <Bell size={14} /> Permissão
          </p>
          <p className="mt-2 text-sm font-black text-[var(--ff-text)]">
            {getPermissionLabel(permission)}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">
            Pendentes
          </p>
          <p className="mt-2 text-sm font-black text-[var(--ff-text)]">
            {pendingCount} notificação(ões)
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
          No Android 13+, o sistema pode bloquear notificações até você permitir manualmente.
        </p>

        <Button type="button" variant="secondary" onClick={handleRequestPermission}>
          Solicitar permissão
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SettingToggleCard
          title="Lembrete diário de peso"
          description="Avise todo dia para registrar o peso corporal e acompanhar evolução."
          active={settings.weightReminderEnabled}
          onChange={handleWeightReminderToggle}
        />

        <Input
          label="Horário do peso"
          type="time"
          value={settings.weightReminderTime}
          onChange={(event) => handleWeightTimeChange(event.target.value)}
        />

        <SettingToggleCard
          title="Lembrete de treino do dia"
          description="Usa a agenda semanal para avisar somente nos dias com treino."
          active={settings.workoutReminderEnabled}
          onChange={handleWorkoutReminderToggle}
        />

        <Input
          label="Horário do treino"
          type="time"
          value={settings.workoutReminderTime}
          onChange={(event) => handleWorkoutTimeChange(event.target.value)}
        />
      </div>

      {!nativeApp && (
        <div className="mt-5 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4">
          <Badge>Modo web</Badge>
          <p className="mt-2 text-sm leading-relaxed text-yellow-100/80">
            As preferências ficam salvas, mas notificações locais reais dependem do APK Android com Capacitor.
          </p>
        </div>
      )}
    </Card>
  )
}

export default NotificationSettingsSection
