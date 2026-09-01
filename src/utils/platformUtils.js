import { Capacitor } from '@capacitor/core'

function isForcedCapacitorLayout() {
  // Flag de depuração para conferir o visual do APK no navegador durante o
  // desenvolvimento (`npm run dev:mobile`). Fica restrita ao modo DEV de
  // propósito: o Vite também lê .env.local em `vite build`, e sem essa trava
  // qualquer build feito numa máquina com a flag ligada entregava o layout de
  // celular para todo mundo no desktop.
  return import.meta.env.DEV && import.meta.env.VITE_FORCE_CAPACITOR_LAYOUT === 'true'
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
