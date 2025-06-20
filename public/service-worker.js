// --- Service Worker for CheatPDF ---

// --- Cache Configuration ---
const STATIC_CACHE = 'cheatpdf-static-v4';
const DYNAMIC_CACHE = 'cheatpdf-dynamic-v4';

// Files to cache immediately on install
const STATIC_FILES = [
  '/offline.html',
  '/favicon.svg'
];

// --- IndexedDB + Encryption Configuration ---
const DB_NAME = 'cheatpdf-offline-db';
const DB_STORE = 'responses';
const DB_VERSION = 1;
const CACHE_LIMIT = 50; // Max number of entries in the encrypted cache
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms (Time-to-Live for fresh data)

// --- Session Key Management ---
let sessionKey = null; // AES-GCM CryptoKey, in-memory only
let keyPromise = null; // A promise that resolves with the sessionKey

// --- Message Types ---
const MSG = {
  SET_SESSION_KEY: 'SET_SESSION_KEY',
  GET_SESSION_KEY: 'GET_SESSION_KEY'
};


// --- Service Worker Events ---

// Install event - cache static files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and perform maintenance
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // 1. Clean up old named caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      );

      // 2. Perform encrypted cache maintenance (remove expired/enforce limit)
      await removeExpired();
      await enforceCacheLimit();

      // 3. Claim clients to take control immediately
      await self.clients.claim();
    })()
  );
});

// Main fetch event handler
self.addEventListener('fetch', event => {
  const { request } = event;
  // Only handle GET requests with our caching strategy
  if (request.method === 'GET') {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Listen for messages from the app (e.g., setting the session key)
self.addEventListener('message', event => {
  const { type, key } = event.data;
  if (type === MSG.SET_SESSION_KEY) {
    importSessionKey(key).then(cryptoKey => {
      sessionKey = cryptoKey;
      // If there was a pending promise waiting for the key, resolve it
      if (keyPromise) {
        keyPromise.resolve(sessionKey);
        keyPromise = null;
      }
    });
  }
});

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


// --- Caching Strategy: Stale-While-Revalidate ---

async function staleWhileRevalidate(request) {
  // This function implements the SWR strategy. It returns a cached response
  // immediately if available, while simultaneously fetching a fresh version
  // from the network to update the cache for the next visit.

  const cacheId = makeCacheId(request);

  // Promise for the network request, which will happen in the background
  const networkPromise = fetch(request)
    .then(networkResponse => {
      // If the network request is successful, update the cache
      if (networkResponse.ok) {
        cacheEncryptedResponse(cacheId, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // The network request failed, we'll rely on the cache.
      // Returning a specific error allows us to distinguish from cache failure.
      return new Response(null, { status: 500, statusText: 'Network Error' });
    });

  // Try to get the response from the cache first
  try {
    const cachedResponse = await getDecryptedResponse(cacheId);
    if (cachedResponse) {
      // If we have a cached response, return it immediately.
      // The network request continues in the background.
      return cachedResponse;
    }
  } catch (error) {
    console.warn(`Could not get cached response for ${cacheId}:`, error);
  }

  // If there's no cached response, we must wait for the network.
  const networkResponse = await networkPromise;
  if (networkResponse && networkResponse.ok) {
    return networkResponse;
  }
  
  // If both network and cache fail, return the generic offline page for navigation.
  if (request.mode === 'navigate' || request.destination === 'document') {
    return caches.match('/offline.html');
  }

  // For other assets (scripts, images), just throw the error.
  throw new Error('Network and cache failed.');
}


// --- Session Key & Encryption Helpers ---

/**
 * Ensures the sessionKey is available. If not, it requests it from an active client.
 * This is crucial for when the service worker restarts.
 */
async function ensureSessionKey() {
  if (sessionKey) return sessionKey;

  // If a request for the key is already in flight, wait for it
  if (keyPromise) return keyPromise.promise;

  // Create a new promise to be resolved when the key arrives
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  keyPromise = { promise, resolve, reject };

  // Request the key from all active clients
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (clients.length === 0) {
    keyPromise = null;
    throw new Error("No active clients to get session key from.");
  }
  clients.forEach(client => client.postMessage({ type: MSG.GET_SESSION_KEY }));

  // Set a timeout in case no client responds
  setTimeout(() => {
    if (keyPromise) {
      keyPromise.reject(new Error("Timeout waiting for session key."));
      keyPromise = null;
    }
  }, 5000); // 5-second timeout

  return keyPromise.promise;
}

/**
 * Caches a response by encrypting it and storing it in IndexedDB.
 */
async function cacheEncryptedResponse(cacheId, response) {
  try {
    const key = await ensureSessionKey();
    const text = await response.text();
    const encrypted = await encryptData(text, key);
    await idbPut({ id: cacheId, encrypted, timestamp: Date.now() });
    await enforceCacheLimit(); // Prune cache after adding
  } catch (error) {
    console.warn(`Failed to encrypt and cache ${cacheId}:`, error);
  }
}

/**
 * Retrieves and decrypts a response from IndexedDB.
 */
async function getDecryptedResponse(cacheId) {
  try {
    const key = await ensureSessionKey();
    const entry = await idbGet(cacheId);
    
    if (!entry) return null;

    // A fresh response is one within the TTL
    const isFresh = (Date.now() - entry.timestamp) < CACHE_TTL;
    
    // For now, we return any valid cached entry (stale or fresh) as per SWR.
    // The TTL check could be used for more advanced strategies.

    const decrypted = await decryptData(entry.encrypted, key);
    return new Response(decrypted, { status: 200 });

  } catch (error) {
    console.warn(`Failed to decrypt ${cacheId}. Deleting corrupted entry.`, error);
    // If decryption fails, the entry is likely corrupt or the key is wrong. Delete it.
    await idbDelete(cacheId);
    return null;
  }
}

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

// --- IndexedDB Helpers ---

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


// --- Cache Maintenance Helpers ---

async function enforceCacheLimit() {
  const all = await idbGetAll();
  if (all.length > CACHE_LIMIT) {
    all.sort((a, b) => a.timestamp - b.timestamp); // oldest first
    for (let i = 0; i < all.length - CACHE_LIMIT; ++i) {
      await idbDelete(all[i].id);
    }
  }
}

async function removeExpired() {
  const now = Date.now();
  const all = await idbGetAll();
  for (const entry of all) {
    if (now - entry.timestamp > CACHE_MAX_AGE) {
      await idbDelete(entry.id);
    }
  }
}

// --- General Helpers ---

function makeCacheId(request) {
  return request.url + '::' + request.method;
}