const APP_NAME = 'ForgeFlow'
const MANIFEST_PATH = '/manifest.webmanifest'

function ensureMeta(name, content) {
  if (typeof document === 'undefined') return

  const selector = `meta[name="${name}"]`
  let element = document.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function ensureLink(rel, href, attributes = {}) {
  if (typeof document === 'undefined') return

  const selector = `link[rel="${rel}"][href="${href}"]`
  let element = document.querySelector(selector)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    element.setAttribute('href', href)
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
}

export function setupPwaHeadTags() {
  if (typeof document === 'undefined') return

  document.title = APP_NAME

  ensureLink('manifest', MANIFEST_PATH)
  ensureLink('apple-touch-icon', '/icons/apple-touch-icon.png')

  ensureMeta('application-name', APP_NAME)
  ensureMeta('apple-mobile-web-app-title', APP_NAME)
  ensureMeta('apple-mobile-web-app-capable', 'yes')
  ensureMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')
  ensureMeta('mobile-web-app-capable', 'yes')
  ensureMeta('theme-color', '#0b0b0f')
  ensureMeta('msapplication-TileColor', '#0b0b0f')
  ensureMeta(
    'description',
    'ForgeFlow é um app de treinos para registrar cargas, acompanhar evolução, metas e histórico.'
  )
}

export function registerForgeFlowServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update?.()
      })
      .catch((error) => {
        console.warn('[ForgeFlow PWA] Service worker não registrado:', error)
      })
  })
}

export function listenForPwaInstallPrompt(callback) {
  if (typeof window === 'undefined') return () => {}

  function handleBeforeInstallPrompt(event) {
    event.preventDefault()
    callback?.(event)
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }
}
