import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export function MobileOrderAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleOrderAlert = (event: CustomEvent) => {
      setOrderInfo(event.detail);
      setShowAlert(true);
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 5000);
    };

    window.addEventListener('showOrderModal', handleOrderAlert as EventListener);
    return () => {
      window.removeEventListener('showOrderModal', handleOrderAlert as EventListener);
    };
  }, []);

  if (!Capacitor.isNativePlatform() || !showAlert) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[10000] animate-in slide-in-from-top duration-300">
      <Card className="border-orange-200 bg-orange-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
              <Bell className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-orange-900">
                🔔 New Order Received!
              </h3>
              {orderInfo && (
                <p className="text-xs text-orange-700">
                  Order #{orderInfo.orderNumber} - ₹{orderInfo.amount}
                </p>
              )}
              <p className="text-xs text-orange-600 mt-1">
                Tap anywhere to view and respond
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}