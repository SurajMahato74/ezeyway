import { Capacitor } from '@capacitor/core';
import { realPushNotifications } from './realPushNotifications';

class SimpleNotificationService {
  private persistentIntervals: Map<number, NodeJS.Timeout> = new Map();
  
  constructor() {
    this.setupNotificationHandlers();
    this.initializePushNotifications();
  }
  
  private async initializePushNotifications() {
    if (Capacitor.isNativePlatform()) {
      await realPushNotifications.initialize();
    }
  }
  
  private async setupNotificationHandlers() {
    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const { App } = await import('@capacitor/app');
        
        // Handle notification clicks - AUTO OPEN APP (Yango Pro style)
        LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
          console.log('🚀 NOTIFICATION TAPPED - AUTO OPENING APP:', notification);
          
          try {
            // FORCE BRING APP TO FOREGROUND
            const { App } = await import('@capacitor/app');
            
            // Get app state
            const state = await App.getState();
            console.log('📱 Current app state:', state);
            
            // Force app to active state
            if (!state.isActive) {
              console.log('🚀 App was in background - bringing to foreground');
              
              // Multiple methods to ensure app opens
              window.focus();
              document.body.click(); // Trigger user interaction
              
              // Try to minimize and restore (Android trick)
              try {
                await App.minimizeApp();
                setTimeout(() => {
                  window.focus();
                }, 100);
              } catch (e) {
                console.log('Minimize/restore not available');
              }
            }
            
            const orderId = parseInt(notification.notification.extra?.orderId || '0');
            if (orderId) {
              console.log('🎯 Opening order:', orderId);
              
              // Navigate to vendor dashboard immediately
              window.location.href = '/vendor/home';
              
              // Show order modal after navigation
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('showOrderModal', {
                  detail: { 
                    orderId, 
                    orderNumber: notification.notification.extra?.orderNumber,
                    amount: notification.notification.extra?.amount,
                    autoOpened: true,
                    fromNotification: true
                  }
                }));
              }, 1500);
            }
          } catch (error) {
            console.error('❌ Failed to open app:', error);
            // Fallback - just navigate
            window.location.href = '/vendor/home';
          }
        });
        
        // Handle app resume from background
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            console.log('📱 App resumed - checking for pending orders');
            window.dispatchEvent(new CustomEvent('refreshPendingOrders'));
          }
        });
        
      } catch (error) {
        console.warn('Could not setup notification handlers:', error);
      }
    }
  }
  
  async showOrderNotification(orderNumber: string, amount: string, orderId: number) {
    console.log('🔔 Using FCM push notifications for order:', orderNumber);
    
    // Use FCM push notification service
    const { pushNotificationService } = await import('./pushNotificationService');
    await pushNotificationService.showOrderNotification(orderNumber, amount, orderId);
    
    // Play sound and show in-app modal (only if app is active)
    this.playBeepSound();
    window.dispatchEvent(new CustomEvent('showOrderModal', {
      detail: { orderId, orderNumber, amount }
    }));
  }
  
  private async requestBackendPushNotification(orderNumber: string, amount: string, orderId: number) {
    try {
      // Request your backend to send FCM push notification
      const response = await fetch('/api/vendor/send-order-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: localStorage.getItem('vendor_id'),
          orderId,
          orderNumber,
          amount,
          title: '🔔 NEW ORDER RECEIVED',
          body: `Order #${orderNumber} - ₹${amount}`,
          data: {
            orderId: orderId.toString(),
            orderNumber,
            amount,
            action: 'openOrder'
          }
        })
      });
      
      if (response.ok) {
        console.log('✅ Backend push notification requested');
      } else {
        console.warn('❌ Backend push notification failed');
      }
    } catch (error) {
      console.warn('Backend push notification error:', error);
    }
  }
  
  private async showPushNotification(orderNumber: string, amount: string, orderId: number) {
    try {
      // In production, this would be sent from your backend server
      // For now, we'll simulate it with enhanced local notification
      console.log('🚀 Simulating push notification for auto-opening');
      
      // This is where your backend would send the actual push notification
      // using Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNs)
      
    } catch (error) {
      console.warn('Push notification failed, using local fallback:', error);
    }
  }
  
  private async showLocalNotification(orderNumber: string, amount: string, orderId: number) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // Request permissions
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }
      
      // Schedule HIGH PRIORITY notification with auto-opening capability
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🔔 NEW ORDER - TAP TO OPEN APP',
            body: `Order #${orderNumber} - ₹${amount}\n👆 TAP HERE TO OPEN`,
            id: orderId,
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: 'OPEN_ORDER',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#FF0000',
            channelId: 'order-alerts',
            summaryText: 'Tap to open app',
            extra: {
              orderId: orderId.toString(),
              orderNumber,
              amount,
              autoOpen: true,
              action: 'openApp',
              deepLink: 'vendor://order/' + orderId
            }
          }
        ]
      });
      
      console.log('📱 Local notification scheduled for order:', orderId);
    } catch (error) {
      console.warn('Local notifications not available:', error);
    }
  }
  
  private showWebNotification(orderNumber: string, amount: string, orderId: number) {
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

      setTimeout(() => notification.close(), 30000);
    }
  }
  
  private startPersistentAlert(orderNumber: string, amount: string, orderId: number) {
    // Clear any existing alert for this order
    this.stopPersistentAlert(orderId);
    
    // Start continuous vibration and sound every 5 seconds for mobile
    const interval = setInterval(() => {
      console.log('📳 Persistent alert for order:', orderNumber);
      
      // Continuous vibration pattern
      if ('vibrate' in navigator) {
        navigator.vibrate([1000, 300, 1000, 300, 1000]);
      }
      
      // Play sound
      this.playMobileSound();
    }, 5000);
    
    this.persistentIntervals.set(orderId, interval);
    
    // Auto-stop after 5 minutes to prevent infinite alerts
    setTimeout(() => {
      this.stopPersistentAlert(orderId);
    }, 300000);
  }
  
  stopPersistentAlert(orderId: number) {
    const interval = this.persistentIntervals.get(orderId);
    if (interval) {
      clearInterval(interval);
      this.persistentIntervals.delete(orderId);
      console.log('🛑 Stopped persistent alert for order:', orderId);
    }
  }
  
  async clearNotification(orderId: number) {
    // Stop persistent alerts
    this.stopPersistentAlert(orderId);
    
    // Clear background notification
    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({ notifications: [{ id: orderId }] });
        console.log('📱 Cleared background notification for order:', orderId);
      } catch (error) {
        console.warn('Could not clear notification:', error);
      }
    }
  }

  async requestPermissions() {
    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        // Request all permissions including exact alarm (for app opening)
        const permission = await LocalNotifications.requestPermissions();
        console.log('🔔 Notification permissions:', permission);
        
        // Create notification channel for high priority
        try {
          await LocalNotifications.createChannel({
            id: 'order-alerts',
            name: 'Order Alerts',
            description: 'High priority notifications for new orders',
            sound: 'default',
            importance: 5, // Max importance
            visibility: 1, // Public
            lights: true,
            vibration: true
          });
          console.log('📢 High priority notification channel created');
        } catch (channelError) {
          console.warn('Could not create notification channel:', channelError);
        }
        
        return permission.display === 'granted';
      } catch (error) {
        console.warn('Local notifications not available:', error);
        return false;
      }
    }
    
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission() === 'granted';
    }
    return 'Notification' in window && Notification.permission === 'granted';
  }

  private playBeepSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('🔊 Beep sound played');
    } catch (error) {
      console.warn('Audio not available:', error);
    }
  }
  
  private playMobileSound() {
    try {
      // Create a more prominent sound for mobile
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Play multiple beeps
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 1000 + (i * 200);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        }, i * 300);
      }
      
      console.log('📱 Mobile sound sequence played');
    } catch (error) {
      console.warn('Mobile audio not available:', error);
    }
  }
}

export const simpleNotificationService = new SimpleNotificationService();