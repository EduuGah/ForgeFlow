import {
  cancelCustomReminder,
  rescheduleCustomReminders,
} from '../services/nativeNotificationService'
import { getGoalPacing, formatGoalValue } from '../features/goals/goalUtils'
import { getUserStorageData, saveUserStorageData } from './userStorage'
import { WEEK_DAYS } from './workoutScheduleUtils'

export const GOAL_REMINDER_STORAGE_KEY = 'notification-reminders-v1'

const DEFAULT_GOAL_REMINDER_TIME = '19:00'
const DEFAULT_GOAL_REMINDER_DAYS = WEEK_DAYS.map((day) => day.key)

function normalizeReminderTime(time) {
  return /^\d{2}:\d{2}$/.test(String(time || '')) ? time : DEFAULT_GOAL_REMINDER_TIME
}

function normalizeReminderDays(days) {
  const selected = Array.isArray(days) ? days.filter((day) => WEEK_DAYS.some((item) => item.key === day)) : []
  return selected.length ? selected : DEFAULT_GOAL_REMINDER_DAYS
}

export function getGoalReminderId(goal = {}) {
  return `goal-${goal.id || goal._id || goal.title || 'draft'}`
}

export function buildGoalReminder(goal = {}) {
  const pacing = getGoalPacing(goal)
  const remaining = pacing.remainingValue > 0
    ? `Faltam ${formatGoalValue(pacing.remainingValue, goal.unit)}.`
    : 'A meta está pronta para concluir.'
  const cadence = pacing.daysLeft !== null
    ? `${pacing.daysLeft === 0 ? 'Prazo hoje' : `${pacing.daysLeft} dia(s) restantes`}.`
    : 'Revise seu progresso.'

  return {
    id: getGoalReminderId(goal),
    title: `Meta: ${goal.title || 'objetivo ForgeFlow'}`,
    body: `${remaining} ${cadence}`,
    time: normalizeReminderTime(goal.reminderTime),
    days: normalizeReminderDays(goal.reminderDays),
    enabled: goal.reminderEnabled !== false,
    actionUrl: '/goals',
    preset: false,
  }
}

function getStoredReminders(user) {
  const stored = getUserStorageData(user, GOAL_REMINDER_STORAGE_KEY, [])
  return Array.isArray(stored) ? stored : []
}

function withoutGoalReminder(reminders, goal) {
  const reminderId = getGoalReminderId(goal)
  return reminders.filter((reminder) => String(reminder.id) !== String(reminderId))
}

export async function syncGoalReminder(user, goal = {}) {
  if (!user || !goal?.id) return { saved: false, reason: 'missing-goal' }

  const existing = getStoredReminders(user)
  const oldReminder = existing.find((reminder) => String(reminder.id) === getGoalReminderId(goal))
  const base = withoutGoalReminder(existing, goal)
  const shouldSchedule = goal.reminderEnabled && goal.status === 'active' && !goal.isCompleted
  const nextReminders = shouldSchedule
    ? [buildGoalReminder(goal), ...base]
    : base

  saveUserStorageData(user, GOAL_REMINDER_STORAGE_KEY, nextReminders)

  try {
    if (oldReminder && !shouldSchedule) {
      await cancelCustomReminder(oldReminder)
    } else {
      await rescheduleCustomReminders(nextReminders)
    }
  } catch (error) {
    console.warn('[ForgeFlow] Lembrete de meta salvo sem reagendar agora:', error)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('forgeflow:notifications-changed', {
      detail: { reason: 'goal-reminder-updated' },
    }))
  }

  return { saved: true, scheduled: shouldSchedule }
}

export async function removeGoalReminder(user, goal = {}) {
  if (!user || !goal) return { removed: false }

  const existing = getStoredReminders(user)
  const oldReminder = existing.find((reminder) => String(reminder.id) === getGoalReminderId(goal))
  const nextReminders = withoutGoalReminder(existing, goal)

  saveUserStorageData(user, GOAL_REMINDER_STORAGE_KEY, nextReminders)
  try {
    if (oldReminder) await cancelCustomReminder(oldReminder)
  } catch (error) {
    console.warn('[ForgeFlow] Lembrete de meta removido localmente:', error)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('forgeflow:notifications-changed', {
      detail: { reason: 'goal-reminder-removed' },
    }))
  }

  return { removed: Boolean(oldReminder) }
}
