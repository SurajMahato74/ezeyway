import React, { useState, useEffect, useRef } from 'react';
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
import { reviewService } from '@/services/reviewService';
import { useToast } from "@/hooks/use-toast";

const VendorOrders: React.FC = () => {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [shippingOrder, setShippingOrder] = useState<any>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(2);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryBoyPhone, setDeliveryBoyPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [isDeliveryFeeReadonly, setIsDeliveryFeeReadonly] = useState(false);
  const [deliveryFeeSource, setDeliveryFeeSource] = useState('');
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const itemsPerPage = 10;
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<number>>(new Set());
  const [orderReviews, setOrderReviews] = useState<{[key: number]: any[]}>({});
  
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

  // Debounce timer for notifications
  const notificationDebounceRef = useRef(null);

  // WebSocket order update handler
  useEffect(() => {
    const handleWebSocketOrderUpdate = (event) => {
      const data = event.detail;
      if (data.type === 'order_update' || data.type === 'order_status_change' || data.type === 'refund_update') {
        console.log('WebSocket order update:', data);
        // Refresh orders immediately
        fetchVendorOrders();
      }
    };

    window.addEventListener('websocket_message', handleWebSocketOrderUpdate);
    return () => window.removeEventListener('websocket_message', handleWebSocketOrderUpdate);
  }, []);

  // Auto-refresh orders every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchVendorOrders();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Initial order loading - ONCE ONLY
  useEffect(() => {
    console.log('📦 Loading initial orders...');
    fetchVendorOrders();

    // Listen for order notifications to refresh orders (only when page is visible and on vendor orders page)
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'order' && !document.hidden && window.location.pathname.includes('/vendor/orders')) {
        // Clear existing debounce timer
        if (notificationDebounceRef.current) {
          clearTimeout(notificationDebounceRef.current);
        }

        // Debounce the refresh to prevent multiple rapid calls
        notificationDebounceRef.current = setTimeout(() => {
          if (!document.hidden && window.location.pathname.includes('/vendor/orders')) {
            fetchVendorOrders();
          }
        }, 2000); // Increased to 2 seconds
      }
    };

    // Listen for real-time order status updates from customer
    const handleOrderStatusUpdate = (event: CustomEvent) => {
      const { orderId, status, type } = event.detail;
      console.log('Order status update received:', { orderId, status, type });

      // Only refresh if we're on the vendor orders page
      if (window.location.pathname.includes('/vendor/orders')) {
        // Immediately refresh orders to show updated status
        fetchVendorOrders();
      }
    };

    // Handle visibility change to refresh orders when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && window.location.pathname.includes('/vendor/orders')) {
        // Refresh orders when page becomes visible after being hidden
        fetchVendorOrders();
      }
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    window.addEventListener('orderStatusUpdated', handleOrderStatusUpdate as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
      window.removeEventListener('orderStatusUpdated', handleOrderStatusUpdate as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Clear debounce timer on cleanup
      if (notificationDebounceRef.current) {
        clearTimeout(notificationDebounceRef.current);
      }
    };
  }, []); // Empty dependency array to prevent re-renders

  const fetchVendorOrders = async () => {
    try {
      setLoadingOrders(true);
      const { apiRequest } = await import('@/utils/apiUtils');
      
      // Mobile-optimized request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), isMobile ? 8000 : 30000);

      const apiUrl = '/vendor/orders/';
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
    if (status === 'pending') return ordersData.filter(order => order.status === 'confirmed');
    if (status === 'shipped') return ordersData.filter(order => order.status === 'out_for_delivery' || order.status === 'Out_for_delivery');
    if (status === 'delivered') return ordersData.filter(order => order.status === 'delivered');
    if (status === 'cancelled') return ordersData.filter(order => order.status === 'cancelled');
    if (status === 'returned') return ordersData.filter(order => order.status === 'returned');
    if (status === 'returns') return ordersData.filter(order => order.refunds?.length > 0);
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

  const loadOrderReviews = async (orderId: number) => {
    if (orderReviews[orderId]) return; // Already loaded

    try {
      const reviews = await reviewService.getOrderReviews(orderId);
      setOrderReviews(prev => ({
        ...prev,
        [orderId]: reviews
      }));
    } catch (error) {
      console.error('Error loading order reviews:', error);
    }
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
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
              setSelectedOrder(order);
              if (order.status === 'delivered') {
                loadOrderReviews(order.id);
              }
            }}>
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
            {order.status?.toLowerCase() === 'out_for_delivery' && (
              <Button
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const { response } = await apiRequest(`/vendor/orders/${order.id}/update-status/`, {
                      method: 'POST',
                      body: JSON.stringify({ status: 'delivered' })
                    });

                    if (response.ok) {
                      updateOrderStatus(order.id, 'delivered');

                      // Trigger events for cross-component communication
                      window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
                        detail: { orderId: order.id, status: 'delivered', type: 'deliver' }
                      }));

                      window.dispatchEvent(new CustomEvent('newNotification', {
                        detail: {
                          type: 'order',
                          title: `Order #${order.order_number} Delivered`,
                          message: 'Order has been marked as delivered',
                          data: { orderId: order.id, status: 'delivered' }
                        }
                      }));

                      // Refresh after a delay
                      setTimeout(() => fetchVendorOrders(), 1000);
                    }
                  } catch (error) {
                    console.error('Error delivering order:', error);
                  }
                }}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Delivered
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button
                size="sm"
                className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={async (e) => {
                  e.stopPropagation();
                  setShippingOrder(order);
                  setShowDeliveryForm(true);

                  // Determine delivery fee from order data directly
                  const hasFreeDelivery = order.items?.some(item => item.product_details?.free_delivery === true);
                  const hasCustomFee = order.items?.some(item =>
                    item.product_details?.custom_delivery_fee_enabled === true &&
                    item.product_details?.custom_delivery_fee !== null &&
                    item.product_details?.custom_delivery_fee !== undefined
                  );

                  if (hasFreeDelivery) {
                    // Free delivery - no fee input needed
                    setIsDeliveryFeeReadonly(true);
                    setDeliveryFee('0');
                    setDeliveryFeeSource('Free delivery');
                  } else if (hasCustomFee) {
                    // Custom delivery fee - use the first custom fee found
                    const customFee = order.items?.find(item =>
                      item.product_details?.custom_delivery_fee_enabled === true &&
                      item.product_details?.custom_delivery_fee !== null
                    )?.product_details?.custom_delivery_fee || 0;
                    setIsDeliveryFeeReadonly(false);
                    setDeliveryFee(customFee.toString());
                    setDeliveryFeeSource(`Custom fee: ₹${customFee}`);
                  } else {
                    // To be determined - allow user input
                    setIsDeliveryFeeReadonly(false);
                    setDeliveryFee('');
                    setDeliveryFeeSource('Enter delivery fee');
                  }
                }}
              >
                <Truck className="h-3 w-3 mr-1" />
                Ship
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
                    <p className="text-xl font-bold text-yellow-600">{ordersData.filter(o => o.status === 'confirmed').length}</p>
                    <p className="text-xs text-gray-600">Confirmed</p>
                  </div>
                  <div className="min-w-[120px] bg-white rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-purple-600">{ordersData.filter(o => o.status === 'out_for_delivery' || o.status === 'Out_for_delivery').length}</p>
                    <p className="text-xs text-gray-600">On the Way</p>
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
                      <TabsTrigger value="pending" className="text-xs py-2 px-3 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-600 data-[state=active]:border-b-2 data-[state=active]:border-yellow-600 rounded-none whitespace-nowrap flex-shrink-0">
                        Confirmed <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'confirmed').length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="shipped" className="text-xs py-2 px-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none whitespace-nowrap flex-shrink-0">
                        On the Way <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'out_for_delivery' || o.status === 'Out_for_delivery').length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="delivered" className="text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none whitespace-nowrap flex-shrink-0">
                        Delivered <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'delivered').length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="cancelled" className="text-xs py-2 px-3 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-gray-600 rounded-none whitespace-nowrap flex-shrink-0">
                            Cancelled <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'cancelled').length})</span>
                          </TabsTrigger>
                          <TabsTrigger value="returns" className="text-xs py-2 px-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none whitespace-nowrap flex-shrink-0">
                            Returns <span className="font-bold ml-2">({ordersData.filter(o => o.refunds?.length > 0).length})</span>
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
                  
                  <TabsContent value="pending" className="mt-0">
                    <div className="divide-y divide-gray-100">
                      {getPaginatedOrders(filterOrdersByStatus('pending')).map((order) => (
                        <OrderItem key={order.id} order={order} />
                      ))}
                    </div>
                    <PaginationControls orders={filterOrdersByStatus('pending')} />
                  </TabsContent>

                  <TabsContent value="shipped" className="mt-0">
                    <div className="divide-y divide-gray-100">
                      {getPaginatedOrders(filterOrdersByStatus('shipped')).map((order) => (
                        <OrderItem key={order.id} order={order} />
                      ))}
                    </div>
                    <PaginationControls orders={filterOrdersByStatus('shipped')} />
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

                  <TabsContent value="returns" className="mt-0">
                    <div className="divide-y divide-gray-100">
                      {getPaginatedOrders(filterOrdersByStatus('returns')).map((order) => (
                        <div key={order.id} className="p-4">
                          <div className="bg-white rounded-lg border">
                            <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => {
                              setSelectedOrder(order);
                            }}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-sm text-gray-900">Order #{order.order_number}</h3>
                                </div>
                                <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1 text-xs px-2 py-1">
                                  <RotateCcw className="h-3 w-3" />
                                  Return Request
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <User className="h-4 w-4" />
                                  <span className="truncate">{order.customer_details?.username || order.delivery_name}</span>
                                </div>

                                {order.refunds?.map(refund => (
                                  <div key={refund.id} className="bg-orange-50 p-3 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium">Return Reason:</span>
                                      <Badge className={`text-xs ${
                                        refund.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                                        refund.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        refund.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        refund.status === 'appeal' ? 'bg-purple-100 text-purple-800' :
                                        refund.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                                        refund.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-700 capitalize">{refund.reason.replace('_', ' ')}</p>
                                    {refund.customer_notes && (
                                      <p className="text-xs text-gray-600">"{refund.customer_notes}"</p>
                                    )}
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">Amount:</span> Rs {refund.requested_amount}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">Method:</span> {refund.refund_method}
                                    </div>

                                    {refund.evidence_photos?.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium mb-1">Evidence Documents:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {refund.evidence_photos.map((doc, idx) => {
                                            const isImage = doc.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                            let imageUrl;
                                            if (doc.filename.startsWith('http')) {
                                              imageUrl = doc.filename;
                                            } else if (doc.filename.startsWith('/media/')) {
                                              imageUrl = `${API_CONFIG.BASE_URL}${doc.filename}`;
                                            } else {
                                              imageUrl = `${API_CONFIG.BASE_URL}/media/${doc.filename}`;
                                            }
                                            return (
                                              <div
                                                key={idx}
                                                className="bg-blue-100 p-2 rounded text-xs cursor-pointer hover:bg-blue-200 transition-colors flex items-center gap-1"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (isImage) {
                                                    setPreviewImage(imageUrl);
                                                    setShowImagePreview(true);
                                                  } else {
                                                    window.open(imageUrl, '_blank');
                                                  }
                                                }}
                                              >
                                                {isImage ? (
                                                  <Eye className="h-3 w-3 text-blue-600" />
                                                ) : (
                                                  <Package className="h-3 w-3 text-blue-600" />
                                                )}
                                                <span className="text-blue-800">{doc.filename || `Document ${idx + 1}`}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {refund.status === 'requested' && (
                                      <div className="space-y-3 pt-2">
                                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                          <strong>Note:</strong> Customer has provided payment details. Approve to process the refund or reject the return request.
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                const { response } = await apiRequest(`/vendor/refunds/${refund.id}/approve/`, {
                                                  method: 'POST',
                                                  body: JSON.stringify({
                                                    status: 'approved',
                                                    admin_notes: 'Return request approved by vendor'
                                                  })
                                                });

                                                if (response.ok) {
                                                  toast({
                                                    title: "Return Approved",
                                                    description: "Return request has been approved. Now you can process the refund.",
                                                  });
                                                  fetchVendorOrders();
                                                }
                                              } catch (error) {
                                                toast({
                                                  title: "Error",
                                                  description: "Failed to approve return.",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                          >
                                            Approve
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                const { response } = await apiRequest(`/vendor/refunds/${refund.id}/reject/`, {
                                                  method: 'POST',
                                                  body: JSON.stringify({
                                                    status: 'rejected',
                                                    admin_notes: 'Return request rejected by vendor'
                                                  })
                                                });

                                                if (response.ok) {
                                                  toast({
                                                    title: "Return Rejected",
                                                    description: "Return request has been rejected.",
                                                  });
                                                  fetchVendorOrders();
                                                }
                                              } catch (error) {
                                                toast({
                                                  title: "Error",
                                                  description: "Failed to reject return.",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                          >
                                            Reject
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {refund.status === 'approved' && (
                                      <div className="space-y-3 pt-2">
                                        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                          <strong>Approved:</strong> Return approved. Now process the refund payment.
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                          <h4 className="text-sm font-medium text-gray-700">Customer Payment Details:</h4>
                                          {refund.refund_method === 'esewa' && refund.esewa_number && (
                                            <p className="text-xs text-gray-600"><strong>eSewa:</strong> {refund.esewa_number}</p>
                                          )}
                                          {refund.refund_method === 'khalti' && refund.khalti_number && (
                                            <p className="text-xs text-gray-600"><strong>Khalti:</strong> {refund.khalti_number}</p>
                                          )}
                                          {refund.refund_method === 'bank' && (
                                            <>
                                              <p className="text-xs text-gray-600"><strong>Bank:</strong> {refund.bank_account_name}</p>
                                              <p className="text-xs text-gray-600"><strong>Account:</strong> {refund.bank_account_number}</p>
                                              <p className="text-xs text-gray-600"><strong>Branch:</strong> {refund.bank_branch}</p>
                                            </>
                                          )}
                                          <p className="text-xs text-gray-600"><strong>Amount:</strong> Rs {refund.requested_amount}</p>
                                          <p className="text-xs text-gray-600"><strong>Method:</strong> {refund.refund_method}</p>
                                          {refund.refund_method === 'khalti' && refund.khalti_number && (
                                            <p className="text-xs text-gray-600"><strong>Khalti Number:</strong> {refund.khalti_number}</p>
                                          )}
                                          {refund.refund_method === 'esewa' && refund.esewa_number && (
                                            <p className="text-xs text-gray-600"><strong>eSewa Number:</strong> {refund.esewa_number}</p>
                                          )}
                                          {refund.refund_method === 'bank' && (
                                            <>
                                              {refund.bank_account_name && <p className="text-xs text-gray-600"><strong>Account Name:</strong> {refund.bank_account_name}</p>}
                                              {refund.bank_account_number && <p className="text-xs text-gray-600"><strong>Account Number:</strong> {refund.bank_account_number}</p>}
                                              {refund.bank_branch && <p className="text-xs text-gray-600"><strong>Bank Branch:</strong> {refund.bank_branch}</p>}
                                            </>
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          className="w-full bg-blue-600 hover:bg-blue-700"
                                          onClick={async (e) => {
                                            e.stopPropagation();

                                            try {
                                              const { response } = await apiRequest(`/vendor/refunds/${refund.id}/approve/`, {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                  status: 'processed',
                                                  admin_notes: 'Refund payment processed by vendor'
                                                })
                                              });

                                              if (response.ok) {
                                                toast({
                                                  title: "Refund Processed",
                                                  description: "Refund payment has been transferred to customer.",
                                                });
                                                fetchVendorOrders();
                                              } else {
                                                const errorData = await response.json();
                                                toast({
                                                  title: "Error",
                                                  description: errorData.error || "Failed to process refund.",
                                                  variant: "destructive",
                                                });
                                              }
                                            } catch (error) {
                                              toast({
                                                title: "Error",
                                                description: "Failed to process refund.",
                                                variant: "destructive",
                                              });
                                            }
                                          }}
                                        >
                                          Mark as Refunded
                                        </Button>
                                      </div>
                                    )}

                                    {refund.status === 'processed' && (
                                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                                        <strong>Processed:</strong> Refund payment has been transferred to customer.
                                      </div>
                                    )}

                                    {refund.status === 'completed' && (
                                      <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded mt-2">
                                        <strong>Completed:</strong> Refund process finished successfully.
                                      </div>
                                    )}

                                    {refund.status === 'rejected' && (
                                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                                        <strong>Rejected:</strong> Return request was rejected.
                                      </div>
                                    )}

                                    {refund.admin_notes && (
                                      <div className="text-xs text-gray-600 mt-2">
                                        <span className="font-medium">Response:</span> {refund.admin_notes}
                                      </div>
                                    )}
                                  </div>
                                ))}

                                <div className="flex justify-between items-center pt-2 border-t">
                                  <span className="font-semibold text-lg text-emerald-600">
                                    Rs {parseFloat(order.total_amount || 0).toFixed(2)}
                                  </span>
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                  }}>
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filterOrdersByStatus('returns').length === 0 && (
                        <div className="text-center py-16">
                          <RotateCcw className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">No returns yet</h3>
                          <p className="text-gray-500">Return requests will appear here</p>
                        </div>
                      )}
                    </div>
                    <PaginationControls orders={filterOrdersByStatus('returns')} />
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

                {/* Reviews Section for Delivered Orders */}
                {selectedOrder.status === 'delivered' && (
                  <div className="bg-white border rounded-lg p-3">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Customer Reviews
                    </h3>
                    {orderReviews[selectedOrder.id] && orderReviews[selectedOrder.id].length > 0 ? (
                      <div className="space-y-3">
                        {orderReviews[selectedOrder.id].map((review: any, index: number) => (
                          <div key={index} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, starIndex) => (
                                    <Star
                                      key={starIndex}
                                      className={`h-3 w-3 ${starIndex < (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-medium text-gray-700">{review.rating || 0}/5</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-xs text-gray-700 mb-2">{review.comment}</p>
                            )}
                            {review.images && review.images.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto">
                                {review.images.map((image: any, imgIndex: number) => (
                                  <div
                                    key={imgIndex}
                                    className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                                    onClick={() => {
                                      setPreviewImage(getImageUrl(image.image_url));
                                      setShowImagePreview(true);
                                    }}
                                  >
                                    <img
                                      src={getImageUrl(image.image_url)}
                                      alt={`Review image ${imgIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement.innerHTML = '<span className="text-xs text-gray-400">📷</span>';
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No reviews yet for this order</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Delivery Form Sheet */}
        <Sheet open={showDeliveryForm} onOpenChange={(open) => {
          setShowDeliveryForm(open);
          if (!open) {
            setShippingOrder(null);
          }
        }}>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Ship Order - {shippingOrder?.order_number}</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeliveryForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      const deliveryData = {
                        status: 'out_for_delivery',
                        delivery_boy_phone: deliveryBoyPhone,
                        vehicle_number: vehicleNumber,
                        vehicle_color: vehicleColor,
                        estimated_delivery_time: estimatedDeliveryTime,
                        delivery_fee: parseFloat(deliveryFee) || 0,
                      };

                      const { response } = await apiRequest(`/vendor/orders/${shippingOrder.id}/ship/`, {
                        method: 'POST',
                        body: JSON.stringify(deliveryData)
                      });

                      if (response.ok) {
                        updateOrderStatus(shippingOrder.id, 'out_for_delivery', deliveryData);
                        setShowDeliveryForm(false);
                        setDeliveryBoyPhone('');
                        setVehicleNumber('');
                        setVehicleColor('');
                        setEstimatedDeliveryTime('');
                        setDeliveryFee('');
                        setCalculatedDeliveryFee(null);
                        setIsDeliveryFeeReadonly(false);
                        setDeliveryFeeSource('');
                        setShippingOrder(null);

                        // Trigger events for cross-component communication
                        window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
                          detail: { orderId: shippingOrder.id, status: 'out_for_delivery', type: 'ship' }
                        }));

                        window.dispatchEvent(new CustomEvent('newNotification', {
                          detail: {
                            type: 'order',
                            title: `Order #${shippingOrder.order_number} Shipped`,
                            message: 'Order has been shipped successfully',
                            data: { orderId: shippingOrder.id, status: 'out_for_delivery' }
                          }
                        }));

                        // Refresh after a delay
                        setTimeout(() => fetchVendorOrders(), 1000);
                      }
                    } catch (error) {
                      console.error('Error shipping order:', error);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!deliveryBoyPhone || !vehicleNumber || !vehicleColor || !estimatedDeliveryTime}
                >
                  Confirm & Ship
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deliveryBoyPhone">Delivery Boy Phone</Label>
                <Input
                  id="deliveryBoyPhone"
                  type="tel"
                  placeholder="Enter delivery boy phone number"
                  value={deliveryBoyPhone}
                  onChange={(e) => setDeliveryBoyPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="Enter vehicle number"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vehicleColor">Vehicle Color</Label>
                <Input
                  id="vehicleColor"
                  placeholder="Enter vehicle color"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estimatedDeliveryTime">Estimated Delivery Time (hours)</Label>
                <Input
                  id="estimatedDeliveryTime"
                  type="number"
                  min="1"
                  max="72"
                  placeholder="Enter hours (e.g., 2)"
                  value={estimatedDeliveryTime}
                  onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="deliveryFee">Delivery Fee</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  step="0.01"
                  placeholder={deliveryFeeSource === 'Enter delivery fee' ? 'Enter delivery fee' : 'Delivery fee'}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  disabled={isDeliveryFeeReadonly}
                />
                {deliveryFeeSource && (
                  <p className="text-xs text-gray-500 mt-1">{deliveryFeeSource}</p>
                )}
              </div>
            </div>
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