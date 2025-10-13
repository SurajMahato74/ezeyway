import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/services/notificationService';

export function NotificationTest() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    const result = await notificationService.requestPermission();
    setPermission(result);
  };

  const testNotification = () => {
    notificationService.showBrowserNotification('Test Message', {
      body: 'This is a test message notification',
      tag: 'test-message',
      requireInteraction: false,
      data: { actionUrl: '/vendor/messages' }
    });
  };

  const testOrderNotification = () => {
    notificationService.showBrowserNotification('New Order!', {
      body: 'Order #ORD-123 for ₹450.00',
      tag: 'test-order',
      requireInteraction: true,
      data: { actionUrl: '/vendor/orders' }
    });
  };

  return (
    <div className="p-4 space-y-4 border rounded">
      <h3 className="font-bold">Notification Test</h3>
      <p>Permission: {permission}</p>
      
      {permission === 'default' && (
        <Button onClick={requestPermission}>Request Permission</Button>
      )}
      
      {permission === 'granted' && (
        <div className="space-x-2">
          <Button onClick={testNotification}>Test Message</Button>
          <Button onClick={testOrderNotification}>Test Order</Button>
        </div>
      )}
      
      {permission === 'denied' && (
        <p className="text-red-500">Notifications blocked. Enable in browser settings.</p>
      )}
    </div>
  );
}