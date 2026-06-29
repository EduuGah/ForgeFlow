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

export function isStandalonePwaMode() {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true ||
    document.referrer?.startsWith('android-app://')
  )
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
  ensureMeta('theme-color', document.documentElement?.dataset?.theme === 'light' ? '#f7f7fb' : '#000000')
  ensureMeta('msapplication-TileColor', document.documentElement?.dataset?.theme === 'light' ? '#f7f7fb' : '#000000')
  ensureMeta('description', 'ForgeFlow é um app de treinos para registrar cargas, acompanhar evolução, metas e histórico.')
}

export function notifyPwaStatus(status) {
  if (typeof window === 'undefined') return

  window.__FORGEFLOW_PWA_STATUS__ = status
  window.dispatchEvent(new CustomEvent('forgeflow:pwa-ready', { detail: { status } }))
}

export function registerForgeFlowServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) {
    notifyPwaStatus('service worker indisponível')
    return
  }
  if (import.meta.env.DEV) {
    notifyPwaStatus('desenvolvimento')
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        notifyPwaStatus('service worker registrado')

        registration.update?.()

        if (registration.waiting) {
          notifyPwaStatus('atualização disponível')
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing

          if (!worker) return

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                notifyPwaStatus('nova versão disponível')
                window.dispatchEvent(new CustomEvent('forgeflow:pwa-update-available'))
              } else {
                notifyPwaStatus('pronto para instalar')
              }
            }
          })
        })
      })
      .catch((error) => {
        console.warn('[ForgeFlow PWA] Service worker não registrado:', error)
        notifyPwaStatus('falha no service worker')
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

export async function clearForgeFlowPwaCache() {
  if (typeof window === 'undefined') return false

  if ('caches' in window) {
    const keys = await window.caches.keys()
    await Promise.all(keys.map((key) => window.caches.delete(key)))
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    registrations.forEach((registration) => {
      registration.update?.()
    })
  }

  return true
}
