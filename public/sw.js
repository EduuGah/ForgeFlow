/* ForgeFlow Service Worker */
const VERSION = 'forgeflow-pwa-v40-2026-05-13'
const STATIC_CACHE = `${VERSION}-static`
const RUNTIME_CACHE = `${VERSION}-runtime`
const OFFLINE_URL = '/offline.html'

const CORE_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/pwa-192.png',
  '/icons/pwa-512.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((error) => {
        console.warn('[ForgeFlow SW] Falha ao pré-cachear:', error)
      })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('forgeflow-pwa-') && !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

function isApiRequest(request) {
  const url = new URL(request.url)

  return (
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/active-workout') ||
    url.pathname.startsWith('/workouts') ||
    url.pathname.startsWith('/history') ||
    url.pathname.startsWith('/exercises') ||
    url.pathname.startsWith('/goals') ||
    url.pathname.startsWith('/notifications')
  )
}

async function networkOnlyWithOfflineFallback(request) {
  try {
    return await fetch(request)
  } catch (error) {
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE)
      return (await cache.match(OFFLINE_URL)) || Response.error()
    }

    return new Response(
      JSON.stringify({
        message: 'Sem conexão ou servidor indisponível.',
        reason: 'network_failed',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }

      return networkResponse
    })
    .catch(() => cachedResponse)

  return cachedResponse || fetchPromise
}

async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request)
    const cache = await caches.open(RUNTIME_CACHE)
    cache.put('/', networkResponse.clone())
    return networkResponse
  } catch (error) {
    const runtimeCache = await caches.open(RUNTIME_CACHE)
    const staticCache = await caches.open(STATIC_CACHE)

    return (
      (await runtimeCache.match('/')) ||
      (await staticCache.match('/')) ||
      (await staticCache.match(OFFLINE_URL)) ||
      Response.error()
    )
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    event.respondWith(networkOnlyWithOfflineFallback(request))
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    event.respondWith(networkOnlyWithOfflineFallback(request))
    return
  }

  if (isApiRequest(request)) {
    event.respondWith(networkOnlyWithOfflineFallback(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  event.respondWith(networkOnlyWithOfflineFallback(request))
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data?.type === 'GET_VERSION') {
    event.source?.postMessage({
      type: 'FORGEFLOW_SW_VERSION',
      version: VERSION,
    })
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => event.source?.postMessage({ type: 'FORGEFLOW_CACHE_CLEARED' }))
    )
  }
})
