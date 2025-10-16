import { useState, useEffect, useRef } from 'react';
import { simpleNotificationService } from '@/services/simpleNotificationService';
import { authService } from '@/services/authService';
import { getWsUrl } from '@/config/api';

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

  // WebSocket connection (disabled for ngrok compatibility)
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

    // Skip WebSocket connection when using ngrok
    const currentUrl = window.location.href;
    if (currentUrl.includes('ngrok') || currentUrl.includes('ngrok-free.app')) {
      console.log('Ngrok detected - using HTTP polling instead of WebSocket');
      startHttpPolling();
      return;
    }

    // Skip WebSocket for now - use HTTP polling for all connections
    console.log('Using HTTP polling for notifications');
    startHttpPolling();
    return;

    try {
      const wsUrl = `${getWsUrl('/ws/notifications/')}?token=${token}`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Notification WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
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

      wsRef.current.onclose = async (event) => {
        console.log('Notification WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure and we have a token
        const token = await authService.getToken();
        if (token && event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connectWebSocket();
          }, delay);
        } else if (!token) {
          console.warn('Cannot reconnect WebSocket: No authentication token');
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.warn('Max WebSocket reconnection attempts reached');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    console.log('Received notification:', data);

    if (data.type === 'connection_established') {
      console.log('Notification service connected:', data.message);
      return;
    }

    if (data.type === 'pong') {
      return; // Ignore pong responses
    }

    if (data.type === 'order_notification' || data.type === 'notification') {
      const notification = data.notification;
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

  // HTTP polling fallback for ngrok (disabled)
  const startHttpPolling = () => {
    setIsConnected(true); // Simulate connection for UI
    console.log('Notification polling disabled');
    // No polling interval to prevent excessive API calls
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
      if (reconnectTimeoutRef.current) {
        clearInterval(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
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
    clearNotifications
  };
}