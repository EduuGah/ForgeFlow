import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Toast from '../components/ui/Toast'
import ScheduleHeader from '../components/schedule/ScheduleHeader'
import WeeklySummaryCards from '../components/schedule/WeeklySummaryCards'
import WeekDayCard from '../components/schedule/WeekDayCard'
import DayDetailsPanel from '../components/schedule/DayDetailsPanel'
import NotificationSettingsCard from '../components/schedule/NotificationSettingsCard'
import { useAuth } from '../context/AuthContext'
import { useWorkoutSession } from '../context/useWorkoutSession'
import { apiFetch } from '../services/api'
import { loadScheduleSettings, saveScheduleSettings } from '../services/workoutScheduleService'
import {
  WORKOUT_REMINDER_BASE_ID,
  checkNotificationPermission,
  getPendingNotifications,
  requestNotificationPermission,
  rescheduleConfiguredNotifications,
  scheduleTestNotification,
  scheduleWeeklyWorkoutReminders,
} from '../services/nativeNotificationService'
import { getUserStorageData, migrateLegacyUserStorageData } from '../utils/userStorage'
import { normalizeWorkoutFromApi } from '../utils/workoutNormalizers'
import {
  WEEK_DAYS,
  findWorkoutByScheduleEntry,
  getDayInfo,
  getNextScheduledWorkout,
  getScheduleEntryTime,
  getScheduleSummary,
  getTodayScheduleKey,
  getTodayScheduledWorkout,
  getWorkoutId,
  getWorkoutName,
  hydrateWeeklyScheduleWithWorkoutNames,
  normalizeScheduleTime,
  normalizeWeeklySchedule,
} from '../utils/workoutScheduleUtils'
import { defaultSettings } from '../utils/settingsUtils'

function normalizeWorkouts(workouts = []) {
  return workouts.map((workout) => normalizeWorkoutFromApi(workout))
}

function getStartOfWeek(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1)
  return start
}

function formatShortDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getWeekLabel(date = new Date()) {
  const start = getStartOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return `${formatShortDate(start)} - ${formatShortDate(end)}`
}

function getWeekDateLabels(date = new Date()) {
  const start = getStartOfWeek(date)

  return WEEK_DAYS.reduce((labels, day, index) => {
    const current = new Date(start)
    current.setDate(start.getDate() + index)
    labels[day.key] = String(current.getDate()).padStart(2, '0')
    return labels
  }, {})
}

function formatNextWorkoutLabel(nextWorkout, fallbackTime) {
  if (!nextWorkout?.workout) return 'Nada planejado'

  const time = getScheduleEntryTime(nextWorkout.entry, fallbackTime)
  const workoutName = getWorkoutName(nextWorkout.workout)

  if (nextWorkout.isToday) return `${workoutName} • Hoje ${time}`
  if (nextWorkout.isTomorrow) return `${workoutName} • Amanhã ${time}`

  return `${workoutName} • ${nextWorkout.day.short} ${time}`
}

function countPendingWorkoutNotifications(pending = []) {
  const maxId = WORKOUT_REMINDER_BASE_ID + WEEK_DAYS.length

  return pending.filter((notification) => {
    const id = Number(notification?.id)
    return id >= WORKOUT_REMINDER_BASE_ID && id < maxId
  }).length
}

function getScheduleSaveFingerprint(schedule) {
  return JSON.stringify(normalizeWeeklySchedule(schedule))
}

