// FCM Debug Script - Run this in browser console after app loads
console.log('🔍 FCM Debug Script Started');

// Check if FCM service is initialized
if (window.fcmService) {
  console.log('✅ FCM Service found');
  console.log('📱 FCM Token:', window.fcmService.getFCMTokenValue());
} else {
  console.log('❌ FCM Service not found');
}

// Check Capacitor platform
console.log('📱 Platform:', window.Capacitor?.getPlatform());
console.log('🏠 Is Native:', window.Capacitor?.isNativePlatform());

// Check push notification permissions
if (window.PushNotifications) {
  window.PushNotifications.checkPermissions().then(result => {
    console.log('🔐 Push Permissions:', result);
  });
}

// Listen for custom events
window.addEventListener('showOrderModal', (event) => {
  console.log('🎯 Order Modal Event Received:', event.detail);
});

console.log('🔍 Debug script complete. Check logs above.');