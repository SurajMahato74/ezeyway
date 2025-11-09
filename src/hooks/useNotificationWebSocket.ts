import { useState, useEffect, useRef } from 'react';
import { simpleNotificationService } from '@/services/simpleNotificationService';
import { authService } from '@/services/authService';
import { getWsUrl, getApiUrl } from '@/config/api';

interface NotificationData {
  id: string;
  type: 'order' | 'payment' | 'system';
  title: string;
  message: string;
  data?: any;
  action_url?: string;
  timestamp?: string;
}

export function useNotificationWebSocket() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Request notification permission on mount
  useEffect(() => {
    simpleNotificationService.requestPermissions();
  }, []);

  // Enhanced WebSocket connection with better error handling
  const connectWebSocket = async () => {
    let token = await authService.getToken();
    
    // If no token from authService, try localStorage directly
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    if (!token) {
      console.warn('No authentication token found for WebSocket connection');
      return;
    }

    // Check for ngrok and use HTTP polling if detected
    const currentUrl = window.location.href;
    if (currentUrl.includes('ngrok') || currentUrl.includes('ngrok-free.app')) {
      console.log('Ngrok detected - using HTTP polling instead of WebSocket');
      startHttpPolling();
      return;
    }

    console.log('🚀 ENABLING WEBSOCKET FOR REAL-TIME ORDER UPDATES');
    
    try {
      const wsUrl = `${getWsUrl('/ws/notifications/')}?token=${token}`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      // Create WebSocket with timeout
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          console.log('WebSocket connection timeout, closing...');
          wsRef.current.close();
          setIsConnected(false);
        }
      }, 10000); // 10 second timeout

      wsRef.current.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ Notification WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send authentication message if needed
        wsRef.current?.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
        
        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            } catch (error) {
              console.error('Error sending ping:', error);
              clearInterval(pingInterval);
            }
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🔌 Notification WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        setIsConnected(false);
        
        // Handle different close codes
        if (event.code === 1000) {
          console.log('Normal WebSocket closure');
          return;
        }
        
        if (event.code === 1006) {
          console.error('WebSocket closed abnormally (1006) - likely backend not running or incorrect configuration');
          // Don't retry immediately for abnormal closures
          return;
        }
        
        // Attempt to reconnect for other errors
        const attemptReconnect = async () => {
          const currentToken = await authService.getToken();
          if (currentToken && reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              console.log(`🔄 Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
              connectWebSocket();
            }, delay);
          } else if (!currentToken) {
            console.warn('❌ Cannot reconnect WebSocket: No authentication token');
          } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.warn('⚠️ Max WebSocket reconnection attempts reached, switching to polling');
            startHttpPolling();
          }
        };
        
        attemptReconnect();
      };

      wsRef.current.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ Notification WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('💥 Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  // Handle WebSocket messages - ENHANCED FOR ORDER UPDATES
  const handleWebSocketMessage = (data: any) => {
    console.log('📨 WEBSOCKET MESSAGE RECEIVED:', data);

    if (data.type === 'connection_established') {
      console.log('✅ Notification service connected:', data.message);
      return;
    }

    if (data.type === 'pong') {
      return; // Ignore pong responses
    }

    // HANDLE ORDER STATUS UPDATES VIA WEBSOCKET
    if (data.type === 'order_update' || data.type === 'order_status_change') {
      console.log('🔄 ORDER STATUS UPDATE VIA WEBSOCKET:', data);

      // Dispatch event to update order status in real-time
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
        detail: {
          orderId: data.order_id || data.orderId,
          status: data.status || data.new_status,
          type: data.action || 'websocket_update',
          websocket: true
        }
      }));

      // Dispatch WebSocket message event for components listening
      window.dispatchEvent(new CustomEvent('websocket_message', {
        detail: data
      }));

      return;
    }

    // HANDLE REFUND UPDATES VIA WEBSOCKET
    if (data.type === 'refund_update') {
      console.log('💰 REFUND UPDATE VIA WEBSOCKET:', data);

      window.dispatchEvent(new CustomEvent('websocket_message', {
        detail: data
      }));

      return;
    }

    // HANDLE REGULAR NOTIFICATIONS
    if (data.type === 'order_notification' || data.type === 'notification') {
      const notification = data.notification || data;
      if (notification) {
        // Add to notifications list
        const newNotification: NotificationData = {
          id: notification.id || `notification_${Date.now()}`,
          type: notification.type || 'system',
          title: notification.title,
          message: notification.message,
          data: notification.data,
          action_url: notification.action_url,
          timestamp: new Date().toISOString()
        };

        setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
        setUnreadCount(prev => prev + 1);

        // Show notification using simple service
        simpleNotificationService.showOrderNotification(
          notification.title,
          notification.message,
          parseInt(newNotification.id)
        );

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('newNotification', {
          detail: newNotification
        }));
      }
    }
  };

  // Enhanced HTTP polling fallback
  const startHttpPolling = () => {
    console.log('🔄 Starting HTTP polling fallback for notifications');
    setIsConnected(true); // Simulate connection for UI
    
    // Simple HTTP polling to check for new notifications
    const pollInterval = setInterval(async () => {
      try {
        const token = await authService.getToken();
        if (!token) {
          console.warn('No token for HTTP polling');
          clearInterval(pollInterval);
          return;
        }

        // Make a simple API call to check for notifications
        const response = await fetch(`${getApiUrl('/notifications/')}`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const notifications = await response.json();
          // Process new notifications if any
          if (notifications && notifications.length > 0) {
            console.log('📨 HTTP Polling: New notifications found');
            // You can dispatch events here for new notifications
          }
        }
      } catch (error) {
        console.warn('HTTP polling error:', error);
      }
    }, 30000); // Poll every 30 seconds

    // Store interval for cleanup
    if (reconnectTimeoutRef.current) {
      clearInterval(reconnectTimeoutRef.current as any);
    }
    reconnectTimeoutRef.current = pollInterval as any;
  };

  // Connect on mount with delay to ensure token is available
  useEffect(() => {
    const initConnection = async () => {
      // Wait a bit for authentication to complete
      setTimeout(async () => {
        await connectWebSocket();
      }, 1000);
    };
    initConnection();

    return () => {
      // Clean up WebSocket connection
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounting');
        } catch (error) {
          console.warn('Error closing WebSocket:', error);
        }
        wsRef.current = null;
      }
      
      // Clean up reconnection timeout
      if (reconnectTimeoutRef.current) {
        try {
          clearTimeout(reconnectTimeoutRef.current);
        } catch (error) {
          console.warn('Error clearing timeout:', error);
        }
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  // Skip initial notification fetch for now
  useEffect(() => {
    console.log('Initial notification fetch disabled');
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    console.log('Mark as read:', notificationId);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    console.log('Mark all as read');
    setUnreadCount(0);
  };

  // Send WebSocket message
  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', message);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  };

  // Listen for messages to send from other components
  useEffect(() => {
    const handleSendMessage = (event: CustomEvent) => {
      sendMessage(event.detail);
    };

    window.addEventListener('websocket_send', handleSendMessage as EventListener);
    return () => window.removeEventListener('websocket_send', handleSendMessage as EventListener);
  }, []);

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    sendMessage
  };
}