import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { fcmService } from './services/fcmService'
import { Capacitor } from '@capacitor/core'

// 🚨 ULTIMATE NOTIFICATION SYSTEM INITIALIZATION
console.log('🚀 Initializing ULTIMATE Notification System...');

// Initialize app with auto-login and vendor session persistence
(async () => {
  try {
    const { appInitializer } = await import('./services/appInitializer');
    appInitializer.initialize().then(() => {
      console.log('✅ App initialized with persistent vendor sessions');
    }).catch(error => {
      console.error('❌ App initialization failed:', error);
    });
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
  }
})();

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
    await simpleNotificationService.showOrderNotification('TEST-' + Date.now().toString().slice(-4), '99.99', 999999);
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

(window as any).testMobileSound = async function() {
  console.log('🔊 Testing mobile sound functionality...');
  alert('🔊 Testing mobile sound - you should hear emergency beeps');

  try {
    const { realPushNotifications } = await import('./services/realPushNotifications');
    await realPushNotifications.testMobileSound();
    console.log('✅ Mobile sound test completed');
  } catch (error) {
    console.error('❌ Mobile sound test failed:', error);
    alert('❌ Sound test failed: ' + error.message);
  }
};

(window as any).testEmergencyNotification = async function() {
  console.log('🚨 Testing emergency notification...');
  alert('🚨 Testing emergency notification system');

  try {
    const { realPushNotifications } = await import('./services/realPushNotifications');
    await realPushNotifications.testEmergencyNotification();
    console.log('✅ Emergency notification test completed');
  } catch (error) {
    console.error('❌ Emergency notification test failed:', error);
    alert('❌ Emergency notification test failed: ' + error.message);
  }
};

(window as any).checkFCMStatus = async function() {
  console.log('🔥 Checking FCM status for WhatsApp-style notifications...');

  try {
    const { realPushNotifications } = await import('./services/realPushNotifications');
    const status = await realPushNotifications.checkFCMStatus();

    const message = `
🔥 FCM STATUS CHECK:
✅ Has Token: ${status.hasToken}
🔑 Token: ${status.token || 'NONE'}
📱 Platform: ${status.platform}

${status.hasToken
  ? '🚀 Background notifications SHOULD work when browser is closed!'
  : '❌ NO FCM TOKEN - Background notifications WONT work when browser is closed!'
}
    `;

    console.log(message);
    alert(message.trim());
  } catch (error) {
    console.error('❌ FCM status check failed:', error);
    alert('❌ FCM status check failed: ' + error.message);
  }
};

console.log('🧪 Global test functions available:');
console.log('  - testNotifications() - Test full notification system');
console.log('  - checkNotificationPermissions() - Check permission status');
console.log('  - showTestOrder() - Show test order modal');
console.log('  - checkForNewOrders() - Manually check and trigger notifications for pending orders');
console.log('  - testMobileSound() - Test mobile sound functionality');
console.log('  - testEmergencyNotification() - Test emergency notification');
console.log('  - checkFCMStatus() - Check FCM token for WhatsApp-style background notifications');
console.log('');
console.log('🔧 To test notifications:');
console.log('  1. Open browser console (F12)');
console.log('  2. Run: checkNotificationPermissions()');
console.log('  3. Run: checkFCMStatus() - CRITICAL: Check if background notifications work');
console.log('  4. Run: testNotifications()');
console.log('  5. Run: testMobileSound() - Test if sound works on mobile');
console.log('  6. Or click the orange "🧪 TEST" button in vendor orders');
console.log('  7. Run: checkForNewOrders() to check for real pending orders');
console.log('');
console.log('🚨 WHATSAPP-STYLE TESTING:');
console.log('  1. Run: checkFCMStatus() - Ensure FCM token is registered');
console.log('  2. Close browser completely');
console.log('  3. Place test order - should receive notification even when closed!');

createRoot(document.getElementById("root")!).render(<App />);
