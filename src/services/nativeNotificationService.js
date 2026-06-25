import { registerPlugin } from '@capacitor/core'

import { isNativeApp } from '../utils/platformUtils'
import {
  WEEK_DAYS,
  findWorkoutByScheduleEntry,
  getScheduleEntryTime,
  getShiftedWeekday,
  getWorkoutName,
  normalizeWeeklySchedule,
  subtractMinutesFromTime,
} from '../utils/workoutScheduleUtils'

const LocalNotifications = registerPlugin('LocalNotifications')
const ActiveWorkoutForeground = registerPlugin('ActiveWorkoutForeground')

const WEIGHT_REMINDER_ID = 9001
const WORKOUT_REMINDER_BASE_ID = 9100
const TEST_REMINDER_ID = 9999
const ACTIVE_WORKOUT_NOTIFICATION_ID = 9301
const HYDRATION_REMINDER_ID = 9401
const PRE_WORKOUT_MEAL_REMINDER_ID = 9402
const POST_WORKOUT_MEAL_REMINDER_ID = 9403
const PROGRESS_PHOTO_REMINDER_ID = 9404
const SLEEP_REMINDER_ID = 9405
const CUSTOM_REMINDER_BASE_ID = 9500
const DEFAULT_WEIGHT_TIME = '08:00'
const DEFAULT_WORKOUT_TIME = '18:00'
const REMINDER_CHANNEL_ID = 'forgeflow-reminders'
const ACTIVE_WORKOUT_CHANNEL_ID = 'forgeflow-active-workout'

function parseTime(time = DEFAULT_WEIGHT_TIME) {
  const [rawHour, rawMinute] = String(time || '').split(':')
  const hour = Math.min(23, Math.max(0, Number(rawHour) || 0))
  const minute = Math.min(59, Math.max(0, Number(rawMinute) || 0))

  return { hour, minute }
}

function canUseNativeNotifications() {
  return isNativeApp() && Boolean(LocalNotifications)
}

function buildScheduleOn(time, weekday) {
  const { hour, minute } = parseTime(time)
  const on = { hour, minute, second: 0 }

  if (weekday) on.weekday = weekday

  return {
    on,
    repeats: true,
    allowWhileIdle: true,
  }
}

function buildOneShotSchedule(secondsFromNow = 10) {
  return {
    at: new Date(Date.now() + Math.max(1, secondsFromNow) * 1000),
    allowWhileIdle: true,
  }
}

function buildNotification(payload) {
  return {
    channelId: REMINDER_CHANNEL_ID,
    autoCancel: true,
    ...payload,
  }
}

async function ensureAndroidChannel() {
  if (!canUseNativeNotifications()) return

  try {
    await LocalNotifications.createChannel?.({
      id: REMINDER_CHANNEL_ID,
      name: 'Lembretes ForgeFlow',
      description: 'Lembretes de treino, água, refeições e registro de peso.',
      importance: 4,
      visibility: 1,
    })
  } catch {
    // Canais podem não existir em todas as plataformas/versões do plugin.
  }

  try {
    await LocalNotifications.createChannel?.({
      id: ACTIVE_WORKOUT_CHANNEL_ID,
      name: 'Treino em andamento',
      description: 'Resumo persistente do treino ativo.',
      importance: 3,
      visibility: 1,
    })
  } catch {
    // Canais podem não existir em todas as plataformas/versões do plugin.
  }
}


export async function checkNotificationPermission() {
  if (!canUseNativeNotifications()) {
    return { display: 'granted', source: 'web-fallback' }
  }

  try {
    return await LocalNotifications.checkPermissions()
  } catch {
    return { display: 'prompt' }
  }
}

export async function checkExactNotificationPermission() {
  if (!canUseNativeNotifications()) {
    return { exact_alarm: 'granted', source: 'web-fallback' }
  }

  try {
    return await LocalNotifications.checkExactNotificationSetting?.()
  } catch {
    return { exact_alarm: 'unknown' }
  }
}

export async function requestExactNotificationPermission() {
  if (!canUseNativeNotifications()) {
    return { exact_alarm: 'granted', source: 'web-fallback' }
  }

  try {
    return await LocalNotifications.changeExactNotificationSetting?.()
  } catch {
    return { exact_alarm: 'unknown' }
  }
}

