const CACHE_NAME = 'cheatpdf-v1';
const STATIC_CACHE = 'cheatpdf-static-v1';
const DYNAMIC_CACHE = 'cheatpdf-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/dashboard/upload',
  '/dashboard/documents',
  '/dashboard/chats',
  '/dashboard/exams',
  '/offline.html'
];

// Install event - cache static files
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(cache) {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(function() {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.error('Service Worker install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function() {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
      .catch(function(error) {
        console.error('Service Worker activation failed:', error);
      })
  );
});

// Background sync for document processing
self.addEventListener('sync', function(event) {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'document-processing') {
    event.waitUntil(processPendingDocuments());
  }
});

// Handle document processing in background
function processPendingDocuments() {
  console.log('Processing pending documents...');
  // This would be implemented when we have the background processing system
  return Promise.resolve();
}

// Fetch event - handle network requests
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static file requests
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with offline support
async function handleApiRequest(request) {
  // Skip caching for unsupported schemes
  if (!isCacheableRequest(request)) {
    return fetch(request);
  }

  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('Network failed, checking cache:', request.url);

    // For GET requests, try cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }

    throw error;
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  // Skip caching for unsupported schemes
  if (!isCacheableRequest(request)) {
    return fetch(request);
  }

  try {
    const response = await fetch(request);
    // Cache successful responses
    if (response.ok) {
      var responseClone = response.clone();
      caches.open(DYNAMIC_CACHE)
        .then(function (cache) {
          cache.put(request, responseClone);
        })
        .catch(function (error) {
          console.error('Failed to cache response:', error);
        });
    }
    return response;
  } catch (error_1) {
    console.log('Network failed, serving from cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    throw error_1;
  }
}

// Check if a request is cacheable
function isCacheableRequest(request) {
  var url = new URL(request.url);
  
  // Only cache HTTP and HTTPS requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }
  
  // Skip chrome-extension, chrome, and other browser-specific schemes
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'chrome:' || 
      url.protocol === 'moz-extension:' ||
      url.protocol === 'safari-extension:') {
    return false;
  }
  
  // Skip data URLs
  if (url.protocol === 'data:') {
    return false;
  }
  
  // Skip blob URLs
  if (url.protocol === 'blob:') {
    return false;
  }
  
  return true;
}

// Push event for notifications
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  var options = {
    body: event.data ? event.data.text() : 'Document processing update',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Documents',
        icon: '/favicon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('CheatPDF', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard/documents')
    );
  }
});