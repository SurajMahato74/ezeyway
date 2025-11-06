import { useState, useEffect, useRef } from 'react';
import { useNotificationWebSocket } from './useNotificationWebSocket';
import { getApiUrl } from '@/config/api';
import { Capacitor } from '@capacitor/core';

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
}

export function useOrderNotifications() {
  const [pendingOrders, setPendingOrders] = useState<NewOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedOrdersRef = useRef<Set<number>>(new Set());
  const lastOrderCountRef = useRef<number>(0);
  
  // Use the comprehensive notification system
  const { notifications, unreadCount, isConnected } = useNotificationWebSocket();

  // Listen for new order notifications
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'order' && notification.title.includes('New Order')) {
        // Refresh pending orders when new order notification is received
        fetchPendingOrders();
      }
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
    };
  }, []);

  // Fetch pending orders
  const fetchPendingOrders = async () => {
    try {
      // Use authService to get token (works on both web and mobile)
      const { authService } = await import('@/services/authService');
      const token = await authService.getToken();
      
      if (!token) {
        console.log('No token found for pending orders');
        return;
      }

      console.log('📱 Mobile: Fetching pending orders with token:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');
      console.log('📱 Mobile: API URL:', getApiUrl('orders/vendor/pending/'));
      
      // Use apiRequest utility for better mobile compatibility
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response, data: orders } = await apiRequest('orders/vendor/pending/');

      console.log('📱 Mobile: Pending orders response:', response.status, response.ok);
      if (response.ok && orders) {
        console.log('Pending orders received:', orders.length, orders);

        // Only update if we have new orders (like messages page)
        if (orders.length !== lastOrderCountRef.current) {
          console.log(`📱 Order count changed: ${lastOrderCountRef.current} → ${orders.length}`);
          setPendingOrders(orders);
          setIsModalOpen(orders.length > 0);
          lastOrderCountRef.current = orders.length;

          // Show notification if there are new orders
          if (orders.length > 0) {
            console.log('📱 Mobile: Showing order notification for', orders.length, 'orders');

            // Import and use notification service only for new orders
            import('@/services/simpleNotificationService').then(({ simpleNotificationService }) => {
              orders.forEach((order: any) => {
                // Only notify if this order hasn't been notified before
                if (!notifiedOrdersRef.current.has(order.id)) {
                  console.log('📱 Processing NEW order:', order.order_number, order.total_amount);
                  notifiedOrdersRef.current.add(order.id);
                  simpleNotificationService.showOrderNotification(
                    order.order_number,
                    order.total_amount,
                    order.id
                  );
                }
              });
            });
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

  // Initial fetch and auto-refresh (like messages page)
  useEffect(() => {
    const checkTokenAndFetch = async () => {
      const { authService } = await import('@/services/authService');
      const token = await authService.getToken();
      if (!token) return;

      // Initial fetch
      fetchPendingOrders();
    };

    checkTokenAndFetch();

    // Auto-refresh orders every 10 seconds (more frequent than messages since orders are urgent)
    const refreshOrders = async () => {
      try {
        const { authService } = await import('@/services/authService');
        const token = await authService.getToken();
        if (!token) return;

        console.log('🔄 Auto-refreshing pending orders...');
        await fetchPendingOrders();
      } catch (error) {
        console.error('Failed to auto-refresh orders:', error);
      }
    };

    // Set up interval for auto-refresh
    const interval = setInterval(refreshOrders, 10000); // Refresh every 10 seconds

    // Also refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 Page visible - refreshing orders');
        refreshOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for mobile app refresh events
    if (Capacitor.isNativePlatform()) {
      const handleAppStateChange = () => {
        console.log('📱 App state changed - refreshing orders');
        refreshOrders();
      };

      document.addEventListener('resume', handleAppStateChange);
      document.addEventListener('visibilitychange', handleAppStateChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('resume', handleAppStateChange);
        document.removeEventListener('visibilitychange', handleAppStateChange);
      };
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const acceptOrder = async (orderId: number) => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response } = await apiRequest(`/orders/${orderId}/accept/`, {
        method: 'POST'
      });

      if (response.ok) {
        // Clear persistent notification
        const { simpleNotificationService } = await import('@/services/simpleNotificationService');
        simpleNotificationService.clearNotification(orderId);

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
        // Clear persistent notification
        const { simpleNotificationService } = await import('@/services/simpleNotificationService');
        simpleNotificationService.clearNotification(orderId);
        
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

  return {
    pendingOrders,
    isModalOpen,
    acceptOrder,
    rejectOrder,
    notifications,
    unreadCount,
    isConnected
  };
}