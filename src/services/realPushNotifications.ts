import { Capacitor } from '@capacitor/core';

class RealPushNotifications {
  private fcmToken: string | null = null;

  async initialize() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const { App } = await import('@capacitor/app');

      // Request permissions for both push and local notifications
      let pushPermStatus = await PushNotifications.requestPermissions();
      let localPermStatus = await LocalNotifications.requestPermissions();

      if (pushPermStatus.receive !== 'granted' || localPermStatus.display !== 'granted') {
        console.warn('Push or local notification permission denied');
        return;
      }

      // Create ULTIMATE PRIORITY notification channel - CUTS THROUGH EVERYTHING!
      await LocalNotifications.createChannel({
        id: 'order-emergency',
        name: 'Order Emergency Alerts',
        description: 'CRITICAL: New orders - interrupts video calls and all activities',
        sound: 'default',
        importance: 5, // Max importance - CRITICAL
        visibility: 1, // Public - shows on lock screen
        vibration: true,
        lights: true
      });

      // Create additional MAXIMUM PRIORITY channel for video call interruption
      await LocalNotifications.createChannel({
        id: 'order-max-emergency',
        name: 'MAXIMUM Order Alerts',
        description: 'MAXIMUM PRIORITY: Interrupts video calls, games, and all activities',
        sound: 'default',
        importance: 5, // Absolute maximum
        visibility: 1, // Public
        vibration: true,
        lights: true
      });

      console.log('📢 Emergency notification channel created');

      // Register for push notifications
      await PushNotifications.register();

      // Get FCM token
      PushNotifications.addListener('registration', (token) => {
        console.log('🔥 FCM Token:', token.value);
        this.fcmToken = token.value;
        // Send this token to your backend
        this.sendTokenToBackend(token.value);
      });

      // Handle push notification received (app in background/foreground)
      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        console.log('📱 Push received:', notification);

