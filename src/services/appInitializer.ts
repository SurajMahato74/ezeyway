import { Capacitor } from '@capacitor/core';
import { initializeDeliveryRadius } from '@/utils/deliveryUtils';

class AppInitializer {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;


    try {
      // Initialize delivery radius from API
      await initializeDeliveryRadius();

      // Initialize authentication persistence
      await this.initializeAuth();

      // Initialize mobile services
      if (Capacitor.isNativePlatform()) {
        await this.initializeMobileServices();
      }

      // Setup global event listeners
      this.setupGlobalListeners();

      this.isInitialized = true;
      console.log('✅ Yango Pro Style App System Ready!');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
    }
  }

  private async initializeAuth() {
    const { authService } = await import('./authService');
    
    // Try auto-login on app start
    const autoLoginSuccess = await authService.autoLogin();
    
    if (autoLoginSuccess) {
      console.log('🔐 Auto-login successful on app start');
      
      // Keep session alive
      setInterval(async () => {
        await authService.keepAlive();
      }, 60000); // Every minute
    }
  }

  private async initializeMobileServices() {
    try {
      const { pushNotificationService } = await import('./pushNotificationService');
      const { backgroundOrderService } = await import('./backgroundOrderService');
      const { mobileAutoOpener } = await import('./mobileAutoOpener');

      // Initialize push notifications
      await pushNotificationService.initialize();

      // Initialize background order polling
      await backgroundOrderService.start();

      // Initialize auto-opener
      await mobileAutoOpener.initialize();

      console.log('📱 Mobile services initialized');
    } catch (error) {
      console.error('Mobile services initialization failed:', error);
    }
  }

  private setupGlobalListeners() {
    // Handle app resume from notification
    window.addEventListener('appResumeFromNotification', async (event: any) => {
      console.log('🚀 App resumed from notification:', event.detail);
      
      const { authService } = await import('./authService');
      
      // Auto-login
      const autoLoginSuccess = await authService.autoLogin();
      
      if (autoLoginSuccess) {
        // Navigate to vendor orders
        window.location.href = '/vendor/orders';
      }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        console.log('📱 App became visible');
        
        const { authService } = await import('./authService');
        await authService.autoLogin();
      }
    });
  }
}

export const appInitializer = new AppInitializer();