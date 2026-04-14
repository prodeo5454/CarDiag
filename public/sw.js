// Service worker for CarDiag PWA (precache only URLs that exist; Next hashed assets are cached at runtime)
const CACHE_NAME = 'cardiag-v1';
const STATIC_CACHE = 'cardiag-static-v1';
const DYNAMIC_CACHE = 'cardiag-dynamic-v1';
const API_CACHE = 'cardiag-api-v1';

const STATIC_ASSETS = [
  '/',
  '/diagnostics',
  '/live-data',
  '/vehicles',
  '/reports',
  '/maintenance',
  '/connection',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Clearing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different request types
  if (request.method === 'GET') {
    // Handle static assets and pages
    if (url.origin === self.location.origin) {
      event.respondWith(handleStaticRequest(request));
    } 
    // Handle API calls
    else if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleAPIRequest(request));
    }
    // Handle external resources (fonts, images, etc.)
    else {
      event.respondWith(handleExternalRequest(request));
    }
  }
  // Handle POST requests (API calls)
  else if (request.method === 'POST') {
    event.respondWith(handlePostRequest(request));
  }
});

// Handle static requests (pages, assets)
async function handleStaticRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, serving from cache');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offline = await caches.match('/offline.html');
      if (offline) return offline;
      return new Response('Offline - Please check your connection', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
    
    // Return error for asset requests
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // Try network first for API calls
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: API request failed, checking cache');
    
    // Return cached response for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Add header to indicate cached response
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Service-Worker-Cache', 'true');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers
        });
      }
    }
    
    // Return offline response for API calls
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'API request failed - device is offline',
      timestamp: Date.now()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle external requests (fonts, images, CDN resources)
async function handleExternalRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache fonts and images
    if (networkResponse.ok && 
        (request.destination === 'font' || 
         request.destination === 'image' ||
         request.destination === 'script')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: External request failed, checking cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('External resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle POST requests
async function handlePostRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: POST request failed');
    
    // Store POST requests for later sync
    if ('sync' in self.registration) {
      // Store request for background sync
      const requestData = {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: await request.text(),
        timestamp: Date.now()
      };
      
      // Store in IndexedDB for background sync
      const db = await openDB();
      const tx = db.transaction('pendingRequests', 'readwrite');
      await tx.store.add(requestData);
      
      // Register for background sync
      await self.registration.sync.register('background-sync');
    }
    
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Request queued for when connection is restored',
      timestamp: Date.now()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processPendingRequests());
  }
});

// Process pending requests when back online
async function processPendingRequests() {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingRequests', 'readwrite');
    const store = tx.store;
    const requests = await store.getAll();
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          await store.delete(requestData.id);
          console.log('Service Worker: Pending request completed');
        }
      } catch (error) {
        console.log('Service Worker: Failed to process pending request', error);
      }
    }
  } catch (error) {
    console.log('Service Worker: Error processing pending requests', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from CarDiag',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CarDiag', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// IndexedDB helper for storing pending requests
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cardiag-offline-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const store = db.createObjectStore('pendingRequests', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then(cache => cache.addAll(STATIC_ASSETS))
    );
  }
  
  if (event.data && event.data.type === 'CACHE_CLEAR') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// Periodic background sync for data updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-data') {
    event.waitUntil(updateCachedData());
  }
});

// Update cached data periodically
async function updateCachedData() {
  try {
    // Update vehicle data, maintenance records, etc.
    const cache = await caches.open(API_CACHE);
    
    // Add endpoints to refresh
    const endpoints = [
      '/api/vehicles',
      '/api/maintenance',
      '/api/diagnostics'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          cache.put(endpoint, response);
        }
      } catch (error) {
        console.log('Failed to update', endpoint, error);
      }
    }
  } catch (error) {
    console.log('Error updating cached data', error);
  }
}
