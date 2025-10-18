import { useState, useEffect } from "react";
import { ShoppingCart, MapPin, Star, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { locationService } from "@/services/locationService";
import { motion, AnimatePresence } from "framer-motion";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const lat1Num = parseFloat(lat1);
  const lon1Num = parseFloat(lon1);
  const lat2Num = parseFloat(lat2);
  const lon2Num = parseFloat(lon2);
  
  const R = 6371000;
  const toRad = (deg) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2Num - lat1Num);
  const dLon = toRad(lon2Num - lon1Num);
  const lat1Rad = toRad(lat1Num);
  const lat2Rad = toRad(lat2Num);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c) / 1000;
};

export function HomeCartWidget() {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState(locationService.getLocation());

  useEffect(() => {
    const unsubscribe = locationService.subscribe(setUserLocation);
    return unsubscribe;
  }, []);

  const cartItems = cart?.items || [];
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price.toString()), 0);

  if (cartItems.length === 0) {
    return null;
  }

  const handleBuyNow = () => {
    navigate("/checkout", {
      state: {
        selectedItems: cartItems
      }
    });
  };

  return (
    <>
      {/* Floating Cart Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-24 right-4 z-40"
      >
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative bg-[#856043] hover:bg-[#856043]/90 text-white rounded-full w-14 h-14 shadow-lg"
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[20px] h-5 text-xs flex items-center justify-center">
              {totalItems > 99 ? '99+' : totalItems}
            </Badge>
          )}
        </Button>
      </motion.div>

      {/* Expanded Cart Widget */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-40 right-4 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart ({totalItems})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="max-h-48 overflow-y-auto">
              {cartItems.map((item) => {
                const product = item.product;
                let distance = "N/A";
                
                if (userLocation && product.vendor_latitude && product.vendor_longitude) {
                  const distanceValue = calculateDistance(
                    userLocation.latitude, userLocation.longitude,
                    product.vendor_latitude, product.vendor_longitude
                  );
                  distance = `${distanceValue.toFixed(1)} km`;
                }

                return (
                  <div key={item.id} className="p-3 border-b hover:bg-gray-50">
                    <div className="flex gap-3">
                      <img
                        src={product.images?.[0]?.image_url || "/placeholder-product.jpg"}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => { e.currentTarget.src = "/placeholder-product.jpg"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {product.vendor_name}
                        </p>
                        
                        {/* Distance and Sold Info */}
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>{distance}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="h-3 w-3" />
                            <span>{product.total_sold || 0} sold</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#856043]">
                              ₹{product.price}
                            </span>
                            <span className="text-xs text-gray-500">
                              × {item.quantity}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with Buy Button */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="font-semibold text-lg text-[#856043]">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/cart")}
                  className="flex-1"
                >
                  View Cart
                </Button>
                <Button
                  size="sm"
                  onClick={handleBuyNow}
                  className="flex-1 bg-[#856043] hover:bg-[#856043]/90 text-white"
                >
                  Buy Now
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-2">
                <Truck className="h-3 w-3" />
                <span>Free delivery on orders above ₹500</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}