function WorkoutSchedule() {
  const { user } = useAuth()
  const { startSession } = useWorkoutSession()
  const navigate = useNavigate()

  const [workouts, setWorkouts] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [weeklySchedule, setWeeklySchedule] = useState(defaultSettings.weeklySchedule)
  const [selectedDayKey, setSelectedDayKey] = useState(getTodayScheduleKey())
  const [notificationPermission, setNotificationPermission] = useState(null)
  const [pendingWorkoutNotifications, setPendingWorkoutNotifications] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isNotificationBusy, setIsNotificationBusy] = useState(false)
  const [isTestingNotification, setIsTestingNotification] = useState(false)
  const [toast, setToast] = useState(null)

  const normalizedSchedule = useMemo(
    () => normalizeWeeklySchedule(weeklySchedule),
    [weeklySchedule]
  )

  const selectedDay = useMemo(() => getDayInfo(selectedDayKey), [selectedDayKey])
  const selectedEntry = normalizedSchedule[selectedDayKey] || { type: 'empty' }
  const selectedWorkout = findWorkoutByScheduleEntry(workouts, selectedEntry)
  const summary = useMemo(() => getScheduleSummary(weeklySchedule), [weeklySchedule])
  const weekLabel = useMemo(() => getWeekLabel(), [])
  const weekDateLabels = useMemo(() => getWeekDateLabels(), [])
  const defaultWorkoutTime = settings.workoutReminderTime || '18:00'
  const alertCount = settings.workoutReminderEnabled ? summary.workoutDays : 0

  const today = useMemo(
    () => getTodayScheduledWorkout({ schedule: weeklySchedule, workouts }),
    [weeklySchedule, workouts]
  )

  const nextWorkout = useMemo(() => {
    if (today.workout) return { ...today, isToday: true, offset: 0 }
    return getNextScheduledWorkout({ schedule: weeklySchedule, workouts })
  }, [today, weeklySchedule, workouts])

  const hasUnsavedChanges = useMemo(() => {
    return getScheduleSaveFingerprint(weeklySchedule) !== getScheduleSaveFingerprint(settings.weeklySchedule)
  }, [settings.weeklySchedule, weeklySchedule])

  function showToast(type, title, message = '') {
    setToast({ type, title, message })
    window.setTimeout(() => setToast(null), 3400)
  }

  async function refreshNotificationStatus() {
    try {
      const [permission, pending] = await Promise.all([
        checkNotificationPermission(),
        getPendingNotifications(),
      ])

      setNotificationPermission(permission)
      setPendingWorkoutNotifications(countPendingWorkoutNotifications(pending?.notifications || []))
    } catch {
      setNotificationPermission({ display: 'unknown' })
      setPendingWorkoutNotifications(0)
    }
  }

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadData() {
      setIsLoading(true)

      const cachedWorkouts = migrateLegacyUserStorageData(user, 'workouts', [])
      let loadedWorkouts = Array.isArray(cachedWorkouts) ? cachedWorkouts : []

      try {
        const remoteWorkouts = await apiFetch('/workouts')
        loadedWorkouts = Array.isArray(remoteWorkouts) ? normalizeWorkouts(remoteWorkouts) : loadedWorkouts
      } catch {
        loadedWorkouts = getUserStorageData(user, 'workouts', loadedWorkouts)
      }

      const loadedSettings = await loadScheduleSettings(user)
      const hydratedSchedule = hydrateWeeklyScheduleWithWorkoutNames(
        loadedSettings.weeklySchedule,
        loadedWorkouts
      )
      const hydratedSettings = { ...loadedSettings, weeklySchedule: hydratedSchedule }

      if (!isMounted) return

      setWorkouts(loadedWorkouts)
      setSettings(hydratedSettings)
      setWeeklySchedule(hydratedSchedule)
      setSelectedDayKey(getTodayScheduleKey())
      setIsLoading(false)
    }

    loadData()
    refreshNotificationStatus()

    return () => {
      isMounted = false
    }
  }, [user])

  function updateSelectedDay(nextEntry) {
    setWeeklySchedule((current) => ({
      ...normalizeWeeklySchedule(current),
      [selectedDayKey]: nextEntry,
    }))
  }

  function handleSelectedWorkoutChange(value) {
    if (value === 'rest') {
      updateSelectedDay({ type: 'rest' })
      return
    }

    if (value === 'empty') {
      updateSelectedDay({ type: 'empty' })
      return
    }

    const workout = workouts.find((item) => getWorkoutId(item) === String(value))

    updateSelectedDay({
      type: 'workout',
      workoutId: String(value),
      workoutName: workout ? getWorkoutName(workout) : 'Treino agendado',
      time: getScheduleEntryTime(selectedEntry, defaultWorkoutTime),
    })
  }

  function handleSelectedTimeChange(value) {
    if (selectedEntry?.type !== 'workout') return

    updateSelectedDay({
      ...selectedEntry,
      time: normalizeScheduleTime(value, defaultWorkoutTime),
    })
  }

  function handleMarkSelectedRest() {
    updateSelectedDay({ type: 'rest' })
  }

  function handleClearSelectedDay() {
    updateSelectedDay({ type: 'empty' })
  }

  async function handleSaveSchedule(nextSettings = settings) {
    setIsSaving(true)

    const hydratedSchedule = hydrateWeeklyScheduleWithWorkoutNames(weeklySchedule, workouts)
    const scheduleSummary = getScheduleSummary(hydratedSchedule)
    const payload = {
      ...nextSettings,
      workoutReminderEnabled: nextSettings.workoutReminderEnabled && scheduleSummary.workoutDays > 0,
      weeklySchedule: hydratedSchedule,
    }

    try {
      const savedSettings = await saveScheduleSettings(user, payload)
      const savedHydratedSettings = {
        ...savedSettings,
        weeklySchedule: hydrateWeeklyScheduleWithWorkoutNames(savedSettings.weeklySchedule, workouts),
      }

      setSettings(savedHydratedSettings)
      setWeeklySchedule(savedHydratedSettings.weeklySchedule)

      await rescheduleConfiguredNotifications({
        settings: savedHydratedSettings,
        workouts,
      })

      await refreshNotificationStatus()
      showToast('success', 'Agenda salva', 'Rotina semanal e alertas foram atualizados.')
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao salvar', error.message || 'Não foi possível salvar a agenda.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReminderChange(key, value) {
    const hydratedSchedule = hydrateWeeklyScheduleWithWorkoutNames(weeklySchedule, workouts)
    const nextSettings = {
      ...settings,
      [key]: value,
      weeklySchedule: hydratedSchedule,
    }

    if (key === 'workoutReminderEnabled' && value && getScheduleSummary(hydratedSchedule).workoutDays === 0) {
      showToast('error', 'Agenda vazia', 'Selecione pelo menos um treino na semana antes de ativar alertas.')
      return
    }

    setIsNotificationBusy(true)
    setSettings(nextSettings)

    try {
      const savedSettings = await saveScheduleSettings(user, nextSettings)
      const savedHydratedSettings = {
        ...savedSettings,
        weeklySchedule: hydrateWeeklyScheduleWithWorkoutNames(savedSettings.weeklySchedule, workouts),
      }
      setSettings(savedHydratedSettings)
      setWeeklySchedule(savedHydratedSettings.weeklySchedule)

      if (savedHydratedSettings.workoutReminderEnabled) {
        const result = await scheduleWeeklyWorkoutReminders({
          schedule: savedHydratedSettings.weeklySchedule,
          workouts,
          time: savedHydratedSettings.workoutReminderTime,
          leadMinutes: savedHydratedSettings.workoutReminderLeadMinutes,
        })

        if (result?.reason === 'not-native') {
          showToast('success', 'Preferência salva', 'Os alertas serão enviados quando estiverem disponíveis no aparelho.')
        } else if (result?.reason === 'permission-denied') {
          showToast('error', 'Notificações bloqueadas', 'Permita as notificações do ForgeFlow nas configurações do aparelho.')
        } else {
          showToast('success', 'Alertas atualizados', `${result?.count || 0} lembrete(s) configurado(s).`)
        }
      } else {
        await rescheduleConfiguredNotifications({ settings: savedHydratedSettings, workouts })
        showToast('success', 'Alertas desativados', 'As notificações da agenda foram canceladas.')
      }

      await refreshNotificationStatus()
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao atualizar', 'Não foi possível atualizar os alertas.')
    } finally {
      setIsNotificationBusy(false)
    }
  }

  async function handleRequestNotificationPermission() {
    setIsNotificationBusy(true)

    try {
      const permission = await requestNotificationPermission()
      setNotificationPermission(permission)

      if (permission?.display === 'granted') {
        showToast('success', 'Permissão ativa', 'Agora o ForgeFlow pode enviar alertas de treino.')
      } else {
        showToast('error', 'Permissão não liberada', 'As notificações continuam bloqueadas no aparelho.')
      }
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro de permissão', 'Não foi possível pedir permissão agora.')
    } finally {
      setIsNotificationBusy(false)
      refreshNotificationStatus()
    }
  }

  async function handleTestNotification() {
    setIsTestingNotification(true)

    try {
      const result = await scheduleTestNotification(8)

      if (result?.reason === 'not-native') {
        showToast('success', 'Teste salvo', 'O lembrete de teste foi registrado.')
      } else if (result?.reason === 'permission-denied') {
        showToast('error', 'Notificações bloqueadas', 'Permita as notificações do app para testar.')
      } else {
        showToast('success', 'Teste enviado', 'A notificação deve aparecer em alguns segundos.')
      }

      await refreshNotificationStatus()
    } catch (error) {
      console.error(error)
      showToast('error', 'Teste falhou', 'Não foi possível criar a notificação de teste.')
    } finally {
      setIsTestingNotification(false)
    }
  }

  async function handleStartTodayWorkout() {
    if (!today.workout) return

    try {
      await apiFetch(`/workouts/${getWorkoutId(today.workout)}/start`, {
        method: 'POST',
      })
    } catch (error) {
      console.error(error)
    }

    startSession(today.workout)
    navigate('/start-workout')
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-workoutschedule ff-schedule-v2">
      <ScheduleHeader
        weekLabel={weekLabel}
        plannedCount={summary.workoutDays}
        alertCount={alertCount}
        nextWorkoutLabel={formatNextWorkoutLabel(nextWorkout, defaultWorkoutTime)}
        todayWorkoutName={today.workout ? getWorkoutName(today.workout) : ''}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isLoading={isLoading}
        onSave={() => handleSaveSchedule()}
        onStartTodayWorkout={handleStartTodayWorkout}
      />

      <WeeklySummaryCards summary={summary} alertCount={alertCount} />

      {workouts.length === 0 && !isLoading && (
        <section className="ff-schedule-v2-empty-state">
          <strong>Nenhum treino criado ainda.</strong>
          <span>Crie uma rotina em Treinos para montar sua agenda semanal.</span>
        </section>
      )}

      <section className="ff-schedule-v2-layout">
        <div className="ff-schedule-v2-main-flow">
          <section className="ff-schedule-v2-week" data-tutorial="schedule-week" aria-label="Calendário semanal de treinos">
            <div className="ff-schedule-v2-section-title">
              <div>
                <span>Planner semanal</span>
                <h2>Dias da semana</h2>
              </div>
              {hasUnsavedChanges && <b>Alterações pendentes</b>}
            </div>

            <div className="ff-schedule-v2-week__grid">
              {WEEK_DAYS.map((day) => {
                const entry = normalizedSchedule[day.key]
                const workout = findWorkoutByScheduleEntry(workouts, entry)

                return (
                  <WeekDayCard
                    key={day.key}
                    day={day}
                    entry={entry}
                    workout={workout}
                    dateLabel={weekDateLabels[day.key]}
                    fallbackTime={defaultWorkoutTime}
                    isToday={today.dayKey === day.key}
                    isSelected={selectedDayKey === day.key}
                    isMissingWorkout={entry?.type === 'workout' && !workout}
                    alertsEnabled={Boolean(settings.workoutReminderEnabled)}
                    onSelect={() => setSelectedDayKey(day.key)}
                  />
                )
              })}
            </div>
          </section>
        </div>

        <aside className="ff-schedule-v2-side-flow">
          <DayDetailsPanel
            day={selectedDay}
            entry={selectedEntry}
            workout={selectedWorkout}
            workouts={workouts}
            fallbackTime={defaultWorkoutTime}
            alertsEnabled={Boolean(settings.workoutReminderEnabled)}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            isToday={selectedDayKey === today.dayKey}
            onWorkoutChange={handleSelectedWorkoutChange}
            onTimeChange={handleSelectedTimeChange}
            onMarkRest={handleMarkSelectedRest}
            onClearDay={handleClearSelectedDay}
            onSave={() => handleSaveSchedule()}
            onStartWorkout={handleStartTodayWorkout}
          />

          <NotificationSettingsCard
            settings={settings}
            summary={summary}
            permission={notificationPermission}
            pendingWorkoutNotifications={pendingWorkoutNotifications}
            isBusy={isNotificationBusy}
            isTesting={isTestingNotification}
            onToggleEnabled={(enabled) => handleReminderChange('workoutReminderEnabled', enabled)}
            onDefaultTimeChange={(value) => handleReminderChange('workoutReminderTime', value)}
            onLeadChange={(value) => handleReminderChange('workoutReminderLeadMinutes', value)}
            onRequestPermission={handleRequestNotificationPermission}
            onTestNotification={handleTestNotification}
          />
        </aside>
      </section>

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

export default WorkoutSchedule
