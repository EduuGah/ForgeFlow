const CACHE_VERSION = 'forgeflow-pwa-v2'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('forgeflow-pwa-') && !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

function isCacheableRequest(request) {
  try {
    const url = new URL(request.url)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }

    if (url.origin !== self.location.origin) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function isApiRequest(request) {
  try {
    const url = new URL(request.url)

    return (
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/auth') ||
      url.pathname.startsWith('/me') ||
      url.pathname.startsWith('/workouts') ||
      url.pathname.startsWith('/workout-history') ||
      url.pathname.startsWith('/exercises') ||
      url.pathname.startsWith('/goals') ||
      url.pathname.startsWith('/notifications') ||
      url.pathname.startsWith('/settings') ||
      url.pathname.startsWith('/progress')
    )
  } catch {
    return false
  }
}

async function networkFirst(request) {
  try {
    const freshResponse = await fetch(request)

    if (isCacheableRequest(request) && freshResponse?.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      await cache.put(request, freshResponse.clone())
    }

    return freshResponse
  } catch {
    const cachedResponse = isCacheableRequest(request)
      ? await caches.match(request)
      : null

    if (cachedResponse) return cachedResponse

    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }

    throw new Error('Sem conexão e sem cache disponível.')
  }
}

async function staleWhileRevalidate(request) {
  if (!isCacheableRequest(request)) {
    return fetch(request)
  }

  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse?.ok) {
        cache.put(request, networkResponse.clone())
      }

      return networkResponse
    })
    .catch(() => cachedResponse)

  return cachedResponse || fetchPromise
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return
  if (!isCacheableRequest(request)) return
  if (isApiRequest(request)) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  const destination = request.destination

  if (
    destination === 'script' ||
    destination === 'style' ||
    destination === 'image' ||
    destination === 'font' ||
    destination === 'manifest'
  ) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