export async function requestNotificationPermission() {
  if (!canUseNativeNotifications()) {
    return { display: 'granted', source: 'web-fallback' }
  }

  const current = await checkNotificationPermission()
  if (current?.display === 'granted') return current

  return LocalNotifications.requestPermissions()
}

export async function getPendingNotifications() {
  if (!canUseNativeNotifications()) return { notifications: [] }

  try {
    return await LocalNotifications.getPending()
  } catch {
    return { notifications: [] }
  }
}

export async function cancelNotificationsByIds(ids = []) {
  if (!canUseNativeNotifications()) return

  const notifications = ids.map((id) => ({ id }))
  if (notifications.length === 0) return

  await LocalNotifications.cancel({ notifications })
}

export async function cancelDailyWeightReminder() {
  await cancelNotificationsByIds([WEIGHT_REMINDER_ID])
}

export async function cancelWorkoutReminders() {
  await cancelNotificationsByIds(WEEK_DAYS.map((_, index) => WORKOUT_REMINDER_BASE_ID + index))
}

export async function cancelTestReminder() {
  await cancelNotificationsByIds([TEST_REMINDER_ID])
}

export async function cancelAllForgeFlowNotifications() {
  await cancelNotificationsByIds([
    WEIGHT_REMINDER_ID,
    TEST_REMINDER_ID,
    ACTIVE_WORKOUT_NOTIFICATION_ID,
    HYDRATION_REMINDER_ID,
    PRE_WORKOUT_MEAL_REMINDER_ID,
    POST_WORKOUT_MEAL_REMINDER_ID,
    PROGRESS_PHOTO_REMINDER_ID,
    SLEEP_REMINDER_ID,
    ...WEEK_DAYS.map((_, index) => WORKOUT_REMINDER_BASE_ID + index),
  ])
}

export async function scheduleTestNotification(secondsFromNow = 10) {
  if (!canUseNativeNotifications()) return { scheduled: false, reason: 'not-native' }

  const permission = await requestNotificationPermission()
  if (permission?.display !== 'granted') return { scheduled: false, reason: 'permission-denied' }

  await ensureAndroidChannel()
  await cancelTestReminder()

  await LocalNotifications.schedule({
    notifications: [
      buildNotification({
        id: TEST_REMINDER_ID,
        title: 'Teste de lembrete ForgeFlow',
        body: 'Se você recebeu esta notificação, os lembretes estão funcionando no APK.',
        schedule: buildOneShotSchedule(secondsFromNow),
      }),
    ],
  })

  return { scheduled: true, secondsFromNow }
}

export async function scheduleDailyWeightReminder(time = DEFAULT_WEIGHT_TIME) {
  if (!canUseNativeNotifications()) return { scheduled: false, reason: 'not-native' }

  const permission = await requestNotificationPermission()
  if (permission?.display !== 'granted') return { scheduled: false, reason: 'permission-denied' }

  await ensureAndroidChannel()
  await cancelDailyWeightReminder()

  await LocalNotifications.schedule({
    notifications: [
      buildNotification({
        id: WEIGHT_REMINDER_ID,
        title: 'Hora de registrar seu peso',
        body: 'Atualize seu peso de hoje no ForgeFlow e acompanhe sua evolução.',
        schedule: buildScheduleOn(time),
      }),
    ],
  })

  return { scheduled: true }
}

