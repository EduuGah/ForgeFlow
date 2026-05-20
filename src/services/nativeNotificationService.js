import { registerPlugin } from '@capacitor/core'

import { isNativeApp } from '../utils/platformUtils'
import { WEEK_DAYS, findWorkoutByScheduleEntry, getWorkoutName, normalizeWeeklySchedule } from '../utils/workoutScheduleUtils'

const LocalNotifications = registerPlugin('LocalNotifications')

const WEIGHT_REMINDER_ID = 9001
const WORKOUT_REMINDER_BASE_ID = 9100
const TEST_REMINDER_ID = 9999
const DEFAULT_WEIGHT_TIME = '08:00'
const DEFAULT_WORKOUT_TIME = '18:00'
const REMINDER_CHANNEL_ID = 'forgeflow-reminders'

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
      description: 'Lembretes de treino e registro de peso.',
      importance: 4,
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

export async function scheduleWeeklyWorkoutReminders({ schedule, workouts, time = DEFAULT_WORKOUT_TIME }) {
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

    return [
      buildNotification({
        id: WORKOUT_REMINDER_BASE_ID + index,
        title: `Treino de hoje: ${workoutName}`,
        body: `Seu treino ${workoutName} está programado para hoje. Bora manter a consistência.`,
        schedule: buildScheduleOn(time, day.weekday),
      }),
    ]
  })

  if (notifications.length === 0) return { scheduled: false, reason: 'empty-schedule' }

  await LocalNotifications.schedule({ notifications })

  return { scheduled: true, count: notifications.length }
}

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
    })
  } else {
    await cancelWorkoutReminders()
  }

  return { scheduled: true }
}

export { WEIGHT_REMINDER_ID, WORKOUT_REMINDER_BASE_ID, TEST_REMINDER_ID }
