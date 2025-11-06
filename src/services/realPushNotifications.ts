import { Capacitor } from '@capacitor/core';

class RealPushNotifications {
  private fcmToken: string | null = null;

  async initialize() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const { App } = await import('@capacitor/app');

      // Request permissions
      let permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission denied');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Get FCM token
      PushNotifications.addListener('registration', (token) => {
        console.log('🔥 FCM Token:', token.value);
        this.fcmToken = token.value;
        // Send this token to your backend
        this.sendTokenToBackend(token.value);
      });

      // Handle push notification received (app in background/foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📱 Push received:', notification);
        
        // Show in-app notification if app is active
        if (notification.data?.orderId) {
          window.dispatchEvent(new CustomEvent('showOrderModal', {
            detail: {
              orderId: parseInt(notification.data.orderId),
              orderNumber: notification.data.orderNumber,
              amount: notification.data.amount,
              fromPush: true
            }
          }));
        }
      });

      // Handle push notification tapped (app was closed/background)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('🚀 Push notification tapped - app opening:', notification);
        
        // App is now opening - navigate to order
        const orderId = notification.notification.data?.orderId;
        if (orderId) {
          // Navigate to vendor orders
          window.location.href = '/vendor/orders';
          
          // Show order modal after navigation
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: {
                orderId: parseInt(orderId),
                orderNumber: notification.notification.data?.orderNumber,
                amount: notification.notification.data?.amount,
                autoOpened: true,
                fromPush: true
              }
            }));
          }, 1500);
        }
      });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('📱 App resumed from push notification');
          window.dispatchEvent(new CustomEvent('refreshPendingOrders'));
        }
      });

      console.log('🔥 Real push notifications initialized');
    } catch (error) {
      console.error('❌ Push notifications setup failed:', error);
    }
  }

  private async sendTokenToBackend(token: string) {
    try {
      // Send FCM token to your backend
      const response = await fetch('/api/vendor/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fcmToken: token,
          vendorId: localStorage.getItem('vendor_id') 
        })
      });
      
      if (response.ok) {
        console.log('✅ FCM token sent to backend');
      }
    } catch (error) {
      console.warn('Failed to send FCM token:', error);
    }
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }
}

export const realPushNotifications = new RealPushNotifications();