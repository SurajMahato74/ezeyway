import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle } from 'lucide-react';
import { notificationService } from '@/services/notificationService';

export const TestNotification: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);
  const testNotification = async () => {
    await notificationService.notifyNewMessage(
      'Test Admin',
      'This is a test notification to check if notifications are working!',
      '1',
      'vendor'
    );
  };

  const testBrowserNotification = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications not supported');
      return;
    }
    
    console.log('Current permission:', Notification.permission);
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      if (permission !== 'granted') {
        alert('Notification permission denied');
        return;
      }
    } else if (Notification.permission === 'denied') {
      alert('Notifications are blocked. Please enable them in browser settings.');
      return;
    }
    
    if (Notification.permission === 'granted') {
      const notification = new Notification('Test Notification', {
        body: 'This is a test browser notification',
        icon: '/logo192.png',
        requireInteraction: true
      });
      
      notification.onclick = () => {
        console.log('Notification clicked');
        notification.close();
      };
      
      setTimeout(() => notification.close(), 5000);
      console.log('Notification shown');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 bg-white p-3 rounded-lg shadow-lg border">
      <div className="text-xs text-gray-600 mb-2">
        Permission: <span className={`font-bold ${
          permission === 'granted' ? 'text-green-600' : 
          permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
        }`}>{permission}</span>
      </div>
      
      <Button onClick={testNotification} size="sm" className="bg-blue-500 hover:bg-blue-600">
        <Bell className="h-4 w-4 mr-2" />
        Test Notification
      </Button>
      
      <Button onClick={testBrowserNotification} size="sm" variant="outline">
        {permission === 'denied' ? <AlertCircle className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
        Test Browser
      </Button>
      
      {permission === 'denied' && (
        <div className="text-xs text-red-600 mt-1">
          Enable notifications in browser settings
        </div>
      )}
    </div>
  );
};