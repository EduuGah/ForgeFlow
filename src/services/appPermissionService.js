import { requestLocationPermission } from './geolocationService'
import {
  requestExactNotificationPermission,
  requestNotificationPermission,
} from './nativeNotificationService'
import { isNativeApp } from '../utils/platformUtils'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'

const STARTUP_PERMISSION_KEY = 'startup-permissions-v2'

export async function requestStartupPermissions(user) {
  if (!user || !isNativeApp()) return { requested: false, reason: 'not-native' }

  const cached = getUserStorageData(user, STARTUP_PERMISSION_KEY, null)
  if (cached?.requestedAt) return { requested: false, reason: 'already-requested' }

  const results = {
    notification: null,
    exactAlarm: null,
    location: null,
    requestedAt: new Date().toISOString(),
  }

  try {
    results.notification = await requestNotificationPermission()
  } catch (error) {
    results.notification = { display: 'unknown', error: error?.message || 'notification-permission-error' }
  }

  try {
    results.exactAlarm = await requestExactNotificationPermission()
  } catch (error) {
    results.exactAlarm = { exact_alarm: 'unknown', error: error?.message || 'exact-alarm-permission-error' }
  }

  try {
    results.location = await requestLocationPermission()
  } catch (error) {
    results.location = { location: 'unknown', error: error?.message || 'location-permission-error' }
  }

  saveUserStorageData(user, STARTUP_PERMISSION_KEY, results)

  return { requested: true, results }
}
