import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Clock, MapPin, Phone, Star, RotateCcw, Truck, X, Store, Upload, AlertTriangle, Eye, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { orderService } from "@/services/orderService";
import { authService } from "@/services/authService";
import { NotificationHeader } from "@/components/NotificationHeader";
import { useNotificationWebSocket } from "@/hooks/useNotificationWebSocket";
import { API_CONFIG } from '@/config/api';
import { apiRequest } from '@/utils/apiUtils';
import { getImageUrl } from '@/utils/imageUtils';

export default function Orders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [cancelReason, setCancelReason] = useState("");
  const [refundOption, setRefundOption] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [vendorStatuses, setVendorStatuses] = useState({});
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [showReturnSheet, setShowReturnSheet] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnMethod, setReturnMethod] = useState('');
  const [esewaNumber, setEsewaNumber] = useState('');
  const [khaltiNumber, setKhaltiNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  // Use notification system
  const { notifications, unreadCount, isConnected } = useNotificationWebSocket();

  useEffect(() => {
    fetchOrders();
    
    // Listen for order notifications to refresh orders
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'order') {
        // Refresh orders when order notification is received
        fetchOrders();
      }
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    
    // Auto-refresh orders every 30 seconds (less frequent since we have WebSocket)
    const interval = setInterval(async () => {
      try {
        const token = await authService.getToken();
        if (!token) return;
        
        const orders = await orderService.getOrders();
        setOrders(orders);
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
      clearInterval(interval);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const orders = await orderService.getOrders();
      setOrders(orders);
      
      // Check vendor status for each order
      const statuses = {};
      for (const order of orders) {
        const vendorName = order.items?.[0]?.product_details?.vendor_name;
        if (vendorName && !statuses[vendorName]) {
          statuses[vendorName] = await checkVendorStatus(vendorName);
        }
      }
      setVendorStatuses(statuses);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      out_for_delivery: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Order Placed",
      confirmed: "Confirmed",
      preparing: "Preparing",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled"
    };
    return texts[status] || status;
  };

  const filterOrders = (status) => {
    if (status === "all") return orders;
    return orders.filter(order => order.status === status);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a valid reason for cancellation",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await orderService.cancelOrder(selectedOrderId, cancelReason);
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
      });
      setShowCancelDialog(false);
      setCancelReason("");
      setRefundOption("");
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const checkVendorStatus = async (vendorName) => {
    try {
      const { response, data } = await apiRequest(`search/vendors/?search=${encodeURIComponent(vendorName)}`);
      if (!response.ok) return false;
      const vendor = data?.results?.find(v => v.business_name === vendorName);
      return vendor?.is_active || false;
    } catch (error) {
      console.error('Error checking vendor status:', error);
      return false;
    }
  };

  const handleReorder = async (order) => {
    try {
      // Check if vendor is active before allowing reorder
      const vendorName = order.items?.[0]?.product_details?.vendor_name;
      if (vendorName) {
        const isVendorActive = await checkVendorStatus(vendorName);
        if (!isVendorActive) {
          toast({
            title: "Vendor Offline",
            description: "This vendor is currently offline. Cannot reorder at this time.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Add items to cart and navigate to cart
      for (const item of order.items) {
        // Add to cart logic here
      }
      toast({
        title: "Items Added",
        description: "Order items added to cart",
      });
      navigate('/cart');
    } catch (error) {
      toast({
        title: "Reorder Failed",
        description: "Failed to add items to cart",
        variant: "destructive",
      });
    }
  };

  const OrderCard = ({ order }) => (
    <Card 
      key={order.id} 
      className="cursor-pointer hover:shadow-md transition-shadow mb-4"
      onClick={() => {
        setSelectedOrderDetail(order);
        setShowOrderDetail(true);
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
            <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <Badge className={`${getStatusColor(order.status)} px-3 py-1`}>
            {getStatusText(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Order Items Preview */}
          <div>
            <p className="text-sm font-medium text-gray-800 mb-2">
              {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-3 overflow-x-auto">
              {order.items?.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-2 flex-shrink-0">
                  <img
                    src={getImageUrl(item.product_details?.images?.[0]?.image_url)}
                    alt={item.product_name}
                    className="w-12 h-12 object-cover rounded-lg border"
                  />
                  <div>
                    <p className="text-xs text-gray-700 font-medium truncate max-w-[80px]">{item.product_name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[80px] capitalize">{item.product_details?.category}</p>
                  </div>
                </div>
              ))}
              {order.items?.length > 3 && (
                <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-gray-600">+{order.items.length - 3}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Store className="h-4 w-4" />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const vendorId = order.items?.[0]?.product_details?.vendor_id;
                if (vendorId) navigate(`/vendor/${vendorId}`);
              }}
              className="text-blue-600 hover:underline text-xs font-medium truncate"
            >
              {order.items?.[0]?.product_details?.vendor_name || 'Vendor'}
            </button>
          </div>

          {/* Delivery Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{order.delivery_address}</span>
          </div>

          {/* Shipping Details for Shipped Orders */}
          {order.status === 'out_for_delivery' && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Shipping Details</span>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Vehicle:</span> {order.vehicle_number || 'TBA'}</p>
                <p><span className="font-medium">Vehicle Color:</span> {order.vehicle_color || 'N/A'}</p>
                <p><span className="font-medium">Driver Phone:</span> {order.delivery_boy_phone || 'TBA'}</p>
                <p><span className="font-medium">ETA:</span> {order.estimated_delivery_time || 'TBA'}</p>
                {order.delivery_fee > 0 && (
                  <p><span className="font-medium">Delivery Fee:</span> ₹{parseFloat(order.delivery_fee).toFixed(2)}</p>
                )}
              </div>
            </div>
          )}

          {/* Cancel Reason for Cancelled Orders */}
          {order.status === 'cancelled' && order.cancel_reason && (
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <X className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Cancellation Reason</span>
              </div>
              <p className="text-sm text-red-700">{order.cancel_reason}</p>
              {order.refund_status && (
                <p className="text-sm text-red-600 mt-1">
                  <span className="font-medium">Refund:</span> {order.refund_status}
                </p>
              )}
            </div>
          )}

          {/* Total Amount */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold text-lg text-emerald-600">
              ₹{parseFloat(order.total_amount).toFixed(2)}
            </span>
            <div className="flex gap-2">


              {/* Mark as Received for Shipped Orders */}
              {order.status === 'out_for_delivery' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const token = await authService.getToken();
                      const { response } = await apiRequest(`/api/orders/${order.id}/status/`, {
                        method: 'POST',
                        body: JSON.stringify({
                          status: 'delivered',
                          notes: 'Marked as received by customer'
                        })
                      });
                      
                      if (response.ok) {
                        // Update order status locally without full refresh
                        setOrders(prevOrders => 
                          prevOrders.map(o => 
                            o.id === order.id ? {...o, status: 'delivered', delivered_at: new Date().toISOString()} : o
                          )
                        );
                      }
                    } catch (error) {
                      console.error('Error marking as received:', error);
                    }
                  }}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  Received
                </Button>
              )}

              {/* Reorder for Cancelled, Pending, and Delivered - only if vendor is active */}
              {(order.status === 'cancelled' || order.status === 'pending' || order.status === 'delivered') && 
               vendorStatuses[order.items?.[0]?.product_details?.vendor_name] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReorder(order);
                  }}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}

              {/* Cancel for Pending Orders */}
              {order.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderId(order.id);
                    setShowCancelDialog(true);
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Cancel
                </Button>
              )}

              {/* Return for Delivered Orders - within 24 hours and no existing return */}
              {order.status === 'delivered' && 
               !order.refunds?.some(r => ['requested', 'approved', 'rejected', 'appeal', 'processed', 'completed'].includes(r.status)) &&
               (() => {
                 const deliveredDate = new Date(order.delivered_at);
                 const now = new Date();
                 const hoursDiff = (now - deliveredDate) / (1000 * 60 * 60);
                 return hoursDiff <= 24;
               })() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderForReturn(order);
                    setShowReturnSheet(true);
                  }}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  Return
                </Button>
              )}
              
              {/* Show return deadline info */}
              {order.status === 'delivered' && 
               !order.refunds?.some(r => ['requested', 'approved', 'rejected', 'appeal', 'processed', 'completed'].includes(r.status)) &&
               (() => {
                 const deliveredDate = new Date(order.delivered_at);
                 const now = new Date();
                 const hoursDiff = (now - deliveredDate) / (1000 * 60 * 60);
                 return hoursDiff > 24;
               })() && (
                <div className="text-xs text-gray-500 mt-1">
                  Return window expired
                </div>
              )}

              {/* Review for Delivered Orders */}
              {order.status === 'delivered' && !order.review && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderForReview(order);
                    setRating(0);
                    setReviewText('');
                    setIsEditingReview(false);
                    setShowReviewDialog(true);
                  }}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}

              {/* Edit Review for Delivered Orders with existing review */}
              {order.status === 'delivered' && order.review && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderForReview(order);
                    setRating(order.review.overall_rating);
                    setReviewText(order.review.review_text || '');
                    setIsEditingReview(true);
                    setShowReviewDialog(true);
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Edit Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b py-4 px-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <NotificationHeader />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pt-2">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="flex w-max min-w-full gap-1">
                <TabsTrigger value="all" className="flex-shrink-0 px-2">
                  All <span className="font-bold">({orders.length})</span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex-shrink-0 px-2">
                  Pending <span className="font-bold">({filterOrders("pending").length})</span>
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="flex-shrink-0 px-2">
                  Confirmed <span className="font-bold">({filterOrders("confirmed").concat(filterOrders("preparing")).length})</span>
                </TabsTrigger>
                <TabsTrigger value="shipped" className="flex-shrink-0 px-2">
                  Shipped <span className="font-bold">({filterOrders("out_for_delivery").length})</span>
                </TabsTrigger>
                <TabsTrigger value="delivered" className="flex-shrink-0 px-2">
                  Delivered <span className="font-bold">({filterOrders("delivered").length})</span>
                </TabsTrigger>
                <TabsTrigger value="returns" className="flex-shrink-0 px-2">
                  Returns <span className="font-bold">({orders.filter(order => order.refunds?.length > 0).length})</span>
                </TabsTrigger>
                <TabsTrigger value="reviewed" className="flex-shrink-0 px-2">
                  Reviewed <span className="font-bold">({orders.filter(order => order.review).length})</span>
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="flex-shrink-0 px-2">
                  Cancelled <span className="font-bold">({filterOrders("cancelled").length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4">
              {orders.map(order => <OrderCard key={order.id} order={order} />)}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {filterOrders("pending").map(order => <OrderCard key={order.id} order={order} />)}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4">
              {filterOrders("confirmed").concat(
                filterOrders("preparing")
              ).map(order => <OrderCard key={order.id} order={order} />)}
            </TabsContent>

            <TabsContent value="shipped" className="space-y-4">
              {filterOrders("out_for_delivery").map(order => <OrderCard key={order.id} order={order} />)}
            </TabsContent>

            <TabsContent value="delivered" className="space-y-4">
              {filterOrders("delivered").map(order => (
                <div key={order.id}>
                  <OrderCard order={order} />
                  {/* Return deadline info for delivered orders */}
                  {order.status === 'delivered' && order.delivered_at && (
                    <div className="mt-2 px-4 py-2 bg-gray-50 rounded text-xs text-gray-600">
                      {(() => {
                        const deliveredDate = new Date(order.delivered_at);
                        const now = new Date();
                        const hoursDiff = (now - deliveredDate) / (1000 * 60 * 60);
                        const hoursLeft = 24 - hoursDiff;
                        
                        if (order.refunds?.some(r => ['requested', 'approved', 'rejected', 'appeal', 'processed', 'completed'].includes(r.status))) {
                          return 'Return request already submitted';
                        } else if (hoursLeft > 0) {
                          return `Return available for ${Math.floor(hoursLeft)} hours ${Math.floor((hoursLeft % 1) * 60)} minutes`;
                        } else {
                          return 'Return window expired (24 hours after delivery)';
                        }
                      })()} 
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="returns" className="space-y-4">
              {orders.filter(order => order.refunds?.length > 0).length > 0 ? (
                orders.filter(order => order.refunds?.length > 0).map(order => (
                  <div key={order.id} className="bg-white rounded-lg border">
                    <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => {
                      setSelectedOrderDetail(order);
                      setShowOrderDetail(true);
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
                          <Store className="h-4 w-4" />
                          <span className="truncate">{order.items?.[0]?.product_details?.vendor_name || 'Vendor'}</span>
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
                              <span className="font-medium">Amount:</span> ₹{refund.requested_amount}
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
                            
                            {refund.status === 'completed' && (
                              <div className="bg-emerald-50 border border-emerald-200 rounded p-2 mt-2">
                                <p className="text-xs text-emerald-800 font-medium">✅ Refund Completed</p>
                              </div>
                            )}
                            
                            {refund.status === 'processed' && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                <p className="text-xs text-blue-800 font-medium">💰 Money Transferred</p>
                              </div>
                            )}
                            
                            {refund.admin_notes && (
                              <div className="text-xs text-gray-600 mt-2">
                                <span className="font-medium">Response:</span> {refund.admin_notes}
                              </div>
                            )}
                            
                            {refund.status === 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const token = await authService.getToken();
                                    const { response } = await apiRequest(`/api/refunds/${refund.id}/appeal/`, {
                                      method: 'POST',
                                      body: JSON.stringify({
                                        customer_notes: 'Appealing the rejection decision'
                                      })
                                    });
                                    
                                    if (response.ok) {
                                      toast({
                                        title: "Appeal Submitted",
                                        description: "Your appeal has been submitted for review.",
                                      });
                                      fetchOrders();
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to submit appeal.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Appeal Decision
                              </Button>
                            )}
                          </div>
                        ))}

                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-semibold text-lg text-emerald-600">
                            ₹{parseFloat(order.total_amount).toFixed(2)}
                          </span>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderDetail(order);
                            setShowOrderDetail(true);
                          }}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <RotateCcw className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No returns yet</h3>
                  <p className="text-gray-500">Your return requests will appear here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviewed" className="space-y-4">
              {orders.filter(order => order.review).length > 0 ? (
                orders.filter(order => order.review).map(order => (
                  <Card key={order.id} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
                          <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 px-3 py-1">
                          Reviewed
                        </Badge>
                      </div>
                      
                      {/* Order Items */}
                      <div className="mb-4">
                        <div className="flex gap-3 overflow-x-auto">
                          {order.items?.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-2 flex-shrink-0">
                              <img
                                src={item.product_details?.images?.[0]?.image_url || '/placeholder-product.jpg'}
                                alt={item.product_name}
                                className="w-12 h-12 object-cover rounded-lg border"
                              />
                              <div>
                                <p className="text-xs text-gray-700 font-medium truncate max-w-[80px]">{item.product_name}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[80px] capitalize">{item.product_details?.category}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Review Display */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">Your Review</h4>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= order.review.overall_rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrderForReview(order);
                              setRating(order.review.overall_rating);
                              setReviewText(order.review.review_text || '');
                              setIsEditingReview(true);
                              setShowReviewDialog(true);
                            }}
                            className="h-7 text-xs"
                          >
                            Edit
                          </Button>
                        </div>
                        {order.review.review_text && (
                          <p className="text-sm text-gray-700">{order.review.review_text}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Reviewed on {new Date(order.review.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Total Amount */}
                      <div className="flex justify-between items-center pt-3 border-t mt-3">
                        <span className="font-semibold text-lg text-emerald-600">
                          ₹{parseFloat(order.total_amount).toFixed(2)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrderDetail(order);
                            setShowOrderDetail(true);
                          }}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16">
                  <Star className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-500 mb-6">Complete your orders and share your experience</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {filterOrders("cancelled").map(order => <OrderCard key={order.id} order={order} />)}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNavigation />

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Cancellation *</Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="changed_mind">Changed my mind</SelectItem>
                  <SelectItem value="found_better_price">Found better price elsewhere</SelectItem>
                  <SelectItem value="delivery_too_long">Delivery time too long</SelectItem>
                  <SelectItem value="ordered_by_mistake">Ordered by mistake</SelectItem>
                  <SelectItem value="payment_issues">Payment issues</SelectItem>
                  <SelectItem value="other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {cancelReason === 'other' && (
              <div>
                <Label htmlFor="custom_reason">Please specify</Label>
                <Textarea
                  id="custom_reason"
                  placeholder="Enter your reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="refund">Refund Option *</Label>
              <Select value={refundOption} onValueChange={setRefundOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Select refund method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original_payment">Refund to original payment method</SelectItem>
                  <SelectItem value="wallet">Refund to wallet</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1"
              >
                Keep Order
              </Button>
              <Button
                onClick={handleCancelOrder}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={!cancelReason || !refundOption}
              >
                Cancel Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditingReview ? 'Edit Review' : 'Rate & Review Order'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating *</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="review">Review (Optional)</Label>
              <Textarea
                id="review"
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewDialog(false);
                  setRating(0);
                  setReviewText('');
                  setIsEditingReview(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!rating) return;
                  
                  try {
                    const token = await authService.getToken();
                    const method = 'POST';
                    const { response, data: reviewData } = await apiRequest(`/api/orders/${selectedOrderForReview.id}/review/`, {
                      method,
                      body: JSON.stringify({
                        overall_rating: rating,
                        review_text: reviewText
                      })
                    });
                    
                    if (response.ok && reviewData) {
                      setOrders(prevOrders => 
                        prevOrders.map(o => 
                          o.id === selectedOrderForReview.id ? {...o, review: reviewData.review} : o
                        )
                      );
                      setShowReviewDialog(false);
                      setRating(0);
                      setReviewText('');
                      setIsEditingReview(false);
                      toast({
                        title: isEditingReview ? "Review Updated" : "Review Submitted",
                        description: "Thank you for your feedback!",
                      });
                    }
                  } catch (error) {
                    console.error('Error submitting review:', error);
                    toast({
                      title: "Error",
                      description: "Failed to submit review. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={!rating}
              >
                {isEditingReview ? 'Update Review' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Request Sheet */}
      <Sheet open={showReturnSheet} onOpenChange={setShowReturnSheet}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Return Order #{selectedOrderForReturn?.order_number}
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 overflow-y-auto h-full pb-20">
            <div>
              <Label>Return Reason *</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason for return" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defective_product">Defective/Damaged Product</SelectItem>
                  <SelectItem value="wrong_item">Wrong Item Delivered</SelectItem>
                  <SelectItem value="quality_issue">Quality Issue</SelectItem>
                  <SelectItem value="not_as_described">Not as Described</SelectItem>
                  <SelectItem value="expired_product">Expired Product</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Evidence Photos/Documents *</Label>
              <p className="text-xs text-gray-500 mb-2">Please provide evidence to support your return request</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Upload photos or documents as proof</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setEvidenceFiles(Array.from(e.target.files))}
                  className="hidden"
                  id="evidence-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('evidence-upload').click()}
                  className="mt-2"
                >
                  Choose Files
                </Button>
              </div>
              {evidenceFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-600">{evidenceFiles.length} file(s) selected:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {evidenceFiles.map((file, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded text-xs flex items-center justify-between">
                        <span className="truncate">{file.name}</span>
                        <button
                          onClick={() => setEvidenceFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Refund Method *</Label>
              <Select value={returnMethod} onValueChange={setReturnMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select refund method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="esewa">eSewa</SelectItem>
                  <SelectItem value="khalti">Khalti</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {returnMethod === 'esewa' && (
              <div>
                <Label>eSewa Number *</Label>
                <Input
                  placeholder="98XXXXXXXX"
                  value={esewaNumber}
                  onChange={(e) => setEsewaNumber(e.target.value)}
                />
              </div>
            )}

            {returnMethod === 'khalti' && (
              <div>
                <Label>Khalti Number *</Label>
                <Input
                  placeholder="98XXXXXXXX"
                  value={khaltiNumber}
                  onChange={(e) => setKhaltiNumber(e.target.value)}
                />
              </div>
            )}

            {returnMethod === 'bank' && (
              <div className="space-y-3">
                <div>
                  <Label>Account Holder Name *</Label>
                  <Input
                    placeholder="Full name as per bank account"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Account Number *</Label>
                  <Input
                    placeholder="Bank account number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bank Branch *</Label>
                  <Input
                    placeholder="Branch name"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Return Policy</p>
                  <ul className="text-xs space-y-1">
                    <li>• Returns are processed within 3-5 business days</li>
                    <li>• Refund will be processed after vendor approval</li>
                    <li>• You can appeal if your return is rejected</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-4 left-4 right-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowReturnSheet(false);
                setReturnReason('');
                setReturnNotes('');
                setReturnMethod('');
                setEsewaNumber('');
                setKhaltiNumber('');
                setBankAccountName('');
                setBankAccountNumber('');
                setBankBranch('');
                setEvidenceFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={!returnReason || !returnMethod || evidenceFiles.length === 0 ||
                (returnMethod === 'esewa' && !esewaNumber) ||
                (returnMethod === 'khalti' && !khaltiNumber) ||
                (returnMethod === 'bank' && (!bankAccountName || !bankAccountNumber || !bankBranch))
              }
              onClick={async () => {
                try {
                  const token = await authService.getToken();
                  const formData = new FormData();
                  
                  formData.append('reason', returnReason);
                  formData.append('customer_notes', returnNotes);
                  formData.append('refund_method', returnMethod);
                  formData.append('requested_amount', selectedOrderForReturn.total_amount);
                  
                  if (returnMethod === 'esewa') formData.append('esewa_number', esewaNumber);
                  if (returnMethod === 'khalti') formData.append('khalti_number', khaltiNumber);
                  if (returnMethod === 'bank') {
                    formData.append('bank_account_name', bankAccountName);
                    formData.append('bank_account_number', bankAccountNumber);
                    formData.append('bank_branch', bankBranch);
                  }
                  
                  evidenceFiles.forEach((file, index) => {
                    formData.append(`evidence_${index}`, file);
                  });
                  
                  const response = await fetch(`${API_CONFIG.BASE_URL}/api/orders/${selectedOrderForReturn.id}/return/`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Token ${token}`,
                      'ngrok-skip-browser-warning': 'true',
                      'x-ngrok-skip-browser-warning': 'true',
                    },
                    body: formData
                  });
                  
                  if (response.ok) {
                    toast({
                      title: "Return Requested",
                      description: "Your return request has been submitted successfully.",
                    });
                    setShowReturnSheet(false);
                    fetchOrders();
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to submit return request.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Submit Return Request
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Order Detail Sheet */}
      <Sheet open={showOrderDetail} onOpenChange={setShowOrderDetail}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left">
              Order Details - #{selectedOrderDetail?.order_number}
            </SheetTitle>
          </SheetHeader>
          
          {selectedOrderDetail && (
            <div className="space-y-4 overflow-y-auto h-full pb-20">
              {/* Order Items */}
              <div className="bg-white border rounded-lg p-3">
                <h3 className="font-semibold text-sm mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrderDetail.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.product_details?.images?.[0]?.image_url || '/placeholder-product.jpg'}
                          alt={item.product_name}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div>
                          <p className="text-sm font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">₹{item.total_price}</p>
                    </div>
                  )) || []}
                </div>
              </div>
              
              {/* Delivery Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-sm mb-2">Delivery Information</h3>
                <div className="space-y-1 text-xs">
                  <p><span className="font-medium">Address:</span> {selectedOrderDetail.delivery_address}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrderDetail.delivery_phone}</p>
                  <p><span className="font-medium">Name:</span> {selectedOrderDetail.delivery_name}</p>
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="bg-white border rounded-lg p-3">
                <h3 className="font-semibold text-sm mb-3">Payment Details</h3>
                
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 mb-3">
                  <h4 className="font-semibold text-emerald-800 text-sm mb-2">Bill Amount (Paid via {selectedOrderDetail.payment_method})</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{selectedOrderDetail.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>₹{selectedOrderDetail.tax_amount}</span>
                    </div>
                    <hr className="my-1" />
                    <div className="flex justify-between font-semibold">
                      <span>Bill Total (Paid):</span>
                      <span className="text-emerald-600">₹{(parseFloat(selectedOrderDetail.subtotal) + parseFloat(selectedOrderDetail.tax_amount)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-orange-800 text-base">Delivery Fee</h4>
                      <p className="text-xs text-orange-700">{selectedOrderDetail.status === 'delivered' ? 'Paid on delivery' : 'Pay on delivery'}</p>
                    </div>
                    <span className="font-bold text-lg text-orange-600">₹{parseFloat(selectedOrderDetail.delivery_fee).toFixed(2)}</span>
                  </div>
                </div>
                
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-sm">
                  <span>Grand Total:</span>
                  <span>₹{selectedOrderDetail.total_amount}</span>
                </div>
                
                <div className="mt-3 pt-2 border-t space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{selectedOrderDetail.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <Badge variant={selectedOrderDetail.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                      {selectedOrderDetail.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Refund Details */}
              {selectedOrderDetail.refunds?.map(refund => (
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
                      <p className="font-medium text-blue-800 mb-2">Your Refund Details:</p>
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
                        <p className="font-medium text-gray-700">Your Notes:</p>
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
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 border-t pt-2">
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
  );
}