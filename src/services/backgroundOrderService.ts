import { Capacitor } from '@capacitor/core';

class BackgroundOrderService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastCheckedOrders: Set<number> = new Set();

  async start() {
    if (this.isRunning || !Capacitor.isNativePlatform()) return;

    console.log('🔄 Starting background order service');
    this.isRunning = true;

    // Check for orders every 10 seconds
    this.intervalId = setInterval(() => {
      this.checkForNewOrders();
    }, 10000);

    // Also check when app becomes active
    if (Capacitor.isNativePlatform()) {
      const { App } = await import('@capacitor/app');
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          this.checkForNewOrders();
        }
      });
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Background order service stopped');
  }

  private async checkForNewOrders() {
    try {
      const { authService } = await import('./authService');
      const { apiRequest } = await import('@/utils/apiUtils');
      
      // Auto-login if needed
      const isAuth = await authService.autoLogin();
      if (!isAuth) return;

      // Fetch pending orders
      const { response, data } = await apiRequest('orders/vendor/pending/');
      
      if (response.ok && data) {
        const orders = Array.isArray(data) ? data : data.results || [];
        
        // Find new orders
        const newOrders = orders.filter(order => !this.lastCheckedOrders.has(order.id));
        
        if (newOrders.length > 0) {
          console.log('🆕 Found new orders:', newOrders.length);
          
          // Update tracked orders
          orders.forEach(order => this.lastCheckedOrders.add(order.id));
          
          // Send push notification for each new order
          for (const order of newOrders) {
            await this.triggerPushNotification(order);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new orders:', error);
    }
  }

  private async triggerPushNotification(order: any) {
    try {
      // For now, use local notification as fallback
      // In production, this would trigger a server-side push notification
      const { simpleNotificationService } = await import('./simpleNotificationService');
      
      console.log('🚀 Triggering notification for order:', order.order_number);
      
      // This simulates what your backend would do
      await simpleNotificationService.showOrderNotification(
        order.order_number,
        order.total_amount,
        order.id
      );
      
      // In production, you would call your backend API here:
      // await this.sendPushNotificationViaServer(order);
      
    } catch (error) {
      console.error('Error triggering push notification:', error);
    }
  }

  // This would be implemented in your backend
  private async sendPushNotificationViaServer(order: any) {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      
      // Call your backend to send push notification
      await apiRequest('/api/send-push-notification/', {
        method: 'POST',
        body: JSON.stringify({
          type: 'order',
          orderId: order.id,
          orderNumber: order.order_number,
          amount: order.total_amount,
          vendorId: order.vendor_id
        })
      });
      
      console.log('📤 Push notification sent via server');
    } catch (error) {
      console.error('Failed to send push notification via server:', error);
    }
  }

  // Clear tracked orders when vendor logs out
  clearTrackedOrders() {
    this.lastCheckedOrders.clear();
  }
}

export const backgroundOrderService = new BackgroundOrderService();