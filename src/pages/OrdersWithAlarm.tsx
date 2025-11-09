import React from 'react';
import { useMobileAlarmNotifications } from '@/hooks/useMobileAlarmNotifications';
import { MobileAlarmTestComponent } from '@/components/MobileAlarmTestComponent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function OrdersWithAlarm() {
  const {
    pendingOrders,
    isModalOpen,
    isAlarmServiceReady,
    alarmStatus,
    acceptOrder,
    rejectOrder,
    testAlarm,
    stopAllAlarms
  } = useMobileAlarmNotifications();

  // Show alarm test component in development
  const showTestComponent = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with alarm status */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">📋 Orders (ALARM MODE)</h1>
          <div className="flex items-center gap-2">
            {isAlarmServiceReady ? (
              <Badge className="bg-green-100 text-green-800">
                🚨 Alarm System Ready
              </Badge>
            ) : (
              <Badge variant="secondary">
                ⏳ Initializing Alarm...
              </Badge>
            )}
            {alarmStatus.isAlarmActive && (
              <Badge className="bg-red-100 text-red-800 animate-pulse">
                🔔 ALARM ACTIVE
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4">
        {pendingOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">✅ No pending orders</div>
            <div className="text-gray-400 text-sm mt-2">
              {isAlarmServiceReady 
                ? '🚨 Alarm system is ready and will alert you for new orders'
                : '⏳ Initializing alarm system...'
              }
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-red-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <Badge className="bg-red-100 text-red-800">
                      🚨 URGENT
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ₹{order.total_amount}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Customer</div>
                    <div className="font-medium">{order.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="font-medium">{order.delivery_phone}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-600">Address</div>
                    <div className="font-medium">{order.delivery_address}</div>
                  </div>
                </div>

                {order.delivery_instructions && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-sm text-yellow-800">
                      <strong>Instructions:</strong> {order.delivery_instructions}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => rejectOrder(order.id)}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    ❌ Reject
                  </Button>
                  <Button
                    onClick={() => acceptOrder(order.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    ✅ Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual Test Controls */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🧪 Alarm Testing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => testAlarm('MANUAL-TEST', '250.00')}
              disabled={!isAlarmServiceReady}
              variant="outline"
              className="w-full"
            >
              🔔 Test Alarm
            </Button>
            <Button
              onClick={stopAllAlarms}
              variant="destructive"
              className="w-full"
            >
              🛑 Stop Alarms
            </Button>
            <Button
              onClick={() => {
                const status = alarmStatus;
                alert(`Alarm Status:\nActive: ${status.isAlarmActive}\nCurrent Order: ${status.currentOrderId}\nActive Alarms: ${status.activeAlarms.length}`);
              }}
              variant="outline"
              className="w-full"
            >
              📊 Status
            </Button>
          </div>
        </div>

        {/* Development Test Component */}
        {showTestComponent && (
          <div className="mt-8">
            <MobileAlarmTestComponent />
          </div>
        )}

        {/* Alarm Status Display */}
        {alarmStatus.isAlarmActive && (
          <div className="mt-8 p-4 bg-red-50 border-2 border-red-300 rounded animate-pulse">
            <h3 className="text-lg font-bold text-red-800 mb-2">🚨 ALARM STATUS</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold">Active:</span> {alarmStatus.isAlarmActive ? 'YES' : 'NO'}
              </div>
              <div>
                <span className="font-semibold">Current Order ID:</span> {alarmStatus.currentOrderId || 'None'}
              </div>
              <div>
                <span className="font-semibold">Total Active Alarms:</span> {alarmStatus.activeAlarms.length}
              </div>
            </div>
            <div className="mt-3 text-sm text-red-700">
              🔊 Sound playing every 2 seconds • 📳 Vibration every 3 seconds • 🔔 High-priority notifications active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersWithAlarm;