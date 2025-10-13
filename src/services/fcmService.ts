import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import app from './firebaseConfig';

class FCMService {
  private fcmToken: string | null = null;

  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Not on native platform, skipping FCM initialization');
      return;
    }

    try {
      console.log('🚀 Initializing FCM Service...');
      
      // Check for auto-open order from notification tap
      this.checkForAutoOpenOrder();
      
      // Set up listeners first
      this.setupListeners();
      
      // Request permissions
      console.log('🔐 Requesting push notification permissions...');
      const permResult = await PushNotifications.requestPermissions();
      console.log('📋 Permission result:', permResult);
      
      if (permResult.receive !== 'granted') {
        console.warn('❌ Push notification permission denied');
        return;
      }

      // Register for push notifications
      console.log('📝 Registering for push notifications...');
      await PushNotifications.register();

      // Initialize FCM community plugin for better background handling
      try {
        await FCM.requestPermissions();
        console.log('✅ FCM Community plugin initialized');
      } catch (fcmError) {
        console.warn('⚠️ FCM Community plugin not available:', fcmError);
      }

      // Get FCM token (will be handled in registration listener)
      await this.getFCMToken();

      console.log('✅ FCM Service initialized successfully');
    } catch (error) {
      console.error('❌ FCM initialization failed:', error);
    }
  }

  private checkForAutoOpenOrder() {
    try {
      const autoOpenOrder = localStorage.getItem('autoOpenOrder');
      if (autoOpenOrder) {
        const orderData = JSON.parse(autoOpenOrder);
        const now = Date.now();
        
        // Only auto-open if within 30 seconds of notification
        if (now - orderData.timestamp < 30000) {
          console.log('🚀 AUTO-OPENING ORDER FROM NOTIFICATION:', orderData);
          
          // Clear the stored data
          localStorage.removeItem('autoOpenOrder');
          
          // Start beeping
          this.startOrderBeeping();
          
          // Show modal after short delay
          setTimeout(() => {
            this.showOrderModalImmediately(orderData);
          }, 1000);
        } else {
          // Clear expired data
          localStorage.removeItem('autoOpenOrder');
        }
      }
      
      // Listen for auto-opened events from background service
      window.addEventListener('autoOpenedFromBackground', (event) => {
        console.log('🚀 APP AUTO-OPENED FROM BACKGROUND SERVICE:', event.detail);
        
        // Start beeping immediately
        this.startOrderBeeping();
        
        // Show modal
        setTimeout(() => {
          this.showOrderModalImmediately(event.detail);
        }, 500);
      });
      
    } catch (error) {
      console.error('Error checking for auto-open order:', error);
    }
  }

  private async getFCMToken() {
    try {
      if (!Capacitor.isNativePlatform()) return null;

      // For native platforms, token comes from registration listener
      return new Promise((resolve) => {
        PushNotifications.addListener('registration', (token) => {
          this.fcmToken = token.value;
          console.log('🔥 FCM Token (Native):', token.value);
          
          // Token registered silently
          
          // Automatically send token to backend
          this.sendTokenToBackend();
          
          resolve(token.value);
        });
      });
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  private setupListeners() {
    // Handle data-only messages (auto-open functionality) - AGGRESSIVE MODE
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📱 Push notification received:', notification);
      console.log('📊 Notification data:', notification.data);
      
      // Check if this is an auto-open order message
      if (notification.data?.autoOpen === 'true' || notification.data?.action === 'autoOpenOrder') {
        console.log('🚀 AGGRESSIVE AUTO-OPENING APP FROM DATA MESSAGE!');
        
        // FORCE APP TO FOREGROUND AGGRESSIVELY
        this.forceAppToForeground();
        
        // Start beeping immediately
        this.startOrderBeeping();
        
        // Show modal immediately with multiple attempts
        this.showOrderModalImmediately({
          orderId: parseInt(notification.data.orderId),
          orderNumber: notification.data.orderNumber,
          amount: notification.data.amount,
          autoOpened: true,
          fromPush: true,
          startBeeping: true,
          aggressive: true
        });
        
        // Send broadcast to background service
        this.triggerBackgroundAutoOpen(notification.data);
        
        return; // Don't process as regular notification
      }
      
      // Handle regular notifications
      if (notification.data?.orderId) {
        console.log(`🔔 Showing order modal for order: ${notification.data.orderId}`);
        
        // Start beeping for foreground notification too
        this.startOrderBeeping();
        
        window.dispatchEvent(new CustomEvent('showOrderModal', {
          detail: {
            orderId: parseInt(notification.data.orderId),
            orderNumber: notification.data.orderNumber,
            amount: notification.data.amount,
            fromPush: true,
            startBeeping: true
          }
        }));
      } else {
        console.warn('⚠️ No orderId in notification data');
      }
    });

    // Handle notification tapped (app was closed/background) - AGGRESSIVE AUTO OPEN
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('🚀 NOTIFICATION TAPPED - AGGRESSIVE AUTO OPENING LIKE YANGO PRO:', notification);
      console.log('📱 Notification data:', notification.notification.data);
      
      const orderId = notification.notification.data?.orderId;
      if (orderId) {
        console.log(`🎯 AGGRESSIVE AUTO-OPENING FOR ORDER: ${orderId}`);
        
        // Start beeping immediately
        this.startOrderBeeping();
        
        // Store order data for immediate access
        localStorage.setItem('autoOpenOrder', JSON.stringify({
          orderId: parseInt(orderId),
          orderNumber: notification.notification.data?.orderNumber,
          amount: notification.notification.data?.amount,
          autoOpened: true,
          fromPush: true,
          startBeeping: true,
          timestamp: Date.now()
        }));
        
        // Trigger aggressive auto-opening
        this.triggerAggressiveAutoOpen({
          orderId: parseInt(orderId),
          orderNumber: notification.notification.data?.orderNumber,
          amount: notification.notification.data?.amount
        });
        
      } else {
        console.warn('⚠️ No orderId found in notification data');
        // Still trigger auto-opening
        this.triggerAggressiveAutoOpen({});
      }
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Push registration error:', error);
    });
    
    console.log('🎧 FCM listeners set up successfully');
  }

  async sendTokenToBackend() {
    if (!this.fcmToken) {
      console.warn('No FCM token available to send');
      return;
    }

    try {
      // Wait for authentication to be ready
      await this.waitForAuth();
      
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response } = await apiRequest('/api/register-fcm-token/', {
        method: 'POST',
        body: JSON.stringify({
          fcm_token: this.fcmToken,
          platform: Capacitor.getPlatform()
        })
      });

      if (response.ok) {
        console.log('✅ FCM token sent to backend successfully');
      } else {
        console.warn('❌ Failed to register FCM token:', response.status);
      }
    } catch (error) {
      console.warn('❌ Failed to send FCM token:', error);
      // Retry after 5 seconds
      setTimeout(() => this.sendTokenToBackend(), 5000);
    }
  }

  private async waitForAuth(maxWait = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        const { authService } = await import('@/services/authService');
        const token = authService.getToken();
        if (token) {
          console.log('🔐 Authentication ready for FCM token registration');
          return;
        }
      } catch (error) {
        // Auth service not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.warn('⚠️ Authentication not ready, sending FCM token anyway');
  }

  private showOrderModalImmediately(orderData: any) {
    console.log('📢 SHOWING ORDER MODAL IMMEDIATELY:', orderData);
    
    // Dispatch event immediately
    window.dispatchEvent(new CustomEvent('showOrderModal', {
      detail: orderData
    }));
    
    // Also dispatch after short delays to ensure it's caught
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('showOrderModal', {
        detail: orderData
      }));
    }, 500);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('showOrderModal', {
        detail: orderData
      }));
    }, 1500);
  }

  private async forceAppToForeground() {
    try {
      console.log('🚀 FORCING APP TO FOREGROUND...');
      
      // Multiple methods to force app focus
      if (window.focus) window.focus();
      if (document.hidden) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      
      // Force page visibility
      Object.defineProperty(document, 'hidden', { value: false, writable: false });
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
      
      // Trigger focus events
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
      
    } catch (error) {
      console.warn('Could not force app focus:', error);
    }
  }
  
  private triggerBackgroundAutoOpen(orderData: any) {
    try {
      // Send intent to background service
      if (Capacitor.isNativePlatform()) {
        const intent = {
          action: 'com.ezeyway.app.AUTO_OPEN_ORDER',
          extras: {
            orderId: orderData.orderId,
            orderNumber: orderData.orderNumber,
            amount: orderData.amount,
            autoOpened: true
          }
        };
        
        // This would trigger the background receiver
        console.log('📡 Triggering background auto-open:', intent);
      }
    } catch (error) {
      console.error('Failed to trigger background auto-open:', error);
    }
  }
  
  private async triggerAggressiveAutoOpen(orderData: any) {
    try {
      console.log('🚀 TRIGGERING AGGRESSIVE AUTO-OPEN...');
      
      // Force app to foreground
      this.forceAppToForeground();
      
      // Force navigation and show modal
      window.location.replace('/vendor/home');
      
      // Show modal immediately with multiple attempts
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          this.showOrderModalImmediately({
            ...orderData,
            autoOpened: true,
            fromPush: true,
            startBeeping: true,
            aggressive: true
          });
        }, i * 500);
      }
      
    } catch (error) {
      console.error('Failed to trigger aggressive auto-open:', error);
    }
  }

  private async startOrderBeeping() {
    try {
      console.log('🔊 Starting order notification beeping...');
      
      // Import notification service and start beeping
      const { notificationService } = await import('./notificationService');
      await notificationService.playNotificationSound();
      
      // Vibrate if available
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Heavy });
        
        // Continue vibrating every 2 seconds for 10 seconds
        let vibrateCount = 0;
        const vibrateInterval = setInterval(async () => {
          if (vibrateCount < 5) {
            await Haptics.impact({ style: ImpactStyle.Medium });
            vibrateCount++;
          } else {
            clearInterval(vibrateInterval);
          }
        }, 2000);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
      
      // Continue beeping every 3 seconds for 15 seconds
      let beepCount = 0;
      const beepInterval = setInterval(async () => {
        if (beepCount < 5) {
          await notificationService.playNotificationSound();
          beepCount++;
        } else {
          clearInterval(beepInterval);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Failed to start order beeping:', error);
    }
  }

  getFCMTokenValue(): string | null {
    return this.fcmToken;
  }
  
  // Method to manually trigger token registration
  async registerToken() {
    if (this.fcmToken) {
      await this.sendTokenToBackend();
    } else {
      console.warn('No FCM token available to register');
    }
  }
}

export const fcmService = new FCMService();