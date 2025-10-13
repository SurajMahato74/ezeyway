import { Capacitor } from '@capacitor/core';
import { fcmService } from '@/services/fcmService';

export class FCMVerification {
  static async runFullVerification(): Promise<boolean> {
    console.log('🔥 Starting FCM Verification...');
    
    try {
      // 1. Check if running on mobile
      if (!Capacitor.isNativePlatform()) {
        console.log('❌ Not running on native platform');
        return false;
      }
      
      // 2. Initialize FCM service
      console.log('📱 Initializing FCM service...');
      await fcmService.initialize();
      
      // 3. Check if FCM token was obtained
      const token = fcmService.getFCMTokenValue();
      if (!token) {
        console.log('❌ FCM token not obtained');
        return false;
      }
      
      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
      
      // 4. Send token to backend
      console.log('📤 Sending token to backend...');
      await fcmService.sendTokenToBackend();
      
      console.log('✅ FCM Verification Complete - Ready for auto-opening!');
      return true;
      
    } catch (error) {
      console.error('❌ FCM Verification Failed:', error);
      return false;
    }
  }
  
  static async testNotificationHandling(): Promise<void> {
    console.log('🧪 Testing notification handling...');
    
    // Simulate a push notification tap
    const testNotification = {
      notification: {
        data: {
          orderId: '123',
          orderNumber: 'TEST001',
          amount: '500.00'
        }
      }
    };
    
    // Trigger the auto-opening logic
    window.dispatchEvent(new CustomEvent('showOrderModal', {
      detail: {
        orderId: 123,
        orderNumber: 'TEST001',
        amount: '500.00',
        autoOpened: true,
        fromPush: true
      }
    }));
    
    console.log('✅ Test notification handled');
  }
}

