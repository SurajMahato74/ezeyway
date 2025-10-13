import { Button } from '@/components/ui/button';
import { simpleNotificationService } from '@/services/simpleNotificationService';
import { Capacitor } from '@capacitor/core';

export function TestOrderNotification() {
  const testNotification = async () => {
    try {
      console.log('📱 Testing notification on platform:', Capacitor.getPlatform());
      
      // Request permissions first
      const hasPermission = await simpleNotificationService.requestPermissions();
      console.log('🔔 Notification permission:', hasPermission);
      
      if (!hasPermission) {
        alert('Notification permission denied. Please enable notifications in settings.');
        return;
      }
      
      // Test notification
      await simpleNotificationService.showOrderNotification(
        'TEST001',
        '299.99',
        99999
      );
      
      console.log('✅ Test notification sent successfully');
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      alert(`Test failed: ${error.message}`);
    }
  };

  const testPermissions = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permission = await LocalNotifications.checkPermissions();
        console.log('📱 Current permissions:', permission);
        
        if (permission.display !== 'granted') {
          const request = await LocalNotifications.requestPermissions();
          console.log('📱 Permission request result:', request);
        }
        
        // Test basic local notification
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Test Notification',
              body: 'This is a test notification from your app',
              id: 1,
              schedule: { at: new Date(Date.now() + 1000) },
            }
          ]
        });
        
        console.log('✅ Local notification scheduled');
      } else {
        console.log('💻 Web platform - using web notifications');
      }
    } catch (error) {
      console.error('❌ Permission test failed:', error);
      alert(`Permission test failed: ${error.message}`);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={testNotification}
        variant="outline"
        className="text-xs bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200"
      >
        🔔 Test Notification
      </Button>
      <Button 
        onClick={testPermissions}
        variant="outline"
        className="text-xs bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200"
      >
        🔍 Test Permissions
      </Button>
    </div>
  );
}