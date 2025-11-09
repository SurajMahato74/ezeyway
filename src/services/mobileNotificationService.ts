
import { Capacitor } from '@capacitor/core';

class MobileNotificationService {
  private isInitialized = false;
  private hasCapacitorPlugins = false;

  async initialize() {
    if (!Capacitor.isNativePlatform() || this.isInitialized) return;

    try {
      // Check if Capacitor plugins are available
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const { App } = await import('@capacitor/app');

      this.hasCapacitorPlugins = true;

      // Request permissions
      await LocalNotifications.requestPermissions();
      await PushNotifications.requestPermissions();
      await PushNotifications.register();

      // Handle app launch from notification
      App.addListener('appUrlOpen', (event) => {
        console.log('App opened from URL:', event.url);
        if (event.url.includes('order-notification')) {
          window.location.href = '/vendor/orders';
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: { fromNotification: true }
            }));
          }, 1000);
        }
      });

      // Handle notification tap when app is closed
      LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
        console.log('Notification tapped - app opening:', notification);
        
        const data = notification.notification.extra;
        if (data?.type === 'order') {
          await this.vibrateUrgent();
          window.location.href = '/vendor/orders';
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: data
            }));
          }, 1500);
        }
      });

      this.isInitialized = true;
      console.log('Mobile notification service initialized');
    } catch (error) {
      console.warn('Capacitor plugins not available, using web fallbacks:', error);
      this.hasCapacitorPlugins = false;
      this.isInitialized = true;
    }
  }

  async scheduleOrderNotification(orderNumber: string, amount: string, orderId: number) {
    if (!Capacitor.isNativePlatform()) return;

    if (this.hasCapacitorPlugins) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        // ALARM MODE: Create high-priority notification channel first
        try {
          await LocalNotifications.createChannel({
            id: 'order-alerts',
            name: '🚨 ORDER ALARMS - ALARM MODE',
            description: 'ALARM MODE: Sound every 2s | Vibration every 3s | Works on lock screen',
            sound: 'default',
            importance: 5, // MAXIMUM importance
            visibility: 1, // Public for lock screen
            lights: true,
            vibration: true
          });
        } catch (channelError) {
          console.warn('Could not create alarm channel:', channelError);
        }

        await LocalNotifications.schedule({
          notifications: [{
            title: '🚨🚨 NEW ORDER - ALARM MODE! 🚨🚨',
            body: `Order #${orderNumber} - ₹${amount}\n🔔 Sound every 2s | Vibration every 3s\n👆 TAP TO ACCEPT/REJECT`,
            id: orderId,
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#FF0000',
            actionTypeId: 'OPEN_ORDER',
            channelId: 'order-alerts',
            extra: {
              type: 'order',
              orderId,
              orderNumber,
              amount,
              autoOpen: true,
              url: 'order-notification://open',
              alarmMode: true,
              soundEvery: '2s',
              vibrationEvery: '3s'
            }
          }]
        });

        console.log('Mobile order notification scheduled');
      } catch (error) {
        console.error('Failed to schedule mobile notification:', error);
        this.fallbackNotification(orderNumber, amount);
      }
    } else {
      this.fallbackNotification(orderNumber, amount);
    }
  }

  async vibrateUrgent() {
    if (!Capacitor.isNativePlatform()) return;

    if (this.hasCapacitorPlugins) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        
        // ALARM VIBRATION PATTERN: Heavy impact, pause, heavy impact, pause, heavy impact
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(async () => {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }, 1000);
        setTimeout(async () => {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }, 2000);
        
        console.log('🔊🔊🔊 ALARM VIBRATION PATTERN TRIGGERED');
      } catch (error) {
        console.error('Haptics error:', error);
        this.fallbackVibration();
      }
    } else {
      this.fallbackVibration();
    }
  }

  private fallbackVibration() {
    // Fallback to web vibration API - ALARM PATTERN
    if ('vibrate' in navigator) {
      // ALARM VIBRATION: Long buzz, pause, long buzz, pause, long buzz
      navigator.vibrate([2000, 500, 2000, 500, 2000]); // Alarm-style long vibrations
      console.log('📳 FALLBACK ALARM VIBRATION PATTERN');
    }
  }

  private fallbackNotification(orderNumber: string, amount: string) {
    // Fallback to web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 New Order Alert!', {
        body: `Order #${orderNumber} - ₹${amount}`,
        icon: '/favicon.ico',
        requireInteraction: true
      });
    }
    
    // Trigger vibration
    this.fallbackVibration();
  }
}

export const mobileNotificationService = new MobileNotificationService();