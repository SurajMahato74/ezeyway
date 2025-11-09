import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';

interface OrderNotificationData {
  orderId: number;
  orderNumber: string;
  amount: string;
  customerName: string;
  deliveryAddress: string;
  deliveryPhone: string;
  items: any[];
  timestamp: number;
}

class UnifiedNotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;
  private notificationSoundInterval: NodeJS.Timeout | null = null;
  private vibrationInterval: NodeJS.Timeout | null = null;

  async initialize() {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Unified Notification Service...');

    try {
      // Initialize based on platform
      if (Capacitor.isNativePlatform()) {
        await this.initializeMobile();
      } else {
        await this.initializeWeb();
      }

      this.setupNotificationHandlers();
      this.setupAppStateHandlers();
      
      this.isInitialized = true;
      console.log('✅ Unified Notification Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  private async initializeMobile() {
    console.log('📱 Initializing mobile notifications...');

    // Request permissions
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    await PushNotifications.register();

    // Register FCM token
    await this.registerMobileFCMToken();

    // Create notification channels for rich notifications
    await this.createNotificationChannels();

    console.log('✅ Mobile notifications initialized');
  }

  private async initializeWeb() {
    console.log('🌐 Initializing web notifications...');

    // Request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }
    }

    // Register service worker for background notifications
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service worker registered for background notifications');
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    }

    await this.registerWebFCMToken();
    console.log('✅ Web notifications initialized');
  }

  private async createNotificationChannels() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.createChannel({
        id: 'order-alerts',
        name: 'Order Alerts',
        description: 'High priority notifications for new orders',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true
      });

      await LocalNotifications.createChannel({
        id: 'critical-alerts',
        name: 'Critical Alerts',
        description: 'Critical notifications that require immediate attention',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true
      });
    } catch (error) {
      console.warn('Failed to create notification channels:', error);
    }
  }

  private async registerMobileFCMToken() {
    try {
      // Use Firebase FCM for mobile
      const { getToken } = await import('firebase/messaging');
      const { messaging } = await import('./firebaseConfig');
      
      const token = await getToken(messaging, {
        vapidKey: 'BKxX8QhZvQK9qYjVh4wQX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8Q'
      });

      if (token) {
        this.fcmToken = token;
        await this.sendTokenToBackend(token, 'android');
        console.log('✅ Mobile FCM token registered');
      }
    } catch (error) {
      console.warn('Failed to register mobile FCM token:', error);
    }
  }

  private async registerWebFCMToken() {
    try {
      // Use Firebase FCM for web
      const { getToken } = await import('firebase/messaging');
      const { messaging } = await import('./firebaseConfig');
      
      const token = await getToken(messaging, {
        vapidKey: 'BKxX8QhZvQK9qYjVh4wQX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8Q'
      });

      if (token) {
        this.fcmToken = token;
        await this.sendTokenToBackend(token, 'web');
        console.log('✅ Web FCM token registered');
      }
    } catch (error) {
      console.warn('Failed to register web FCM token:', error);
    }
  }

  private async sendTokenToBackend(token: string, platform: string) {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      await apiRequest('/api/register-fcm-token/', {
        method: 'POST',
        body: JSON.stringify({
          fcm_token: token,
          platform: platform,
          browser: navigator.userAgent
        })
      });
    } catch (error) {
      console.warn('Failed to send FCM token to backend:', error);
    }
  }

  private setupNotificationHandlers() {
    // Mobile push notification handler
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📱 Push notification received:', notification);
      this.handleOrderNotification(notification.data);
    });

    // Mobile notification tap handler
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('📱 Notification tapped:', notification);
      this.handleNotificationTap(notification.notification.data);
    });

    // Local notification tap handler
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('📱 Local notification tapped:', notification);
      this.handleNotificationTap(notification.notification.extra);
    });

    // Service worker message handler (Web)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'ORDER_NOTIFICATION') {
          this.handleOrderNotification(event.data.data);
        }
      });
    }
  }

  private setupAppStateHandlers() {
    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('📱 App became active - refreshing notifications');
        this.stopPersistentAlerts();
        this.checkForPendingNotifications();
      }
    });
  }

  private handleOrderNotification(data: any) {
    if (data?.action === 'order_notification' || data?.orderId) {
      const orderData: OrderNotificationData = {
        orderId: parseInt(data.orderId),
        orderNumber: data.orderNumber || 'Unknown',
        amount: data.amount || '0',
        customerName: data.customerName || 'Customer',
        deliveryAddress: data.deliveryAddress || 'Address not provided',
        deliveryPhone: data.deliveryPhone || 'Phone not provided',
        items: data.items || [],
        timestamp: Date.now()
      };

      this.showRichOrderNotification(orderData);
      this.startPersistentAlerts(orderData.orderId);
    }
  }

  private handleNotificationTap(data: any) {
    console.log('🔔 Notification tapped:', data);

    // Force app to foreground
    this.forceAppToForeground();

    // Navigate to orders page
    window.location.href = '/vendor/orders';

    // Show order modal
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('showOrderModal', {
        detail: {
          orderId: parseInt(data.orderId),
          orderNumber: data.orderNumber,
          amount: data.amount,
          fromNotification: true
        }
      }));
    }, 1000);
  }

  private async showRichOrderNotification(orderData: OrderNotificationData) {
    console.log('🔔 Showing rich order notification:', orderData);

    // Play urgent sound
    await this.playUrgentOrderSound();

    // Start vibration
    this.startVibrationPattern();

    // Show system notification
    if (Capacitor.isNativePlatform()) {
      await this.showMobileRichNotification(orderData);
    } else {
      this.showWebRichNotification(orderData);
    }

    // Dispatch to app
    window.dispatchEvent(new CustomEvent('showOrderModal', {
      detail: orderData
    }));
  }

  private async showMobileRichNotification(orderData: OrderNotificationData) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          title: '🚨 NEW ORDER RECEIVED!',
          body: `Order #${orderData.orderNumber} - ₹${orderData.amount}\n${orderData.customerName}\n📞 ${orderData.deliveryPhone}`,
          id: orderData.orderId,
          schedule: { at: new Date(Date.now() + 100) },
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#FF0000',
          channelId: 'order-alerts',
          extra: {
            type: 'order',
            orderId: orderData.orderId.toString(),
            orderNumber: orderData.orderNumber,
            amount: orderData.amount,
            autoOpen: true
          }
        }]
      });
    } catch (error) {
      console.error('Failed to show mobile notification:', error);
    }
  }

  private showWebRichNotification(orderData: OrderNotificationData) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`🚨 NEW ORDER #${orderData.orderNumber}`, {
        body: `₹${orderData.amount} - ${orderData.customerName}\n${orderData.deliveryAddress}`,
        icon: '/alert-icon.svg',
        badge: '/alert-icon.svg',
        tag: `order-${orderData.orderId}`,
        requireInteraction: true,
        data: orderData
      });

      notification.onclick = () => {
        this.handleNotificationTap(orderData);
        notification.close();
      };
    }
  }

  private async playUrgentOrderSound() {
    try {
      // Create urgent order sound sequence
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Play urgent beep sequence
      this.playBeepSequence(audioContext, [
        { freq: 1200, duration: 0.3, volume: 0.8 },
        { freq: 800, duration: 0.3, volume: 0.8 },
        { freq: 1200, duration: 0.5, volume: 1.0 }
      ], 0);

      // Start continuous sound if on mobile
      if (Capacitor.isNativePlatform()) {
        // Continuous sound will be handled by startPersistentAlerts
      }
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }

  private playBeepSequence(audioContext: AudioContext, sequence: Array<{freq: number, duration: number, volume: number}>, index: number) {
    if (index >= sequence.length) return;

    const { freq, duration, volume } = sequence[index];
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = freq;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);

    setTimeout(() => {
      this.playBeepSequence(audioContext, sequence, index + 1);
    }, 400);
  }

  private startVibrationPattern() {
    if (!('vibrate' in navigator)) return;

    // Urgent vibration pattern
    navigator.vibrate([1000, 300, 1000, 300, 1000, 500, 500, 500, 500, 500]);

    // Continue periodic vibration
    this.vibrationInterval = setInterval(() => {
      navigator.vibrate([800, 200, 800, 200, 800]);
    }, 5000);
  }

  private startContinuousSound(orderId: number) {
    this.stopContinuousSound(orderId);

    this.notificationSoundInterval = setInterval(() => {
      this.playUrgentOrderSound();
    }, 3000);

    // Store interval reference
    (window as any).notificationSoundIntervals = (window as any).notificationSoundIntervals || new Map();
    (window as any).notificationSoundIntervals.set(orderId, this.notificationSoundInterval);
  }

  private stopContinuousSound(orderId: number) {
    const intervals = (window as any).notificationSoundIntervals;
    if (intervals && intervals.has(orderId)) {
      clearInterval(intervals.get(orderId));
      intervals.delete(orderId);
    }
  }

  private startPersistentAlerts(orderId: number) {
    // Start continuous alerts that persist until user action
    this.startContinuousSound(orderId);
  }

  stopPersistentAlerts() {
    if (this.notificationSoundInterval) {
      clearInterval(this.notificationSoundInterval);
      this.notificationSoundInterval = null;
    }

    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }

    // Stop all continuous sounds
    const intervals = (window as any).notificationSoundIntervals;
    if (intervals) {
      intervals.forEach((interval: NodeJS.Timeout) => clearInterval(interval));
      intervals.clear();
    }
  }

  private forceAppToForeground() {
    try {
      if (Capacitor.isNativePlatform()) {
        // Try to bring app to foreground using native methods
        window.focus();
        document.body.click();
        
        // Additional Android-specific methods
        if (Capacitor.getPlatform() === 'android') {
          try {
            // This would require a native plugin
            console.log('Attempting native foreground force...');
          } catch (error) {
            console.warn('Native foreground force failed:', error);
          }
        }
      } else {
        // Web method
        window.focus();
        document.body.click();
      }
    } catch (error) {
      console.warn('Failed to force app to foreground:', error);
    }
  }

  private checkForPendingNotifications() {
    // Check for any pending order notifications that need attention
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder) {
      try {
        const orderData = JSON.parse(pendingOrder);
        this.showRichOrderNotification(orderData);
        localStorage.removeItem('pendingOrder');
      } catch (error) {
        console.warn('Failed to process pending order:', error);
      }
    }
  }

  // Public API methods
  async showOrderNotification(orderNumber: string, amount: string, orderId: number) {
    const orderData: OrderNotificationData = {
      orderId,
      orderNumber,
      amount,
      customerName: 'Customer',
      deliveryAddress: 'Address not provided',
      deliveryPhone: 'Phone not provided',
      items: [],
      timestamp: Date.now()
    };

    this.showRichOrderNotification(orderData);
  }

  async clearNotification(orderId: number) {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [{ id: orderId }] });
      }
      
      this.stopContinuousSound(orderId);
      
      console.log('🛑 Notification cleared for order:', orderId);
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  }

  // Enhanced FCM token management
  async refreshToken() {
    console.log('🔄 Refreshing FCM token...');
    this.fcmToken = null;
    
    if (Capacitor.isNativePlatform()) {
      await this.registerMobileFCMToken();
    } else {
      await this.registerWebFCMToken();
    }
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Enhanced notification with persistent alerts
  async showPersistentOrderNotification(orderNumber: string, amount: string, orderId: number) {
    const orderData: OrderNotificationData = {
      orderId,
      orderNumber,
      amount,
      customerName: 'Customer',
      deliveryAddress: 'Address not provided',
      deliveryPhone: 'Phone not provided',
      items: [],
      timestamp: Date.now()
    };

    // Store for persistence
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));

    this.showRichOrderNotification(orderData);
    this.startPersistentAlerts(orderId);

    return orderData;
  }

  // Stop all alerts
  stopAllAlerts() {
    this.stopPersistentAlerts();
    
    // Clear all stored intervals
    const intervals = (window as any).notificationSoundIntervals;
    if (intervals) {
      intervals.forEach((interval: NodeJS.Timeout) => clearInterval(interval));
      intervals.clear();
    }
  }
}

export const unifiedNotificationService = new UnifiedNotificationService();