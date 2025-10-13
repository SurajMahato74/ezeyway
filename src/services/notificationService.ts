import { Capacitor } from '@capacitor/core';

class NotificationService {
  private audio: HTMLAudioElement | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Use Web Audio API for notification sound
    this.audio = null; // Skip file-based audio

    // Register service worker for background notifications
    if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SHOW_ORDER_MODAL') {
            // Dispatch event to show order modal
            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: event.data.data
            }));
          }
        });
        
        // Listen for visibility changes to enable background notifications
        document.addEventListener('visibilitychange', () => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'VISIBILITY_CHANGE',
              hidden: document.hidden
            });
          }
        });

        // Enable background sync for order checking
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          registration.sync.register('background-sync-orders');
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Request browser notification permission only on web
    if (!Capacitor.isNativePlatform() && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
          this.showTestNotification();
        } else {
          console.warn('Notification permission denied');
        }
      } else if (Notification.permission === 'granted') {
        console.log('Notification permission already granted');
      }
    }

    // Skip complex mobile initialization to prevent crashes
    console.log('Notification service initialized for:', Capacitor.isNativePlatform() ? 'mobile' : 'web');

    this.isInitialized = true;
  }

  private async initializeMobileNotifications() {
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        
        // Request permissions
        await LocalNotifications.requestPermissions();
        await PushNotifications.requestPermissions();
        await PushNotifications.register();

        // Handle notification received (app in foreground)
        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          console.log('Push notification received:', notification);
          await this.handleMobileOrderNotification(notification.data);
        });

        // Handle notification tap (opens app)
        PushNotifications.addListener('pushNotificationActionPerformed', async (notification) => {
          console.log('Push notification tapped:', notification);
          const data = notification.notification.data;
          if (data?.type === 'order') {
            // Vibrate and show order modal
            await Haptics.impact({ style: ImpactStyle.Heavy });
            this.openOrderModal(data);
          }
        });

        // Handle local notification tap
        LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
          console.log('Local notification tapped:', notification);
          const data = notification.notification.extra;
          if (data?.type === 'order') {
            await Haptics.impact({ style: ImpactStyle.Heavy });
            this.openOrderModal(data);
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize mobile notifications:', error);
    }
  }

  async playNotificationSound() {
    // Always use Web Audio API beep sound
    this.createBeepSound();
  }

  private createBeepSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a triple beep notification sound - longer and louder
      this.playBeep(audioContext, 800, 0.3, 0.4); // First beep - longer, louder
      setTimeout(() => this.playBeep(audioContext, 1000, 0.3, 0.4), 400); // Second beep
      setTimeout(() => this.playBeep(audioContext, 1200, 0.4, 0.5), 800); // Third beep - highest pitch, loudest
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }
  
  private playBeep(audioContext: AudioContext, frequency: number, duration: number, volume: number) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square'; // Square wave is more noticeable than sine
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  async showTestNotification() {
    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Notifications Enabled!', {
        body: 'You will now receive order notifications even when the app is in the background.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false
      });

      setTimeout(() => notification.close(), 3000);
    }
  }

  async showOrderNotification(orderNumber: string, amount: string, orderId: number) {
    // Web notification only
    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🔔 New Order Received!', {
        body: `Order #${orderNumber} - ₹${amount}\nTap to view and respond`,
        icon: '/favicon.ico',
        tag: `order-${orderId}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        this.openOrderModal({ orderId, orderNumber, amount });
        notification.close();
      };

      setTimeout(() => notification.close(), 15000);
    }

    // Mobile: just vibration and modal
    if (Capacitor.isNativePlatform()) {
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 500]);
      }
      this.openOrderModal({ orderId, orderNumber, amount });
    }
  }

  async showBrowserNotification(title: string, body: string, conversationId: string, userType: string) {
    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `message-${conversationId}`,
        requireInteraction: true,
        data: { conversationId, userType }
      });

      notification.onclick = () => {
        window.focus();
        this.navigateToConversation(conversationId, userType);
        notification.close();
      };

      setTimeout(() => notification.close(), 10000);
    }
  }

  async showMobileOrderNotification(orderNumber: string, amount: string, orderId: number) {
    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        
        // Vibrate phone
        await Haptics.impact({ style: ImpactStyle.Heavy });
        
        // Schedule notification that opens app
        await LocalNotifications.schedule({
          notifications: [{
            title: '🔔 New Order Received!',
            body: `Order #${orderNumber} - ₹${amount}\nTap to accept/reject`,
            id: Date.now(),
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#FF6B35',
            actionTypeId: 'OPEN_ORDER',
            extra: { 
              type: 'order',
              orderId, 
              orderNumber, 
              amount,
              autoOpen: true
            }
          }]
        });
      } catch (error) {
        console.error('Failed to show mobile order notification:', error);
      }
    }
  }

  async showMobileNotification(title: string, body: string, conversationId: string, userType: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.schedule({
          notifications: [{
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: [],
            actionTypeId: 'OPEN_MESSAGE',
            extra: { conversationId, userType }
          }]
        });
      } catch (error) {
        console.error('Failed to show mobile notification:', error);
      }
    }
  }

  private openOrderModal(data: any) {
    // Dispatch event to show order modal
    window.dispatchEvent(new CustomEvent('showOrderModal', {
      detail: data
    }));
    
    // Navigate to vendor home if not already there
    if (Capacitor.isNativePlatform()) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/vendor/home') && !currentPath.includes('/vendor/dashboard')) {
        window.location.href = '/vendor/home';
      }
    }
  }

  private async handleMobileOrderNotification(data: any) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      
      // Vibrate phone
      await Haptics.impact({ style: ImpactStyle.Heavy });
      
      // Play notification sound
      await this.playNotificationSound();
      
      // Show order modal
      this.openOrderModal(data);
    } catch (error) {
      console.error('Error handling mobile order notification:', error);
    }
  }

  private navigateToConversation(conversationId: string, userType: string) {
    const routes = {
      vendor: `/vendor/messages/${conversationId}`,
      customer: `/messages/${conversationId}`,
      superadmin: `/accounts/superadmin/messages/${conversationId}/`
    };

    const route = routes[userType as keyof typeof routes];
    if (route) {
      window.location.href = route;
    }
  }

  async notifyNewMessage(senderName: string, message: string, conversationId: string, userType: string) {
    await this.initialize();

    const title = `New message from ${senderName}`;
    const body = message.length > 50 ? message.substring(0, 50) + '...' : message;

    // Play sound
    await this.playNotificationSound();

    // Show browser notification
    await this.showBrowserNotification(title, body, conversationId, userType);

    // Show mobile notification
    await this.showMobileNotification(title, body, conversationId, userType);
  }

  async requestPermissions() {
    await this.initialize();
    
    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return !Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted';
  }

  // Alias for compatibility
  async requestPermission() {
    return this.requestPermissions();
  }

  // Mock methods for notifications (replace with actual API calls)
  async getNotifications() {
    // This should be replaced with actual API call
    return [];
  }

  async getUnreadCount() {
    // This should be replaced with actual API call
    return 0;
  }

  async markAsRead(id: number) {
    // This should be replaced with actual API call
    console.log('Marking notification as read:', id);
  }

  async markAllAsRead() {
    // This should be replaced with actual API call
    console.log('Marking all notifications as read');
  }

  // Browser notification method for compatibility (overloaded)
  async showBrowserNotificationCompat(title: string, options: any) {
    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: options.body,
        icon: '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        data: options.data
      });

      notification.onclick = () => {
        window.focus();
        if (options.data?.actionUrl) {
          window.location.href = options.data.actionUrl;
        }
        notification.close();
      };

      setTimeout(() => notification.close(), 10000);
    }
  }
}

// Export notification type for compatibility
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  action_url?: string;
}

export const notificationService = new NotificationService();