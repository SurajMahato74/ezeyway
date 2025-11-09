import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { mobileAlarmNotificationService } from '@/services/mobileAlarmNotificationService';
import { authService } from '@/services/authService';
import { getApiUrl } from '@/config/api';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product_details?: {
    images?: { image_url: string }[];
  };
}

interface NewOrder {
  id: number;
  order_number: string;
  customer_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  total_amount: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  delivery_instructions?: string;
  delivery_fee?: string;
}

export function useMobileAlarmNotifications() {
  const [pendingOrders, setPendingOrders] = useState<NewOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlarmServiceReady, setIsAlarmServiceReady] = useState(false);
  const [alarmStatus, setAlarmStatus] = useState({
    isAlarmActive: false,
    currentOrderId: null as number | null,
    activeAlarms: [] as number[]
  });
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedOrdersRef = useRef<Set<number>>(new Set());
  const lastOrderCountRef = useRef<number>(0);

  // ALARM MODE: Only work on mobile platforms
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('🚨 Mobile Alarm Notifications only work on mobile platforms');
      return;
    }

    const initializeAlarmService = async () => {
      try {
        console.log('🚨 Initializing Mobile Alarm Notification Service...');
        await mobileAlarmNotificationService.initialize();
        setIsAlarmServiceReady(true);
        console.log('✅ Mobile Alarm Service initialized - ALARM MODE READY');
      } catch (error) {
        console.error('❌ Failed to initialize alarm service:', error);
      }
    };

    initializeAlarmService();
  }, []);

  // ALARM MODE: Handle login/logout for alarm service
  useEffect(() => {
    const handleAuthChange = async (event: CustomEvent) => {
      const { isAuthenticated, userType } = event.detail;
      
      if (isAuthenticated && userType === 'vendor' && isAlarmServiceReady) {
        console.log('🔑 Vendor logged in - ALARM MODE ACTIVE');
        // Alarm service is already initialized and ready
      } else {
        console.log('🔓 User logged out - STOPPING ALL ALARMS');
        if (isAlarmServiceReady) {
          await mobileAlarmNotificationService.stopAllAlarms();
        }
        setPendingOrders([]);
        setIsModalOpen(false);
        notifiedOrdersRef.current.clear();
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange as EventListener);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
  }, [isAlarmServiceReady]);

  // ALARM MODE: Monitor app state and alarm status
  useEffect(() => {
    if (!isAlarmServiceReady) return;

    const interval = setInterval(() => {
      const status = mobileAlarmNotificationService.getAlarmStatus();
      setAlarmStatus(status);
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isAlarmServiceReady]);

  // ALARM MODE: Fetch orders and trigger alarms
  const fetchPendingOrders = async () => {
    try {
      const token = await authService.getToken();
      
      if (!token) {
        console.log('No token found for pending orders');
        return;
      }

      console.log('🚨 ALARM MODE: Fetching pending orders...');
      
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response, data: orders } = await apiRequest('orders/vendor/pending/');

      if (response.ok && orders) {
        console.log(`🚨 ALARM MODE: Found ${orders.length} pending orders`);

        if (orders.length !== lastOrderCountRef.current) {
          console.log(`📊 Order count changed: ${lastOrderCountRef.current} → ${orders.length}`);
          setPendingOrders(orders);
          setIsModalOpen(orders.length > 0);
          lastOrderCountRef.current = orders.length;

          // ALARM MODE: Trigger alarm for new orders
          if (orders.length > 0) {
            for (const order of orders) {
              if (!notifiedOrdersRef.current.has(order.id)) {
                console.log('🚨 ALARM MODE: Processing NEW order with ALARM:', order.order_number, order.total_amount);
                notifiedOrdersRef.current.add(order.id);
                
                // TRIGGER ALARM - AGGRESSIVE NOTIFICATION
                if (isAlarmServiceReady) {
                  try {
                    await mobileAlarmNotificationService.triggerOrderAlarm(
                      order.order_number,
                      order.total_amount,
                      order.id
                    );
                    console.log('🚨🚨 ALARM TRIGGERED for order:', order.order_number);
                    console.log('🔊 Sound will play every 2 seconds');
                    console.log('📳 Vibration will repeat every 3 seconds');
                    console.log('🔔 Notification will be PERSISTENT and IMPOSSIBLE TO IGNORE');
                  } catch (error) {
                    console.error('❌ Failed to trigger alarm:', error);
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  // ALARM MODE: AGGRESSIVE polling for orders
  useEffect(() => {
    if (!isAlarmServiceReady) return;

    const checkTokenAndFetch = async () => {
      const token = await authService.getToken();
      if (!token) return;

      fetchPendingOrders();
    };

    checkTokenAndFetch();

    // ALARM MODE: Ultra-aggressive polling (orders are critical!)
    const refreshOrders = async () => {
      try {
        const token = await authService.getToken();
        if (!token) return;

        console.log('🚨 ALARM MODE: Auto-refreshing orders...');
        await fetchPendingOrders();
      } catch (error) {
        console.error('Failed to auto-refresh orders:', error);
      }
    };

    // ALARM POLLING: More aggressive than normal notifications
    let alarmPollingInterval: NodeJS.Timeout;
    let backgroundPollingInterval: NodeJS.Timeout;

    const startAlarmPolling = () => {
      if (alarmPollingInterval) clearInterval(alarmPollingInterval);
      if (backgroundPollingInterval) clearInterval(backgroundPollingInterval);

      // ALARM MODE: Every 2 seconds when app is active (very aggressive)
      alarmPollingInterval = setInterval(() => {
        if (!document.hidden) {
          console.log('🚨 ALARM MODE: Active polling for urgent orders');
          refreshOrders();
        }
      }, 2000); // Every 2 seconds when active!

      // ALARM MODE: Every 5 seconds when in background (still very aggressive)
      backgroundPollingInterval = setInterval(() => {
        if (document.hidden) {
          console.log('🚨 ALARM MODE: Background polling for orders');
          refreshOrders();
        }
      }, 5000); // Every 5 seconds when in background
    };

    startAlarmPolling();

    // ALARM MODE: IMMEDIATE refresh when app becomes active
    const handleVisibilityChange = () => {
      console.log(`📱 Visibility changed: ${document.hidden ? 'hidden' : 'visible'}`);
      if (!document.hidden) {
        console.log('📱 App became visible - ALARM MODE: IMMEDIATE refresh!');
        refreshOrders();
        startAlarmPolling();
      }
    };

    // ALARM MODE: Handle app state changes
    const handleAppStateChange = async (event: any) => {
      const isActive = event?.detail?.isActive ?? true;
      console.log(`📱 ALARM MODE App state changed: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);

      if (isActive) {
        console.log('📱 ALARM MODE: App ACTIVE - IMMEDIATE order refresh!');
        await refreshOrders();
        startAlarmPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('appStateChange', handleAppStateChange);
    document.addEventListener('resume', handleAppStateChange);

    return () => {
      if (alarmPollingInterval) clearInterval(alarmPollingInterval);
      if (backgroundPollingInterval) clearInterval(backgroundPollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('appStateChange', handleAppStateChange);
      document.removeEventListener('resume', handleAppStateChange);
    };
  }, [isAlarmServiceReady]);

  // ALARM MODE: Enhanced order acceptance
  const acceptOrder = async (orderId: number) => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response } = await apiRequest(`/orders/${orderId}/accept/`, {
        method: 'POST'
      });

      if (response.ok) {
        // ALARM MODE: Stop alarm immediately
        if (isAlarmServiceReady) {
          await mobileAlarmNotificationService.stopAllAlarms();
        }

        // Clear tracking
        notifiedOrdersRef.current.delete(orderId);

        setPendingOrders(prev => prev.filter(order => order.id !== orderId));
        if (pendingOrders.length <= 1) {
          setIsModalOpen(false);
        }

        // Dispatch event
        window.dispatchEvent(new CustomEvent('orderAccepted', { detail: { orderId } }));

        console.log('✅ Order accepted - ALARM STOPPED');
        return true;
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
    return false;
  };

  // ALARM MODE: Enhanced order rejection
  const rejectOrder = async (orderId: number) => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response } = await apiRequest(`/orders/${orderId}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ 
          reason: 'Rejected by vendor via ALARM MODE'
        })
      });

      if (response.ok) {
        // ALARM MODE: Stop alarm immediately
        if (isAlarmServiceReady) {
          await mobileAlarmNotificationService.stopAllAlarms();
        }
        
        // Clear tracking
        notifiedOrdersRef.current.delete(orderId);
        
        setPendingOrders(prev => prev.filter(order => order.id !== orderId));
        if (pendingOrders.length <= 1) {
          setIsModalOpen(false);
        }
        
        console.log('❌ Order rejected - ALARM STOPPED');
        return true;
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
    return false;
  };

  // ALARM MODE: Test alarm functionality
  const testAlarm = async (orderNumber: string = 'ALARM-TEST', amount: string = '999.00') => {
    if (!isAlarmServiceReady) {
      console.warn('🚨 Alarm service not ready for testing');
      return;
    }

    console.log('🧪 TESTING ALARM MODE...');
    console.log('🚨 This will trigger a loud, persistent alarm like a real emergency!');
    
    const orderId = Date.now(); // Use timestamp as test ID
    
    try {
      await mobileAlarmNotificationService.triggerOrderAlarm(
        orderNumber,
        amount,
        orderId
      );
      console.log('🧪 ALARM TEST TRIGGERED - Check your phone!');
    } catch (error) {
      console.error('❌ Alarm test failed:', error);
    }
  };

  return {
    pendingOrders,
    isModalOpen,
    isAlarmServiceReady,
    alarmStatus,
    acceptOrder,
    rejectOrder,
    testAlarm,
    stopAllAlarms: () => mobileAlarmNotificationService.stopAllAlarms(),
    getAlarmStatus: () => mobileAlarmNotificationService.getAlarmStatus()
  };
}