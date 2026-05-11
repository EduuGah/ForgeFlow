const CACHE_VERSION = 'forgeflow-pwa-v4'
const STATIC_CACHE = `${CACHE_VERSION}-static`

const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
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
            .filter((key) => key.startsWith('forgeflow-pwa-') && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

function isSameOriginHttpRequest(request) {
  try {
    const url = new URL(request.url)

    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.origin === self.location.origin
    )
  } catch {
    return false
  }
}

function shouldUseNetworkOnly(request) {
  const url = new URL(request.url)

  return (
    request.mode === 'navigate' ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/me') ||
    url.pathname.startsWith('/workouts') ||
    url.pathname.startsWith('/workout-history') ||
    url.pathname.startsWith('/exercises') ||
    url.pathname.startsWith('/goals') ||
    url.pathname.startsWith('/notifications') ||
    url.pathname.startsWith('/settings') ||
    url.pathname.startsWith('/progress') ||
    url.pathname.startsWith('/profile') ||
    url.pathname.startsWith('/active-workout') ||
    url.pathname.startsWith('/active-session') ||
    url.pathname.startsWith('/workout-session')
  )
}

async function networkOnlyWithOfflineFallback(request) {
  try {
    return await fetch(request)
  } catch {
    if (request.mode === 'navigate') {
      const offline = await caches.match('/offline.html')
      if (offline) return offline
    }

    throw new Error('Sem conexão e sem cache disponível.')
  }
}

async function cacheFirstStatic(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) return cachedResponse

  const networkResponse = await fetch(request)

  if (networkResponse?.ok) {
    const cache = await caches.open(STATIC_CACHE)
    await cache.put(request, networkResponse.clone())
  }

  return networkResponse
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return
  if (!isSameOriginHttpRequest(request)) return

  if (shouldUseNetworkOnly(request)) {
    event.respondWith(networkOnlyWithOfflineFallback(request))
    return
  }

  const url = new URL(request.url)

  if (
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/offline.html' ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(cacheFirstStatic(request))
  }
})
