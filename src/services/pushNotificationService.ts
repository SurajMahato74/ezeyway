import { Capacitor } from '@capacitor/core';
import { fcmService } from './fcmService';

class PushNotificationService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize FCM service
      await fcmService.initialize();
      
      // Send token to backend
      await fcmService.sendTokenToBackend();
      
      this.isInitialized = true;
      console.log('🔔 Push Notification Service initialized');
    } catch (error) {
      console.error('❌ Push notification service failed:', error);
    }
  }

  async showOrderNotification(orderNumber: string, amount: string, orderId: number) {
    console.log('🔔 Order notification triggered:', { orderNumber, amount, orderId });
    
    // For mobile, FCM handles everything automatically
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Mobile: FCM will handle notification');
      return;
    }
    
    // For web, show browser notification as fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🔔 New Order!', {
        body: `Order #${orderNumber} - ₹${amount}`,
        icon: '/favicon.ico',
        tag: `order-${orderId}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        window.dispatchEvent(new CustomEvent('showOrderModal', {
          detail: { orderId, orderNumber, amount }
        }));
        notification.close();
      };
    }
  }

  async requestPermissions() {
    if (Capacitor.isNativePlatform()) {
      // FCM service handles permissions
      return true;
    }
    
    // Web notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission() === 'granted';
    }
    return 'Notification' in window && Notification.permission === 'granted';
  }
}

export const pushNotificationService = new PushNotificationService();