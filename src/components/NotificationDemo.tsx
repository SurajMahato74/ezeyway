import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationService } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

export function NotificationDemo() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const testBrowserNotification = async () => {
    setIsLoading(true);
    try {
      const permission = await notificationService.requestPermission();
      
      if (permission === 'granted') {
        notificationService.showBrowserNotification('Test Notification', {
          body: 'This is a test notification from KathSnap!',
          tag: 'test-notification',
          requireInteraction: true,
          data: { actionUrl: '/vendor/orders' }
        });
        
        toast({
          title: "Success",
          description: "Test notification sent!",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateOrderNotification = () => {
    // Simulate a new order notification
    const mockOrder = {
      id: Date.now(),
      order_number: `ORD-${Math.floor(Math.random() * 10000)}`,
      total_amount: (Math.random() * 500 + 100).toFixed(2)
    };

    // Dispatch the event that would normally come from the order creation
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('orderCreated', { 
        detail: { order: mockOrder } 
      }));
    }

    toast({
      title: "Order Simulation",
      description: `Simulated order ${mockOrder.order_number}`,
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Notification Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testBrowserNotification}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Test Browser Notification'}
        </Button>
        
        <Button 
          onClick={simulateOrderNotification}
          variant="outline"
          className="w-full"
        >
          Simulate New Order
        </Button>
        
        <div className="text-sm text-gray-600">
          <p>• First button tests browser notifications</p>
          <p>• Second button simulates a new order notification</p>
          <p>• Make sure notifications are enabled in your browser</p>
        </div>
      </CardContent>
    </Card>
  );
}