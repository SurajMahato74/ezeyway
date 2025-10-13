import { Capacitor } from '@capacitor/core';

class MobileAutoOpener {
  private isInitialized = false;

  async initialize() {
    if (!Capacitor.isNativePlatform() || this.isInitialized) return;

    try {
      const { App } = await import('@capacitor/app');
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Handle app URL opening (deep links)
      App.addListener('appUrlOpen', (event) => {
        console.log('🚀 App opened via URL:', event.url);
        
        if (event.url.includes('vendor://order/')) {
          const orderId = event.url.split('/').pop();
          this.openOrderPage(parseInt(orderId || '0'));
        }
      });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('📱 App state changed:', isActive ? 'ACTIVE' : 'BACKGROUND');
        
        if (isActive) {
          console.log('🚀 App became ACTIVE - checking for pending orders');
          
          // App came to foreground - check for pending orders
          window.dispatchEvent(new CustomEvent('refreshPendingOrders'));
          
          // Navigate to vendor home if not already there
          if (!window.location.pathname.includes('/vendor/home')) {
            console.log('🎯 Auto-navigating to vendor home');
            window.location.href = '/vendor/home';
          }
        }
      });

      // Handle notification received while app is in background
      App.addListener('appRestoredResult', (result) => {
        console.log('🔄 App restored:', result);
        
        if (result.pluginId === 'LocalNotifications') {
          // App was opened by notification
          this.handleNotificationOpen(result.data);
        }
      });

      this.isInitialized = true;
      console.log('🚀 Mobile Auto-Opener initialized - Yango Pro style ready!');
    } catch (error) {
      console.error('Failed to initialize mobile auto-opener:', error);
    }
  }

  private openOrderPage(orderId: number) {
    console.log('🎯 Auto-opening order page for:', orderId);
    
    // Navigate to vendor dashboard
    window.location.href = '/vendor/home';
    
    // Show order modal after navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('showOrderModal', {
        detail: { 
          orderId,
          autoOpened: true,
          source: 'deepLink'
        }
      }));
    }, 1000);
  }

  private handleNotificationOpen(data: any) {
    console.log('📲 Handling notification open:', data);
    
    if (data?.orderId) {
      this.openOrderPage(parseInt(data.orderId));
    }
  }

  // Force app to foreground (AGGRESSIVE METHOD)
  async bringToForeground() {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const { App } = await import('@capacitor/app');
      
      console.log('🚀 FORCING APP TO FOREGROUND');
      
      // Multiple aggressive methods
      window.focus();
      document.body.click();
      
      // Try minimize/restore trick
      try {
        await App.minimizeApp();
        setTimeout(async () => {
          window.focus();
          document.body.click();
          
          // Navigate to vendor home
          window.location.href = '/vendor/home';
        }, 200);
      } catch (e) {
        console.log('Minimize/restore not available, using direct focus');
        window.location.href = '/vendor/home';
      }
      
      return true;
    } catch (error) {
      console.error('Could not bring app to foreground:', error);
      return false;
    }
  }
}

export const mobileAutoOpener = new MobileAutoOpener();