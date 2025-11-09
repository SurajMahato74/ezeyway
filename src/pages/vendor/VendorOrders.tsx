import React, { useState, useEffect } from 'react';
import { VendorPage } from "@/components/VendorLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle, XCircle, Eye, Bell, MapPin, Phone, CreditCard, User, Calendar, Truck, ChevronLeft, ChevronRight, Copy, Share2, RotateCcw, AlertTriangle, MessageCircle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useNotificationWebSocket } from "@/hooks/useNotificationWebSocket";
import { API_CONFIG } from '@/config/api';
import { apiRequest } from '@/utils/apiUtils';
import { getImageUrl } from '@/utils/imageUtils';

const VendorOrders: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(2);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryBoyPhone, setDeliveryBoyPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [isDeliveryFeeReadonly, setIsDeliveryFeeReadonly] = useState(false);
  const [deliveryFeeSource, setDeliveryFeeSource] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const itemsPerPage = 10;
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<number>>(new Set());
  
  // Use notification system
  const { notifications, unreadCount, isConnected } = useNotificationWebSocket();
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // WebSocket event handlers for real-time updates only
  useEffect(() => {
    // Listen for order notifications to refresh orders
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'order') {
        console.log('🔔 New order notification received, refreshing...');
        setTimeout(() => fetchVendorOrders(), 1000);
      }
    };

    // Listen for real-time order status updates from customer
    const handleOrderStatusUpdate = (event: CustomEvent) => {
      const { orderId, status, type } = event.detail;
      console.log('📊 Order status update received:', { orderId, status, type });
      
      // For review updates, refresh with delay to ensure API is updated
      if (type === 'review') {
        setTimeout(() => {
          fetchVendorOrders();
        }, 1000);
      } else {
        // For other updates, refresh immediately
        setTimeout(() => {
          fetchVendorOrders();
        }, 500);
      }
    };

    // WebSocket message handler
    const handleWebSocketMessage = (event: CustomEvent) => {
      const data = event.detail;
      if (data.type === 'order_update' || data.type === 'order_status_change' || data.type === 'refund_update') {
        console.log('🔄 WebSocket order update received:', data.type);
        if (data.action && data.order_id) {
          setTimeout(() => fetchVendorOrders(), 500);
        }
      }
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    window.addEventListener('orderStatusUpdated', handleOrderStatusUpdate as EventListener);
    window.addEventListener('websocket_message', handleWebSocketMessage as EventListener);
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
      window.removeEventListener('orderStatusUpdated', handleOrderStatusUpdate as EventListener);
      window.removeEventListener('websocket_message', handleWebSocketMessage as EventListener);
    };
  }, []);
  
  // Initial order loading - ONCE ONLY
  useEffect(() => {
    console.log('📦 Loading initial orders...');
    fetchVendorOrders();
  }, []);

  const fetchVendorOrders = async () => {
    try {
      setLoadingOrders(true);
      const { apiRequest } = await import('@/utils/apiUtils');
      
      // Mobile-optimized request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), isMobile ? 8000 : 30000);

      const apiUrl = isMobile ? '/vendor/orders/?limit=50' : '/vendor/orders/';
      const { response, data } = await apiRequest(apiUrl, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok && data) {
        const orders = data.results || data || [];
        console.log('📦 Orders received:', orders.length);

        // Check for new pending orders and trigger notifications
        const currentPendingOrders = orders.filter(o => o.status === 'pending');
        const currentOrderIds: Set<number> = new Set(currentPendingOrders.map(o => Number(o.id)));
        const newOrderIds: number[] = [...currentOrderIds].filter((id: number) => !previousOrderIds.has(id));
        const newOrders = currentPendingOrders.filter(order => newOrderIds.includes(Number(order.id)));

        if (newOrders.length > 0) {
          console.log('🎯 New orders detected:', newOrders.length, 'orders');
          
          // Auto-play sound for new orders
          const { simpleNotificationService } = await import('@/services/simpleNotificationService');
          for (const order of newOrders) {
            try {
              await simpleNotificationService.showOrderNotification(
                order.order_number,
                order.total_amount,
                order.id
              );
            } catch (error) {
              console.error('Failed to show notification for order:', order.order_number, error);
            }
          }
        }

        // Update tracking
        setPreviousOrderIds(currentOrderIds);
        setOrdersData(orders);
      } else {
        console.error('Failed to fetch orders:', response.status, data);
        setOrdersData([]);
      }
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      setOrdersData([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'returned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Bell className="h-3 w-3" />;
      case 'confirmed': return <Package className="h-3 w-3" />;
      case 'pending': return <Truck className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      case 'returned': return <RotateCcw className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === 'all') return ordersData;
    if (status === 'new') return ordersData.filter(order => order.status === 'pending');
    if (status === 'pending') return ordersData.filter(order => order.status === 'out_for_delivery');
    return ordersData.filter(order => order.status === status);
  };

  const updateOrderStatus = (orderId: string, newStatus: string, additionalData?: any) => {
    setOrdersData(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: newStatus,
          isNew: newStatus === 'new',
          estimatedTime: newStatus === 'pending' ? 'On the way' : 
                        newStatus === 'delivered' ? 'Delivered' : 
                        newStatus === 'confirmed' ? 'Ready for delivery' : order.estimatedTime,
          ...additionalData
        };
      }
      return order;
    }));
  };

  const getPaginatedOrders = (orders: any[]) => {
    const mobileLimit = isMobile ? 15 : itemsPerPage;
    
    if (activeTab === 'new') {
      return isMobile ? orders.slice(0, mobileLimit) : orders;
    }
    
    const startIndex = (currentPage - 1) * mobileLimit;
    const endIndex = startIndex + mobileLimit;
    return orders.slice(startIndex, endIndex);
  };

  const getTotalPages = (orders: any[]) => {
    return Math.ceil(orders.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const PaginationControls = ({ orders }: { orders: any[] }) => {
    if (activeTab === 'new') return null;
    
    const totalPages = getTotalPages(orders);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} orders
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="h-7 w-7 p-0 text-xs"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  const OrderItem = ({ order }: { order: any }) => (
    <div className={`p-4 ${order.status === 'pending' ? 'bg-blue-50 border-l-4 border-blue-500' : order.refunds?.length > 0 ? 'bg-orange-50 border-l-4 border-orange-400' : 'bg-white'} cursor-pointer hover:bg-gray-50 min-h-[120px]`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-gray-900">{order.order_number}</h3>
          {order.status === 'pending' && <Bell className="h-3 w-3 text-blue-500 animate-pulse" />}
        </div>
        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 text-xs px-2 py-1`}>
          {getStatusIcon(order.status)}
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {/* Order Items Preview */}
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2">
            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-3 overflow-x-auto">
            {order.items?.slice(0, isMobile ? 2 : 3).map((item, index) => (
              <div key={index} className="flex items-center gap-2 flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center overflow-hidden">
                  {item.product_details?.images?.[0]?.image_url ? (
                    <img
                      src={getImageUrl(item.product_details.images[0].image_url)}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.innerHTML = '<span class="text-xs text-gray-400">📦</span>';
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">📦</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-700 font-medium truncate max-w-[80px]">{item.product_name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[80px] capitalize">{item.product_details?.category || 'Item'}</p>
                  {item.product_selections && Object.keys(item.product_selections).length > 0 && (
                    <div className="text-xs text-blue-600 truncate max-w-[80px] mt-1">
                      {Object.entries(item.product_selections).map(([key, value]) => (
                        <div key={key} className="capitalize">
                          {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      )).slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {order.items?.length > (isMobile ? 2 : 3) && (
              <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-600">+{order.items.length - (isMobile ? 2 : 3)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate text-gray-700 min-w-0">{order.customer_details?.username || order.delivery_name}</span>
        </div>

        {/* Delivery Info */}
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate text-gray-700 min-w-0">{order.delivery_address}</span>
        </div>

        {/* Total Amount */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-emerald-600">
              ₹{parseFloat(order.total_amount || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedOrder(order)}>
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            {order.status === 'pending' && (
              <Button 
                size="sm" 
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const { response } = await apiRequest(`/orders/${order.id}/accept/`, {
                      method: 'POST'
                    });
                    
                    if (response.ok) {
                      updateOrderStatus(order.id, 'confirmed');
                      setNewOrdersCount(prev => Math.max(0, prev - 1));
                      
                      // Trigger events for cross-component communication
                      window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
                        detail: { orderId: order.id, status: 'confirmed', type: 'accept' }
                      }));
                      
                      window.dispatchEvent(new CustomEvent('newNotification', {
                        detail: {
                          type: 'order',
                          title: `Order #${order.order_number} Accepted`,
                          message: 'Order has been accepted by vendor',
                          data: { orderId: order.id, status: 'confirmed' }
                        }
                      }));
                      
                      // Refresh after a delay
                      setTimeout(() => fetchVendorOrders(), 1000);
                    }
                  } catch (error) {
                    console.error('Error accepting order:', error);
                  }
                }}
              >
                Accept
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <VendorPage title="Orders">
      <div className="bg-gray-50 min-h-screen pb-20 max-w-full overflow-x-hidden">
        {loadingOrders ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        ) : ordersData.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Orders will appear here when customers place them.</p>
          </div>
        ) : (
          <>
            <div className="p-4">
              <div className="overflow-x-auto">
                <div className="flex gap-3 pb-2">
                  <div className="min-w-[120px] bg-white rounded-lg p-3 text-center border-l-4 border-blue-500">
                    <p className="text-xl font-bold text-blue-600">{ordersData.filter(o => o.status === 'pending').length}</p>
                    <p className="text-xs text-gray-600">New Orders</p>
                  </div>
                  <div className="min-w-[120px] bg-white rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-yellow-600">{ordersData.filter(o => o.status === 'out_for_delivery').length}</p>
                    <p className="text-xs text-gray-600">Shipped</p>
                  </div>
                  <div className="min-w-[120px] bg-white rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-600">{ordersData.filter(o => o.status === 'confirmed').length}</p>
                    <p className="text-xs text-gray-600">Confirmed</p>
                  </div>
                  <div className="min-w-[120px] bg-white rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{ordersData.filter(o => o.status === 'delivered').length}</p>
                    <p className="text-xs text-gray-600">Delivered</p>
                  </div>
                  <div className="min-w-[120px] bg-white rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-600">{ordersData.filter(o => o.status === 'cancelled').length}</p>
                    <p className="text-xs text-gray-600">Cancelled</p>
                  </div>
                  <div className="min-w-[120px] bg-white rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-600">{ordersData.filter(o => o.refunds?.length > 0).length}</p>
                    <p className="text-xs text-gray-600">Returns</p>
                  </div>
                  <div className="min-w-[120px] bg-white rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-600">{ordersData.length}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                </div>
                
                <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setCurrentPage(1); }} className="w-full">
                  <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide">
                    <TabsList className="flex w-max bg-transparent h-auto p-2 gap-3">
                      <TabsTrigger value="all" className="text-xs py-2 px-3 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-gray-600 rounded-none whitespace-nowrap flex-shrink-0">
                        All <span className="font-bold ml-2">({ordersData.length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="new" className="text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none whitespace-nowrap flex-shrink-0">
                        New <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'pending').length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="confirmed" className="text-xs py-2 px-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none whitespace-nowrap flex-shrink-0">
                        Confirmed <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'confirmed').length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="delivered" className="text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none whitespace-nowrap flex-shrink-0">
                        Delivered <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'delivered').length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="cancelled" className="text-xs py-2 px-3 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-gray-600 rounded-none whitespace-nowrap flex-shrink-0">
                        Cancelled <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'cancelled').length})</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="all" className="mt-0">
                    <div className="divide-y divide-gray-100">
                      {getPaginatedOrders(ordersData).map((order) => (
                        <OrderItem key={order.id} order={order} />
                      ))}
                    </div>
                    <PaginationControls orders={ordersData} />
                  </TabsContent>
                  
                  <TabsContent value="new" className="mt-0">
                    <div className="divide-y divide-gray-100">
                      {getPaginatedOrders(filterOrdersByStatus('new')).map((order) => (
                        <OrderItem key={order.id} order={order} />
                      ))}
                    </div>
                    <PaginationControls orders={filterOrdersByStatus('new')} />
                  </TabsContent>
                  
                  <TabsContent value="confirmed" className="mt-0">
                    <div className="divide-y divide-gray-100">
                      {getPaginatedOrders(filterOrdersByStatus('confirmed')).map((order) => (
                        <OrderItem key={order.id} order={order} />
                      ))}
                    </div>
                    <PaginationControls orders={filterOrdersByStatus('confirmed')} />
                  </TabsContent>
                  
                  <TabsContent value="delivered" className="mt-0">
                    <div className="divide-y divide-gray-100">
                      {getPaginatedOrders(filterOrdersByStatus('delivered')).map((order) => (
                        <OrderItem key={order.id} order={order} />
                      ))}
                    </div>
                    <PaginationControls orders={filterOrdersByStatus('delivered')} />
                  </TabsContent>
                  
                  <TabsContent value="cancelled" className="mt-0">
                    <div className="divide-y divide-gray-100">
                      {getPaginatedOrders(filterOrdersByStatus('cancelled')).map((order) => (
                        <OrderItem key={order.id} order={order} />
                      ))}
                    </div>
                    <PaginationControls orders={filterOrdersByStatus('cancelled')} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
        
        {/* Order Details Sheet */}
        <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-left">
                Order Details - {selectedOrder?.order_number}
              </SheetTitle>
            </SheetHeader>
            
            {selectedOrder && (
              <div className="space-y-4 overflow-y-auto h-full pb-20">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="space-y-1 text-xs">
                    <p><span className="font-medium">Name:</span> {selectedOrder.customer_details?.username || selectedOrder.delivery_name}</p>
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span className="font-medium">Phone:</span> {selectedOrder.customer_details?.phone_number || selectedOrder.delivery_phone}
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium">Address:</span> {selectedOrder.delivery_address}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-3">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order Items
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any, index: number) => (
                      <div key={index} className="py-1 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.product_details?.images?.[0]?.image_url ? (
                              <img
                                src={getImageUrl(item.product_details.images[0].image_url)}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement.innerHTML = '<span class="text-xs text-gray-400">📦</span>';
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">📦</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 break-words">{item.product_name}</p>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                            <p className="text-sm font-semibold text-emerald-600 mt-1">₹{item.total_price}</p>
                          </div>
                        </div>
                      </div>
                    )) || []}
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-3">
                  <h3 className="font-semibold text-sm mb-3">Payment Details</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{parseFloat(selectedOrder.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-3">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Order Timeline
                  </h3>
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Ordered:</span> {new Date(selectedOrder.created_at).toLocaleDateString()} at {new Date(selectedOrder.created_at).toLocaleTimeString()}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <Badge className={`${getStatusColor(selectedOrder.status)} text-xs`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Image Preview Modal */}
        <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
          <DialogContent className="max-w-5xl max-h-[95vh] p-4">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Image Preview
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
              <img 
                src={previewImage} 
                alt="Preview"
                className="max-w-full max-h-[75vh] object-contain rounded shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.svg';
                  e.currentTarget.alt = 'Image not found';
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VendorPage>
  );
};

export default VendorOrders;