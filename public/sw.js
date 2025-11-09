const CACHE_NAME = 'ezeyway-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/alert-icon.svg'
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching files for offline use');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background fetch for notifications
self.addEventListener('backgroundfetch', (event) => {
  console.log('📡 Background fetch for notifications');
});

// Push notification handler - CRITICAL for lock screen notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'New Notification',
        body: event.data.text()
      };
    }
  }

  const { title, body, icon, badge, data } = notificationData;
  
  // Default values for rich notifications
  const options = {
    title: title || '🚨 EzyWay Order Alert',
    body: body || 'You have a new order that needs immediate attention!',
    icon: icon || '/alert-icon.svg',
    badge: badge || '/alert-icon.svg',
    tag: 'order-notification',
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200],
    data: data || {},
    actions: [
      {
        action: 'view_order',
        title: 'View Order',
        icon: '/alert-icon.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/alert-icon.svg'
      }
    ]
  };

  // Show notification that works on lock screen
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click handler - AUTO OPEN APP
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'view_order' || !action) {
    // Primary action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes('/vendor') && 'focus' in client) {
              console.log('📱 Focusing existing app window');
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            console.log('🆕 Opening new app window');
            return clients.openWindow('/vendor/orders');
          }
        })
    );
    
    // Send data to the app
    if (data.orderId) {
      event.waitUntil(
        clients.matchAll({ type: 'window' })
          .then((clients) => {
            for (const client of clients) {
              client.postMessage({
                type: 'ORDER_NOTIFICATION_CLICKED',
                data: data
              });
            }
          })
      );
    }
  } else if (action === 'dismiss') {
    // Just close the notification
    console.log('🔇 Notification dismissed');
  }
});

// Background sync for when connectivity is restored
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(
      // Sync pending orders
      syncPendingOrders()
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
  
  if (event.data && event.data.type === 'ORDER_ALERT') {
    // Handle order alert from main thread
    const { orderNumber, amount, orderId } = event.data;
    
    // Show persistent notification
    self.registration.showNotification(`🚨 NEW ORDER #${orderNumber}`, {
      body: `₹${amount} - Immediate attention required!`,
      icon: '/alert-icon.svg',
      tag: `order-${orderId}`,
      requireInteraction: true,
      data: {
        orderId,
        orderNumber,
        amount,
        type: 'order_notification'
      }
    });
  }
});

// Sync pending orders function
async function syncPendingOrders() {
  try {
    console.log('🔄 Syncing pending orders...');
    
    // This would sync with your backend to check for any missed orders
    // Implementation depends on your backend API
    
  } catch (error) {
    console.error('❌ Failed to sync pending orders:', error);
  }
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync triggered:', event.tag);
  
  if (event.tag === 'order-check') {
    event.waitUntil(
      // Check for new orders periodically
      checkForNewOrders()
    );
  }
});

// Check for new orders function
async function checkForNewOrders() {
  try {
    console.log('🔍 Checking for new orders...');
    
    // This would check your backend for new orders
    // For now, we'll just log
    console.log('✅ Order check completed');
    
  } catch (error) {
    console.error('❌ Failed to check for new orders:', error);
  }
}

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('🔇 Notification closed:', event.notification.tag);
  
  // Clean up any background processes if needed
  const data = event.notification.data;
  if (data && data.orderId) {
    // Tell the main thread that the notification was closed
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clients) => {
          for (const client of clients) {
            client.postMessage({
              type: 'NOTIFICATION_CLOSED',
              data: data
            });
          }
        })
    );
  }
});

// Wake lock request handler
self.addEventListener('wake lock', (event) => {
  console.log('🔋 Wake lock state changed:', event);
});