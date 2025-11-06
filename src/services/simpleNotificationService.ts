import { Capacitor } from '@capacitor/core';
import { realPushNotifications } from './realPushNotifications';

class SimpleNotificationService {
  private persistentIntervals: Map<number, NodeJS.Timeout> = new Map();
  
  constructor() {
    this.setupNotificationHandlers();
    this.initializePushNotifications();
    this.initializeBrowserNotifications();
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
              
              // Navigate to vendor orders immediately
              window.location.href = '/vendor/orders';
              
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
            window.location.href = '/vendor/orders';
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
    console.log('🚨🚨🚨 ULTIMATE ORDER ALERT! ACTIVATING ALL NOTIFICATION SYSTEMS:', orderNumber, 'Amount:', amount, 'OrderID:', orderId);

    // Check notification permissions first
    const hasPermission = await this.checkAndRequestPermissions();
    console.log('🔔 Notification permission status:', hasPermission);

    if (!hasPermission) {
      console.warn('❌ Notification permission denied');
      return;
    }

    // 🔥 PRIORITY 1: FCM PUSH NOTIFICATIONS (WORKS WHEN BROWSER CLOSED!)
    try {
      console.log('📡 Sending FCM push notification to backend...');
      const { pushNotificationService } = await import('./pushNotificationService');
      await pushNotificationService.showOrderNotification(orderNumber, amount, orderId);
      console.log('✅ FCM push notification sent - will work even when browser closed!');
    } catch (error) {
      console.warn('❌ FCM push notification failed:', error);
    }

    // 🔥 PRIORITY 2: SERVICE WORKER BACKGROUND NOTIFICATIONS
    try {
      console.log('⚙️ Triggering Service Worker background notification...');
      this.sendToServiceWorker('ORDER_ALERT', {
        orderNumber,
        amount,
        orderId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('❌ Service Worker notification failed:', error);
    }

    // 🚨 ULTIMATE NOTIFICATION SEQUENCE - MULTIPLE LAYERS
    await this.activateUltimateOrderAlert(orderNumber, amount, orderId);

    // Show in-app modal (only if app is active)
    window.dispatchEvent(new CustomEvent('showOrderModal', {
      detail: { orderId, orderNumber, amount }
    }));

    console.log('🎯 Order notification sequence completed');
  }


  // Check and request permissions with detailed feedback
  async checkAndRequestPermissions(): Promise<boolean> {
    console.log('🔍 Checking notification permissions...');

    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permission = await LocalNotifications.checkPermissions();
        console.log('📱 Mobile notification permission:', permission);

        if (permission.display !== 'granted') {
          const requestResult = await LocalNotifications.requestPermissions();
          console.log('📱 Mobile permission request result:', requestResult);
          return requestResult.display === 'granted';
        }
        return true;
      } catch (error) {
        console.warn('📱 Mobile notifications not available:', error);
        return false;
      }
    }

    // Web browser notifications
    if ('Notification' in window) {
      console.log('🌐 Current notification permission:', Notification.permission);

      if (Notification.permission === 'granted') {
        console.log('✅ Browser notifications already granted');
        return true;
      }

      if (Notification.permission === 'denied') {
        console.warn('❌ Browser notifications denied by user');
        alert('❌ Notifications blocked! Please enable notifications in browser settings:\n\n1. Click lock icon in address bar\n2. Allow notifications\n3. Refresh page');
        return false;
      }

      // Request permission
      console.log('🔐 Requesting browser notification permission...');
      try {
        const permission = await Notification.requestPermission();
        console.log('🔔 Permission request result:', permission);

        if (permission === 'granted') {
          console.log('✅ Browser notifications granted!');
          alert('✅ Notifications enabled! You will now receive order alerts.');
          return true;
        } else {
          console.warn('❌ Browser notifications denied');
          alert('❌ Notifications denied. You won\'t receive order alerts.');
          return false;
        }
      } catch (error) {
        console.warn('❌ Error requesting permissions:', error);
        return false;
      }
    }

    console.warn('❌ Notifications not supported in this browser');
    return false;
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

    // For web browsers - FORCE permission request
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        console.log('🔐 REQUESTING BROWSER NOTIFICATION PERMISSION...');
        const permission = await Notification.requestPermission();
        console.log('🔔 Browser notification permission result:', permission);

        if (permission === 'granted') {
          console.log('✅ Browser notifications enabled! You will now get instant notifications even when the tab is not active.');
          // Show a test notification to confirm it works
          setTimeout(() => {
            const testNotification = new Notification('🔔 Notifications Enabled!', {
              body: 'You will now receive instant order alerts even when this tab is not active.\n\nTest notification - you can dismiss this.',
              icon: '/favicon.ico',
              tag: 'permission-test',
              requireInteraction: false
            });
            setTimeout(() => testNotification.close(), 5000);
          }, 1000);

          // Show settings instructions for floating notifications
          setTimeout(() => {
            this.showNotificationSettingsInstructions();
          }, 3000);
        } else {
          console.warn('❌ Browser notifications denied. You may not receive notifications when the tab is not active.');
        }

        return permission === 'granted';
      }