export async function scheduleWeeklyWorkoutReminders({
  schedule,
  workouts,
  time = DEFAULT_WORKOUT_TIME,
  leadMinutes = 0,
}) {
  if (!canUseNativeNotifications()) return { scheduled: false, reason: 'not-native' }

  const permission = await requestNotificationPermission()
  if (permission?.display !== 'granted') return { scheduled: false, reason: 'permission-denied' }

  await ensureAndroidChannel()
  await cancelWorkoutReminders()

  const normalizedSchedule = normalizeWeeklySchedule(schedule)
  const notifications = WEEK_DAYS.flatMap((day, index) => {
    const entry = normalizedSchedule[day.key]
    const workout = findWorkoutByScheduleEntry(workouts, entry)

    if (entry?.type !== 'workout' || !workout) return []

    const workoutName = getWorkoutName(workout)
    const plannedTime = getScheduleEntryTime(entry, time)
    const reminderSchedule = subtractMinutesFromTime(plannedTime, leadMinutes)
    const reminderWeekday = getShiftedWeekday(day.weekday, reminderSchedule.dayOffset)
    const leadLabel = Number(leadMinutes) > 0 ? `${leadMinutes} min antes` : 'na hora do treino'

    return [
      buildNotification({
        id: WORKOUT_REMINDER_BASE_ID + index,
        title: `Treino de hoje: ${workoutName}`,
        body: `Seu treino ${workoutName} está planejado para ${plannedTime}. Lembrete ${leadLabel}.`,
        schedule: buildScheduleOn(reminderSchedule.time, reminderWeekday),
        extra: {
          forgeflowRoute: '/schedule',
          dayKey: day.key,
          workoutId: entry.workoutId,
        },
      }),
    ]
  })

  if (notifications.length === 0) return { scheduled: false, reason: 'empty-schedule' }

  await LocalNotifications.schedule({ notifications })

  return { scheduled: true, count: notifications.length }
}

export const DEFAULT_LIFESTYLE_REMINDERS = [
  {
    id: 'water-1800',
    title: 'Lembre-se de se hidratar',
    body: 'Beba agua e mantenha o corpo pronto para treinar.',
    time: '18:00',
    days: WEEK_DAYS.map((day) => day.key),
    enabled: true,
  },
  {
    id: 'train-today-1930',
    title: 'Ja treinou hoje?',
    body: 'Um treino feito hoje conta muito para sua consistencia.',
    time: '19:30',
    days: WEEK_DAYS.map((day) => day.key),
    enabled: false,
  },
  {
    id: 'recovery-2130',
    title: 'Recuperacao tambem e treino',
    body: 'Veja seus grupos musculares e planeje o proximo treino com calma.',
    time: '21:30',
    days: WEEK_DAYS.map((day) => day.key),
    enabled: false,
  },
]

function getCustomReminderBaseId(reminder = {}) {
  const source = String(reminder.id || reminder.title || 'reminder')
  let hash = 0

  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash) + source.charCodeAt(index)
    hash |= 0
  }

  return CUSTOM_REMINDER_BASE_ID + (Math.abs(hash) % 500) * 8
}

function getCustomReminderIds(reminder = {}) {
  const days = Array.isArray(reminder.days) ? reminder.days : []
  const baseId = getCustomReminderBaseId(reminder)

  if (days.length === 0) return [baseId]

  return WEEK_DAYS
    .map((day, index) => days.includes(day.key) ? baseId + index : null)
    .filter((id) => id !== null)
}

export async function cancelCustomReminder(reminder) {
  await cancelNotificationsByIds(getCustomReminderIds(reminder))
}

export async function scheduleCustomReminder(reminder = {}) {
  if (!canUseNativeNotifications()) return { scheduled: false, reason: 'not-native' }
  if (!reminder.enabled) {
    await cancelCustomReminder(reminder)
    return { scheduled: false, reason: 'disabled' }
  }

  const permission = await requestNotificationPermission()
  if (permission?.display !== 'granted') return { scheduled: false, reason: 'permission-denied' }

  await ensureAndroidChannel()
  await cancelCustomReminder(reminder)

  const title = String(reminder.title || 'Lembrete ForgeFlow').trim()
  const body = String(reminder.body || 'Seu lembrete esta na hora.').trim()
  const days = Array.isArray(reminder.days) ? reminder.days : []
  const baseId = getCustomReminderBaseId(reminder)
  const time = reminder.time || DEFAULT_WORKOUT_TIME

  const notifications = days.length > 0
    ? WEEK_DAYS.flatMap((day, index) => {
        if (!days.includes(day.key)) return []

        return [
          buildNotification({
            id: baseId + index,
            title,
            body,
            schedule: buildScheduleOn(time, day.weekday),
            extra: {
              forgeflowRoute: reminder.actionUrl || '/notifications',
              reminderId: reminder.id,
            },
          }),
        ]
      })
    : [
        buildNotification({
          id: baseId,
          title,
          body,
          schedule: buildScheduleOn(time),
          extra: {
            forgeflowRoute: reminder.actionUrl || '/notifications',
            reminderId: reminder.id,
          },
        }),
      ]

  if (notifications.length === 0) return { scheduled: false, reason: 'empty-days' }

  await LocalNotifications.schedule({ notifications })

  return { scheduled: true, count: notifications.length }
}

