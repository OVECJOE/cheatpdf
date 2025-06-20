const STATIC_CACHE = 'cheatpdf-static-v3';
const DYNAMIC_CACHE = 'cheatpdf-dynamic-v3';

// Files to cache immediately
const STATIC_FILES = [
  '/offline.html',
  '/favicon.svg'
];

// --- IndexedDB + Encryption Offline Cache ---
const DB_NAME = 'cheatpdf-offline-db';
const DB_STORE = 'responses';
const DB_VERSION = 1;
const CACHE_LIMIT = 50; // max entries
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in ms
let sessionKey = null; // AES-GCM CryptoKey, in-memory only

// Install event - cache static files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// Background sync for document processing
self.addEventListener('sync', event => {
  if (event.tag === 'document-processing') {
    event.waitUntil(processPendingDocuments());
  }
});

// Handle document processing in background
async function processPendingDocuments() {
  try {
    const response = await fetch('/api/documents/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: 'background_sync' })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.processed) {
        self.registration.showNotification('CheatPDF', {
          body: `Document "${result.documentId}" processed successfully!`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'document-processed',
          data: { documentId: result.documentId, action: 'view_document' }
        });
      }
    }
  } catch (error) {
    console.warn('Background processing failed:', error);
  }
}

// Listen for session key from app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SET_SESSION_KEY') {
    // event.data.key should be a base64 string
    importSessionKey(event.data.key).then(key => {
      sessionKey = key;
    });
  }
});

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(entry) {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  tx.objectStore(DB_STORE).put(entry);
  return tx.complete || tx.done || new Promise(r => tx.oncomplete = r);
}
async function idbGet(id) {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(DB_STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(id) {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  tx.objectStore(DB_STORE).delete(id);
  return tx.complete || tx.done || new Promise(r => tx.oncomplete = r);
}
async function idbGetAll() {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Encryption helpers
async function importSessionKey(base64) {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function encryptData(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(data);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
  return { iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
}
async function decryptData({ iv, ciphertext }, key) {
  const ivArr = new Uint8Array(iv);
  const ctArr = new Uint8Array(ciphertext);
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivArr }, key, ctArr);
  return new TextDecoder().decode(dec);
}

// LRU eviction
async function enforceCacheLimit() {
  const all = await idbGetAll();
  if (all.length > CACHE_LIMIT) {
    all.sort((a, b) => a.timestamp - b.timestamp); // oldest first
    for (let i = 0; i < all.length - CACHE_LIMIT; ++i) {
      await idbDelete(all[i].id);
    }
  }
}
// Expiry
async function removeExpired() {
  const now = Date.now();
  const all = await idbGetAll();
  for (const entry of all) {
    if (now - entry.timestamp > CACHE_MAX_AGE) {
      await idbDelete(entry.id);
    }
  }
}

// Helper to make a cache key
function makeCacheId(request) {
  return request.url + '::' + request.method;
}

// Main fetch event for navigation/static/API
self.addEventListener('fetch', event => {
  const { request } = event;
  // Only cache GET requests for navigation, document, or static assets
  if (
    request.method === 'GET' &&
    (request.mode === 'navigate' ||
      request.destination === 'document' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font' ||
      request.destination === 'image' ||
      request.url.includes('/_next/') ||
      request.url.includes('/api/')
    )
  ) {
    event.respondWith(offlineCacheHandler(request));
  }
});

async function offlineCacheHandler(request) {
  await removeExpired();
  const cacheId = makeCacheId(request);
  const now = Date.now();

  // Check for a fresh cache entry
  if (sessionKey) {
    const entry = await idbGet(cacheId);
    if (entry && (now - entry.timestamp < CACHE_TTL)) {
      // Serve fresh cache
      try {
        const decrypted = await decryptData(entry.encrypted, sessionKey);
        return new Response(decrypted, { status: 200 });
      } catch {
        await idbDelete(cacheId);
      }
    }
  }

  // Otherwise, fetch from network and update cache
  try {
    const response = await fetch(request);
    if (response.ok && sessionKey) {
      const cloned = response.clone();
      const text = await cloned.text();
      const encrypted = await encryptData(text, sessionKey);
      await idbPut({ id: cacheId, encrypted, timestamp: Date.now() });
      await enforceCacheLimit();
    }
    return response;
  } catch (err) {
    // If offline, try IndexedDB (may be stale)
    if (sessionKey) {
      const entry = await idbGet(cacheId);
      if (entry && entry.encrypted) {
        try {
          const decrypted = await decryptData(entry.encrypted, sessionKey);
          return new Response(decrypted, { status: 200 });
        } catch {
          await idbDelete(cacheId);
        }
      }
    }
    // fallback to offline.html for navigation
    if (request.mode === 'navigate' || request.destination === 'document') {
      return caches.match('/offline.html');
    }
    throw err;
  }
}

// Push event for notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Document processing update',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 },
    actions: [
      { action: 'explore', title: 'View Documents', icon: '/favicon.svg' },
      { action: 'close', title: 'Close', icon: '/favicon.svg' }
    ]
  };
  
  event.waitUntil(self.registration.showNotification('CheatPDF', options));
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const url = event.notification.data?.action === 'view_document' 
    ? `/dashboard/documents/${event.notification.data.documentId}`
    : event.action === 'explore' 
      ? '/dashboard/documents'
      : '/dashboard';

  event.waitUntil(clients.openWindow(url));
});