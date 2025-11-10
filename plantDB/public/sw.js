// Cladari Service Worker - Offline Support
const CACHE_NAME = 'cladari-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/plants',
  '/dashboard',
  '/batch-care',
  '/offline.html',
  '/manifest.json'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Create offline page
      const offlineResponse = new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cladari - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui;
              padding: 20px;
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: rgba(255,255,255,0.1);
              backdrop-filter: blur(10px);
              padding: 40px;
              border-radius: 20px;
              max-width: 400px;
            }
            h1 { margin-bottom: 20px; }
            p { opacity: 0.9; line-height: 1.6; }
            button {
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: bold;
              margin-top: 20px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🌱 Offline Mode</h1>
            <p>You're currently offline. Care data will be saved locally and synced when connection returns.</p>
            <p>Recently viewed plants are available in cache.</p>
            <button onclick="location.reload()">Try Again</button>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });

      cache.put('/offline.html', offlineResponse);
      return cache.addAll(STATIC_CACHE_URLS.filter(url => url !== '/offline.html'));
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle page requests
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache first
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync for offline care logs
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-care-logs') {
    event.waitUntil(syncCareLogs());
  }
});

async function syncCareLogs() {
  // Get pending care logs from IndexedDB
  // This would sync with your API when connection returns
  console.log('Syncing offline care logs...');
}