export async function rescheduleCustomReminders(reminders = []) {
  const results = []

  for (const reminder of reminders) {
    if (reminder?.enabled) {
      results.push(await scheduleCustomReminder(reminder))
    } else {
      await cancelCustomReminder(reminder)
      results.push({ scheduled: false, reason: 'disabled' })
    }
  }

  return results
}



export async function cancelActiveWorkoutNotification() {
  try {
    if (isNativeApp()) {
      await ActiveWorkoutForeground?.stop?.()
    }
  } catch {
    // Foreground service é um recurso Android local. Se não existir, seguimos com fallback.
  }

  await cancelNotificationsByIds([ACTIVE_WORKOUT_NOTIFICATION_ID])
}

export async function updateActiveWorkoutNotification({
  workoutName,
  elapsedLabel,
  completedSets = 0,
  totalSets = 0,
  progressPercent = 0,
  startedAt,
  currentExerciseName = '',
  currentSetLabel = '',
  completedExercises = 0,
  totalExercises = 0,
}) {
  if (!canUseNativeNotifications()) return { scheduled: false, reason: 'not-native' }

  const permission = await requestNotificationPermission()
  if (permission?.display !== 'granted') return { scheduled: false, reason: 'permission-denied' }

  const safeWorkoutName = workoutName || 'Treino em andamento'
  const safeProgress = Math.max(0, Math.min(100, Math.round(Number(progressPercent) || 0)))
  const safeCompletedSets = Math.max(0, Number(completedSets) || 0)
  const safeTotalSets = Math.max(0, Number(totalSets) || 0)
  const safeStartedAt = startedAt ? new Date(startedAt).getTime() : Date.now()
  const safeTotalExercises = Math.max(0, Number(totalExercises) || 0)
  const safeCompletedExercises = Math.max(0, Math.min(safeTotalExercises, Number(completedExercises) || 0))
  const safeExerciseName = String(currentExerciseName || '').trim()
  const safeCurrentSetLabel = String(currentSetLabel || '').trim()
  const exerciseSummary = safeTotalExercises > 0
    ? `${safeCompletedExercises}/${safeTotalExercises} exercícios`
    : 'Exercícios em andamento'
  const setSummary = `${safeCompletedSets}/${safeTotalSets} series`
  const summary = `${elapsedLabel || '00:00:00'} - ${setSummary} - ${safeProgress}%`
  const detailedSummary = safeExerciseName
    ? `${safeCurrentSetLabel ? `${safeCurrentSetLabel} - ` : ''}${safeExerciseName} - ${summary}`
    : `${summary} - ${exerciseSummary}`

  // Preferência no Android: foreground service nativo.
  // Ele mantém uma notificação constante na barra mesmo com o app em segundo plano.
  try {
    await ActiveWorkoutForeground?.start?.({
      workoutName: safeWorkoutName,
      summary: detailedSummary,
      progress: safeProgress,
      startedAt: Number.isFinite(safeStartedAt) ? safeStartedAt : Date.now(),
      currentExerciseName: safeExerciseName,
      currentSetLabel: safeCurrentSetLabel,
      completedSets: safeCompletedSets,
      totalSets: safeTotalSets,
      completedExercises: safeCompletedExercises,
      totalExercises: safeTotalExercises,
    })

    return { scheduled: true, source: 'foreground-service' }
  } catch {
    // Fallback: local notification atualizável. Não é tão constante quanto foreground service.
  }

  await ensureAndroidChannel()

  const body = `${safeWorkoutName} · ${exerciseSummary} · ${detailedSummary}`

  await LocalNotifications.schedule({
    notifications: [
      {
        id: ACTIVE_WORKOUT_NOTIFICATION_ID,
        channelId: ACTIVE_WORKOUT_CHANNEL_ID,
        title: 'ForgeFlow · Treino em andamento',
        body,
        smallIcon: 'ic_launcher',
        extra: {
          forgeflowRoute: '/start-workout',
          deepLink: 'forgeflow://workout/active?source=local-notification',
        },
        ongoing: true,
        autoCancel: false,
        schedule: buildOneShotSchedule(1),
      },
    ],
  })

  return { scheduled: true, source: 'local-notification-fallback' }
}