      return Notification.permission === 'granted';
    }

    return false;
  }

  // Force permission request on service initialization
  async initializeBrowserNotifications() {
    if (!Capacitor.isNativePlatform() && 'Notification' in window) {
      // Wait a bit for page to load, then request permissions
      setTimeout(async () => {
        if (Notification.permission === 'default') {
          console.log('🚀 Auto-requesting notification permissions for instant alerts...');
          await this.requestPermissions();
        }
      }, 3000); // 3 seconds after page load
    }
  }

  // Helper method to show Windows notification settings instructions
  showNotificationSettingsInstructions() {
    const instructions = `
🔔 To Enable Floating Notifications on Windows:

1. Click the notification bell icon in taskbar
2. Click "Manage notifications"
3. Find your browser (Chrome/Firefox/Edge)
4. Make sure notifications are ON
5. Set to "Show notification banners"
6. Enable "Play a sound when a notification arrives"
7. Enable "Show notifications on lock screen" (optional)

This will make notifications appear as floating popups over any screen!
    `;

    console.log(instructions);

    // Show as a browser notification if possible
    if ('Notification' in window && Notification.permission === 'granted') {
      const settingsNotification = new Notification('🔔 How to Enable Floating Notifications', {
        body: 'Click here for instructions on enabling floating popup notifications on Windows',
        icon: '/favicon.ico',
        tag: 'settings-instructions',
        requireInteraction: true
      });

      settingsNotification.onclick = () => {
        alert(instructions);
        settingsNotification.close();
      };

      setTimeout(() => settingsNotification.close(), 30000);
    }
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

  private playOrderAlertSound() {
    try {
      console.log('🔊 🎯 ORDER ALERT! Playing LOUD notification sequence');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create a LOUD, ATTENTION-GRABBING sequence for orders
      const playTone = (frequency: number, duration: number, delay: number, volume: number = 0.8) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = 'square'; // More piercing sound

          gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };

      // ORDER ALERT SEQUENCE: High-low-high pattern (like emergency vehicles)
      playTone(1200, 0.15, 0, 0.9);    // High beep
      playTone(800, 0.15, 200, 0.9);   // Low beep
      playTone(1200, 0.15, 400, 0.9);  // High beep again
      playTone(1000, 0.3, 700, 1.0);   // Sustained middle tone - LOUD!

      // Repeat the pattern for extra attention
      playTone(1200, 0.15, 1200, 0.8);
      playTone(800, 0.15, 1400, 0.8);
      playTone(1200, 0.2, 1600, 0.8);

      console.log('🚨 ORDER ALERT SOUND SEQUENCE PLAYED - VENDOR SHOULD NOTICE!');
    } catch (error) {
      console.warn('Order alert sound not available:', error);
      // Fallback to regular beep
      this.playBeepSound();
    }
  }

  private async activateUltimateOrderAlert(orderNumber: string, amount: string, orderId: number) {
    console.log('🚨 ACTIVATING ULTIMATE ORDER ALERT SYSTEM - IMPOSSIBLE TO MISS!');

    // 🚨 LAYER 0: EMERGENCY WAKE-UP - Try to wake device/screen
    this.emergencyWakeUp();

    // 🎯 LAYER 1: VISUAL ALERTS - Multiple simultaneous visual notifications
    this.showUltimateVisualAlerts(orderNumber, amount, orderId);

    // 🔊 LAYER 2: AUDIO ALERTS - Multiple sound systems
    this.playUltimateSoundAlerts(orderId);

    // 📳 LAYER 3: HAPTIC/VIBRATION ALERTS - For mobile devices
    this.triggerUltimateHapticAlerts();

    // 🔔 LAYER 4: BROWSER NOTIFICATIONS - Even when tab is not active
    this.showBrowserNotifications(orderNumber, amount, orderId);

    // 📱 LAYER 5: PERSISTENT ALERTS - Keep alerting until acknowledged
    this.startPersistentOrderAlerts(orderNumber, amount, orderId);

    // 🖥️ LAYER 6: DESKTOP SYSTEM NOTIFICATIONS - Windows/iOS system tray
    this.showDesktopSystemNotifications(orderNumber, amount, orderId);

    // 🔄 LAYER 7: CROSS-TAB ALERTS - Alert all browser tabs
    this.broadcastToAllTabs(orderNumber, amount, orderId);

    // 📢 LAYER 8: EMERGENCY BROADCAST - Send to all possible channels
    this.emergencyBroadcast(orderNumber, amount, orderId);

    console.log('🚨 ULTIMATE ALERT SYSTEM ACTIVATED - VENDOR WILL DEFINITELY NOTICE!');
  }

  private showUltimateVisualAlerts(orderNumber: string, amount: string, orderId: number) {
    console.log('👁️ ACTIVATING VISUAL ALERTS');

    // Flash the document title
    this.flashDocumentTitle(`🚨 NEW ORDER ${orderNumber}!`, 10);

    // Flash the favicon
    this.flashFavicon();

    // Highlight the page background (subtle)
    this.highlightPageBackground();
  }

  private playUltimateSoundAlerts(orderId: number) {
    console.log('🔊 ACTIVATING ULTIMATE SOUND SYSTEM');

    // Play the order alert sound
    this.playOrderAlertSound();

    // Also play mobile sound if available
    this.playMobileSound();

    // Try to play system sound
    this.playSystemSound();

    // Continuous sound loop for 30 seconds
    let soundCount = 0;
    const soundInterval = setInterval(() => {
      if (soundCount < 10) { // 10 times over 30 seconds
        this.playOrderAlertSound();
        soundCount++;
      } else {
        clearInterval(soundInterval);
      }
    }, 3000);
  }

  private triggerUltimateHapticAlerts() {
    console.log('📳 ACTIVATING HAPTIC ALERTS');

    if ('vibrate' in navigator) {
      // Emergency vehicle pattern: long-short-long
      navigator.vibrate([1000, 200, 1000, 200, 1000]);

      // Repeat vibration pattern
      setTimeout(() => navigator.vibrate([800, 200, 800, 200, 800]), 2000);
      setTimeout(() => navigator.vibrate([600, 200, 600, 200, 600]), 4000);
    }
  }

  private showBrowserNotifications(orderNumber: string, amount: string, orderId: number) {
    console.log('🔔 ACTIVATING BROWSER NOTIFICATIONS - ALARM-STYLE FORCING');

    // Request permission if needed - FORCE REQUEST
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('🔐 Requesting notification permission...');
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission result:', permission);
        if (permission === 'granted') {
          this.showBrowserNotifications(orderNumber, amount, orderId);
        }
      });
      return; // Exit and wait for permission
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      // Get site/app identifier
      const siteName = document.title.split(' - ')[0] || 'EzyWay Vendor';
      const currentUrl = window.location.hostname;

      // FORCE WAKE LOCK - Like alarm apps
      this.requestWakeLock();

      // FORCE ALARM-STYLE VIBRATION - Like mobile alarms
      this.forceAlarmVibration();

      // STRATEGY 1: ALARM-STYLE RAPID NOTIFICATIONS (Like phone alarms)
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const notification = new Notification(`🚨🚨 ${siteName}: ORDER ALERT! 🚨🚨`, {
            body: `ORDER #${orderNumber} - ₹${amount}\n📍 ${currentUrl}\n⚡ TAP NOW - DON'T MISS!`,
            icon: '/alert-icon.svg',
            badge: '/alert-icon.svg',
            tag: `alarm-order-${orderId}-${i}`,
            requireInteraction: true,
            silent: false,
            data: { orderId, orderNumber, amount, site: siteName, url: currentUrl, alarm: true }
          });

          notification.onclick = () => {
            this.releaseWakeLock();
            window.focus();
            document.body.click();
            document.body.focus();

            if (window.location.pathname !== '/vendor/orders') {
              window.location.href = '/vendor/orders';
            }

            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: { orderId, orderNumber, amount, fromAlarmNotification: true }
            }));
            notification.close();
          };

          // Keep notification for 10 minutes (like important alarms)
          setTimeout(() => notification.close(), 600000);
        }, i * 150); // Rapid fire every 150ms for alarm effect
      }

      // STRATEGY 2: LOCK SCREEN COMPATIBLE NOTIFICATION
      setTimeout(() => {
        const lockScreenNotification = new Notification(`🔥 ${siteName} - URGENT ORDER!`, {
          body: `Order #${orderNumber} - ₹${amount}\n🌐 ${currentUrl}\n📱 Works on lock screen too!`,
          icon: '/alert-icon.svg',
          tag: `lockscreen-order-${orderId}`,
          requireInteraction: true,
          silent: false,
          data: { orderId, orderNumber, amount, site: siteName, url: currentUrl, lockScreen: true }
        });

        lockScreenNotification.onclick = () => {
          this.releaseWakeLock();
          window.focus();
          document.body.click();

          if (window.location.pathname !== '/vendor/orders') {
            window.location.href = '/vendor/orders';
          }

          window.dispatchEvent(new CustomEvent('showOrderModal', {
            detail: { orderId, orderNumber, amount, fromLockScreenNotification: true }
          }));
          lockScreenNotification.close();
        };

        setTimeout(() => lockScreenNotification.close(), 900000); // 15 minutes
      }, 2000);

      // STRATEGY 3: DESKTOP ALARM-STYLE FOLLOW-UP (Every 30 seconds)
      let alarmCount = 0;
      const alarmInterval = setInterval(() => {
        if (alarmCount < 10) { // 10 follow-ups over 5 minutes
          const followUpNotification = new Notification(`⏰ ${siteName}: ORDER WAITING!`, {
            body: `Order #${orderNumber} (₹${amount}) still pending!\n📍 ${currentUrl}\n⏰ ${alarmCount + 1}/10 reminders`,
            icon: '/alert-icon.svg',
            tag: `followup-alarm-${orderId}-${alarmCount}`,
            requireInteraction: true,
            silent: false,
            data: { orderId, orderNumber, amount, site: siteName, url: currentUrl, followup: alarmCount + 1 }
          });

          followUpNotification.onclick = () => {
            clearInterval(alarmInterval);
            this.releaseWakeLock();
            window.focus();
            document.body.click();

            if (window.location.pathname !== '/vendor/orders') {
              window.location.href = '/vendor/orders';
            }

            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: { orderId, orderNumber, amount, fromFollowUpAlarm: true }
            }));
            followUpNotification.close();
          };

          setTimeout(() => followUpNotification.close(), 30000); // Each lasts 30 seconds
          alarmCount++;
        } else {
          clearInterval(alarmInterval);
          this.releaseWakeLock();
        }
      }, 30000); // Every 30 seconds like alarm reminders

    } else {
      console.warn('🔔 Browser notifications not available or permission denied');
    }
  }

  // FORCE WAKE LOCK - Like alarm apps
  private async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('🔋 Wake lock acquired - screen will stay awake like alarms');
        (window as any).currentWakeLock = wakeLock;

        wakeLock.addEventListener('release', () => {
          console.log('🔋 Wake lock released');
        });
      }
    } catch (error) {
      console.warn('🔋 Wake lock not available:', error);
    }
  }

  private releaseWakeLock() {
    try {
      if ((window as any).currentWakeLock) {
        (window as any).currentWakeLock.release();
        (window as any).currentWakeLock = null;
      }
    } catch (error) {
      console.warn('Error releasing wake lock:', error);
    }
  }

  // FORCE ALARM-STYLE VIBRATION - Like mobile alarms
  private forceAlarmVibration() {
    if ('vibrate' in navigator) {
      // Alarm vibration pattern: Long buzzes with pauses
      const alarmPattern = [1000, 500, 1000, 500, 1000, 2000, 500, 500, 500, 500, 500];

      // Repeat the pattern 5 times over 30 seconds
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          navigator.vibrate(alarmPattern);
          console.log('📳 Alarm vibration pattern triggered');
        }, i * 6000); // Every 6 seconds
      }
    }
  }

  private startPersistentOrderAlerts(orderNumber: string, amount: string, orderId: number) {
    console.log('🔄 STARTING PERSISTENT ALERTS');

    // Clear any existing alerts for this order
    this.stopPersistentAlert(orderId);

    // Start aggressive persistent alerts
    const interval = setInterval(() => {
      console.log('🚨 PERSISTENT ORDER ALERT:', orderNumber);

      // Visual flash
      this.flashDocumentTitle(`🚨 ORDER ${orderNumber}!`, 2);

      // Sound alert
      this.playBeepSound();

      // Haptic if available
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }

    }, 5000); // Every 5 seconds

    this.persistentIntervals.set(orderId, interval);

    // Auto-stop after 5 minutes
    setTimeout(() => {
      this.stopPersistentAlert(orderId);
    }, 300000);
  }

  private showDesktopSystemNotifications(orderNumber: string, amount: string, orderId: number) {
    console.log('🖥️ ACTIVATING DESKTOP SYSTEM NOTIFICATIONS - FORCE FLOATING');

    // Try to show system notification
    if ('Notification' in window) {
      try {
        // Get site identification
        const siteName = document.title.split(' - ')[0] || 'EzyWay Vendor';
        const currentUrl = window.location.hostname;
        const browserInfo = this.getBrowserInfo();

        // STRATEGY: Multiple high-priority notifications to force floating popup
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const notification = new Notification(`🚨🚨 ${siteName}: ORDER #${orderNumber} 🚨🚨`, {
              body: `₹${amount} - CRITICAL!\n🌐 ${currentUrl} (${browserInfo})\n⚠️ REQUIRES IMMEDIATE ATTENTION\n🖱️ Click to open NOW!`,
              icon: '/alert-icon.svg',
              tag: `desktop-critical-${orderId}-${i}`,
              requireInteraction: true,
              silent: false,
              data: { orderId, orderNumber, amount, system: true, site: siteName, url: currentUrl, browser: browserInfo }
            });

            notification.onclick = () => {
              // Force window to foreground with multiple methods
              window.focus();
              document.body.click(); // Simulate user interaction

              if (window.location.pathname !== '/vendor/orders') {
                window.location.href = '/vendor/orders';
              }

              window.dispatchEvent(new CustomEvent('showOrderModal', {
                detail: { orderId, orderNumber, amount, fromDesktopNotification: true }
              }));
              notification.close();
            };

            // Keep each notification for 3 minutes
            setTimeout(() => notification.close(), 180000);
          }, i * 500); // Stagger by 500ms
        }

        // Emergency follow-up after 45 seconds
        setTimeout(() => {
          const followUpNotification = new Notification(`🚨 ${siteName}: ORDER STILL PENDING!`, {
            body: `Order #${orderNumber} (₹${amount}) waiting!\n📍 ${currentUrl}\n⏰ Respond immediately!`,
            icon: '/alert-icon.svg',
            tag: `desktop-followup-${orderId}`,
            requireInteraction: true,
            silent: false,
            data: { orderId, orderNumber, amount, followup: true, site: siteName, url: currentUrl }
          });

          followUpNotification.onclick = () => {
            window.focus();
            document.body.click();

            if (window.location.pathname !== '/vendor/orders') {
              window.location.href = '/vendor/orders';
            }

            window.dispatchEvent(new CustomEvent('showOrderModal', {
              detail: { orderId, orderNumber, amount, fromFollowUpNotification: true }
            }));
            followUpNotification.close();
          };

          setTimeout(() => followUpNotification.close(), 120000);
        }, 45000);

      } catch (error) {
        console.warn('Desktop notification failed:', error);
      }
    }
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Browser';
  }

  private broadcastToAllTabs(orderNumber: string, amount: string, orderId: number) {
    console.log('🔄 BROADCASTING TO ALL BROWSER TABS');

    // Use localStorage to communicate between tabs
    const alertData = {
      type: 'ultimate_order_alert',
      orderId,
      orderNumber,
      amount,
      timestamp: Date.now()
    };

    localStorage.setItem('ultimate_order_alert', JSON.stringify(alertData));

    // Also send to service worker for background notifications
    this.sendToServiceWorker('ORDER_ALERT', {
      orderNumber,
      amount,
      orderId
    });

    // Listen for storage events (other tabs will receive this)
    window.addEventListener('storage', (event) => {
      if (event.key === 'ultimate_order_alert' && event.newValue) {
        const data = JSON.parse(event.newValue);
        if (data.type === 'ultimate_order_alert' && data.orderId === orderId) {
          // Other tab received the alert - show notification there too
          this.showBrowserNotifications(data.orderNumber, data.amount, data.orderId);
          this.playOrderAlertSound();
        }
      }
    });
  }

  private async sendToServiceWorker(messageType: string, data: any) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: messageType,
        ...data
      });
    }
  }

  private flashDocumentTitle(newTitle: string, times: number) {
    const originalTitle = document.title;
    let count = 0;

    const flash = () => {
      document.title = (count % 2 === 0) ? newTitle : originalTitle;
      count++;

      if (count < times * 2) {
        setTimeout(flash, 500);
      } else {
        document.title = originalTitle;
      }
    };

    flash();
  }

  private showScreenOverlayAlert(orderNumber: string, amount: string) {
    // Create a full-screen overlay alert
    const overlay = document.createElement('div');
    overlay.id = 'ultimate-order-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 0, 0, 0.9);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      font-size: 2rem;
      font-weight: bold;
      text-align: center;
      animation: pulse 0.5s infinite alternate;
    `;

    overlay.innerHTML = `
      <div>🚨 URGENT ORDER ALERT! 🚨</div>
      <div style="font-size: 1.5rem; margin: 20px 0;">Order #${orderNumber}</div>
      <div style="font-size: 1.2rem;">₹${amount}</div>
      <div style="font-size: 1rem; margin-top: 20px;">TAP ANYWHERE TO DISMISS</div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { background: rgba(255, 0, 0, 0.9); }
        100% { background: rgba(255, 0, 0, 1); }
      }
    `;
    document.head.appendChild(style);

    overlay.onclick = () => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    };

    document.body.appendChild(overlay);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
        document.head.removeChild(style);
      }
    }, 10000);
  }

  private flashFavicon() {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      const originalHref = link.href;
      link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="30">!</text></svg>';

      setTimeout(() => {
        link.href = originalHref;
      }, 2000);
    }
  }

  private highlightPageBackground() {
    const originalBackground = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#ffcccc';

    // Flash effect
    let flashCount = 0;
    const flash = () => {
      document.body.style.backgroundColor = (flashCount % 2 === 0) ? '#ff6666' : '#ffcccc';
      flashCount++;

      if (flashCount < 6) {
        setTimeout(flash, 300);
      } else {
        document.body.style.backgroundColor = originalBackground;
      }
    };

    flash();
  }

  private playSystemSound() {
    // Try to play system beep sound
    try {
      // Create audio context and play a system-like sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440; // A4 note
      oscillator.type = 'sawtooth';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);

    } catch (error) {
      console.warn('System sound not available');
    }
  }

  private emergencyWakeUp() {
    console.log('🚨 EMERGENCY WAKE-UP ACTIVATED');

    // Try to wake up the device/screen
    try {
      // Force page focus
      window.focus();

      // Simulate user interaction to wake screen
      const wakeEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      document.body.dispatchEvent(wakeEvent);

      // Try to play silent audio to wake audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Force visibility change to trigger wake-up
      Object.defineProperty(document, 'hidden', { value: false, writable: false });
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
      window.dispatchEvent(new Event('visibilitychange'));

    } catch (error) {
      console.warn('Emergency wake-up failed:', error);
    }
  }

  private emergencyBroadcast(orderNumber: string, amount: string, orderId: number) {
    console.log('📢 EMERGENCY BROADCAST - MAXIMUM ALERT LEVEL');

    // Send alert to all possible channels simultaneously
    const alertData = {
      type: 'EMERGENCY_ORDER_ALERT',
      orderId,
      orderNumber,
      amount,
      timestamp: Date.now(),
      priority: 'MAXIMUM'
    };

    // Broadcast via multiple methods
    try {
      // 1. localStorage for cross-tab
      localStorage.setItem('emergency_order_alert', JSON.stringify(alertData));

      // 2. Send to service worker
      this.sendToServiceWorker('EMERGENCY_ALERT', alertData);

      // 3. Custom events
      window.dispatchEvent(new CustomEvent('emergencyOrderAlert', {
        detail: alertData
      }));

      // 4. Try to send to parent window (if in iframe)
      if (window.parent !== window) {
        window.parent.postMessage(alertData, '*');
      }

      // 5. BroadcastChannel API (if available)
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('order-alerts');
        channel.postMessage(alertData);
        channel.close();
      }

    } catch (error) {
      console.warn('Emergency broadcast failed:', error);
    }

    // Final fallback - just dispatch event without annoying alert
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('showOrderModal', {
        detail: { orderId, orderNumber, amount, emergency: true }
      }));
    }, 1000);
  }
}

export const simpleNotificationService = new SimpleNotificationService();