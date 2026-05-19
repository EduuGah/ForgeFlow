import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.jsx'
import './index.css'
import { setupPwaHeadTags, registerForgeFlowServiceWorker } from './utils/pwaUtils'

setupPwaHeadTags()
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
