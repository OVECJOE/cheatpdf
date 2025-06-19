importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/idb-keyval-iife.min.js');

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
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Periodic sync for exam timer
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'exam-timer-sync') {
    event.waitUntil(syncExamTimer());
  }
});

// Background sync for document processing
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'document-processing') {
    event.waitUntil(processPendingDocuments());
  }
});

// Existing exam timer sync function
async function syncExamTimer() {
  const examId = await idbKeyval.get('currentExamId');
  if (!examId) return;

  const res = await fetch(`/api/exams/${examId}/timer`);
  const data = await res.json();

  if (data.status !== 'IN_PROGRESS' || (data.startedAt && data.timeLimit && (new Date(data.startedAt).getTime() + data.timeLimit * 60 * 1000 < Date.now()))) {
    await fetch(`/api/exams/${examId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });
  }
}

// Handle document processing in background
async function processPendingDocuments() {
  try {
    // Get pending documents from IndexedDB
    const pendingDocuments = await getPendingDocuments();
    
    for (const doc of pendingDocuments) {
      try {
        await processDocument(doc);
        await removePendingDocument(doc.id);
      } catch (error) {
        console.error('Failed to process document:', doc.id, error);
        await updateDocumentStatus(doc.id, 'FAILED', error.message);
      }
    }
  } catch (error) {
    console.error('Background processing failed:', error);
  }
}

// Process a single document
async function processDocument(documentData) {
  const response = await fetch(`/api/documents/${documentData.id}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      buffer: documentData.buffer,
      fileName: documentData.fileName,
      userId: documentData.userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Processing failed: ${response.status}`);
  }

  return response.json();
}

// Store pending document in IndexedDB
async function storePendingDocument(documentData) {
  const db = await openDB();
  const tx = db.transaction('pendingDocuments', 'readwrite');
  const store = tx.objectStore('pendingDocuments');
  await store.put(documentData);
}

// Get pending documents from IndexedDB
async function getPendingDocuments() {
  const db = await openDB();
  const tx = db.transaction('pendingDocuments', 'readonly');
  const store = tx.objectStore('pendingDocuments');
  return await store.getAll();
}

// Remove pending document from IndexedDB
async function removePendingDocument(documentId) {
  const db = await openDB();
  const tx = db.transaction('pendingDocuments', 'readwrite');
  const store = tx.objectStore('pendingDocuments');
  await store.delete(documentId);
}

// Update document status
async function updateDocumentStatus(documentId, status, error = null) {
  try {
    await fetch(`/api/documents/${documentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, error }),
    });
  } catch (error) {
    console.error('Failed to update document status:', error);
  }
}

// Open IndexedDB
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CheatPDF', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store for pending documents
      if (!db.objectStoreNames.contains('pendingDocuments')) {
        const store = db.createObjectStore('pendingDocuments', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
}

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

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
  try {
    // Try network first
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
    }
    
    // For POST requests (like document upload), store for later
    if (request.method === 'POST' && request.url.includes('/api/documents')) {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        
        // Store for background processing
        await storePendingDocument({
          id: body.documentId || Date.now().toString(),
          buffer: body.buffer,
          fileName: body.fileName,
          userId: body.userId,
          timestamp: Date.now(),
        });
        
        // Register background sync
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('document-processing');
        }
        
        // Return a response indicating the document will be processed later
        return new Response(JSON.stringify({
          message: 'Document queued for processing',
          documentId: body.documentId,
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (storeError) {
        console.error('Failed to store pending document:', storeError);
      }
    }
    
    throw error;
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Network failed, serving from cache:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  const options = {
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
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard/documents')
    );
  }
});