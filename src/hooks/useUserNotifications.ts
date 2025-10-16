import { useState, useEffect } from 'react';
import { notificationService, Notification } from '@/services/notificationService';

export function useUserNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      // Check if user is authenticated first
      const { authService } = await import('@/services/authService');
      const token = await authService.getToken();
      if (!token) {
        // User not authenticated, don't load notifications
        return;
      }
      
      setIsLoading(true);
      const [notificationData, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount()
      ]);
      
      setNotifications(notificationData);
      setUnreadCount(count);
    } catch (error) {
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error('Failed to load notifications:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    loadNotifications();
    
    // Refresh every 10 seconds for real-time feel
    const interval = setInterval(loadNotifications, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    notificationService.requestPermission();
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadNotifications
  };
}