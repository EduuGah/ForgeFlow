export function getWindowOrigin() {
  if (typeof window === 'undefined') return ''

  return window.location?.origin || ''
}

export function isNativeAppRuntime() {
  if (typeof window === 'undefined') return false

  const origin = getWindowOrigin()

  return (
    origin.startsWith('capacitor://') ||
    origin.startsWith('ionic://') ||
    Boolean(window.Capacitor?.isNativePlatform?.()) ||
    Boolean(window.Capacitor?.getPlatform && window.Capacitor.getPlatform() !== 'web')
  )
}

export function isLocalWebRuntime() {
  if (typeof window === 'undefined') return false

  const hostname = window.location?.hostname || ''

  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname)
}
