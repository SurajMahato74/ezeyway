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
        setPendingOrders(orders);
        setIsModalOpen(orders.length > 0);
        
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
        console.error('Failed to fetch pending orders:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    const checkTokenAndFetch = async () => {
      const { authService } = await import('@/services/authService');
      const token = await authService.getToken();
      if (!token) return;

      // Initial fetch
      fetchPendingOrders();
    };
    
    checkTokenAndFetch();

    // Reasonable polling interval (every 30 seconds for mobile, 60 seconds for web)
    const pollInterval = Capacitor.isNativePlatform() ? 30000 : 60000;
    pollIntervalRef.current = setInterval(fetchPendingOrders, pollInterval);

    // Also fetch when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPendingOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for mobile app refresh events
    const handleRefreshPendingOrders = () => {
      console.log('Refreshing pending orders from mobile app resume');
      fetchPendingOrders();
    };

    window.addEventListener('refreshPendingOrders', handleRefreshPendingOrders);
    
    // Listen for app state changes on mobile
    if (Capacitor.isNativePlatform()) {
      const handleAppStateChange = () => {
        console.log('📱 App state changed - refreshing orders');
        fetchPendingOrders();
      };
      
      document.addEventListener('resume', handleAppStateChange);
      document.addEventListener('visibilitychange', handleAppStateChange);
      
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('refreshPendingOrders', handleRefreshPendingOrders);
        document.removeEventListener('resume', handleAppStateChange);
        document.removeEventListener('visibilitychange', handleAppStateChange);
      };
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('refreshPendingOrders', handleRefreshPendingOrders);
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