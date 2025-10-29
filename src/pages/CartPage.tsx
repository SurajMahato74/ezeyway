import { ShoppingCart, Trash2, CreditCard, Truck, Gift, Heart, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { CartItem } from "@/services/cartService";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";
import { API_BASE } from '@/config/api';

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

const RecommendedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const headers = {
        'ngrok-skip-browser-warning': 'true'
      };
      
      const currentLocation = locationService.getLocation();
      const params = new URLSearchParams({ page_size: '6' });
      
      if (currentLocation) {
        params.append('latitude', currentLocation.latitude.toString());
        params.append('longitude', currentLocation.longitude.toString());
      }
      
      const response = await fetch(`${API_BASE}search/products/?${params}`, { headers });
      const data = await response.json();
      
      const processedProducts = (data.results || []).map(product => {
        const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
        const DELIVERY_RADIUS_KM = 10;
        
        let distance = "N/A";
        let distanceValue = Infinity;
        if (currentLocation && product.vendor_latitude && product.vendor_longitude) {
          distanceValue = calculateDistance(
            currentLocation.latitude, currentLocation.longitude,
            product.vendor_latitude, product.vendor_longitude
          );
          distance = `${distanceValue.toFixed(1)} km`;
        }
        
        return {
          id: product.id,
          name: product.name,
          vendor: product.vendor_name || "Unknown Vendor",
          price: product.price,
          image: primaryImage?.image_url || "/placeholder-product.jpg",
          distance,
          distanceValue,
          inStock: product.quantity > 0,
          vendorOnline: product.vendor_online !== false,
          deliveryRadius: product.delivery_radius || DELIVERY_RADIUS_KM
        };
      })
      .filter(product => {
        return product.vendorOnline && 
               (product.distanceValue === Infinity || product.distanceValue <= product.deliveryRadius);
      });
      
      setProducts(processedProducts.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 px-2 md:grid-cols-3 md:gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-24 bg-gray-200"></div>
            <div className="p-2 space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-3 px-2">Products Near You</h3>
      <div className="grid grid-cols-2 gap-2 px-2 md:grid-cols-3 md:gap-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg border border-gray-200 hover:border-[#856043]/30 overflow-hidden shadow-sm">
            <div className="relative h-24 overflow-hidden bg-gray-100 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200&h=200"; }}
              />
            </div>
            <div className="p-2 space-y-1">
              <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</h4>
              <p className="text-[10px] text-gray-500">{product.vendor}</p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <MapPin className="h-2 w-2" />
                <span>{product.distance}</span>
              </div>
              <p className="text-xs font-bold text-[#856043]">Rs {product.price}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#856043] text-[#856043] hover:bg-[#856043] hover:text-white rounded-md text-[10px] py-1"
                disabled={!product.inStock}
                onClick={() => addToCart(product.id, 1)}
              >
                <ShoppingCart className="w-2 h-2 mr-1" />
                Add to Cart
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function CartPage() {
  const { toast } = useToast();
  const { cart, loading, updateCartItem, removeFromCart, fetchCart } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const navigate = useNavigate();

  // Force refresh cart when component mounts
  useEffect(() => {
    fetchCart();
  }, []);

  const savedItems: any[] = [];

  useEffect(() => {
    if (cart?.items) {
      setSelectedIds([]);
    }
  }, [cart]);

  const cartItems = cart?.items || [];
  const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));
  const allSelected = selectedIds.length === cartItems.length && cartItems.length > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(cartItems.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const updateQuantity = async (itemId: number, delta: number) => {
    const item = cartItems.find(item => item.id === itemId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity > 0) {
        await updateCartItem(itemId, newQuantity);
      }
    }
  };

  const removeItem = async (itemId: number) => {
    await removeFromCart(itemId);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    for (const itemId of selectedIds) {
      await removeFromCart(itemId);
    }
    setSelectedIds([]);
  };

  const saveForLater = (item: CartItem) => {
    removeItem(item.id);
    toast({
      title: "Feature Coming Soon",
      description: "Save for later feature will be available soon",
    });
  };

  const moveToCart = (item: any) => {
    toast({
      title: "Feature Coming Soon",
      description: "Move to cart feature will be available soon",
    });
  };

  const applyPromo = () => {
    if (promoCode.toLowerCase() === "save10") {
      setDiscount(0.1);
      toast({
        title: "Promo Applied",
        description: "10% discount has been applied",
      });
    } else {
      setDiscount(0);
      toast({
        title: "Invalid Promo",
        description: "Please enter a valid promo code",
        variant: "destructive",
      });
    }
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => {
      return sum + parseFloat(item.total_price.toString());
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.05;
  const totalDiscount = subtotal * discount;
  const grandTotal = subtotal + tax - totalDiscount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-[#856043] mb-2 animate-pulse" />
          <p className="text-sm text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b py-2 px-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShoppingCart className="w-4 h-4 mr-1 text-[#856043]" />({cartItems.length})
          </h2>
          <Button
            variant="outline"
            className="border-[#856043] text-[#856043] hover:bg-[#856043]/10 hover:text-[#856043] rounded-md text-xs font-medium py-1 px-2"
            onClick={() => navigate("/search")}
          >
            Continue Shopping
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-4 pb-52 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
        {cartItems.length === 0 ? (
          <div>
            <div className="text-center py-6">
              <ShoppingCart className="mx-auto h-10 w-10 text-[#856043] mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Cart is Empty</h3>
              <p className="text-xs text-gray-600 mb-4">Discover products near you</p>
            </div>
            <RecommendedProducts />
          </div>
        ) : (
          <div className="md:flex md:gap-4 space-y-2 md:space-y-0">
            <div className="md:w-1/2 space-y-2">
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="select-all" 
                    checked={allSelected} 
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-[#856043] data-[state=checked]:border-[#856043]"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">Select all ({cartItems.length})</label>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-3 py-1 rounded-md"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.length === 0}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete ({selectedIds.length})
                </Button>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white p-3 flex items-center gap-3 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox 
                        checked={selectedIds.includes(item.id)} 
                        onCheckedChange={() => toggleSelect(item.id)}
                        className="data-[state=checked]:bg-[#856043] data-[state=checked]:border-[#856043] flex-shrink-0"
                      />
                      <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded">
                        <img 
                          src={item.product.images?.[0]?.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200&h=200"} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200&h=200"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-gray-900 truncate">{item.product.name}</h3>
                        <p className="text-[10px] text-gray-500 truncate">Sold by {item.product.vendor_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-xs font-bold text-[#856043]">Rs {item.product.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-5 w-5 p-0 text-gray-600 border-gray-300 hover:border-[#856043] hover:text-[#856043]"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          -
                        </Button>
                        <span className="text-xs min-w-[1rem] text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-5 w-5 p-0 text-gray-600 border-gray-300 hover:border-[#856043] hover:text-[#856043]"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          +
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 text-[#856043] hover:text-[#856043]/90 hover:bg-[#856043]/5"
                          onClick={() => saveForLater(item)}
                        >
                          <Heart className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {savedItems.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 px-2">Saved for Later</h3>
                  <AnimatePresence>
                    {savedItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white p-2 flex items-center gap-2 border-b border-gray-300 hover:bg-gray-50"
                      >
                        <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200&h=200"; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-medium text-gray-900 truncate">{item.name}</h3>
                          <p className="text-[10px] text-gray-500 truncate">Sold by {item.vendor}</p>
                          <p className="text-xs font-bold text-[#856043] mt-1">{item.price}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#856043] text-[#856043] hover:bg-[#856043]/10 text-[10px] px-2 py-1"
                          onClick={() => moveToCart(item)}
                        >
                          Move to Cart
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

            </div>
            <div className="md:w-1/2">
              <RecommendedProducts />
            </div>
          </div>
        )}
      </main>

      {cartItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-300 z-40"
        >
          <div className="max-w-7xl mx-auto px-3">
            <div className="overflow-y-auto" style={{ maxHeight: '30vh' }}>
              <div className="py-2">
                <div className="md:flex md:items-center md:justify-between md:gap-6">
                  <div className="md:flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Order Summary</h3>
                    <div className="space-y-2 text-xs mb-4 md:mb-0">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal ({selectedItems.length} items)</span>
                        <span className="font-medium">Rs {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Taxes (5%)</span>
                        <span className="font-medium">Rs {tax.toFixed(2)}</span>
                      </div>
                      <hr className="border-gray-300 my-2" />
                      <div className="flex justify-between font-bold text-sm text-gray-900">
                        <span>Total</span>
                        <span>Rs {grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-gray-600 mt-2">
                        <Truck className="w-3 h-3" />
                        <span className="text-xs font-semibold">Estimated delivery: Rs 50-60</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="lg"
                    className="w-full md:w-auto md:px-8 rounded-md bg-[#856043] text-white hover:bg-[#856043]/90 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-2 md:mb-0"
                    disabled={selectedItems.length === 0}
                    onClick={() => navigate("/checkout", {
                      state: {
                        selectedItems: selectedItems
                      }
                    })}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <BottomNavigation />
    </div>
  );
}

export default CartPage;