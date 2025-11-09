import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface OrderNotificationData {
  orderId: number;
  orderNumber: string;
  amount: string;
  customerName: string;
  deliveryAddress: string;
  deliveryPhone: string;
  items: any[];
  timestamp: number;
}

class MobileAlarmNotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;
  private activeAlarms = new Map<number, AlarmState>();
  private isAlarmActive = false;
  private notificationSoundInterval: NodeJS.Timeout | null = null;
  private vibrationInterval: NodeJS.Timeout | null = null;
  private alarmWakeLock: any = null;
  private audioContext: AudioContext | null = null;
  private currentOrderId: number | null = null;

  // Alarm-like settings - AGGRESSIVE
  private readonly ALARM_SETTINGS = {
    soundInterval: 2000, // Every 2 seconds like alarm apps
    vibrationInterval: 3000, // Every 3 seconds
    maxVibrationPattern: [2000, 500, 2000, 500, 2000, 1000, 500, 500, 500], // Emergency pattern
    soundFrequency: 1000, // Loud, piercing frequency
    soundVolume: 1.0, // Maximum volume
    notificationImportance: 5, // Highest priority
    vibrationEnabled: true,
    soundEnabled: true,
    persistentMode: true
  };

  async initialize() {
    if (this.isInitialized) return;

    console.log('🚨 Initializing Mobile Alarm Notification Service...');
    console.log('🎯 This will behave exactly like an alarm app!');

    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Alarm Notification Service only works on native mobile platforms');
      }

      await this.requestAllPermissions();
      await this.setupAlarmChannels();
      await this.registerFCMToken();
      this.setupAlarmHandlers();
      this.setupAppStateHandlers();
      
      this.isInitialized = true;
      console.log('✅ Mobile Alarm Notification Service initialized - ALARM MODE ACTIVATED');
    } catch (error) {
      console.error('❌ Failed to initialize alarm service:', error);
      throw error;
    }
  }

  private async requestAllPermissions() {
    console.log('🔐 Requesting ALL permissions for alarm functionality...');

    // Push Notifications
    const pushPerm = await PushNotifications.requestPermissions();
    if (pushPerm.receive !== 'granted') {
      throw new Error('Push notification permission required for alarm functionality');
    }
    await PushNotifications.register();

    // Local Notifications
    const localPerm = await LocalNotifications.requestPermissions();
    if (localPerm.display !== 'granted') {
      throw new Error('Local notification permission required for alarm functionality');
    }

    // Haptics permission (for maximum vibration)
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }

    console.log('✅ All permissions granted - ALARM MODE READY');
  }

  private async setupAlarmChannels() {
    console.log('📢 Setting up ALARM-STYLE notification channels...');

    try {
      // URGENT ORDER ALERTS - HIGHEST PRIORITY
      await LocalNotifications.createChannel({
        id: 'urgent-order-alarm',
        name: '🚨 URGENT ORDER ALARMS',
        description: 'ALARM-STYLE notifications that cannot be ignored - like emergency alarms',
        importance: 5, // MAXIMUM importance
        visibility: 1, // Public - shows on lock screen
        sound: 'default',
        vibration: true,
        lights: true
      });

      // EMERGENCY ALERTS - FOR CRITICAL ORDERS
      await LocalNotifications.createChannel({
        id: 'emergency-order-alarm',
        name: '🚨 EMERGENCY ORDER ALARMS',
        description: 'CRITICAL emergency notifications - like fire alarms',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true
      });

      console.log('✅ ALARM channels created - notifications will be IMPOSSIBLE TO IGNORE');
    } catch (error) {
      console.warn('Failed to create alarm channels:', error);
      // Continue anyway - still better than regular notifications
    }
  }

  private async registerFCMToken() {
    try {
      const { getToken } = await import('firebase/messaging');
      const { messaging } = await import('./firebaseConfig');
      
      const token = await getToken(messaging, {
        vapidKey: 'BKxX8QhZvQK9qYjVh4wQX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8Q'
      });

      if (token) {
        this.fcmToken = token;
        await this.sendTokenToBackend(token, 'android');
        console.log('✅ Alarm FCM token registered - alarm notifications will work');
      }
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      // Don't throw - alarm service can still work with local notifications
    }
  }

  private async sendTokenToBackend(token: string, platform: string) {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      await apiRequest('/api/register-fcm-token/', {
        method: 'POST',
        body: JSON.stringify({
          fcm_token: token,
          platform: platform,
          browser: navigator.userAgent
        })
      });
    } catch (error) {
      console.warn('Failed to send FCM token to backend:', error);
    }
  }

  private setupAlarmHandlers() {
    // ALARM MODE: Push notification received - TRIGGER ALARM
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('🚨 ALARM TRIGGERED - PUSH NOTIFICATION RECEIVED:', notification);
      await this.handleAlarmTrigger(notification.data);
    });

    // ALARM MODE: Notification tapped - SNOOZE OR DISMISS
    PushNotifications.addListener('pushNotificationActionPerformed', async (notification) => {
      console.log('🔔 ALARM NOTIFICATION TAPPED - HANDLING ALARM ACTION:', notification);
      await this.handleAlarmAction(notification.notification.data);
    });

    // ALARM MODE: Local notification tap
    LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
      console.log('🔔 ALARM LOCAL NOTIFICATION TAPPED:', notification);
      await this.handleAlarmAction(notification.notification.extra);
    });

    console.log('🚨 ALARM handlers setup complete - ready to handle emergency notifications');
  }

  private setupAppStateHandlers() {
    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('📱 App became active - checking alarm status');
        this.checkAlarmStatus();
      } else {
        console.log('📱 App went to background - ALARM MODE CONTINUES');
        // Keep alarms running in background
      }
    });

    console.log('🚨 App state handlers setup - alarms persist in background');
  }

  private async handleAlarmTrigger(data: any) {
    console.log('🚨 HANDLING ALARM TRIGGER:', data);

    if (data?.action === 'order_notification' || data?.orderId) {
      const orderData: OrderNotificationData = {
        orderId: parseInt(data.orderId),
        orderNumber: data.orderNumber || 'Unknown',
        amount: data.amount || '0',
        customerName: data.customerName || 'Customer',
        deliveryAddress: data.deliveryAddress || 'Address not provided',
        deliveryPhone: data.deliveryPhone || 'Phone not provided',
        items: data.items || [],
        timestamp: Date.now()
      };

      // START ALARM MODE - AGGRESSIVE NOTIFICATION
      await this.startAlarmMode(orderData);
    }
  }

  private async handleAlarmAction(data: any) {
    console.log('🔔 HANDLING ALARM ACTION:', data);

    const orderId = parseInt(data.orderId);
    const action = data.action || 'view';

    if (action === 'accept') {
      await this.snoozeAlarm(orderId);
      // Auto-accept the order
      await this.acceptOrder(orderId);
    } else if (action === 'reject') {
      await this.snoozeAlarm(orderId);
      // Auto-reject the order
      await this.rejectOrder(orderId);
    } else {
      // Default: view order - open app and show modal
      await this.openAppToOrder(data);
    }
  }

  private async startAlarmMode(orderData: OrderNotificationData) {
    console.log('🚨🚨🚨 STARTING ALARM MODE - ORDER:', orderData.orderNumber);
    console.log('🔊 Sound will play every', this.ALARM_SETTINGS.soundInterval / 1000, 'seconds');
    console.log('📳 Vibration will repeat every', this.ALARM_SETTINGS.vibrationInterval / 1000, 'seconds');
    console.log('🔔 Notifications will be PERSISTENT and IMPOSSIBLE TO IGNORE');

    this.isAlarmActive = true;
    this.currentOrderId = orderData.orderId;

    // Store alarm state
    this.activeAlarms.set(orderData.orderId, {
      orderData,
      startTime: Date.now(),
      isActive: true,
      soundCount: 0,
      vibrationCount: 0
    });

    // 1. Show IMMEDIATE alarm notification
    await this.showAlarmNotification(orderData);

    // 2. Start AGGRESSIVE sound loop
    this.startAlarmSoundLoop(orderData.orderId);

    // 3. Start AGGRESSIVE vibration pattern
    this.startAlarmVibrationLoop();

    // 4. Try to wake lock screen to show notifications
    await this.requestWakeLock();

    // 5. Force app to foreground if possible
    await this.forceAlarmForeground();

    // 6. Dispatch to app for immediate modal
    this.dispatchAlarmToApp(orderData);
  }

  private async showAlarmNotification(orderData: OrderNotificationData) {
    console.log('🔔 Showing ALARM-STYLE notification:', orderData.orderNumber);

    try {
      const notifications = [{
        title: '🚨🚨 ALARM! NEW ORDER! 🚨🚨',
        body: `URGENT: Order #${orderData.orderNumber} - ₹${orderData.amount}\n` +
              `👤 ${orderData.customerName}\n` +
              `📞 ${orderData.deliveryPhone}\n` +
              `🔔 TAP TO ACCEPT/REJECT IMMEDIATELY`,
        id: orderData.orderId,
        schedule: { at: new Date(Date.now() + 100) },
        sound: 'default',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#FF0000',
        channelId: 'urgent-order-alarm',
        // Make it impossible to dismiss easily
        actions: [
          {
            id: 'accept',
            title: '✅ ACCEPT NOW',
            foreground: true
          },
          {
            id: 'reject', 
            title: '❌ REJECT',
            foreground: true
          }
        ],
        extra: {
          type: 'alarm_order',
          orderId: orderData.orderId.toString(),
          orderNumber: orderData.orderNumber,
          amount: orderData.amount,
          alarmMode: true,
          autoOpen: true
        }
      }];

      await LocalNotifications.schedule({ notifications });
      console.log('✅ ALARM notification scheduled - CANNOT BE DISMISSED EASILY');

      // Schedule repeated notifications to keep pressure
      this.scheduleRepeatedAlarms(orderData);

    } catch (error) {
      console.error('Failed to show alarm notification:', error);
    }
  }

  private scheduleRepeatedAlarms(orderData: OrderNotificationData) {
    // Schedule follow-up notifications every 30 seconds
    let repeatCount = 0;
    const maxRepeats = 10; // 5 minutes of repeated notifications

    const scheduleNext = () => {
      if (repeatCount < maxRepeats && this.isAlarmActive) {
        setTimeout(async () => {
          if (this.isAlarmActive) {
            console.log(`🔔 Alarm repeat #${repeatCount + 1} for order ${orderData.orderNumber}`);
            await LocalNotifications.schedule({
              notifications: [{
                title: `🚨 URGENT: Order #${orderData.orderNumber} STILL WAITING!`,
                body: `₹${orderData.amount} - ${orderData.customerName}\n` +
                      `⏰ ${repeatCount + 1}/10 reminders\n` +
                      `🔔 RESPOND IMMEDIATELY!`,
                id: orderData.orderId + 100000 + repeatCount,
                schedule: { at: new Date(Date.now() + 100) },
                sound: 'default',
                smallIcon: 'ic_stat_icon_config_sample',
                iconColor: '#FF0000',
                channelId: 'urgent-order-alarm',
                extra: {
                  type: 'alarm_order_repeat',
                  orderId: orderData.orderId.toString(),
                  repeatCount: repeatCount + 1
                }
              }]
            });
            repeatCount++;
            scheduleNext();
          }
        }, 30000); // Every 30 seconds
      }
    };

    scheduleNext();
  }

  private startAlarmSoundLoop(orderId: number) {
    console.log('🔊 Starting ALARM sound loop for order:', orderId);
    
    this.stopAlarmSoundLoop();

    this.notificationSoundInterval = setInterval(() => {
      if (this.isAlarmActive && this.currentOrderId === orderId) {
        this.playAlarmSound();
      }
    }, this.ALARM_SETTINGS.soundInterval);
  }

  private stopAlarmSoundLoop() {
    if (this.notificationSoundInterval) {
      clearInterval(this.notificationSoundInterval);
      this.notificationSoundInterval = null;
    }
  }

  private startAlarmVibrationLoop() {
    console.log('📳 Starting ALARM vibration loop');
    
    this.stopAlarmVibrationLoop();

    this.vibrationInterval = setInterval(() => {
      if (this.isAlarmActive) {
        this.playAlarmVibration();
      }
    }, this.ALARM_SETTINGS.vibrationInterval);
  }

  private stopAlarmVibrationLoop() {
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
  }

  private async playAlarmSound() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Create AGGRESSIVE alarm sound - like fire alarm
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Alarm frequency - loud and piercing
      oscillator.frequency.value = this.ALARM_SETTINGS.soundFrequency;
      oscillator.type = 'square'; // Square wave for harsh alarm sound

      // Maximum volume
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.ALARM_SETTINGS.soundVolume, this.audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.8);

      console.log('🔊 ALARM SOUND PLAYED - LOUD AND PIERCING');
    } catch (error) {
      console.warn('Failed to play alarm sound:', error);
    }
  }

  private async playAlarmVibration() {
    try {
      // Use Capacitor Haptics for stronger vibration
      await Haptics.impact({ style: ImpactStyle.Heavy });

      // Also use browser vibration for backup
      if ('vibrate' in navigator) {
        navigator.vibrate(this.ALARM_SETTINGS.maxVibrationPattern);
      }

      console.log('📳 ALARM VIBRATION TRIGGERED - EMERGENCY PATTERN');
    } catch (error) {
      console.warn('Failed to play alarm vibration:', error);
      
      // Fallback to basic vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([2000, 500, 2000, 500, 2000]);
      }
    }
  }

  private async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.alarmWakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('🔋 Wake lock acquired - screen will stay awake for alarm');
        
        this.alarmWakeLock.addEventListener('release', () => {
          console.log('🔋 Wake lock released');
        });
      }
    } catch (error) {
      console.warn('Failed to acquire wake lock:', error);
    }
  }

  private async forceAlarmForeground() {
    try {
      console.log('📱 FORCING APP TO FOREGROUND FOR ALARM');
      
      // Multiple methods to force foreground
      window.focus();
      document.body.click();
      document.body.dispatchEvent(new Event('click'));
      
      // Try to bring to front
      if (document.hasFocus()) {
        console.log('✅ App focused for alarm');
      }

    } catch (error) {
      console.warn('Failed to force foreground:', error);
    }
  }

  private dispatchAlarmToApp(orderData: OrderNotificationData) {
    console.log('📢 Dispatching alarm to app:', orderData.orderNumber);
    
    // Dispatch to show order modal
    window.dispatchEvent(new CustomEvent('showOrderModal', {
      detail: {
        ...orderData,
        alarmMode: true,
        urgent: true,
        fromAlarm: true
      }
    }));

    // Also store in localStorage for persistence
    localStorage.setItem('activeAlarmOrder', JSON.stringify({
      ...orderData,
      alarmStartTime: Date.now()
    }));
  }

  private async snoozeAlarm(orderId: number) {
    console.log('⏰ SNOOZING ALARM for order:', orderId);
    
    this.isAlarmActive = false;
    this.currentOrderId = null;
    
    this.stopAlarmSoundLoop();
    this.stopAlarmVibrationLoop();
    
    if (this.alarmWakeLock) {
      this.alarmWakeLock.release();
      this.alarmWakeLock = null;
    }

    console.log('🔕 Alarm snoozed - will stop for now');
  }

  private async stopAlarm(orderId: number) {
    console.log('🛑 STOPPING ALARM for order:', orderId);
    
    this.isAlarmActive = false;
    this.currentOrderId = null;
    
    this.stopAlarmSoundLoop();
    this.stopAlarmVibrationLoop();
    
    if (this.alarmWakeLock) {
      this.alarmWakeLock.release();
      this.alarmWakeLock = null;
    }

    this.activeAlarms.delete(orderId);
    
    console.log('🔕 Alarm stopped completely');
  }

  private async openAppToOrder(data: any) {
    console.log('📱 Opening app to order:', data.orderId);
    
    // Force app to foreground
    await this.forceAlarmForeground();
    
    // Navigate to orders page
    window.location.href = '/vendor/orders';
    
    // Show order modal after navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('showOrderModal', {
        detail: {
          orderId: parseInt(data.orderId),
          orderNumber: data.orderNumber,
          amount: data.amount,
          fromAlarm: true
        }
      }));
    }, 1000);
  }

  private async acceptOrder(orderId: number) {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response } = await apiRequest(`/orders/${orderId}/accept/`, {
        method: 'POST'
      });

      if (response.ok) {
        console.log('✅ Order accepted via alarm action');
        await this.stopAlarm(orderId);
        return true;
      }
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
    return false;
  }

  private async rejectOrder(orderId: number) {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response } = await apiRequest(`/orders/${orderId}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Rejected by vendor via alarm' })
      });

      if (response.ok) {
        console.log('❌ Order rejected via alarm action');
        await this.stopAlarm(orderId);
        return true;
      }
    } catch (error) {
      console.error('Failed to reject order:', error);
    }
    return false;
  }

  private checkAlarmStatus() {
    const activeAlarm = localStorage.getItem('activeAlarmOrder');
    if (activeAlarm) {
      try {
        const orderData = JSON.parse(activeAlarm);
        const alarmAge = Date.now() - orderData.alarmStartTime;
        
        if (alarmAge < 300000) { // 5 minutes
          console.log('🔄 Found active alarm, resuming alarm mode');
          this.startAlarmMode(orderData);
        } else {
          console.log('🕐 Alarm too old, clearing');
          localStorage.removeItem('activeAlarmOrder');
        }
      } catch (error) {
        console.warn('Failed to check alarm status:', error);
      }
    }
  }

  // Public API
  async triggerOrderAlarm(orderNumber: string, amount: string, orderId: number) {
    if (!this.isInitialized) {
      throw new Error('Alarm service not initialized');
    }

    const orderData: OrderNotificationData = {
      orderId,
      orderNumber,
      amount,
      customerName: 'Customer',
      deliveryAddress: 'Address not provided',
      deliveryPhone: 'Phone not provided',
      items: [],
      timestamp: Date.now()
    };

    await this.startAlarmMode(orderData);
    return orderData;
  }

  async stopAllAlarms() {
    console.log('🛑 STOPPING ALL ALARMS');
    
    this.isAlarmActive = false;
    this.currentOrderId = null;
    
    this.stopAlarmSoundLoop();
    this.stopAlarmVibrationLoop();
    
    if (this.alarmWakeLock) {
      this.alarmWakeLock.release();
      this.alarmWakeLock = null;
    }
    
    this.activeAlarms.clear();
    localStorage.removeItem('activeAlarmOrder');
    
    console.log('🔕 ALL ALARMS STOPPED');
  }

  getAlarmStatus() {
    return {
      isAlarmActive: this.isAlarmActive,
      currentOrderId: this.currentOrderId,
      activeAlarms: Array.from(this.activeAlarms.keys()),
      hasWakeLock: !!this.alarmWakeLock
    };
  }
}

interface AlarmState {
  orderData: OrderNotificationData;
  startTime: number;
  isActive: boolean;
  soundCount: number;
  vibrationCount: number;
}

export const mobileAlarmNotificationService = new MobileAlarmNotificationService();