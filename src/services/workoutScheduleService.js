import { apiFetch } from './api'
import { getUserAppSettings, saveUserAppSettings } from '../utils/settingsUtils'
import { hydrateWeeklyScheduleWithWorkoutNames, normalizeWeeklySchedule } from '../utils/workoutScheduleUtils'

export async function loadScheduleSettings(user) {
  const cachedSettings = getUserAppSettings(user)

  try {
    const remoteSettings = await apiFetch('/settings')
    return saveUserAppSettings(user, {
      ...cachedSettings,
      ...remoteSettings,
    })
  } catch {
    return cachedSettings
  }
}

export async function saveScheduleSettings(user, nextSettings) {
  const savedSettings = saveUserAppSettings(user, nextSettings)

  try {
    const remoteSettings = await apiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(savedSettings),
    })

    return saveUserAppSettings(user, {
      ...savedSettings,
      ...remoteSettings,
    })
  } catch {
    return savedSettings
  }
}

export function buildScheduleSettingsPayload(settings, weeklySchedule, workouts = []) {
  return {
    ...settings,
    weeklySchedule: hydrateWeeklyScheduleWithWorkoutNames(
      normalizeWeeklySchedule(weeklySchedule),
      workouts
    ),
  }
}
