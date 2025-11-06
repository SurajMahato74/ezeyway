import { Capacitor } from '@capacitor/core';
import { fcmService } from './fcmService';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app from './firebaseConfig';

class PushNotificationService {
  private isInitialized = false;
  private messaging: any = null;
  // VAPID key for web push notifications - Generate from Firebase Console
  // Go to Firebase Console > Project Settings > Cloud Messaging > Web Push certificates > Generate key pair
  private vapidKey = 'BKxX8QhZvQK9qYjVh4wQX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8Q'; // Replace with your actual VAPID key

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Web Push Notification Service...');

      // Initialize mobile FCM service
      if (Capacitor.isNativePlatform()) {
        await fcmService.initialize();
        await fcmService.sendTokenToBackend();
        this.isInitialized = true;
        console.log('📱 Mobile FCM Push Notification Service initialized');
        return;
      }

      // Initialize web push notifications
      await this.initializeWebPush();
      this.isInitialized = true;
      console.log('🌐 Web Push Notification Service initialized');

    } catch (error) {
      console.error('❌ Push notification service failed:', error);
    }
  }

  private async initializeWebPush() {
    try {
      console.log('🔥 Setting up Firebase Cloud Messaging for Web...');

      // Check if FCM is supported
      const supported = await isSupported();
      if (!supported) {
        console.warn('❌ Firebase Cloud Messaging not supported in this browser');
        return;
      }

      // Initialize Firebase Messaging
      this.messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialized');

      // Request notification permission
      await this.requestWebPushPermissions();

      // Get and register FCM token
      await this.getAndRegisterWebToken();

      // Set up message listener for foreground messages
      onMessage(this.messaging, (payload) => {
        console.log('📨 Web Push Message received in foreground:', payload);

        // Handle the message
        this.handleWebPushMessage(payload);
      });

      console.log('🎧 Web push message listeners set up');

    } catch (error) {
      console.error('❌ Web push initialization failed:', error);
    }
  }

  private async requestWebPushPermissions(): Promise<boolean> {
    try {
      if (Notification.permission === 'granted') {
        console.log('✅ Web push notifications already granted');
        return true;
      }

      if (Notification.permission === 'denied') {
        console.warn('❌ Web push notifications denied by user');
        alert('❌ Push notifications blocked! Please enable notifications in browser settings for order alerts even when browser is closed.');
        return false;
      }

      console.log('🔐 Requesting web push notification permission...');
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('✅ Web push notifications granted!');
        return true;
      } else {
        console.warn('❌ Web push notifications denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting web push permissions:', error);
      return false;
    }
  }

  private async getAndRegisterWebToken() {
    try {
      if (!this.messaging) return;

      console.log('🔑 Getting FCM token for web push...');

      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });

      if (token) {
        console.log('🔥 Web FCM Token obtained:', token);

        // Send token to backend
        await this.sendWebTokenToBackend(token);
      } else {
        console.warn('❌ No FCM token received');
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
    }
  }

  private async sendWebTokenToBackend(token: string) {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');

      const { response } = await apiRequest('/api/register-fcm-token/', {
        method: 'POST',
        body: JSON.stringify({
          fcm_token: token,
          platform: 'web',
          browser: navigator.userAgent
        })
      });

      if (response.ok) {
        console.log('✅ Web FCM token registered with backend');
      } else {
        console.warn('❌ Failed to register web FCM token:', response.status);
      }
    } catch (error) {
      console.warn('❌ Error sending web FCM token:', error);
    }
  }

  private handleWebPushMessage(payload: any) {
    console.log('📨 Handling web push message:', payload);

    try {
      const data = payload.data || {};
      const notification = payload.notification || {};

      // Extract order data
      const orderId = parseInt(data.orderId || data.order_id || '0');
      const orderNumber = data.orderNumber || data.order_number || notification.title || 'Unknown';
      const amount = data.amount || '0';

      if (orderId) {
        console.log('🎯 Web push contains order data, showing notification');

        // Show the order notification
        const { simpleNotificationService } = require('./simpleNotificationService');
        simpleNotificationService.showOrderNotification(orderNumber, amount, orderId);
      } else {
        // Show generic notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(
            payload.notification?.title || 'Notification',
            {
              body: payload.notification?.body || 'You have a new notification',
              icon: '/favicon.ico',
              tag: 'web-push',
              requireInteraction: true
            }
          );

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }
      }
    } catch (error) {
      console.error('❌ Error handling web push message:', error);
    }
  }

  async showOrderNotification(orderNumber: string, amount: string, orderId: number) {
    console.log('🔔 Order notification triggered:', { orderNumber, amount, orderId });

    // For mobile, FCM handles everything automatically
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Mobile: FCM will handle notification');
      return;
    }

    // For web, trigger backend to send FCM push notification
    await this.triggerBackendWebPush(orderNumber, amount, orderId);
  }

  private async triggerBackendWebPush(orderNumber: string, amount: string, orderId: number) {
    try {
      console.log('📡 Triggering backend web push notification...');

      const { apiRequest } = await import('@/utils/apiUtils');

      const { response } = await apiRequest('/api/send-web-push-notification/', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          orderNumber,
          amount,
          title: `🚨 New Order #${orderNumber}`,
          body: `Order received - ₹${amount}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: {
            orderId: orderId.toString(),
            orderNumber,
            amount,
            action: 'openOrder',
            timestamp: Date.now()
          }
        })
      });

      if (response.ok) {
        console.log('✅ Backend web push notification triggered');
      } else {
        console.warn('❌ Backend web push notification failed:', response.status);
        // Fallback to browser notification
        this.showFallbackBrowserNotification(orderNumber, amount, orderId);
      }
    } catch (error) {
      console.warn('❌ Error triggering backend web push:', error);
      // Fallback to browser notification
      this.showFallbackBrowserNotification(orderNumber, amount, orderId);
    }
  }

  private showFallbackBrowserNotification(orderNumber: string, amount: string, orderId: number) {
    console.log('🔄 Showing fallback browser notification');

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`🚨 EzyWay: New Order #${orderNumber}`, {
        body: `₹${amount} - Tap to view order`,
        icon: '/favicon.ico',
        tag: `order-${orderId}`,
        requireInteraction: true,
        data: { orderId, orderNumber, amount }
      });

      notification.onclick = () => {
        window.focus();
        window.dispatchEvent(new CustomEvent('showOrderModal', {
          detail: { orderId, orderNumber, amount }
        }));
        notification.close();
      };

      setTimeout(() => notification.close(), 30000);
    } else {
      console.warn('❌ Fallback browser notification not available');
    }
  }

  async requestPermissions() {
    if (Capacitor.isNativePlatform()) {
      // FCM service handles permissions
      return true;
    }

    // Web push permissions
    return await this.requestWebPushPermissions();
  }

  // Method to manually re-register token (useful for debugging)
  async refreshWebToken() {
    if (!Capacitor.isNativePlatform()) {
      console.log('🔄 Refreshing web FCM token...');
      await this.getAndRegisterWebToken();
    }
  }
}

export const pushNotificationService = new PushNotificationService();