import { useState, useEffect, useRef } from 'react';
import { useNotificationWebSocket } from './useNotificationWebSocket';
import { getApiUrl } from '@/config/api';
import { Capacitor } from '@capacitor/core';
import { unifiedNotificationService } from '@/services/unifiedNotificationService';
import { authService } from '@/services/authService';

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

export function useEnhancedOrderNotifications() {
  const [pendingOrders, setPendingOrders] = useState<NewOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedOrdersRef = useRef<Set<number>>(new Set());
  const lastOrderCountRef = useRef<number>(0);
  const [isNotificationServiceReady, setIsNotificationServiceReady] = useState(false);
  
  // Use the comprehensive notification system
  const { notifications, unreadCount, isConnected } = useNotificationWebSocket();

  // Initialize notification service
  useEffect(() => {
    const initializeNotificationService = async () => {
      try {
        await unifiedNotificationService.initialize();
        setIsNotificationServiceReady(true);
        console.log('✅ Enhanced notification service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize notification service:', error);
      }
    };

    initializeNotificationService();
  }, []);

  // Handle login/logout events
  useEffect(() => {
    const handleAuthChange = (event: CustomEvent) => {
      const { isAuthenticated, userType } = event.detail;
      
      if (isAuthenticated && userType === 'vendor') {
        console.log('🔑 Vendor logged in - enabling enhanced notifications');
        if (isNotificationServiceReady) {
          unifiedNotificationService.refreshToken();
        }
      } else {
        console.log('🔓 User logged out - stopping all notifications');
        unifiedNotificationService.stopAllAlerts();
        setPendingOrders([]);
        setIsModalOpen(false);
        notifiedOrdersRef.current.clear();
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange as EventListener);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
  }, [isNotificationServiceReady]);

  // Listen for new order notifications
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'order' && notification.title.includes('New Order')) {
        console.log('🔔 New order notification received via WebSocket');
        fetchPendingOrders();
      }
    };

    // Listen for notification service events
    window.addEventListener('newNotification', handleNewNotification as EventListener);
    
    // Listen for order modal events
    window.addEventListener('showOrderModal', (event: any) => {
      console.log('📱 Order modal request from notification service:', event.detail);
    });

    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
    };
  }, []);

  // Fetch pending orders with enhanced error handling
  const fetchPendingOrders = async () => {
    try {
      const token = await authService.getToken();
      
      if (!token) {
        console.log('No token found for pending orders');
        return;
      }

      console.log('📱 Mobile: Fetching pending orders with token:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');
      console.log('📱 Mobile: API URL:', getApiUrl('orders/vendor/pending/'));
      
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response, data: orders } = await apiRequest('orders/vendor/pending/');

      console.log('📱 Mobile: Pending orders response:', response.status, response.ok);
      if (response.ok && orders) {
        console.log('Pending orders received:', orders.length, orders);

        // Only update if we have new orders
        if (orders.length !== lastOrderCountRef.current) {
          console.log(`📱 Order count changed: ${lastOrderCountRef.current} → ${orders.length}`);
          setPendingOrders(orders);
          setIsModalOpen(orders.length > 0);
          lastOrderCountRef.current = orders.length;

          // Show enhanced notifications for new orders
          if (orders.length > 0) {
            console.log('📱 Mobile: Showing enhanced order notifications for', orders.length, 'orders');

            for (const order of orders) {
              // Only notify if this order hasn't been notified before
              if (!notifiedOrdersRef.current.has(order.id)) {
                console.log('📱 Processing NEW order with enhanced notifications:', order.order_number, order.total_amount);
                notifiedOrdersRef.current.add(order.id);
                
                // Use the enhanced unified notification service
                if (isNotificationServiceReady) {
                  try {
                    await unifiedNotificationService.showPersistentOrderNotification(
                      order.order_number,
                      order.total_amount,
                      order.id
                    );
                    console.log('✅ Enhanced notification sent for order:', order.order_number);
                  } catch (error) {
                    console.error('❌ Failed to send enhanced notification:', error);
                  }
                }
              }
            }
          }
        } else {
          console.log('📱 No change in order count, skipping update');
        }
      } else {
        console.error('Failed to fetch pending orders:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  // Enhanced polling with background support
  useEffect(() => {
    const checkTokenAndFetch = async () => {
      const token = await authService.getToken();
      if (!token) return;

      fetchPendingOrders();
    };

    checkTokenAndFetch();

    // AGGRESSIVE auto-refresh for orders (they're time-sensitive!)
    const refreshOrders = async () => {
      try {
        const token = await authService.getToken();
        if (!token) return;

        console.log('🔄 Auto-refreshing pending orders...');
        await fetchPendingOrders();
      } catch (error) {
        console.error('Failed to auto-refresh orders:', error);
      }
    };

    // ENHANCED POLLING: Different intervals based on visibility and platform
    let aggressiveInterval: NodeJS.Timeout; // Every 3 seconds when visible
    let backgroundInterval: NodeJS.Timeout; // Every 10 seconds when hidden
    let mobileBackgroundInterval: NodeJS.Timeout; // Every 5 seconds when mobile in background

    const startEnhancedPolling = () => {
      // Clear existing intervals
      if (aggressiveInterval) clearInterval(aggressiveInterval);
      if (backgroundInterval) clearInterval(backgroundInterval);
      if (mobileBackgroundInterval) clearInterval(mobileBackgroundInterval);

      if (Capacitor.isNativePlatform()) {
        // Mobile-specific intervals
        aggressiveInterval = setInterval(() => {
          if (!document.hidden) {
            console.log('📱 MOBILE ACTIVE: Aggressive polling for urgent orders');
            refreshOrders();
          }
        }, 3000); // Every 3 seconds when active

        mobileBackgroundInterval = setInterval(() => {
          if (document.hidden) {
            console.log('📱 MOBILE BACKGROUND: Background polling for orders');
            refreshOrders();
          }
        }, 5000); // Every 5 seconds when in background
      } else {
        // Web intervals
        aggressiveInterval = setInterval(() => {
          if (!document.hidden) {
            console.log('🌐 WEB ACTIVE: Aggressive polling for urgent orders');
            refreshOrders();
          }
        }, 3000); // Every 3 seconds when visible

        backgroundInterval = setInterval(() => {
          if (document.hidden) {
            console.log('🌐 WEB BACKGROUND: Background polling for orders');
            refreshOrders();
          }
        }, 10000); // Every 10 seconds when hidden
      }
    };

    startEnhancedPolling();

    // IMMEDIATE refresh when page becomes visible
    const handleVisibilityChange = () => {
      console.log(`📱 Visibility changed: ${document.hidden ? 'hidden' : 'visible'}`);
      if (!document.hidden) {
        console.log('📱 Page became visible - IMMEDIATE order refresh!');
        refreshOrders();
        startEnhancedPolling();
      }
    };

    // Mobile-specific app state handling
    if (Capacitor.isNativePlatform()) {
      const handleAppStateChange = async (event: any) => {
        const isActive = event?.detail?.isActive ?? true;
        console.log(`📱 MOBILE App state changed: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);

        if (isActive) {
          console.log('📱 MOBILE App ACTIVE - IMMEDIATE order refresh!');
          await refreshOrders();
          startEnhancedPolling();
        } else {
          console.log('📱 MOBILE App INACTIVE - stopping visual alerts but keeping background polling');
          // Don't stop background polling, just stop visual alerts
          unifiedNotificationService.stopPersistentAlerts();
        }
      };

      document.addEventListener('appStateChange', handleAppStateChange);
      document.addEventListener('resume', handleAppStateChange);

      return () => {
        if (aggressiveInterval) clearInterval(aggressiveInterval);
        if (backgroundInterval) clearInterval(backgroundInterval);
        if (mobileBackgroundInterval) clearInterval(mobileBackgroundInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('appStateChange', handleAppStateChange);
        document.removeEventListener('resume', handleAppStateChange);
      };
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (aggressiveInterval) clearInterval(aggressiveInterval);
      if (backgroundInterval) clearInterval(backgroundInterval);
      if (mobileBackgroundInterval) clearInterval(mobileBackgroundInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isNotificationServiceReady]);

  // Enhanced order acceptance
  const acceptOrder = async (orderId: number) => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response } = await apiRequest(`/orders/${orderId}/accept/`, {
        method: 'POST'
      });

      if (response.ok) {
        // Clear enhanced notification
        if (isNotificationServiceReady) {
          await unifiedNotificationService.clearNotification(orderId);
        }

        // Remove from notified orders tracking
        notifiedOrdersRef.current.delete(orderId);

        setPendingOrders(prev => prev.filter(order => order.id !== orderId));
        if (pendingOrders.length <= 1) {
          setIsModalOpen(false);
        }

        // Dispatch event to refresh dashboard data
        window.dispatchEvent(new CustomEvent('orderAccepted', { detail: { orderId } }));

        return true;
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
    return false;
  };

  // Enhanced order rejection
  const rejectOrder = async (orderId: number) => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response } = await apiRequest(`/orders/${orderId}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ 
          reason: 'Rejected by vendor'
        })
      });

      if (response.ok) {
        // Clear enhanced notification
        if (isNotificationServiceReady) {
          await unifiedNotificationService.clearNotification(orderId);
        }
        
        // Remove from notified orders tracking
        notifiedOrdersRef.current.delete(orderId);
        
        setPendingOrders(prev => prev.filter(order => order.id !== orderId));
        if (pendingOrders.length <= 1) {
          setIsModalOpen(false);
        }
        return true;
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
    return false;
  };

  // Manual notification trigger for testing
  const testNotification = async (orderNumber: string = 'TEST-001', amount: string = '500.00') => {
    if (isNotificationServiceReady) {
      console.log('🧪 Testing enhanced notification system');
      await unifiedNotificationService.showPersistentOrderNotification(
        orderNumber, 
        amount, 
        Date.now() // Use timestamp as test ID
      );
    }
  };

  return {
    pendingOrders,
    isModalOpen,
    isNotificationServiceReady,
    acceptOrder,
    rejectOrder,
    testNotification,
    notifications,
    unreadCount,
    isConnected,
    clearAllAlerts: () => unifiedNotificationService.stopAllAlerts()
  };
}