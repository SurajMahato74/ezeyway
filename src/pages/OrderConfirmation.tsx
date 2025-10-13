import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { CheckCircle, MapPin, Clock, Phone, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { orderService } from "@/services/orderService";
import { API_BASE } from '@/config/api';

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (!order && orderId) {
      fetchOrder();
    }
  }, [orderId, order]);

  const fetchOrder = async () => {
    try {
      const orderData = await orderService.getOrder(parseInt(orderId));
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load order details",
        variant: "destructive",
      });
      navigate('/');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h3>
          <Button onClick={() => navigate('/home')} className="bg-emerald-600 hover:bg-emerald-700">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
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
          <h1 className="text-2xl font-bold text-gray-800">Order Confirmation</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 pb-32">
        {/* Success Message */}
        <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden mb-6">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your order #{order.order_number} has been placed and is being processed.
            </p>
            <Badge className={`${getStatusColor(order.status)} px-4 py-2 text-sm font-medium`}>
              {getStatusText(order.status)}
            </Badge>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden mb-6">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
            <CardTitle className="text-xl font-semibold text-gray-800">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">#{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-emerald-600">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Delivery Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{order.delivery_name}</p>
                      <p className="text-gray-600">{order.delivery_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <span className="text-gray-600">{order.delivery_phone}</span>
                  </div>
                  {order.delivery_instructions && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <p className="text-gray-600 text-xs">{order.delivery_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden mb-6">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
            <CardTitle className="text-xl font-semibold text-gray-800">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
                  <img
                    src={item.product_details?.images?.[0]?.image_url || '/placeholder-product.jpg'}
                    alt={item.product_name}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.product_name}</h4>
                    <p className="text-sm text-gray-600">{item.vendor_name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₹{parseFloat(item.total_price).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">₹{parseFloat(item.unit_price).toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-2">Bill Amount (Paid via {order.payment_method})</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{parseFloat(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">₹{parseFloat(order.tax_amount).toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-bold">
                    <span>Bill Total (Paid):</span>
                    <span className="text-emerald-600">₹{(parseFloat(order.subtotal) + parseFloat(order.tax_amount)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-orange-800 text-lg">Delivery Fee</h4>
                    <p className="text-sm text-orange-700">Pay on delivery</p>
                  </div>
                  <span className="font-bold text-xl text-orange-600">₹{parseFloat(order.delivery_fee).toFixed(2)}</span>
                </div>
              </div>
              
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total:</span>
                <span className="text-gray-800">₹{parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate('/orders')}
            className="px-8 py-3 rounded-xl"
          >
            View All Orders
          </Button>
          <Button
            onClick={() => navigate('/search')}
            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700"
          >
            Continue Shopping
          </Button>
        </div>
      </main>
    </div>
  );
}