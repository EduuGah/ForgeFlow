import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.jsx'
import './index.css'


function ensurePwaHeadTags() {
  if (typeof document === 'undefined') return

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    manifestLink.href = '/manifest.webmanifest'
    document.head.appendChild(manifestLink)
  }

  if (!document.querySelector('meta[name="theme-color"]')) {
    const themeColor = document.createElement('meta')
    themeColor.name = 'theme-color'
    themeColor.content = '#0ea5e9'
    document.head.appendChild(themeColor)
  }

  if (!document.querySelector('meta[name="mobile-web-app-capable"]')) {
    const mobileCapable = document.createElement('meta')
    mobileCapable.name = 'mobile-web-app-capable'
    mobileCapable.content = 'yes'
    document.head.appendChild(mobileCapable)
  }

  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    const appleCapable = document.createElement('meta')
    appleCapable.name = 'apple-mobile-web-app-capable'
    appleCapable.content = 'yes'
    document.head.appendChild(appleCapable)
  }

  if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
    const appleTitle = document.createElement('meta')
    appleTitle.name = 'apple-mobile-web-app-title'
    appleTitle.content = 'ForgeFlow'
    document.head.appendChild(appleTitle)
  }
}

function registerForgeFlowServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) {
    window.__FORGEFLOW_PWA_STATUS__ = 'service-worker-not-supported'
    return
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      window.__FORGEFLOW_PWA_STATUS__ = 'service-worker-registered'
      window.__FORGEFLOW_SW_REGISTRATION__ = registration

      navigator.serviceWorker.ready.then(() => {
        window.__FORGEFLOW_PWA_STATUS__ = 'service-worker-ready'
        window.dispatchEvent(new CustomEvent('forgeflow:pwa-ready'))
      })
    } catch (error) {
      console.error('Erro ao registrar service worker:', error)
      window.__FORGEFLOW_PWA_STATUS__ = 'service-worker-error'
    }
  })
}

ensurePwaHeadTags()
registerForgeFlowServiceWorker()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento root não encontrado.')
}

function Root() {
  return import.meta.env.DEV ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
}


function handleStaleViteChunk() {
  if (typeof window === 'undefined') return

  const reloadKey = 'forgeflow:last-stale-chunk-reload'
  const lastReload = Number(window.sessionStorage.getItem(reloadKey) || 0)
  const now = Date.now()

  if (now - lastReload < 10000) return

  window.sessionStorage.setItem(reloadKey, String(now))
  window.location.reload()
}

window.addEventListener('vite:preloadError', handleStaleViteChunk)
window.addEventListener('error', (event) => {
  const message = String(event?.message || '')

  if (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Expected a JavaScript-or-Wasm module script')
  ) {
    handleStaleViteChunk()
  }
})

ReactDOM.createRoot(rootElement).render(<Root />)