import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEnhancedOrderNotifications } from '@/hooks/useEnhancedOrderNotifications';
import { unifiedNotificationService } from '@/services/unifiedNotificationService';

export function NotificationTestComponent() {
  const { testNotification, isNotificationServiceReady } = useEnhancedOrderNotifications();
  const [isTestRunning, setIsTestRunning] = useState(false);

  const runFullTest = async () => {
    setIsTestRunning(true);
    console.log('🧪 Starting comprehensive notification test...');

    try {
      // Test 1: Basic notification
      console.log('Test 1: Basic notification...');
      await testNotification('TEST-001', '250.00');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Test 2: Persistent notification
      console.log('Test 2: Persistent notification...');
      await unifiedNotificationService.showPersistentOrderNotification('TEST-002', '500.00', Date.now());
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test 3: Multiple notifications
      console.log('Test 3: Multiple notifications...');
      await testNotification('TEST-003', '750.00');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testNotification('TEST-004', '1000.00');

      console.log('✅ All tests completed! Check notifications on your device.');

    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      setIsTestRunning(false);
    }
  };

  const stopAllAlerts = () => {
    console.log('🛑 Stopping all alerts...');
    unifiedNotificationService.stopAllAlerts();
  };

  const checkServiceStatus = () => {
    console.log('📊 Notification Service Status:');
    console.log('- Service Ready:', isNotificationServiceReady);
    console.log('- FCM Token:', unifiedNotificationService.getFCMToken());
    console.log('- Platform:', navigator.platform);
    console.log('- Notification Support:', 'Notification' in window);
    console.log('- Vibration Support:', 'vibrate' in navigator);
    console.log('- Service Worker Support:', 'serviceWorker' in navigator);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-3">🔔 Notification System Test</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span>Service Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isNotificationServiceReady 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isNotificationServiceReady ? 'Ready' : 'Initializing...'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button 
            onClick={() => testNotification('TEST-ORDER', '350.00')}
            disabled={!isNotificationServiceReady || isTestRunning}
            className="w-full"
          >
            🔔 Test Single Notification
          </Button>

          <Button 
            onClick={runFullTest}
            disabled={!isNotificationServiceReady || isTestRunning}
            variant="outline"
            className="w-full"
          >
            {isTestRunning ? '⏳ Testing...' : '🧪 Full Test Suite'}
          </Button>

          <Button 
            onClick={stopAllAlerts}
            variant="destructive"
            className="w-full"
          >
            🛑 Stop All Alerts
          </Button>

          <Button 
            onClick={checkServiceStatus}
            variant="outline"
            className="w-full"
          >
            📊 Check Status
          </Button>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>💡 <strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Enable notifications when prompted</li>
            <li>Test on both foreground and background</li>
            <li>Lock screen to test lock screen notifications</li>
            <li>Check that sound and vibration work</li>
            <li>Tap notifications to test auto-open</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default NotificationTestComponent;