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
  
  // Fetch real orders only
  useEffect(() => {
    fetchVendorOrders();
    
    // Listen for order notifications to refresh orders
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'order') {
        fetchVendorOrders();
      }
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    
    // Disable auto-refresh on mobile for better performance
    let interval;
    if (!isMobile) {
      interval = setInterval(() => {
        fetchVendorOrders();
      }, 60000);
    }
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
      if (interval) clearInterval(interval);
    };
  }, [isMobile]);

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
        console.log('📦 Orders received:', orders.length, orders);
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



  // Notification system for new orders
  useEffect(() => {
    if (newOrdersCount > 0) {
      const interval = setInterval(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${newOrdersCount} New Order${newOrdersCount > 1 ? 's' : ''} Waiting!`, {
            icon: '/favicon.ico',
            body: 'Please check and confirm your orders'
          });
        }
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [newOrdersCount]);
  
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  const handleViewAll = () => {
    setActiveTab('new');
    setCurrentPage(1);
  };

  const getPaginatedOrders = (orders: any[]) => {
    const mobileLimit = isMobile ? 15 : itemsPerPage;
    
    // Limit items on mobile for better performance
    if (activeTab === 'new') {
      return isMobile ? orders.slice(0, mobileLimit) : orders;
    }
    // Pagination for other tabs
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
    // No pagination controls for new orders
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

        {/* Customer Info with Message Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 min-w-0">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{order.customer_details?.username || order.delivery_name}</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 ml-2 flex-shrink-0" 
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const customerId = order.customer_details?.id;
                if (customerId) {
                  // Navigate to messages page and trigger conversation creation
                  window.location.href = `/vendor/messages?start_conversation=${customerId}&customer_name=${encodeURIComponent(order.customer_details?.username || order.delivery_name)}&order_id=${order.id}`;
                } else {
                  // Fallback: navigate to messages with customer info
                  const customerPhone = order.customer_details?.phone_number || order.delivery_phone;
                  const customerName = order.customer_details?.username || order.delivery_name;
                  window.location.href = `/vendor/messages?customer_phone=${encodeURIComponent(customerPhone)}&customer_name=${encodeURIComponent(customerName)}&order_id=${order.id}`;
                }
              } catch (error) {
                console.error('Error opening conversation:', error);
              }
            }}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>

        {/* Delivery Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{order.delivery_address}</span>
        </div>

        {/* Review indicator for delivered orders */}
        {order.status === 'delivered' && order.review && (
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-600 font-medium text-xs">
              Rated {order.review.overall_rating}/5
            </span>
          </div>
        )}

        {/* Return status indicator for any order with refunds */}
        {order.refunds?.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
            {order.refunds.map(refund => (
              <div key={refund.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-700 font-medium text-xs capitalize">
                    {refund.reason.replace('_', ' ')}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  refund.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                  refund.status === 'approved' ? 'bg-green-100 text-green-800' :
                  refund.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  refund.status === 'appeal' ? 'bg-purple-100 text-purple-800' :
                  refund.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                  refund.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Total Amount */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-semibold text-lg text-emerald-600">
            ₹{parseFloat(order.total_amount).toFixed(2)}
          </span>
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
                      // Refresh orders to get updated data
                      fetchVendorOrders();
                      setNewOrdersCount(prev => Math.max(0, prev - 1));
                      
                      // Trigger wallet refresh event
                      window.dispatchEvent(new CustomEvent('walletUpdated'));
                    }
                  } catch (error) {
                    console.error('Error accepting order:', error);
                  }
                }}
              >
                Accept
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button 
                size="sm" 
                className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrder(order);
                  
                  // Auto-calculate delivery fee based on product settings
                  let calculatedFee = '';
                  let feeSource = '';
                  let isReadonly = false;
                  
                  if (order.items && order.items.length > 0) {
                    // Check if any product has free delivery
                    const hasFreeDelivery = order.items.some(item => 
                      item.product_details?.free_delivery === true
                    );
                    
                    if (hasFreeDelivery) {
                      calculatedFee = '0';
                      feeSource = 'Free delivery (set by vendor)';
                      isReadonly = true;
                    } else {
                      // Check for custom delivery fee
                      const customDeliveryItem = order.items.find(item => 
                        item.product_details?.custom_delivery_fee_enabled === true &&
                        item.product_details?.custom_delivery_fee > 0
                      );
                      
                      if (customDeliveryItem) {
                        calculatedFee = customDeliveryItem.product_details.custom_delivery_fee.toString();
                        feeSource = `Custom delivery fee (₹${customDeliveryItem.product_details.custom_delivery_fee})`;
                        isReadonly = true;
                      } else {
                        // No specific delivery settings, allow manual entry
                        calculatedFee = '';
                        feeSource = 'Enter delivery charge manually';
                        isReadonly = false;
                      }
                    }
                  }
                  
                  setDeliveryFee(calculatedFee);
                  setDeliveryFeeSource(feeSource);
                  setIsDeliveryFeeReadonly(isReadonly);
                  setShowDeliveryForm(true);
                }}
              >
                Ship
              </Button>
            )}
            {order.status === 'out_for_delivery' && (
              <Button 
                size="sm" 
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const { response } = await apiRequest(`vendor/orders/${order.id}/status/`, {
                      method: 'POST',
                      body: JSON.stringify({
                        status: 'delivered',
                        notes: 'Marked as delivered by vendor'
                      })
                    });
                    
                    if (response.ok) {
                      fetchVendorOrders();
                    }
                  } catch (error) {
                    console.error('Error marking as delivered:', error);
                  }
                }}
              >
                Delivered
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
                  <TabsTrigger value="pending" className="text-xs py-2 px-3 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-600 data-[state=active]:border-b-2 data-[state=active]:border-yellow-600 rounded-none whitespace-nowrap flex-shrink-0">
                    Shipped <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'out_for_delivery').length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="delivered" className="text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none whitespace-nowrap flex-shrink-0">
                    Delivered <span className="font-bold ml-2">({ordersData.filter(o => o.status === 'delivered').length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="returns" className="text-xs py-2 px-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none whitespace-nowrap flex-shrink-0">
                    Returns <span className="font-bold ml-2">({ordersData.filter(o => o.refunds?.length > 0).length})</span>
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
              
              <TabsContent value="pending" className="mt-0">
                <div className="divide-y divide-gray-100">
                  {getPaginatedOrders(filterOrdersByStatus('pending')).map((order) => (
                    <OrderItem key={order.id} order={order} />
                  ))}
                </div>
                <PaginationControls orders={filterOrdersByStatus('pending')} />
              </TabsContent>
              
              <TabsContent value="delivered" className="mt-0">
                <div className="divide-y divide-gray-100">
                  {getPaginatedOrders(filterOrdersByStatus('delivered')).map((order) => (
                    <OrderItem key={order.id} order={order} />
                  ))}
                </div>
                <PaginationControls orders={filterOrdersByStatus('delivered')} />
              </TabsContent>
              
              <TabsContent value="returns" className="mt-0">
                <div className="divide-y divide-gray-100">
                  {ordersData.filter(order => order.refunds?.length > 0).map((order) => (
                    <div key={order.id} className="p-4 bg-white cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-gray-900">{order.order_number}</h3>
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
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-700 capitalize">{refund.reason.replace('_', ' ')}</p>
                            {refund.customer_notes && (
                              <p className="text-xs text-gray-600">"{refund.customer_notes}"</p>
                            )}
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Amount:</span> ₹{refund.requested_amount}
                            </div>
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Method:</span> {refund.refund_method}
                            </div>
                            
                            {refund.status === 'requested' && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={async () => {
                                    const reason = prompt('Reason for rejection:');
                                    if (!reason) return;
                                    
                                    try {
                                      const { response } = await apiRequest(`/admin/refunds/${refund.id}/process/`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          action: 'reject',
                                          admin_notes: reason
                                        })
                                      });
                                      
                                      if (response.ok) {
                                        fetchVendorOrders();
                                      }
                                    } catch (error) {
                                      console.error('Error rejecting return:', error);
                                    }
                                  }}
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    try {
                                      const { response } = await apiRequest(`/admin/refunds/${refund.id}/process/`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          action: 'approve',
                                          approved_amount: refund.requested_amount,
                                          admin_notes: 'Return approved by vendor'
                                        })
                                      });
                                      
                                      if (response.ok) {
                                        fetchVendorOrders();
                                      }
                                    } catch (error) {
                                      console.error('Error approving return:', error);
                                    }
                                  }}
                                >
                                  Approve
                                </Button>
                              </div>
                            )}
                            
                            {refund.status === 'approved' && (
                              <div className="bg-green-50 p-2 rounded mt-2">
                                <p className="text-xs text-green-800 font-medium mb-2">Return Approved - Process Refund</p>
                                <Button
                                  size="sm"
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                  onClick={async () => {
                                    try {
                                      const { response } = await apiRequest(`/admin/refunds/${refund.id}/process/`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          action: 'process',
                                          admin_notes: 'Money transferred to customer'
                                        })
                                      });
                                      
                                      if (response.ok) {
                                        fetchVendorOrders();
                                      }
                                    } catch (error) {
                                      console.error('Error processing refund:', error);
                                    }
                                  }}
                                >
                                  Process Refund (Transfer Money)
                                </Button>
                              </div>
                            )}
                            
                            {refund.status === 'processed' && (
                              <div className="bg-blue-50 p-2 rounded mt-2">
                                <p className="text-xs text-blue-800 font-medium mb-2">Money Transferred - Upload Proof</p>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    
                                    const formData = new FormData();
                                    formData.append('document', file);
                                    
                                    try {
                                      const { response } = await apiRequest(`/refunds/${refund.id}/upload-document/`, {
                                        method: 'POST',
                                        body: formData
                                      });
                                      
                                      if (response.ok) {
                                        fetchVendorOrders();
                                      }
                                    } catch (error) {
                                      console.error('Error uploading document:', error);
                                    }
                                  }}
                                  className="w-full text-xs mb-2"
                                />
                                <Button
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    try {
                                      const { response } = await apiRequest(`/admin/refunds/${refund.id}/process/`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          action: 'complete',
                                          admin_notes: 'Refund completed successfully'
                                        })
                                      });
                                      
                                      if (response.ok) {
                                        fetchVendorOrders();
                                      }
                                    } catch (error) {
                                      console.error('Error completing refund:', error);
                                    }
                                  }}
                                >
                                  Mark as Completed
                                </Button>
                              </div>
                            )}
                            
                            {refund.status === 'appeal' && (
                              <div className="bg-purple-50 p-2 rounded mt-2">
                                <p className="text-xs text-purple-800 font-medium">Customer has appealed this decision</p>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={async () => {
                                      try {
                                        const { response } = await apiRequest(`/admin/refunds/${refund.id}/process/`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            action: 'reject',
                                            admin_notes: 'Appeal rejected - final decision'
                                          })
                                        });
                                        
                                        if (response.ok) {
                                          fetchVendorOrders();
                                        }
                                      } catch (error) {
                                        console.error('Error rejecting appeal:', error);
                                      }
                                    }}
                                  >
                                    Reject Appeal
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={async () => {
                                      try {
                                        const { response } = await apiRequest(`/admin/refunds/${refund.id}/process/`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            action: 'approve',
                                            approved_amount: refund.requested_amount,
                                            admin_notes: 'Appeal approved - refund processed'
                                          })
                                        });
                                        
                                        if (response.ok) {
                                          fetchVendorOrders();
                                        }
                                      } catch (error) {
                                        console.error('Error approving appeal:', error);
                                      }
                                    }}
                                  >
                                    Approve Appeal
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {refund.evidence_photos?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium mb-1">Evidence Documents:</p>
                                <div className="flex flex-wrap gap-1">
                                  {refund.evidence_photos.map((doc, idx) => {
                                    const isImage = doc.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                    // Handle different possible URL formats
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
                                        onClick={() => {
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
                            
                            {refund.admin_notes && (
                              <div className="text-xs text-gray-600 mt-2">
                                <span className="font-medium">Response:</span> {refund.admin_notes}
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-semibold text-lg text-emerald-600">
                            ₹{parseFloat(order.total_amount).toFixed(2)}
                          </span>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
        
        <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-left">
                {selectedOrder?.status === 'confirmed' && showDeliveryForm ? 'Ship Order' : `Order Details - ${selectedOrder?.id}`}
              </SheetTitle>
            </SheetHeader>
            
            {selectedOrder && (
              <div className="space-y-4 overflow-y-auto h-full pb-20">
                {/* Show delivery form only for confirmed orders when shipping */}
                {selectedOrder.status === 'confirmed' && showDeliveryForm ? (
                  <>
                    {/* Customer Details for Rider */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Customer Details for Rider
                        </h3>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={() => {
                              const customerInfo = `Order ID: ${selectedOrder.order_number}\n\nCustomer: ${selectedOrder.customer_details?.username || selectedOrder.delivery_name}\n\nPhone: ${selectedOrder.customer_details?.phone_number || selectedOrder.delivery_phone}\n\nAddress: ${selectedOrder.delivery_address}\n\nMap Link: https://www.google.com/maps/place/${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}\n\nTotal Amount: ₹${selectedOrder.total_amount}\n\nPayment: ${selectedOrder.payment_method} (${selectedOrder.payment_status})\n\nItems:\n${selectedOrder.items?.map(item => `• ${item.product_name} x${item.quantity}`).join('\n') || ''}`;
                              navigator.clipboard.writeText(customerInfo);
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={() => {
                              const customerInfo = `Order ID: ${selectedOrder.order_number}\n\nCustomer: ${selectedOrder.customer_details?.username || selectedOrder.delivery_name}\n\nPhone: ${selectedOrder.customer_details?.phone_number || selectedOrder.delivery_phone}\n\nAddress: ${selectedOrder.delivery_address}\n\nMap Link: https://www.google.com/maps/place/${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}\n\nTotal Amount: ₹${selectedOrder.total_amount}\n\nPayment: ${selectedOrder.payment_method} (${selectedOrder.payment_status})\n\nItems:\n${selectedOrder.items?.map(item => `• ${item.product_name} x${item.quantity}`).join('\n') || ''}`;
                              if (navigator.share) {
                                navigator.share({
                                  title: 'Delivery Details',
                                  text: customerInfo
                                });
                              } else {
                                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(customerInfo)}`;
                                window.open(whatsappUrl, '_blank');
                              }
                            }}
                          >
                            <Share2 className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs bg-white rounded p-3">
                        <p><span className="font-medium">Order ID:</span> {selectedOrder.order_number}</p>
                        <p><span className="font-medium">Customer:</span> {selectedOrder.customer_details?.username || selectedOrder.delivery_name}</p>
                        <p><span className="font-medium">Phone:</span> {selectedOrder.customer_details?.phone_number || selectedOrder.delivery_phone}</p>
                        <p><span className="font-medium">Address:</span> {selectedOrder.delivery_address}</p>
                        <p><span className="font-medium">Map Link:</span> <a href={`https://www.google.com/maps/place/${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}`} target="_blank" className="text-blue-600 underline">Open in Maps</a></p>
                        <p><span className="font-medium">Total Amount:</span> ₹{selectedOrder.total_amount}</p>
                        <p><span className="font-medium">Payment:</span> {selectedOrder.payment_method} ({selectedOrder.payment_status})</p>
                        <div className="mt-2">
                          <span className="font-medium">Items:</span>
                          <ul className="ml-2 mt-1">
                            {selectedOrder.items?.map((item: any, index: number) => (
                              <li key={index}>• {item.product_name} x{item.quantity}</li>
                            )) || []}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Information Form */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Delivery Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Rider Phone Number <span className="text-red-500">*</span></Label>
                          <Input 
                            value={deliveryBoyPhone}
                            onChange={(e) => setDeliveryBoyPhone(e.target.value)}
                            placeholder="+977-98XXXXXXXX"
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Vehicle Number <span className="text-red-500">*</span></Label>
                          <Input 
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                            placeholder="e.g., BA-1-PA-1234"
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Vehicle Color</Label>
                          <Input 
                            value={vehicleColor}
                            onChange={(e) => setVehicleColor(e.target.value)}
                            placeholder="e.g., Red, Blue, White"
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Estimated Delivery Time <span className="text-red-500">*</span></Label>
                          <Input 
                            value={estimatedDeliveryTime}
                            onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                            placeholder="e.g., 30-45 mins"
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Delivery Fee <span className="text-red-500">*</span></Label>
                          {deliveryFeeSource && (
                            <p className={`text-xs mt-1 mb-2 px-2 py-1 rounded ${
                              isDeliveryFeeReadonly 
                                ? deliveryFee === '0' 
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-gray-50 text-gray-600 border border-gray-200'
                            }`}>
                              {deliveryFeeSource}
                            </p>
                          )}
                          <Input 
                            type="number"
                            value={deliveryFee}
                            onChange={(e) => setDeliveryFee(e.target.value)}
                            placeholder={isDeliveryFeeReadonly ? "Auto-calculated" : "e.g., 50"}
                            className={`h-8 text-xs mt-1 ${
                              isDeliveryFeeReadonly 
                                ? 'bg-gray-50 cursor-not-allowed' 
                                : ''
                            }`}
                            readOnly={isDeliveryFeeReadonly}
                            disabled={isDeliveryFeeReadonly}
                          />
                          {!isDeliveryFeeReadonly && (
                            <p className="text-xs text-gray-500 mt-1">
                              💡 No delivery settings found for products. Enter charge manually.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Regular Order Details */}
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
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="font-medium">Map:</span> 
                          <a 
                            href={`https://www.google.com/maps/place/${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}`} 
                            target="_blank" 
                            className="text-blue-600 underline text-xs"
                          >
                            View Location
                          </a>
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
                          <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
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
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{item.product_name}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold flex-shrink-0">₹{item.total_price}</p>
                          </div>
                        )) || []}
                      </div>
                    </div>
                    
                    <div className="bg-white border rounded-lg p-3">
                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Details
                      </h3>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{selectedOrder.subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Fee:</span>
                          <span>₹{selectedOrder.delivery_fee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>₹{selectedOrder.tax_amount}</span>
                        </div>
                        <hr className="my-1" />
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>₹{selectedOrder.total_amount}</span>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span>Payment Method:</span>
                          <span className="capitalize">{selectedOrder.payment_method}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Payment Status:</span>
                          <Badge variant={selectedOrder.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                            {selectedOrder.payment_status}
                          </Badge>
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
                        <p><span className="font-medium">Order Number:</span> {selectedOrder.order_number}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          <Badge className={`${getStatusColor(selectedOrder.status)} text-xs`}>
                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Customer Review */}
                    {selectedOrder.status === 'delivered' && selectedOrder.review && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Customer Review
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= selectedOrder.review.overall_rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">
                              {selectedOrder.review.overall_rating}/5
                            </span>
                          </div>
                          {selectedOrder.review.review_text && (
                            <div className="bg-white p-2 rounded text-xs">
                              <p className="text-gray-700">{selectedOrder.review.review_text}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            Reviewed on {new Date(selectedOrder.review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Cancellation Details */}
                    {selectedOrder.status === 'cancelled' && selectedOrder.cancelReason && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Cancellation Details
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="font-medium text-gray-700">Reason:</p>
                              <p className="text-gray-600">{selectedOrder.cancelReason}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Cancelled By:</p>
                              <p className="text-gray-600 capitalize">{selectedOrder.cancelledBy || 'System'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Payment Status:</p>
                            <Badge className={`text-xs ${
                              selectedOrder.paymentStatus === 'Refunded' ? 'bg-green-100 text-green-800' :
                              selectedOrder.paymentStatus === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedOrder.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Refund Details */}
                    {selectedOrder.refunds?.map(refund => (
                      <div key={refund.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <RotateCcw className="h-4 w-4" />
                          Return/Refund Details
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="font-medium text-gray-700">Status:</p>
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
                            <div>
                              <p className="font-medium text-gray-700">Reason:</p>
                              <p className="text-gray-600 capitalize">{refund.reason.replace('_', ' ')}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="font-medium text-gray-700">Requested Amount:</p>
                              <p className="text-gray-600">₹{refund.requested_amount}</p>
                            </div>
                            {refund.approved_amount && (
                              <div>
                                <p className="font-medium text-gray-700">Approved Amount:</p>
                                <p className="text-gray-600">₹{refund.approved_amount}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="font-medium text-blue-800 mb-2">Customer Refund Details:</p>
                            <div className="space-y-1">
                              <p><span className="font-medium">Method:</span> {refund.refund_method}</p>
                              {refund.refund_method === 'esewa' && refund.esewa_number && (
                                <p><span className="font-medium">eSewa Number:</span> {refund.esewa_number}</p>
                              )}
                              {refund.refund_method === 'khalti' && refund.khalti_number && (
                                <p><span className="font-medium">Khalti Number:</span> {refund.khalti_number}</p>
                              )}
                              {refund.refund_method === 'bank' && (
                                <div>
                                  <p><span className="font-medium">Account Name:</span> {refund.bank_account_name}</p>
                                  <p><span className="font-medium">Account Number:</span> {refund.bank_account_number}</p>
                                  <p><span className="font-medium">Branch:</span> {refund.bank_branch}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {refund.customer_notes && (
                            <div>
                              <p className="font-medium text-gray-700">Customer Notes:</p>
                              <p className="text-gray-600 bg-white p-2 rounded">{refund.customer_notes}</p>
                            </div>
                          )}
                          
                          {refund.admin_notes && (
                            <div>
                              <p className="font-medium text-gray-700">Vendor Response:</p>
                              <p className="text-gray-600 bg-white p-2 rounded">{refund.admin_notes}</p>
                            </div>
                          )}
                          
                          {refund.evidence_photos?.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Evidence Documents:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {refund.evidence_photos.map((doc, idx) => {
                                  const isImage = doc.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                  // Handle different possible URL formats
                                  let imageUrl;
                                  if (doc.filename.startsWith('http')) {
                                    imageUrl = doc.filename;
                                  } else {
                                    imageUrl = getImageUrl(doc.filename);
                                  }
                                  return (
                                    <div key={idx} className="bg-white p-2 rounded border hover:shadow-md transition-shadow">
                                      {isImage ? (
                                        <div 
                                          className="cursor-pointer mb-2 group"
                                          onClick={() => {
                                            setPreviewImage(imageUrl);
                                            setShowImagePreview(true);
                                          }}
                                        >
                                          <div className="relative overflow-hidden rounded">
                                            <img 
                                              src={imageUrl} 
                                              alt={doc.filename}
                                              className="w-full h-20 object-cover rounded mb-1 group-hover:scale-105 transition-transform"
                                              onError={(e) => {
                                                e.currentTarget.src = '/placeholder-image.svg';
                                                e.currentTarget.alt = 'Image not found';
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                              <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          </div>
                                          <p className="text-xs text-blue-600 font-medium">📷 Click to enlarge</p>
                                        </div>
                                      ) : (
                                        <div 
                                          className="w-full h-20 bg-gray-100 rounded mb-2 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                          onClick={() => {
                                            window.open(imageUrl, '_blank');
                                          }}
                                        >
                                          <div className="text-center">
                                            <Package className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                            <span className="text-xs text-gray-500">Document</span>
                                          </div>
                                        </div>
                                      )}
                                      <p className="font-medium text-xs truncate" title={doc.filename}>{doc.filename || `Document ${idx + 1}`}</p>
                                      <p className="text-gray-500 text-xs">📤 {doc.uploaded_by}</p>
                                      <p className="text-gray-500 text-xs">📅 {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <div>
                              <p>Requested: {new Date(refund.requested_at).toLocaleDateString()}</p>
                            </div>
                            {refund.approved_at && (
                              <div>
                                <p>Approved: {new Date(refund.approved_at).toLocaleDateString()}</p>
                              </div>
                            )}
                            {refund.processed_at && (
                              <div>
                                <p>Processed: {new Date(refund.processed_at).toLocaleDateString()}</p>
                              </div>
                            )}
                            {refund.completed_at && (
                              <div>
                                <p>Completed: {new Date(refund.completed_at).toLocaleDateString()}</p>
                              </div>
                            )}
                            {refund.appeal_at && (
                              <div>
                                <p>Appealed: {new Date(refund.appeal_at).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )) || []}
                  </>
                )}
                
                {/* Action Buttons */}
                {selectedOrder.status === 'new' && (
                  <div className="fixed bottom-4 left-4 right-4 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedOrder(null)}>
                      Reject
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'confirmed');
                      setNewOrdersCount(prev => Math.max(0, prev - 1));
                      setSelectedOrder(null);
                    }}>
                      Accept Order
                    </Button>
                  </div>
                )}
                
                {selectedOrder.status === 'confirmed' && (
                  <div className="fixed bottom-4 left-4 right-4 flex gap-2">
                    {!showDeliveryForm ? (
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                        // Auto-calculate delivery fee based on product settings
                        let calculatedFee = '';
                        let feeSource = '';
                        let isReadonly = false;
                        
                        if (selectedOrder.items && selectedOrder.items.length > 0) {
                          // Check if any product has free delivery
                          const hasFreeDelivery = selectedOrder.items.some(item => 
                            item.product_details?.free_delivery === true
                          );
                          
                          if (hasFreeDelivery) {
                            calculatedFee = '0';
                            feeSource = 'Free delivery (set by vendor)';
                            isReadonly = true;
                          } else {
                            // Check for custom delivery fee
                            const customDeliveryItem = selectedOrder.items.find(item => 
                              item.product_details?.custom_delivery_fee_enabled === true &&
                              item.product_details?.custom_delivery_fee > 0
                            );
                            
                            if (customDeliveryItem) {
                              calculatedFee = customDeliveryItem.product_details.custom_delivery_fee.toString();
                              feeSource = `Custom delivery fee (₹${customDeliveryItem.product_details.custom_delivery_fee})`;
                              isReadonly = true;
                            } else {
                              // No specific delivery settings, allow manual entry
                              calculatedFee = '';
                              feeSource = 'Enter delivery charge manually';
                              isReadonly = false;
                            }
                          }
                        }
                        
                        setDeliveryFee(calculatedFee);
                        setDeliveryFeeSource(feeSource);
                        setIsDeliveryFeeReadonly(isReadonly);
                        setShowDeliveryForm(true);
                      }}>
                        <Truck className="h-4 w-4 mr-2" />
                        Ship Order
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" className="flex-1" onClick={() => {
                          setShowDeliveryForm(false);
                          setDeliveryBoyPhone('');
                          setVehicleNumber('');
                          setVehicleColor('');
                          setEstimatedDeliveryTime('');
                          setDeliveryFee('');
                          setDeliveryFeeSource('');
                          setIsDeliveryFeeReadonly(false);
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700" 
                          disabled={!deliveryBoyPhone || !vehicleNumber || !estimatedDeliveryTime || !deliveryFee}
                          onClick={async () => {
                            try {
                              const { response } = await apiRequest(`vendor/orders/${selectedOrder.id}/status/`, {
                                method: 'POST',
                                body: JSON.stringify({
                                  status: 'out_for_delivery',
                                  delivery_boy_phone: deliveryBoyPhone,
                                  vehicle_number: vehicleNumber,
                                  vehicle_color: vehicleColor,
                                  estimated_delivery_time: estimatedDeliveryTime,
                                  delivery_fee: parseFloat(deliveryFee),
                                  notes: 'Order shipped with delivery details'
                                })
                              });
                              
                              if (response.ok) {
                                fetchVendorOrders();
                                setShowDeliveryForm(false);
                                setDeliveryBoyPhone('');
                                setVehicleNumber('');
                                setVehicleColor('');
                                setEstimatedDeliveryTime('');
                                setDeliveryFee('');
                                setDeliveryFeeSource('');
                                setIsDeliveryFeeReadonly(false);
                                setSelectedOrder(null);
                              }
                            } catch (error) {
                              console.error('Error shipping order:', error);
                            }
                          }}
                        >
                          Confirm Ship
                        </Button>
                      </>
                    )}
                  </div>
                )}


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
                Evidence Document Preview
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
              <img 
                src={previewImage} 
                alt="Evidence Preview"
                className="max-w-full max-h-[75vh] object-contain rounded shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.svg';
                  e.currentTarget.alt = 'Image not found';
                }}
              />
            </div>
            <div className="flex justify-center gap-2 pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(previewImage, '_blank')}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewImage;
                  link.download = 'evidence-document';
                  link.click();
                }}
              >
                <Package className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VendorPage>
  );
};

export default VendorOrders;