import { Capacitor } from '@capacitor/core'

export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export function getGoogleLoginUrl(apiUrl) {
  const baseUrl = String(apiUrl || '').replace(/\/$/, '')
  const platformParam = isNativeApp() ? '?platform=mobile' : ''

  return `${baseUrl}/auth/google${platformParam}`
}
