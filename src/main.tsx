import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { fcmService } from './services/fcmService'
import { Capacitor } from '@capacitor/core'

// 🚨 ULTIMATE NOTIFICATION SYSTEM INITIALIZATION
console.log('🚀 Initializing ULTIMATE Notification System...');

// Register Service Worker for background notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered for ultimate notifications:', registration);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Initialize FCM service for push notifications
if (Capacitor.isNativePlatform()) {
  fcmService.initialize().then(() => {
    console.log('✅ FCM Service initialized on app startup')
  }).catch(error => {
    console.error('❌ FCM Service initialization failed:', error)
  })
}

// 🚨 CROSS-TAB ALERT SYSTEM - Listen for alerts from other tabs
window.addEventListener('storage', (event) => {
  if (event.key === 'ultimate_order_alert' && event.newValue) {
    try {
      const alertData = JSON.parse(event.newValue);
      if (alertData.type === 'ultimate_order_alert') {
        console.log('🔄 CROSS-TAB ALERT RECEIVED:', alertData);

        // Trigger ultimate alert in this tab too
        const { simpleNotificationService } = require('./services/simpleNotificationService');
        simpleNotificationService.showOrderNotification(
          alertData.orderNumber,
          alertData.amount,
          alertData.orderId
        );
      }
    } catch (error) {
      console.error('❌ Error processing cross-tab alert:', error);
    }
  }

  // WHATSAPP-STYLE INSTANT ORDER HANDLING
  if (event.key === 'whatsappInstantOrder' && event.newValue) {
    try {
      const orderData = JSON.parse(event.newValue);
      console.log('📱 WHATSAPP-STYLE INSTANT ORDER RECEIVED:', orderData);

      // Start continuous sound immediately
      const { fcmService } = require('./services/fcmService');
      fcmService.startContinuousSoundForOrder(orderData.orderId, orderData);

      // Show order modal
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showOrderModal', {
          detail: {
            ...orderData,
            whatsappStyle: true,
            instantOpen: true,
            keepSoundPlaying: true
          }
        }));
      }, 500);

    } catch (error) {
      console.error('❌ Error processing WhatsApp instant order:', error);
    }
  }
});

// 🚨 SERVICE WORKER MESSAGE HANDLER - Handle sound requests from background
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 Message from Service Worker:', event.data);

    if (event.data && event.data.type === 'PLAY_ORDER_SOUND') {
      const { orderId, orderNumber, amount, emergency } = event.data;
      console.log('🔊 Service Worker requested sound playback for order:', orderNumber);

      // Play the order alert sound immediately
      const { simpleNotificationService } = require('./services/simpleNotificationService');

      if (emergency) {
        // For emergency/background alerts, play continuous sound
        simpleNotificationService.showOrderNotification(orderNumber, amount, orderId);
      } else {
        // For regular alerts, just play sound
        simpleNotificationService.playOrderAlertSound();
      }
    }
  });
}

// 🚨 PAGE VISIBILITY ALERTS - Extra aggressive when page becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('👁️ Page became visible - checking for pending ultimate alerts');

    // Check if there are any pending alerts in localStorage
    const pendingAlert = localStorage.getItem('ultimate_order_alert');
    if (pendingAlert) {
      try {
        const alertData = JSON.parse(pendingAlert);
        const now = Date.now();
        const alertAge = now - alertData.timestamp;

        // If alert is less than 5 minutes old, show it
        if (alertAge < 300000) {
          console.log('🚨 Showing pending ultimate alert on page visibility');
          const { simpleNotificationService } = require('./services/simpleNotificationService');
          simpleNotificationService.showOrderNotification(
            alertData.orderNumber,
            alertData.amount,
            alertData.orderId
          );
        } else {
          // Clear old alerts
          localStorage.removeItem('ultimate_order_alert');
        }
      } catch (error) {
        console.error('❌ Error processing pending alert:', error);
        localStorage.removeItem('ultimate_order_alert');
      }
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
(window as any).testNotifications = async function() {
  console.log('🧪 GLOBAL TEST: Testing notification system...');
  alert('🧪 Testing notification system from console...');

  try {
    const { simpleNotificationService } = await import('./services/simpleNotificationService');
    await simpleNotificationService.testNotifications();
    console.log('✅ Global test completed');
  } catch (error) {
    console.error('❌ Global test failed:', error);
    alert('❌ Test failed: ' + error.message);
  }
};

(window as any).checkNotificationPermissions = async function() {
  console.log('🔍 Checking notification permissions...');

  if ('Notification' in window) {
    console.log('🌐 Notification permission:', Notification.permission);
    alert('Notification permission: ' + Notification.permission);
  } else {
    console.log('❌ Notifications not supported');
    alert('❌ Notifications not supported in this browser');
  }

  try {
    const { simpleNotificationService } = await import('./services/simpleNotificationService');
    const hasPermission = await simpleNotificationService.checkAndRequestPermissions();
    console.log('🔔 Permission check result:', hasPermission);
  } catch (error) {
    console.error('❌ Permission check failed:', error);
  }
};

(window as any).showTestOrder = function() {
  console.log('🧪 Showing test order modal...');
  window.dispatchEvent(new CustomEvent('showOrderModal', {
    detail: {
      orderId: 999999,
      orderNumber: 'TEST-' + Date.now().toString().slice(-4),
      amount: '99.99',
      test: true
    }
  }));
  alert('🧪 Test order modal should appear');
};

(window as any).checkForNewOrders = async function() {
  console.log('🔍 Manually checking for new orders...');

  try {
    // Import required modules
    const { apiRequest } = await import('./utils/apiUtils');

    // Fetch current orders
    const { response, data } = await apiRequest('/vendor/orders/?limit=20');

    if (response.ok && data) {
      const orders = data.results || data || [];
      const pendingOrders = orders.filter((order: any) => order.status === 'pending');

      console.log('📦 Total orders:', orders.length);
      console.log('⏳ Pending orders:', pendingOrders.length);

      if (pendingOrders.length > 0) {
        alert(`📋 Found ${pendingOrders.length} pending orders:\n\n${pendingOrders.map((o: any) => `• Order #${o.order_number} - ₹${o.total_amount}`).join('\n')}\n\nTriggering notifications...`);

        // Trigger notifications for all pending orders
        const { simpleNotificationService } = await import('./services/simpleNotificationService');
        for (const order of pendingOrders) {
          console.log('🚨 Triggering notification for pending order:', order.order_number);
          await simpleNotificationService.showOrderNotification(
            order.order_number,
            order.total_amount,
            order.id
          );
        }
      } else {
        alert('📭 No pending orders found');
      }
    } else {
      alert('❌ Failed to fetch orders');
    }
  } catch (error) {
    console.error('❌ Error checking orders:', error);
    alert('❌ Error: ' + error.message);
  }
};

console.log('🧪 Global test functions available:');
console.log('  - testNotifications() - Test full notification system');
console.log('  - checkNotificationPermissions() - Check permission status');
console.log('  - showTestOrder() - Show test order modal');
console.log('  - checkForNewOrders() - Manually check and trigger notifications for pending orders');
console.log('');
console.log('🔧 To test notifications:');
console.log('  1. Open browser console (F12)');
console.log('  2. Run: checkNotificationPermissions()');
console.log('  3. Run: testNotifications()');
console.log('  4. Or click the orange "🧪 TEST" button in vendor orders');
console.log('  5. Run: checkForNewOrders() to check for real pending orders');

createRoot(document.getElementById("root")!).render(<App />);
