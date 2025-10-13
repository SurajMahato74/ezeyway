import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, MapPin, Phone, Package, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface NewOrder {
  id: number;
  order_number: string;
  customer_name: string;
  delivery_phone: string;
  delivery_address: string;
  total_amount: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  delivery_instructions?: string;
}

interface OrderNotificationModalProps {
  isOpen: boolean;
  orders: NewOrder[];
  onAccept: (orderId: number) => void;
  onReject: (orderId: number) => void;
}

export function OrderNotificationModal({ isOpen, orders, onAccept, onReject }: OrderNotificationModalProps) {
  const [elapsedTimes, setElapsedTimes] = useState<{[key: number]: number}>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const orderTimesRef = useRef<{[key: number]: Date}>({});

  useEffect(() => {
    if (isOpen && orders.length > 0) {
      // Play alert sound with retry mechanism
      const playSound = async () => {
        if (audioRef.current) {
          try {
            audioRef.current.volume = 0.8;
            await audioRef.current.play();
            // Stop after 3 seconds to avoid infinite loop
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
            }, 3000);
          } catch (error) {
            console.warn('Audio autoplay blocked:', error);
            // Fallback: Use Web Audio API
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
              oscillator.type = 'square';
              
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.5);
            } catch (webAudioError) {
              console.warn('Web Audio API also failed:', webAudioError);
            }
          }
        }
      };
      
      playSound();

      // Request notification permission if not granted
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showNotifications();
          }
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        showNotifications();
      }

      // Set order received times
      orders.forEach(order => {
        if (!orderTimesRef.current[order.id]) {
          orderTimesRef.current[order.id] = new Date(order.created_at);
        }
      });
      
      // Start elapsed time counters
      const timer = setInterval(() => {
        const newElapsedTimes: {[key: number]: number} = {};
        orders.forEach(order => {
          if (orderTimesRef.current[order.id]) {
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - orderTimesRef.current[order.id].getTime()) / 1000);
            newElapsedTimes[order.id] = elapsed;
          }
        });
        setElapsedTimes(newElapsedTimes);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, orders]);

  const showNotifications = () => {
    orders.forEach(order => {
      new Notification('New Order Received!', {
        body: `Order #${order.order_number} - ₹${order.total_amount}`,
        icon: '/favicon.ico',
        tag: `order-${order.id}`,
        requireInteraction: true
      });
    });
  };

  if (!isOpen || orders.length === 0) return null;

  const handleAccept = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    onAccept(orderId);
    toast({
      title: "Order Accepted",
      description: `Order #${order?.order_number} has been accepted`,
    });
  };

  const handleReject = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    onReject(orderId);
    toast({
      title: "Order Rejected",
      description: `Order #${order?.order_number} has been rejected`,
      variant: "destructive",
    });
  };

  return (
    <>
      {/* Enhanced audio notification */}
      <audio ref={audioRef} preload="auto" loop>
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav" />
      </audio>

      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-end">
        {/* Modal */}
        <div className="w-full bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300" style={{ height: '80vh' }}>
          <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                  <Bell className="h-3 w-3 text-red-600 animate-bounce" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-red-900">🔔 New Orders Received!</h2>
                  <p className="text-xs text-red-600 font-medium">{orders.length} order{orders.length > 1 ? 's' : ''} waiting for response</p>
                </div>
              </div>
              <div className="text-xs text-red-600 font-bold animate-pulse">
                URGENT
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {orders.map((order) => {
                const elapsedTime = elapsedTimes[order.id] || 0;
                return (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-gray-900">#{order.order_number}</p>
                      <p className="text-xs font-bold text-green-600">₹{order.total_amount}</p>
                      <p className="text-xs text-blue-600">
                        {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{order.customer_name}</p>

                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div className="flex items-start gap-1">
                        <MapPin className="h-2 w-2 text-gray-500 mt-0.5" />
                        <p className="text-xs text-gray-900">{order.delivery_address}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-2 w-2 text-gray-500" />
                        <p className="text-xs text-gray-900">{order.delivery_phone}</p>
                      </div>
                    </div>

                    <div className="mb-1">
                      <p className="text-xs font-medium text-gray-700 mb-1">Items ({order.items.length})</p>
                      <div className="space-y-1 max-h-16 overflow-y-auto">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-1 p-1 bg-white rounded">
                            <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              <img 
                                src={item.product_details?.images?.[0]?.image_url || '/placeholder-product.jpg'} 
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{item.product_name}</p>
                              <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-xs font-medium text-gray-900">₹{item.total_price}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.delivery_instructions && (
                      <div className="mb-1">
                        <p className="text-xs font-medium text-gray-700">Instructions:</p>
                        <p className="text-xs text-gray-600 italic">{order.delivery_instructions}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleReject(order.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs h-6"
                      >
                        <X className="h-2 w-2 mr-1" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleAccept(order.id)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-6"
                      >
                        <CheckCircle className="h-2 w-2 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}