        // ALWAYS SHOW EMERGENCY LOCAL NOTIFICATION - WORKS WHEN APP IS MINIMIZED!
        if (notification.data?.orderId) {
          await this.showEmergencyLocalNotification(
            notification.data.orderId,
            notification.data.orderNumber,
            notification.data.amount
          );

          // Also show in-app modal if app is active
          window.dispatchEvent(new CustomEvent('showOrderModal', {
            detail: {
              orderId: parseInt(notification.data.orderId),
              orderNumber: notification.data.orderNumber,
              amount: notification.data.amount,
              fromPush: true
            }
          }));
        }
      });

      // Handle push notification tapped (app was closed/background)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('🚀 Push notification tapped - app opening:', notification);
        
        // App is now opening - navigate to order
        const orderId = notification.notification.data?.orderId;
        if (orderId) {
          // Navigate to vendor orders
          window.location.href = '/vendor/orders';
          
          // Show order modal after navigation
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: {
                orderId: parseInt(orderId),
                orderNumber: notification.notification.data?.orderNumber,
                amount: notification.notification.data?.amount,
                autoOpened: true,
                fromPush: true
              }
            }));
          }, 1500);
        }
      });

      // Handle local notification tapped (MAXIMUM PRIORITY emergency notifications)
      LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
        console.log('🚨🚨🚨 MAXIMUM PRIORITY EMERGENCY NOTIFICATION TAPPED - FORCE APP OPEN:', notification);

        const extra = notification.notification.extra;
        if (extra?.orderId) {
          // FORCE IMMEDIATE NAVIGATION - NO DELAY!
          window.location.href = '/vendor/orders';

          // Show order modal immediately after navigation
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: {
                orderId: extra.orderId,
                orderNumber: extra.orderNumber,
                amount: extra.amount,
                fromMaxEmergencyNotification: true,
                maxPriority: true,
                emergency: true,
                tappedFromBackground: true
              }
            }));

            // Clear all related notifications to stop spam
            LocalNotifications.cancel({
              notifications: [
                { id: notification.notification.id },
                { id: notification.notification.id + 1 }, // backup notification
                { id: notification.notification.id + 2 }  // followup notification
              ]
            }).catch(err => console.warn('Could not clear notifications:', err));

          }, 1000); // Faster than before
        }
      });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('📱 App resumed from push notification');
          window.dispatchEvent(new CustomEvent('refreshPendingOrders'));
        }
      });

      console.log('🔥 Real push notifications initialized with emergency alerts');
    } catch (error) {
      console.error('❌ Push notifications setup failed:', error);
    }
  }

  private async sendTokenToBackend(token: string) {
    try {
      // Send FCM token to your backend
      const response = await fetch('/api/vendor/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fcmToken: token,
          vendorId: localStorage.getItem('vendor_id') 
        })
      });
      
      if (response.ok) {
        console.log('✅ FCM token sent to backend');
      }
    } catch (error) {
      console.warn('Failed to send FCM token:', error);
    }
  }

  // MAXIMUM PRIORITY EMERGENCY LOCAL NOTIFICATION - CUTS THROUGH VIDEO CALLS!
  async showEmergencyLocalNotification(orderId: string, orderNumber: string, amount: string) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // MULTIPLE RAPID-FIRE NOTIFICATIONS TO CUT THROUGH EVERYTHING!
      const notifications = [];

      // PRIMARY MAXIMUM PRIORITY NOTIFICATION
      notifications.push({
        title: '🚨🚨🚨 ORDER EMERGENCY! 🚨🚨🚨',
        body: `CRITICAL: Order #${orderNumber} - ₹${amount}\n🚨 INTERRUPTS VIDEO CALLS!\n👆 TAP NOW - BUSINESS URGENT!`,
        id: Date.now(), // Unique ID
        schedule: { at: new Date(Date.now() + 50) }, // Show immediately
        sound: 'default', // Play system sound
        attachments: undefined,
        actionTypeId: 'MAX_EMERGENCY_ORDER',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#FF0000', // Red color for emergency
        channelId: 'order-max-emergency', // MAXIMUM priority channel
        summaryText: 'CRITICAL BUSINESS ALERT',
        extra: {
          orderId: parseInt(orderId),
          orderNumber,
          amount,
          emergency: true,
          maxPriority: true,
          timestamp: Date.now()
        }
      });

      // SECONDARY BACKUP NOTIFICATION (2 seconds later)
      notifications.push({
        title: '💰💰 MONEY ALERT! 💰💰',
        body: `Order #${orderNumber} waiting!\n₹${amount} potential earnings\n⏰ Don't miss this order!`,
        id: Date.now() + 1,
        schedule: { at: new Date(Date.now() + 2050) }, // 2 seconds later
        sound: 'default',
        attachments: undefined,
        actionTypeId: 'EMERGENCY_ORDER',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#00FF00', // Green for money
        channelId: 'order-emergency',
        summaryText: 'EARNINGS OPPORTUNITY',
        extra: {
          orderId: parseInt(orderId),
          orderNumber,
          amount,
          emergency: true,
          backup: true,
          timestamp: Date.now()
        }
      });

      // THIRD FOLLOW-UP (5 seconds later if not tapped)
      notifications.push({
        title: '⚠️⚠️ ORDER STILL WAITING ⚠️⚠️',
        body: `Order #${orderNumber} (₹${amount}) needs attention!\n📞 Customer waiting for response`,
        id: Date.now() + 2,
        schedule: { at: new Date(Date.now() + 5050) }, // 5 seconds later
        sound: 'default',
        attachments: undefined,
        actionTypeId: 'EMERGENCY_ORDER',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#FFFF00', // Yellow for warning
        channelId: 'order-emergency',
        summaryText: 'CUSTOMER WAITING',
        extra: {
          orderId: parseInt(orderId),
          orderNumber,
          amount,
          emergency: true,
          followup: true,
          timestamp: Date.now()
        }
      });

      await LocalNotifications.schedule({ notifications });

      console.log('🚨🚨🚨 MAXIMUM PRIORITY EMERGENCY NOTIFICATIONS SCHEDULED - CUTS THROUGH VIDEO CALLS!');

      // INTENSE VIBRATION PATTERN - IMPOSSIBLE TO IGNORE!
      if ('vibrate' in navigator) {
        // Emergency pattern: Long buzzes with short pauses
        navigator.vibrate([1500, 200, 1500, 200, 1500, 500, 1000, 200, 1000, 200, 1000]);
        console.log('📳 INTENSE EMERGENCY VIBRATION PATTERN ACTIVATED');
      }

      // Try to play audio alert if possible (fallback)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        // Play emergency beep sequence
        const playEmergencyBeep = (frequency: number, duration: number, delay: number) => {
          setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
          }, delay);
        };

        // Emergency siren-like pattern
        playEmergencyBeep(800, 0.2, 0);
        playEmergencyBeep(1000, 0.2, 300);
        playEmergencyBeep(1200, 0.3, 600);
        playEmergencyBeep(1000, 0.2, 1000);
        playEmergencyBeep(800, 0.2, 1300);

        console.log('🔊 EMERGENCY AUDIO ALERT PLAYED');
      } catch (audioError) {
        console.warn('Audio alert failed:', audioError);
      }

    } catch (error) {
      console.error('❌ Failed to show maximum priority emergency notifications:', error);
    }
  }

  // Method to manually trigger emergency notification (for testing)
  async testEmergencyNotification(orderId: string = '123', orderNumber: string = 'TEST-001', amount: string = '100') {
    console.log('🧪 TESTING EMERGENCY NOTIFICATION...');
    await this.showEmergencyLocalNotification(orderId, orderNumber, amount);
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }
}

export const realPushNotifications = new RealPushNotifications();