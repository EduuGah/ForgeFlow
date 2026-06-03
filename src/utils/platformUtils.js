import { Capacitor } from '@capacitor/core'

function isForcedCapacitorLayout() {
  return import.meta.env.VITE_FORCE_CAPACITOR_LAYOUT === 'true'
}

export function isNativeApp() {
  try {
    if (Capacitor.isNativePlatform()) return true
  } catch {
    // Continua com os fallbacks abaixo.
  }

  if (typeof window === 'undefined') return false

  const protocol = window.location.protocol
  const hostname = window.location.hostname

  // No Capacitor Android o app normalmente roda como http://localhost em build de produção.
  // Esse fallback evita esconder/errar o fluxo mobile quando Capacitor.isNativePlatform()
  // não estiver disponível cedo o suficiente no bundle.
  return (
    protocol === 'capacitor:' ||
    protocol === 'ionic:' ||
    (import.meta.env.PROD && ['localhost', '127.0.0.1'].includes(hostname))
  )
}

export function getGoogleLoginUrl(apiUrl) {
  const baseUrl = String(apiUrl || '').replace(/\/$/, '')

  if (isNativeApp()) {
    return `${baseUrl}/auth/google/mobile`
  }

  return `${baseUrl}/auth/google`
}


export function isCapacitorLayout() {
  return isNativeApp() || isForcedCapacitorLayout()
}
