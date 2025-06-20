// Cache names
const STATIC_CACHE = 'cheatpdf-static-v1'
const DYNAMIC_CACHE = 'cheatpdf-dynamic-v1'

// Files to cache on install
const STATIC_FILES = [
  '/offline.html',
  '/favicon.svg',
  '/file.svg',
  '/globe.svg',
  '/window.svg'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Handle API requests with Network First strategy
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Handle static assets with Cache First strategy
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      request.url.includes('.svg') ||
      request.url.includes('.ico')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Handle HTML pages with Network First strategy
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  // Default to Stale While Revalidate for other resources
  event.respondWith(staleWhileRevalidate(request))
})

// Network First strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }
    
    throw error
  }
}

// Cache First strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    throw error
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // Network failed, return cached response if available
    return cachedResponse
  })
  
  return cachedResponse || networkPromise
}

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.svg',
      badge: data.badge || '/favicon.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1',
        url: data.data?.url || '/dashboard',
        ...data.data
      },
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/favicon.svg'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/favicon.svg'
        }
      ],
      requireInteraction: false,
      silent: false
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  let urlToOpen = '/dashboard'
  
  if (event.action === 'open' || !event.action) {
    // Open the app at the specified URL or default to dashboard
    urlToOpen = event.notification.data?.url || '/dashboard'
  } else if (event.action === 'close') {
    // Just close the notification, don't open anything
    return
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle any background sync tasks
  // For example, sync offline data when connection is restored
  console.log('Background sync triggered')
}

// Message event for communication with the main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: '1.0.0' })
      break
    case 'CACHE_UPDATED':
      // Handle cache updates
      console.log('Cache updated:', data)
      break
    default:
      console.log('Unknown message type:', type)
  }
}) 