import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X, AlertCircle } from 'lucide-react';
import { simpleNotificationService } from '@/services/simpleNotificationService';
import { Capacitor } from '@capacitor/core';

export function NotificationPermissionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Don't show banner on mobile (no web notifications support)
    if (Capacitor.isNativePlatform()) {
      setShowBanner(false);
      return;
    }

    // Check if we should show the permission banner
    const checkPermission = () => {
      if ('Notification' in window) {
        const permission = Notification.permission;
        const hasAskedBefore = localStorage.getItem('notification-permission-asked');
        
        // Show banner if permission is default and we haven't asked before
        if (permission === 'default' && !hasAskedBefore) {
          setShowBanner(true);
        }
      }
    };

    checkPermission();
  }, []);

  const requestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await simpleNotificationService.requestPermissions();
      
      if (granted) {
        setShowBanner(false);
        // Show success message
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎉 Notifications Enabled!', {
            body: 'You will now receive instant order notifications.',
            icon: '/favicon.ico',
            tag: 'permission-granted'
          });
        }
      } else {
        // Permission denied, show instructions
        alert('To receive order notifications:\n\n1. Click the lock icon in your browser address bar\n2. Allow notifications for this site\n3. Refresh the page');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
      localStorage.setItem('notification-permission-asked', 'true');
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('notification-permission-asked', 'true');
  };

  if (!showBanner) return null;

  return (
    <Card className="mx-4 mb-4 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="h-4 w-4 text-orange-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-orange-900 mb-1">
              Enable Order Notifications
            </h3>
            <p className="text-xs text-orange-700 mb-3">
              Get instant notifications for new orders, even when the app is in the background or closed.
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={requestPermission}
                disabled={isRequesting}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8"
              >
                {isRequesting ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Bell className="h-3 w-3 mr-1" />
                    Enable Notifications
                  </>
                )}
              </Button>
              
              <Button
                onClick={dismissBanner}
                variant="ghost"
                size="sm"
                className="text-orange-700 hover:text-orange-900 text-xs h-8"
              >
                Maybe Later
              </Button>
            </div>
          </div>
          
          <Button
            onClick={dismissBanner}
            variant="ghost"
            size="sm"
            className="text-orange-600 hover:text-orange-800 p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}