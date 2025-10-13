import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { notificationService } from '@/services/notificationService';

export const NotificationPermission: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setShowPrompt(Notification.permission === 'default');
    }
  }, []);

  const requestPermission = async () => {
    const granted = await notificationService.requestPermissions();
    setPermission(granted ? 'granted' : 'denied');
    setShowPrompt(false);
  };

  if (!showPrompt || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Enable Notifications</h3>
          <p className="text-xs text-gray-600 mt-1">
            Get notified when you receive new messages, even when the app is closed.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={requestPermission}>
              Enable
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowPrompt(false)}>
              Later
            </Button>
          </div>
        </div>
        <button 
          onClick={() => setShowPrompt(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
};