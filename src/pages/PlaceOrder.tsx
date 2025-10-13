import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, MapPin, CreditCard, Truck, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderDetails {
  items: Array<{
    id: number;
    name: string;
    vendor: string;
    price: string;
    quantity: number;
  }>;
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    instructions?: string;
  };
  paymentMethod: string;
  totals: {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
  };
}

export default function PlaceOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [orderId, setOrderId] = useState<string>("");
  const [estimatedTime, setEstimatedTime] = useState<string>("");

  useEffect(() => {
    // Get order details from navigation state
    if (location.state?.orderDetails) {
      setOrderDetails(location.state.orderDetails);
      // Generate mock order ID and estimated time
      setOrderId(`ORD-${Date.now().toString().slice(-6)}`);
      setEstimatedTime("30-45 mins");
    } else {
      // If no order details, redirect to cart
      navigate("/cart");
    }
  }, [location.state, navigate]);

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case "card": return "Credit/Debit Card";
      case "cash": return "Cash on Delivery";
      case "wallet": return "Digital Wallet";
      default: return method;
    }
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Header */}
      <div className="bg-green-50 border-b border-green-200 p-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-green-800 mb-2">Order Placed Successfully!</h1>
        <p className="text-green-700">Your order has been confirmed and is being prepared</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Order ID and Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-semibold text-lg">{orderId}</p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Confirmed
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Estimated delivery: {estimatedTime}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderDetails.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.vendor} × {item.quantity}</p>
                </div>
                <p className="font-medium">{item.price}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{orderDetails.deliveryAddress.name}</p>
              <p className="text-sm text-muted-foreground">{orderDetails.deliveryAddress.address}</p>
              {orderDetails.deliveryAddress.city && (
                <p className="text-sm text-muted-foreground">{orderDetails.deliveryAddress.city}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{orderDetails.deliveryAddress.phone}</span>
              </div>
              {orderDetails.deliveryAddress.instructions && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Delivery Instructions:</p>
                  <p className="text-sm text-yellow-700">{orderDetails.deliveryAddress.instructions}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{getPaymentMethodDisplay(orderDetails.paymentMethod)}</p>
            <p className="text-sm text-muted-foreground">
              {orderDetails.paymentMethod === "cash" ? "Pay when you receive your order" : "Payment processed securely"}
            </p>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{orderDetails.totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className={orderDetails.totals.deliveryFee === 0 ? "text-green-600" : ""}>
                {orderDetails.totals.deliveryFee === 0 ? "Free" : `₹${orderDetails.totals.deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span>₹{orderDetails.totals.tax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₹{orderDetails.totals.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              Delivery Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Order Confirmed</p>
                  <p className="text-sm text-muted-foreground">Your order has been received</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                <div>
                  <p className="font-medium">Preparing</p>
                  <p className="text-sm text-muted-foreground">Your items are being prepared</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                <div>
                  <p className="font-medium">Out for Delivery</p>
                  <p className="text-sm text-muted-foreground">Your order is on the way</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                <div>
                  <p className="font-medium">Delivered</p>
                  <p className="text-sm text-muted-foreground">Order completed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => navigate("/profile")}
          >
            View Orders
          </Button>
        </div>
      </div>
    </div>
  );
}