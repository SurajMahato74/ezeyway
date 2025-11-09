import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useMobileAlarmNotifications } from '@/hooks/useMobileAlarmNotifications';
import { mobileAlarmNotificationService } from '@/services/mobileAlarmNotificationService';
import { AlertTriangle, Volume2, Vibrate, Smartphone, Clock, CheckCircle } from 'lucide-react';

export function MobileAlarmTestComponent() {
  const { 
    testAlarm, 
    isAlarmServiceReady, 
    alarmStatus, 
    stopAllAlarms,
    getAlarmStatus
  } = useMobileAlarmNotifications();
  
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runComprehensiveAlarmTest = async () => {
    setIsTestRunning(true);
    setTestResults([]);
    addTestResult('🧪 Starting comprehensive alarm test...');

    try {
      // Test 1: Service initialization
      addTestResult(`📱 Platform: ${navigator.platform}`);
      addTestResult(`🚨 Alarm Service Ready: ${isAlarmServiceReady ? 'YES' : 'NO'}`);
      
      if (!isAlarmServiceReady) {
        addTestResult('❌ Alarm service not ready - test stopped');
        return;
      }

      // Test 2: Basic alarm trigger
      addTestResult('🔔 Test 1: Basic alarm trigger...');
      await testAlarm('ALARM-TEST-001', '500.00');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test 3: Multiple alarm test
      addTestResult('🔔 Test 2: Multiple rapid alarms...');
      await testAlarm('ALARM-TEST-002', '750.00');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testAlarm('ALARM-TEST-003', '1000.00');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Test 4: Alarm status monitoring
      addTestResult('🔔 Test 3: Monitoring alarm status...');
      for (let i = 0; i < 5; i++) {
        const status = getAlarmStatus();
        addTestResult(`📊 Status ${i + 1}: Active=${status.isAlarmActive}, OrderId=${status.currentOrderId}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      addTestResult('✅ All alarm tests completed!');
      addTestResult('🔊 Check that:');
      addTestResult('   - Sound played every 2 seconds');
      addTestResult('   - Vibration occurred every 3 seconds');
      addTestResult('   - Notifications appeared with high priority');
      addTestResult('   - Screen wake lock was acquired');
      addTestResult('   - App was forced to foreground');

    } catch (error) {
      addTestResult(`❌ Test failed: ${error}`);
    } finally {
      setIsTestRunning(false);
      // Automatically stop alarms after test
      setTimeout(() => {
        stopAllAlarms();
        addTestResult('🔕 All alarms stopped automatically');
      }, 10000);
    }
  };

  const testAlarmStop = () => {
    addTestResult('🛑 Stopping all alarms...');
    stopAllAlarms();
    setTimeout(() => {
      const status = getAlarmStatus();
      addTestResult(`📊 Current status: Active=${status.isAlarmActive}`);
    }, 1000);
  };

  const testBackgroundAlarms = async () => {
    addTestResult('📱 Testing background alarm behavior...');
    addTestResult('⚠️ IMPORTANT: Minimize app after triggering alarm');
    
    await testAlarm('BACKGROUND-TEST', '300.00');
    addTestResult('🔔 Alarm triggered - now minimize the app to test background behavior');
  };

  const testLockScreenAlarms = async () => {
    addTestResult('🔒 Testing lock screen alarm behavior...');
    addTestResult('⚠️ IMPORTANT: Lock your phone after triggering alarm');
    
    await testAlarm('LOCKSCREEN-TEST', '400.00');
    addTestResult('🔔 Alarm triggered - now lock your phone to test lock screen notifications');
  };

  return (
    <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <h3 className="text-xl font-bold text-red-800">🚨 Mobile Alarm Notification System</h3>
      </div>
      
      <div className="bg-white p-4 rounded border mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">🔔 System Status</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span>Platform: {navigator.platform}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`h-4 w-4 ${isAlarmServiceReady ? 'text-green-600' : 'text-red-600'}`} />
            <span>Alarm Service: {isAlarmServiceReady ? 'Ready' : 'Not Ready'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span>Active Alarms: {alarmStatus.activeAlarms.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Vibrate className="h-4 w-4" />
            <span>Currently Active: {alarmStatus.isAlarmActive ? 'YES' : 'NO'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800">🧪 Alarm Tests</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={() => testAlarm('QUICK-TEST', '250.00')}
            disabled={!isAlarmServiceReady || isTestRunning}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Quick Test
          </Button>

          <Button 
            onClick={runComprehensiveAlarmTest}
            disabled={!isAlarmServiceReady || isTestRunning}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isTestRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Full Test Suite
              </>
            )}
          </Button>

          <Button 
            onClick={testBackgroundAlarms}
            disabled={!isAlarmServiceReady || isTestRunning}
            variant="outline"
            className="w-full"
          >
            📱 Background Test
          </Button>

          <Button 
            onClick={testLockScreenAlarms}
            disabled={!isAlarmServiceReady || isTestRunning}
            variant="outline"
            className="w-full"
          >
            🔒 Lock Screen Test
          </Button>

          <Button 
            onClick={testAlarmStop}
            variant="destructive"
            className="w-full"
          >
            🛑 Stop All Alarms
          </Button>

          <Button 
            onClick={() => {
              const status = getAlarmStatus();
              setTestResults([`Current Status: ${JSON.stringify(status, null, 2)}`]);
            }}
            variant="outline"
            className="w-full"
          >
            📊 Check Status
          </Button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Testing Instructions</h5>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li><strong>Volume:</strong> Turn up device volume to test alarm sounds</li>
            <li><strong>Location:</strong> Test near other people to ensure sound is loud</li>
            <li><strong>Background:</strong> Minimize app during background tests</li>
            <li><strong>Lock Screen:</strong> Lock phone during lock screen tests</li>
            <li><strong>Duration:</strong> Alarms play every 2 seconds, vibrate every 3 seconds</li>
            <li><strong>Stopping:</strong> Use "Stop All Alarms" button or accept/reject order</li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded p-3">
          <h5 className="font-semibold text-red-800 mb-2">🚨 Alarm Behavior</h5>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            <li><strong>Sound:</strong> Loud, piercing alarm sound every 2 seconds</li>
            <li><strong>Vibration:</strong> Emergency vibration pattern every 3 seconds</li>
            <li><strong>Notifications:</strong> High-priority, persistent notifications</li>
            <li><strong>Lock Screen:</strong> Appears on lock screen with full details</li>
            <li><strong>Auto-Open:</strong> Forces app to foreground when notification tapped</li>
            <li><strong>Wake Lock:</strong> Keeps screen awake during alarm</li>
            <li><strong>Actions:</strong> Accept/Reject buttons directly on notification</li>
          </ul>
        </div>

        {testResults.length > 0 && (
          <div className="bg-gray-50 border rounded p-3">
            <h5 className="font-semibold text-gray-800 mb-2">📋 Test Results</h5>
            <div className="max-h-48 overflow-y-auto text-sm font-mono bg-black text-green-400 p-2 rounded">
              {testResults.map((result, index) => (
                <div key={index}>{result}</div>
              ))}
            </div>
            <Button 
              onClick={() => setTestResults([])}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Clear Results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileAlarmTestComponent;