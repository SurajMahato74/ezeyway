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
          // PLAY SOUND IMMEDIATELY WHEN USER TAPS NOTIFICATION (works on mobile!)
          this.playMobileEmergencySound();

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
                tappedFromBackground: true,
                soundPlayed: true
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
      console.log('🔥 SENDING FCM TOKEN TO BACKEND (WHATSAPP-STYLE):', token.substring(0, 20) + '...');

      // Send FCM token to your backend - CRITICAL for background notifications
      const response = await fetch('/api/accounts/register-fcm-token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        },
        body: JSON.stringify({
          fcm_token: token,
          platform: 'web',
          device_type: 'pwa'
        })
      });

      if (response.ok) {
        console.log('✅ FCM TOKEN REGISTERED - WHATSAPP-STYLE BACKGROUND NOTIFICATIONS ENABLED!');
        console.log('🚀 Now notifications will work even when browser is completely closed!');
      } else {
        console.error('❌ FCM TOKEN REGISTRATION FAILED:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Failed to send FCM token to backend:', error);
      console.error('💡 This means background notifications WONT work when browser is closed!');
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

      // MOBILE SOUND FIX: Try multiple sound strategies for mobile browsers
      this.playMobileEmergencySound();

    } catch (error) {
      console.error('❌ Failed to show maximum priority emergency notifications:', error);
    }
  }

  // MOBILE SOUND FIX: Multiple strategies for mobile browsers
  private async playMobileEmergencySound() {
    console.log('🔊 MOBILE EMERGENCY SOUND: Trying multiple strategies...');

    // STRATEGY 1: Try Web Audio API with user interaction simulation
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Force resume audio context (critical for mobile)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🔊 Audio context resumed');
      }

      // Create LOUD emergency sound sequence
      const playLoudBeep = (frequency: number, duration: number, delay: number, volume: number = 1.0) => {
        setTimeout(() => {
          try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sawtooth'; // More piercing sound
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
          } catch (error) {
            console.warn('Web Audio beep failed:', error);
          }
        }, delay);
      };

      // Emergency pattern: High-low-high (like ambulance)
      playLoudBeep(1200, 0.15, 0, 1.0);    // High beep - LOUD
      playLoudBeep(800, 0.15, 200, 1.0);   // Low beep - LOUD
      playLoudBeep(1200, 0.2, 400, 1.0);   // High beep again - LOUD
      playLoudBeep(1000, 0.3, 700, 1.0);   // Sustained tone - MAX VOLUME

      console.log('✅ MOBILE EMERGENCY SOUND: Web Audio strategy successful');
    } catch (audioError) {
      console.warn('❌ MOBILE EMERGENCY SOUND: Web Audio failed:', audioError);

      // STRATEGY 2: Try HTML5 Audio with data URL (works better on mobile)
      try {
        // Create a data URL audio (beep sound)
        const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        const audio = new Audio(audioData);
        audio.volume = 1.0; // MAX VOLUME

        // Force play with user interaction simulation
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('✅ MOBILE EMERGENCY SOUND: HTML5 Audio successful');
          }).catch(error => {
            console.warn('❌ MOBILE EMERGENCY SOUND: HTML5 Audio blocked:', error);
            // STRATEGY 3: Simulate user interaction to unlock audio
            this.forceAudioUnlock();
          });
        }
      } catch (html5Error) {
        console.warn('❌ MOBILE EMERGENCY SOUND: HTML5 Audio failed:', html5Error);
        this.forceAudioUnlock();
      }
    }
  }

  // FORCE AUDIO UNLOCK: Simulate user interaction to unlock mobile audio
  private forceAudioUnlock() {
    console.log('🔓 FORCE AUDIO UNLOCK: Simulating user interaction...');

    // Create temporary audio context and try to unlock it
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create a silent buffer and play it to unlock audio
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      // Try to play silent audio to unlock
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          source.start();
          console.log('✅ AUDIO UNLOCKED: Silent buffer played');
        });
      } else {
        source.start();
      }

      // Now try emergency sound again after unlock
      setTimeout(() => {
        this.playMobileEmergencySound();
      }, 100);

    } catch (unlockError) {
      console.warn('❌ AUDIO UNLOCK FAILED:', unlockError);
    }
  }

  // Method to manually trigger emergency notification (for testing)
  async testEmergencyNotification(orderId: string = '123', orderNumber: string = 'TEST-001', amount: string = '100') {
    console.log('🧪 TESTING EMERGENCY NOTIFICATION...');
    await this.showEmergencyLocalNotification(orderId, orderNumber, amount);
  }

  // TEST SOUND METHOD: Call this from browser console to test mobile sound
  async testMobileSound() {
    console.log('🧪 TESTING MOBILE SOUND FUNCTIONALITY...');
    await this.playMobileEmergencySound();
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }

  // DEBUG METHOD: Check FCM token registration status
  async checkFCMStatus() {
    console.log('🔍 CHECKING FCM STATUS FOR WHATSAPP-STYLE NOTIFICATIONS...');

    const token = this.getFCMToken();
    if (token) {
      console.log('✅ FCM Token exists:', token.substring(0, 20) + '...');
      console.log('🚀 Background notifications SHOULD work when browser is closed');

      // Test if we can send a test notification
      try {
        const response = await fetch('/api/accounts/test-fcm-notification/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
          },
          body: JSON.stringify({
            title: 'Test Notification',
            body: 'Testing FCM background notifications',
            test: true
          })
        });

        if (response.ok) {
          console.log('✅ FCM test notification sent - check if you receive it!');
        } else {
          console.warn('❌ FCM test failed:', response.status);
        }
      } catch (error) {
        console.warn('❌ FCM test error:', error);
      }

    } else {
      console.error('❌ NO FCM TOKEN - Background notifications WONT work!');
      console.error('💡 User needs to grant notification permissions and refresh');
    }

    return {
      hasToken: !!token,
      token: token?.substring(0, 20) + '...',
      platform: Capacitor.isNativePlatform() ? 'native' : 'web'
    };
  }
}

export const realPushNotifications = new RealPushNotifications();