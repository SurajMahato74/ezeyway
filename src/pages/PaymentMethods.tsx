import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Plus, Edit3, Trash2, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";

// Mock payment methods data
const mockPaymentMethods = [
  {
    id: 1,
    type: "card",
    last4: "4242",
    brand: "Visa",
    expiryMonth: 12,
    expiryYear: 2026,
    isDefault: true,
    cardholderName: "John Doe"
  },
  {
    id: 2,
    type: "card",
    last4: "8888",
    brand: "Mastercard",
    expiryMonth: 8,
    expiryYear: 2025,
    isDefault: false,
    cardholderName: "John Doe"
  }
];

const getCardIcon = (brand: string) => {
  return <CreditCard className="h-5 w-5" />;
};

const maskCardNumber = (last4: string) => {
  return `•••• •••• •••• ${last4}`;
};

export default function PaymentMethods() {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);

  const handleAddPaymentMethod = () => {
    // In real app, navigate to add payment method form
    console.log("Add new payment method");
  };

  const handleEditPaymentMethod = (id: number) => {
    // In real app, navigate to edit payment method form
    console.log("Edit payment method", id);
  };

  const handleDeletePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };

  const handleSetDefault = (id: number) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Payment Methods</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddPaymentMethod}
            className="p-2"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="p-4 space-y-4 pb-20">
        {paymentMethods.length > 0 ? (
          paymentMethods.map((method) => (
            <Card key={method.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {getCardIcon(method.brand)}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {method.brand} {maskCardNumber(method.last4)}
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Expires {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPaymentMethod(method.id)}
                      className="p-2"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secured with 256-bit SSL encryption</span>
                </div>

                {!method.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(method.id)}
                    className="w-full"
                  >
                    Set as Default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No payment methods</h3>
            <p className="text-muted-foreground mb-4">
              Add a payment method to make checkout faster
            </p>
            <Button onClick={handleAddPaymentMethod}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        )}

        {/* Add New Payment Method Button */}
        {paymentMethods.length > 0 && (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <Button
                variant="ghost"
                onClick={handleAddPaymentMethod}
                className="w-full h-16 flex flex-col items-center gap-2"
              >
                <Plus className="h-6 w-6" />
                <span>Add New Payment Method</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 text-sm">Secure Payments</p>
                <p className="text-green-700 text-xs">
                  All payment information is encrypted and secure
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}