const SMART_REMINDERS = {
  hydration: {
    id: HYDRATION_REMINDER_ID,
    enabledKey: 'hydrationReminderEnabled',
    timeKey: 'hydrationReminderTime',
    defaultTime: '10:00',
    title: 'Hora da água 💧',
    body: 'Beba um pouco de água para manter o treino e o dia em dia em ordem.',
  },
  preWorkoutMeal: {
    id: PRE_WORKOUT_MEAL_REMINDER_ID,
    enabledKey: 'preWorkoutMealReminderEnabled',
    timeKey: 'preWorkoutMealReminderTime',
    defaultTime: '16:30',
    title: 'Refeição pré-treino 🍌',
    body: 'Se for treinar em breve, vale garantir energia antes do treino.',
  },
  postWorkoutMeal: {
    id: POST_WORKOUT_MEAL_REMINDER_ID,
    enabledKey: 'postWorkoutMealReminderEnabled',
    timeKey: 'postWorkoutMealReminderTime',
    defaultTime: '20:30',
    title: 'Pós-treino em ordem 🍽️',
    body: 'Depois do treino, uma boa refeição ajuda na recuperação.',
  },
  progressPhoto: {
    id: PROGRESS_PHOTO_REMINDER_ID,
    enabledKey: 'progressPhotoReminderEnabled',
    timeKey: 'progressPhotoReminderTime',
    defaultTime: '09:00',
    title: 'Registrar progresso 📸',
    body: 'Uma foto semanal ajuda você a enxergar evolução além da balança.',
  },
  sleep: {
    id: SLEEP_REMINDER_ID,
    enabledKey: 'sleepReminderEnabled',
    timeKey: 'sleepReminderTime',
    defaultTime: '22:30',
    title: 'Dormir bem também é treino 🌙',
    body: 'Organize seu descanso para recuperar melhor e evoluir com consistência.',
  },
}

export async function scheduleSmartReminder(key, settings = {}) {
  const reminder = SMART_REMINDERS[key]
  if (!reminder) return { scheduled: false, reason: 'unknown-reminder' }
  if (!canUseNativeNotifications()) return { scheduled: false, reason: 'not-native' }

  const permission = await requestNotificationPermission()
  if (permission?.display !== 'granted') return { scheduled: false, reason: 'permission-denied' }

  await ensureAndroidChannel()
  await cancelNotificationsByIds([reminder.id])

  await LocalNotifications.schedule({
    notifications: [
      buildNotification({
        id: reminder.id,
        title: reminder.title,
        body: reminder.body,
        schedule: buildScheduleOn(settings[reminder.timeKey] || reminder.defaultTime),
      }),
    ],
  })

  return { scheduled: true }
}

export async function cancelSmartReminder(key) {
  const reminder = SMART_REMINDERS[key]
  if (!reminder) return
  await cancelNotificationsByIds([reminder.id])
}

export async function rescheduleSmartReminders(settings = {}) {
  for (const [key, reminder] of Object.entries(SMART_REMINDERS)) {
    if (settings?.[reminder.enabledKey]) {
      await scheduleSmartReminder(key, settings)
    } else {
      await cancelSmartReminder(key)
    }
  }
}

export { SMART_REMINDERS }

export async function rescheduleConfiguredNotifications({ settings, workouts }) {
  if (!canUseNativeNotifications()) return { scheduled: false, reason: 'not-native' }

  if (settings?.weightReminderEnabled) {
    await scheduleDailyWeightReminder(settings.weightReminderTime || DEFAULT_WEIGHT_TIME)
  } else {
    await cancelDailyWeightReminder()
  }

  if (settings?.workoutReminderEnabled) {
    await scheduleWeeklyWorkoutReminders({
      schedule: settings.weeklySchedule,
      workouts,
      time: settings.workoutReminderTime || DEFAULT_WORKOUT_TIME,
      leadMinutes: settings.workoutReminderLeadMinutes || 0,
    })
  } else {
    await cancelWorkoutReminders()
  }

  await rescheduleSmartReminders(settings)

  return { scheduled: true }
}

export { WEIGHT_REMINDER_ID, WORKOUT_REMINDER_BASE_ID, TEST_REMINDER_ID, ACTIVE_WORKOUT_NOTIFICATION_ID }
