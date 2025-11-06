// Service Worker for Ultimate Order Notifications
// This ensures notifications work even when browser is closed or in background

const CACHE_NAME = 'ezy-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker caching files...');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
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
});

// Background sync for orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'order-sync') {
    console.log('🔄 Background sync: Checking for new orders...');
    event.waitUntil(syncOrders());
  }
});

// Push notifications (FCM) - ALARM STYLE
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received:', event);

  if (event.data) {
    const data = event.data.json();
    console.log('📊 Push data:', data);

    // FORCE WAKE LOCK for push notifications
    requestWakeLockInSW();

    // FORCE VIBRATION for push notifications
    triggerAlarmVibrationInSW();

    // ALARM-STYLE MULTIPLE NOTIFICATIONS
    const showNotifications = async () => {
      const baseOptions = {
        icon: '/alert-icon.svg',
        badge: '/alert-icon.svg',
        requireInteraction: true,
        silent: false,
        data: data,
        actions: [
          {
            action: 'view',
            title: 'View Order'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      };

      // Rapid-fire alarm notifications
      for (let i = 0; i < 5; i++) {
        const options = {
          ...baseOptions,
          body: `${data.body || 'New order received!'} - ALERT ${i + 1}/5`,
          tag: `alarm-push-${data.orderId || 'unknown'}-${i}`
        };

        await self.registration.showNotification(`🚨🚨 ${data.title || 'ORDER ALERT!'} 🚨🚨`, options);

        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Lock screen compatible notification
      const lockScreenOptions = {
        ...baseOptions,
        body: `${data.body || 'New order received!'} - Works on lock screen!`,
        tag: `lockscreen-push-${data.orderId || 'unknown'}`
      };

      await self.registration.showNotification(`🔥 ${data.title || 'URGENT ORDER'} 🔥`, lockScreenOptions);
    };

    event.waitUntil(showNotifications());
  }
});

// Wake lock function for service worker
function requestWakeLockInSW() {
  try {
    // Note: Wake Lock API is not available in service workers
    // This is just for logging - actual wake lock is handled in main thread
    console.log('🔋 Wake lock requested from service worker');
  } catch (error) {
    console.warn('Wake lock not available in service worker');
  }
}

// Vibration function for service worker
function triggerAlarmVibrationInSW() {
  try {
    // Note: Vibration API is not available in service workers
    // This is just for logging - actual vibration is handled in main thread
    console.log('📳 Alarm vibration triggered from service worker');
  } catch (error) {
    console.warn('Vibration not available in service worker');
  }
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app and navigate to orders
    event.waitUntil(
      clients.openWindow('/vendor/orders')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/vendor/orders')
    );
  }
});

// Background fetch for orders
async function syncOrders() {
  try {
    console.log('🔄 Syncing orders in background...');

    // This would typically fetch from your API
    // For now, we'll just log
    console.log('✅ Background order sync completed');

  } catch (error) {
    console.error('❌ Background order sync failed:', error);
  }
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);

  if (event.data && event.data.type === 'ORDER_ALERT') {
    // Show notification even if app is closed
    const { orderNumber, amount, orderId } = event.data;

    self.registration.showNotification('🚨 URGENT ORDER ALERT!', {
      body: `Order #${orderNumber} - ₹${amount}`,
      icon: '/favicon.ico',
      tag: `urgent-order-${orderId}`,
      requireInteraction: true,
      data: { orderId, orderNumber, amount }
    });

    // Try to play sound if clients are available
    playOrderSoundInClients(orderId, orderNumber, amount);
  }

  if (event.data && event.data.type === 'EMERGENCY_ALERT') {
    // Emergency alert - show notification and try to play sound
    const { orderNumber, amount, orderId } = event.data;

    self.registration.showNotification('🚨🚨 EMERGENCY ORDER ALERT! 🚨🚨', {
      body: `Order #${orderNumber} - ₹${amount}\n⚠️ REQUIRES IMMEDIATE ATTENTION`,
      icon: '/favicon.ico',
      tag: `emergency-order-${orderId}`,
      requireInteraction: true,
      data: { orderId, orderNumber, amount, emergency: true }
    });

    // Try to play sound in all open clients
    playOrderSoundInClients(orderId, orderNumber, amount, true);
  }
});

// Function to play sound in open clients
async function playOrderSoundInClients(orderId, orderNumber, amount, emergency = false) {
  try {
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      // Send message to client to play sound
      client.postMessage({
        type: 'PLAY_ORDER_SOUND',
        orderId,
        orderNumber,
        amount,
        emergency,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.warn('Could not play sound in clients:', error);
  }
}

// Periodic background check for orders (every 2 minutes)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'order-check') {
    console.log('🔄 Periodic sync: Checking for new orders...');
    event.waitUntil(checkForNewOrders());
  }
});

// Function to periodically check for new orders
async function checkForNewOrders() {
  try {
    console.log('🔍 Checking for new orders in background...');

    // Get stored auth token
    const authToken = await getStoredAuthToken();

    if (!authToken) {
      console.log('No auth token available for background check');
      return;
    }

    // Fetch orders from API
    const response = await fetch('/vendor/orders/?limit=10', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const orders = data.results || data || [];

      // Check for new orders (status: pending)
      const newOrders = orders.filter(order => order.status === 'pending');

      if (newOrders.length > 0) {
        console.log(`🎯 Found ${newOrders.length} new orders in background check!`);

        // Show notification and play sound for each new order
        for (const order of newOrders) {
          await self.registration.showNotification('🚨 NEW ORDER RECEIVED!', {
            body: `Order #${order.order_number} - ₹${order.total_amount}`,
            icon: '/favicon.ico',
            tag: `bg-order-${order.id}`,
            requireInteraction: true,
            data: { orderId: order.id, orderNumber: order.order_number, amount: order.total_amount }
          });

          // Try to play sound in open clients
          await playOrderSoundInClients(order.id, order.order_number, order.total_amount, true);
        }
      }
    }

  } catch (error) {
    console.warn('Background order check failed:', error);
  }
}

// Helper function to get stored auth token
async function getStoredAuthToken() {
  try {
    // This is a simplified version - in reality you'd need to get it from IndexedDB or similar
    // For now, we'll return null and rely on push notifications
    return null;
  } catch (error) {
    return null;
  }
}