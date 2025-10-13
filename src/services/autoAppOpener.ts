import { Capacitor } from '@capacitor/core';

class AutoAppOpener {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized || !Capacitor.isNativePlatform()) return;

    try {
      const { App } = await import('@capacitor/app');
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Handle notification taps - FORCE APP TO OPEN
      LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
        console.log('🚀 NOTIFICATION TAPPED - OPENING APP');
        
        // Force app to foreground
        await this.forceAppOpen();
        
        // Navigate to order
        const orderId = notification.notification.extra?.orderId;
        if (orderId) {
          window.location.href = '/vendor/home';
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: { orderId, fromNotification: true }
            }));
          }, 1000);
        }
      });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('📱 App opened - checking orders');
          window.dispatchEvent(new CustomEvent('refreshPendingOrders'));
        }
      });

      this.isInitialized = true;
      console.log('🚀 Auto app opener initialized');
    } catch (error) {
      console.warn('Auto app opener failed:', error);
    }
  }

  private async forceAppOpen() {
    try {
      console.log('🚀 ATTEMPTING TO FORCE APP OPEN');
      
      // Method 1: Try custom native plugin
      try {
        const ForceAppOpen = await import('../services/forceAppOpen');
        await ForceAppOpen.default.bringToForeground();
        console.log('✅ Native force open successful');
        return;
      } catch (e) {
        console.log('❌ Native plugin not available, using fallback');
      }
      
      // Method 2: Use notification with full screen intent
      await this.createFullScreenNotification();
      
      // Method 3: Vibrate to alert user
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
      
    } catch (error) {
      console.warn('Force app open failed:', error);
    }
  }
  
  private async createFullScreenNotification() {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // Create HIGH PRIORITY notification that should show over lock screen
      await LocalNotifications.schedule({
        notifications: [{
          title: '🚨 URGENT: NEW ORDER',
          body: 'TAP TO OPEN APP IMMEDIATELY',
          id: 88888,
          schedule: { at: new Date(Date.now() + 100) },
          sound: 'default',
          channelId: 'order-alerts',
          extra: { 
            forceOpen: true,
            urgent: true
          }
        }]
      });
      
      console.log('📱 Full screen notification created');
    } catch (error) {
      console.warn('Full screen notification failed:', error);
    }
  }

  async showOrderNotification(orderNumber: string, amount: string, orderId: number) {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // IMMEDIATELY try to force app open
      await this.forceAppOpen();
      
      // Create HIGH PRIORITY notification
      await LocalNotifications.schedule({
        notifications: [{
          title: '🚨 NEW ORDER RECEIVED',
          body: `Order #${orderNumber} - ₹${amount}\n🚀 APP OPENING AUTOMATICALLY`,
          id: orderId,
          schedule: { at: new Date(Date.now() + 200) },
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#FF0000',
          channelId: 'order-alerts',
          extra: {
            orderId: orderId.toString(),
            orderNumber,
            amount,
            autoOpen: true
          }
        }]
      });
      
      // Try multiple times to force open
      setTimeout(() => this.forceAppOpen(), 500);
      setTimeout(() => this.forceAppOpen(), 1000);
      setTimeout(() => this.forceAppOpen(), 2000);

      console.log('📱 Auto-opening notification sent for order:', orderId);
    } catch (error) {
      console.warn('Notification failed:', error);
    }
  }
}

export const autoAppOpener = new AutoAppOpener();