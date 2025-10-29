import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, CreditCard, Navigation, Map, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { useApp } from "@/contexts/AppContext";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { LocationMap } from "@/components/LocationMap";
import { orderService } from "@/services/orderService";
import { notificationService } from "@/services/notificationService";
import { API_BASE } from '@/config/api';
import { getImageUrl } from '@/utils/imageUtils';

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

export default function CheckOut() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { state } = useApp();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [locationOption, setLocationOption] = useState("current");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentLocationName, setCurrentLocationName] = useState("Detecting location...");
  const [customLocation, setCustomLocation] = useState({ lat: null, lng: null, address: "" });
  const [showMap, setShowMap] = useState(false);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    phone: "",
    instructions: ""
  });
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("delivery");
  const [locationSearch, setLocationSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    // Get current location on component mount
    const location = locationService.getLocation();
    if (location) {
      setCurrentLocation(location);
      getLocationName(location.latitude, location.longitude).then(setCurrentLocationName);
    } else {
      locationService.startTracking();
      const unsubscribe = locationService.subscribe(async (newLocation) => {
        if (newLocation) {
          setCurrentLocation(newLocation);
          const locationName = await getLocationName(newLocation.latitude, newLocation.longitude);
          setCurrentLocationName(locationName);
        }
      });
      return unsubscribe;
    }
    
    // Fetch vendor info for the first cart item
    if (cart?.items?.length > 0) {
      fetchVendorInfo(cart.items[0].product.vendor_id);
    }
    
    // Fetch user info if logged in
    const checkAuthAndFetchUser = async () => {
      const token = await authService.getToken();
      if (token) {
        fetchUserInfo();
      }
    };
    checkAuthAndFetchUser();
  }, [cart]);
  
  const fetchUserInfo = async () => {
    try {
      const token = await authService.getToken();
      const response = await fetch(`${API_BASE}profile/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUserInfo(userData);
        setDeliveryAddress(prev => ({
          ...prev,
          phone: userData.phone_number || ""
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const getLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      if (data.address) {
        const primaryLocation = data.address.road || data.address.neighbourhood;
        const secondaryLocation = data.address.neighbourhood || data.address.suburb || data.address.city || data.address.town;
        const fullAddress = `${primaryLocation || secondaryLocation || 'Unknown Location'}, ${data.address.city || data.address.town || data.address.state || ''}`;
        return fullAddress;
      }
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const fetchVendorInfo = async (vendorId) => {
    try {
      const response = await fetch(`${API_BASE}vendors/${vendorId}/`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (response.ok) {
        const vendor = await response.json();
        setVendorInfo(vendor);
      }
    } catch (error) {
      console.error('Failed to fetch vendor info:', error);
    }
  };

  // Check if this is a direct buy from product detail, search, or wishlist
  const location = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const isDirectBuyFromUrl = urlParams.get('directBuy') === 'true';
  
  // Get buyNowProduct from localStorage if coming from redirectService
  const buyNowProduct = isDirectBuyFromUrl ? JSON.parse(localStorage.getItem('buyNowProduct') || 'null') : null;
  
  const directBuyData = location.state?.directBuy ? location.state : 
    (isDirectBuyFromUrl && buyNowProduct ? { directBuy: true, product: buyNowProduct } : null);
  const selectedCartItems = location.state?.selectedItems;
  
  console.log('Checkout - Location state:', location.state);
  console.log('Checkout - URL params directBuy:', isDirectBuyFromUrl);
  console.log('Checkout - buyNowProduct from localStorage:', buyNowProduct);
  console.log('Checkout - Final directBuyData:', directBuyData);
  
  // Use either direct buy product, selected cart items, or all cart items
  const cartItems = directBuyData ? [
    {
      id: Date.now(), // temporary ID
      product: {
        id: directBuyData.product.id,
        name: directBuyData.product.name,
        price: directBuyData.product.price, // Add missing price property
        vendor_name: directBuyData.product.vendor_name,
        vendor_id: directBuyData.product.vendor_id,
        images: directBuyData.product.images,
        // Include delivery properties from direct buy data
        free_delivery: directBuyData.product.free_delivery,
        custom_delivery_fee_enabled: directBuyData.product.custom_delivery_fee_enabled,
        custom_delivery_fee: directBuyData.product.custom_delivery_fee
      },
      quantity: directBuyData.product.quantity,
      total_price: (parseFloat(directBuyData.product.price) * directBuyData.product.quantity).toString()
    }
  ] : (selectedCartItems || cart?.items || []);
  
  console.log('Checkout - Cart items:', cartItems);
  console.log('Checkout - Direct buy data:', directBuyData);
  console.log('Checkout - Buy now product from localStorage:', buyNowProduct);

  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = parseFloat(item.product.price || item.total_price || 0);
    console.log(`Checkout - Item: ${item.product.name}, Price: ${item.product.price}, Total: ${item.total_price}, Calculated: ${itemPrice}, Quantity: ${item.quantity}`);
    return sum + (itemPrice * item.quantity);
  }, 0);

  // Calculate delivery fee based on product settings
  const calculateDeliveryFee = () => {
    let totalDeliveryFee = 0;
    let hasUndeterminedFee = false;
    
    console.log('Checkout - Calculating delivery fee for items:', cartItems);
    
    cartItems.forEach(item => {
      const product = item.product;
      console.log('Checkout - Processing item:', {
        name: product.name,
        free_delivery: product.free_delivery,
        custom_delivery_fee_enabled: product.custom_delivery_fee_enabled,
        custom_delivery_fee: product.custom_delivery_fee
      });
      
      // Handle cases where delivery properties might be missing
      if (product.free_delivery === true) {
        // Free delivery - no fee
        console.log('Checkout - Free delivery for:', product.name);
        return;
      } else if (product.custom_delivery_fee_enabled === true && product.custom_delivery_fee !== null && product.custom_delivery_fee !== undefined) {
        // Custom delivery fee set by vendor
        const fee = parseFloat(product.custom_delivery_fee.toString());
        console.log('Checkout - Custom delivery fee for:', product.name, 'Fee:', fee);
        totalDeliveryFee += fee;
      } else {
        // Yet to be determined - no specific fee set or properties missing
        console.log('Checkout - Undetermined delivery fee for:', product.name);
        hasUndeterminedFee = true;
      }
    });
    
    console.log('Checkout - Final delivery calculation:', { fee: totalDeliveryFee, hasUndetermined: hasUndeterminedFee });
    return { fee: totalDeliveryFee, hasUndetermined: hasUndeterminedFee };
  };

  const deliveryResult = calculateDeliveryFee();
  const deliveryFee = deliveryResult.fee;
  const hasUndeterminedDelivery = deliveryResult.hasUndetermined;
  const tax = 0; // No tax
  const total = subtotal + deliveryFee;

  const validateNepaliPhone = (phone: string) => {
    // Nepali mobile number validation: starts with 98 or 97 and has 10 digits total
    const nepaliPhoneRegex = /^(98|97)\d{8}$/;
    return nepaliPhoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const handleAddressChange = (field: string, value: string) => {
    if (field === 'phone') {
      // Only allow digits and basic formatting
      const cleanValue = value.replace(/[^0-9]/g, '');
      if (cleanValue.length <= 10) {
        setDeliveryAddress(prev => ({ ...prev, [field]: cleanValue }));
      }
    } else {
      setDeliveryAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateDeliveryLocation = (lat, lng) => {
    if (!vendorInfo || !vendorInfo.latitude || !vendorInfo.longitude || !vendorInfo.delivery_radius) {
      return { valid: true, distance: 0 }; // Allow if vendor info not available
    }
    
    const distance = calculateDistance(lat, lng, vendorInfo.latitude, vendorInfo.longitude);
    const valid = distance <= vendorInfo.delivery_radius;
    
    return { valid, distance, maxRadius: vendorInfo.delivery_radius };
  };

  const handleLocationOptionChange = (option) => {
    setLocationOption(option);
    if (option === "custom" && vendorInfo) {
      setShowMap(true);
    } else if (option === "custom" && !vendorInfo) {
      toast({
        title: "Vendor Information Loading",
        description: "Please wait for vendor information to load before selecting map location",
        variant: "destructive",
      });
    }
  };

  const handleMapLocationSelect = (lat, lng, address) => {
    const validation = validateDeliveryLocation(lat, lng);
    
    if (!validation.valid) {
      toast({
        title: "Location Out of Range",
        description: `This location is ${validation.distance.toFixed(1)}km away. Maximum delivery range is ${validation.maxRadius}km.`,
        variant: "destructive",
      });
      return;
    }
    
    setCustomLocation({ lat, lng, address });
    setShowMap(false);
    toast({
      title: "Location Selected",
      description: `Delivery location set (${validation.distance.toFixed(1)}km from vendor)`,
    });
  };

  const isDeliveryComplete = () => {
    const hasLocation = locationOption === "current" ? currentLocation : customLocation.lat;
    const phoneToValidate = userInfo?.phone_number || deliveryAddress.phone;
    const hasValidPhone = phoneToValidate && validateNepaliPhone(phoneToValidate);
    return hasLocation && hasValidPhone;
  };

  const handlePlaceOrder = async () => {
    const token = await authService.getToken();
    if (!token) {
      toast({
        title: "Login Required",
        description: "Please login to place an order",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (!isDeliveryComplete()) {
      toast({
        title: "Missing Information",
        description: "Please complete delivery information",
        variant: "destructive",
      });
      setActiveTab("delivery");
      return;
    }
    
    // Validate delivery location
    const deliveryLocation = locationOption === "current" ? currentLocation : customLocation;
    if (!deliveryLocation || (!deliveryLocation.latitude && !deliveryLocation.lat)) {
      toast({
        title: "Location Required",
        description: "Please select a delivery location",
        variant: "destructive",
      });
      return;
    }
    
    const lat = deliveryLocation.latitude || deliveryLocation.lat;
    const lng = deliveryLocation.longitude || deliveryLocation.lng;
    const validation = validateDeliveryLocation(lat, lng);
    
    if (!validation.valid) {
      toast({
        title: "Delivery Not Available",
        description: `Selected location is outside delivery range (${validation.distance.toFixed(1)}km > ${validation.maxRadius}km)`,
        variant: "destructive",
      });
      return;
    }
    
    // Create order
    try {
      console.log('Checkout - About to create order with cartItems:', cartItems);
      
      if (!cartItems || cartItems.length === 0) {
        toast({
          title: "No Items",
          description: "No items found to place order. Please add items to cart first.",
          variant: "destructive",
        });
        return;
      }
      
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: parseFloat(item.product.price || item.total_price || 0),
          delivery_fee: item.product.free_delivery === true ? 0 : 
            (item.product.custom_delivery_fee_enabled === true && item.product.custom_delivery_fee !== null && item.product.custom_delivery_fee !== undefined
              ? parseFloat(item.product.custom_delivery_fee.toString()) 
              : 0) // 0 for undetermined (backend doesn't accept null)
        })),
        delivery_name: userInfo?.username || userInfo?.first_name || "Customer",
        delivery_phone: userInfo?.phone_number || deliveryAddress.phone,
        delivery_address: locationOption === "current" ? currentLocationName : customLocation.address,
        delivery_latitude: lat,
        delivery_longitude: lng,
        delivery_instructions: deliveryAddress.instructions,
        payment_method: paymentMethod,
        total_amount: total,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        notes: `Distance: ${validation.distance.toFixed(1)}km from vendor. Items: ${cartItems.map(item => `${item.product.name} (${item.quantity}x)`).join(', ')}`
      };
      
      const result = await orderService.createOrder(orderData);
      
      // Handle multiple orders response
      const orders = result.orders || [result.order];
      const orderCount = result.total_orders || orders.length;
      
      toast({
        title: "Order Placed Successfully!",
        description: orderCount > 1 
          ? `${orderCount} orders created for different vendors`
          : `Order #${orders[0].order_number} has been placed.`,
      });
      
      // Show immediate browser notification for testing
      if ('Notification' in window && Notification.permission === 'granted') {
        const firstOrder = orders[0];
        new Notification('New Order Placed!', {
          body: orderCount > 1
            ? `${orderCount} orders created for Rs ${orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0).toFixed(2)}`
            : `Order #${firstOrder.order_number} for Rs ${firstOrder.total_amount}`,
          icon: '/favicon.ico',
          tag: `order-${firstOrder.id}`,
          requireInteraction: true
        });
      }
      
      // Trigger vendor notification event for each order
      if (window.dispatchEvent) {
        orders.forEach(order => {
          window.dispatchEvent(new CustomEvent('orderCreated', { 
            detail: { order } 
          }));
        });
      }
      
      // Clear buyNowProduct from localStorage if it was a direct buy
      if (directBuyData && isDirectBuyFromUrl) {
        localStorage.removeItem('buyNowProduct');
      }
      
      // Clear cart if not direct buy
      if (!directBuyData && selectedCartItems) {
        const token = await authService.getToken();
        // Remove selected items from cart
        for (const item of selectedCartItems) {
          try {
            await fetch(`${API_BASE}cart/items/${item.id}/remove/`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Token ${token}`,
                'ngrok-skip-browser-warning': 'true'
              }
            });
          } catch (error) {
            console.error('Error removing cart item:', error);
          }
        }
      }
      
      // Navigate to order confirmation - use first order for single order, or orders page for multiple
      if (orderCount === 1) {
        navigate(`/order-confirmation/${orders[0].id}`, {
          state: { order: orders[0] }
        });
      } else {
        navigate('/orders', {
          state: { 
            message: `${orderCount} orders created successfully`,
            newOrders: orders
          }
        });
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCurrentLocationText = () => {
    if (!currentLocation) return "Detecting location...";
    return currentLocationName;
  };

  const getCustomLocationText = () => {
    if (!customLocation.lat) return "Select on map";
    return customLocation.address || `Custom Location (${customLocation.lat.toFixed(4)}, ${customLocation.lng.toFixed(4)})`;
  };

  const handleLocationSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      const results = await response.json();
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Location search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const selectSearchLocation = async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;
    
    const validation = validateDeliveryLocation(lat, lng);
    
    if (!validation.valid) {
      toast({
        title: "Location Out of Range",
        description: `This location is ${validation.distance.toFixed(1)}km away. Maximum delivery range is ${validation.maxRadius}km.`,
        variant: "destructive",
      });
      return;
    }
    
    setCustomLocation({ lat, lng, address });
    setLocationOption("custom");
    setLocationSearch("");
    setSearchResults([]);
    setShowSearchResults(false);
    
    toast({
      title: "Location Selected",
      description: `Delivery location set (${validation.distance.toFixed(1)}km from vendor)`,
    });
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (locationSearch.trim()) {
        handleLocationSearch(locationSearch);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [locationSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b py-4 px-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Checkout</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 pb-32">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              {isDeliveryComplete() && <Check className="h-4 w-4" />}
              Delivery
            </TabsTrigger>
            <TabsTrigger value="summary" disabled={!isDeliveryComplete()}>
              Summary
            </TabsTrigger>
          </TabsList>
          <TabsContent value="delivery" className="space-y-6">
            <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                  <MapPin className="h-6 w-6 text-emerald-600" />
                  Delivery Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Current Location Display */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Current Delivery Location</p>
                      <p className="text-base font-semibold text-gray-800">
                        {locationOption === "current" ? getCurrentLocationText() : getCustomLocationText()}
                      </p>
                      {((locationOption === "current" && currentLocation) || (locationOption === "custom" && customLocation.lat)) && vendorInfo && (
                        <p className="text-xs text-emerald-600 mt-1">
                          {locationOption === "current" 
                            ? validateDeliveryLocation(currentLocation.latitude, currentLocation.longitude).distance.toFixed(1)
                            : validateDeliveryLocation(customLocation.lat, customLocation.lng).distance.toFixed(1)
                          }km from {vendorInfo.business_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location Search */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Search Location</Label>
                  <div className="relative">
                    <Input
                      placeholder="Search for an address..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      onFocus={() => locationSearch && setShowSearchResults(true)}
                      className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                    />
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectSearchLocation(result)}
                          >
                            <p className="text-sm font-medium text-gray-900" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{result.display_name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Choose Delivery Location *</Label>
                  <RadioGroup value={locationOption} onValueChange={handleLocationOptionChange} className="space-y-3">
                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                      <RadioGroupItem value="current" id="current" className="text-emerald-600 border-gray-300" />
                      <Label htmlFor="current" className="flex items-center gap-3 flex-1 cursor-pointer">
                        <Navigation className="h-5 w-5 text-gray-600" />
                        <div>
                          <span className="text-base font-medium text-gray-800">Use Current Location</span>
                          <p className="text-sm text-gray-500">{getCurrentLocationText()}</p>
                          {currentLocation && vendorInfo && (
                            <p className="text-xs text-emerald-600">
                              {validateDeliveryLocation(currentLocation.latitude, currentLocation.longitude).distance.toFixed(1)}km from vendor
                            </p>
                          )}
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                      <RadioGroupItem value="custom" id="custom" className="text-emerald-600 border-gray-300" />
                      <Label htmlFor="custom" className="flex items-center gap-3 flex-1 cursor-pointer">
                        <Map className="h-5 w-5 text-gray-600" />
                        <div>
                          <span className="text-base font-medium text-gray-800">Choose on Map</span>
                          <p className="text-sm text-gray-500">{getCustomLocationText()}</p>
                          {customLocation.lat && vendorInfo && (
                            <p className="text-xs text-emerald-600">
                              {validateDeliveryLocation(customLocation.lat, customLocation.lng).distance.toFixed(1)}km from vendor
                            </p>
                          )}
                        </div>
                      </Label>
                    </div>
                    
                    {locationOption === "custom" && !customLocation.lat && (
                      <div className="ml-8">
                        <Button
                          onClick={() => vendorInfo ? setShowMap(true) : null}
                          disabled={!vendorInfo}
                          variant="outline"
                          className="text-sm px-4 py-2 rounded-lg"
                        >
                          {vendorInfo ? "Open Map" : "Loading vendor info..."}
                        </Button>
                      </div>
                    )}
                  </RadioGroup>
                  

                </div>
                
                {!userInfo?.phone_number && (
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="98XXXXXXXX or 97XXXXXXXX"
                      value={deliveryAddress.phone}
                      onChange={(e) => handleAddressChange("phone", e.target.value)}
                      className={`mt-1 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl transition-all ${
                        deliveryAddress.phone && !validateNepaliPhone(deliveryAddress.phone) 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`}
                    />
                    {deliveryAddress.phone && !validateNepaliPhone(deliveryAddress.phone) && (
                      <p className="text-xs text-red-600 mt-1">Please enter a valid Nepali mobile number (98XXXXXXXX or 97XXXXXXXX)</p>
                    )}
                  </div>
                )}
                
                <div>
                  <Label htmlFor="instructions" className="text-sm font-medium text-gray-700">Delivery Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Any special instructions for delivery"
                    value={deliveryAddress.instructions}
                    onChange={(e) => handleAddressChange("instructions", e.target.value)}
                    rows={3}
                    className="mt-1 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl transition-all"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setActiveTab("summary")} 
                    disabled={!isDeliveryComplete()}
                    className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  >
                    Continue to Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
                <CardTitle className="text-xl font-semibold text-gray-800">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Delivery Location Summary */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Delivery Location</p>
                      <p className="text-base font-semibold text-gray-800">
                        {locationOption === "current" ? getCurrentLocationText() : getCustomLocationText()}
                      </p>
                      {((locationOption === "current" && currentLocation) || (locationOption === "custom" && customLocation.lat)) && vendorInfo && (
                        <p className="text-xs text-emerald-600 mt-1">
                          {locationOption === "current" 
                            ? validateDeliveryLocation(currentLocation.latitude, currentLocation.longitude).distance.toFixed(1)
                            : validateDeliveryLocation(customLocation.lat, customLocation.lng).distance.toFixed(1)
                          }km from {vendorInfo.business_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4 bg-gray-200" />
                
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4 border-b border-gray-100">
                    <img
                      src={getImageUrl(item.product.images?.[0]?.image_url)}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-lg text-gray-800">{item.product.name}</p>
                      <p className="text-sm text-gray-500">{item.product.vendor_name}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-500">Price: Rs {parseFloat(item.product.price || item.total_price || 0).toFixed(2)} each</p>
                      {item.product.free_delivery === true && (
                        <p className="text-xs text-green-600 font-medium">✓ Free Delivery</p>
                      )}
                      {item.product.custom_delivery_fee_enabled === true && item.product.custom_delivery_fee !== null && item.product.custom_delivery_fee !== undefined && item.product.free_delivery !== true && (
                        <p className="text-xs text-orange-600">Delivery: Rs {parseFloat(item.product.custom_delivery_fee.toString()).toFixed(2)}</p>
                      )}
                      {item.product.free_delivery !== true && (item.product.custom_delivery_fee_enabled !== true || item.product.custom_delivery_fee === null || item.product.custom_delivery_fee === undefined) && (
                        <p className="text-xs text-orange-600">Delivery: To be determined</p>
                      )}
                    </div>
                    <p className="font-semibold text-lg text-gray-800">Rs {(parseFloat(item.product.price || item.total_price || 0) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <Separator className="my-4 bg-gray-200" />
                <div className="space-y-4">
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-800 mb-3">Order Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-base text-gray-700">
                        <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                        <span className="font-semibold">Rs {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base text-gray-700">
                        <span>Delivery Fee</span>
                        <span className="font-semibold">
                          {deliveryFee === 0 && !hasUndeterminedDelivery ? (
                            <span className="text-green-600">Free</span>
                          ) : hasUndeterminedDelivery ? (
                            <span className="text-orange-600">To be determined</span>
                          ) : (
                            `Rs ${deliveryFee.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      {(deliveryFee > 0 || hasUndeterminedDelivery) && (
                        <p className="text-xs text-gray-500">
                          {hasUndeterminedDelivery 
                            ? "Delivery fee will be determined based on your location"
                            : "Delivery fees are set by individual vendors"
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-2 bg-gray-200" />
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total Amount</span>
                    <span>Rs {total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("delivery")}
                    className="px-8 py-2 rounded-xl"
                  >
                    Back to Delivery
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </main>

      {/* Bottom Action */}
      {activeTab === "summary" && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl py-4">
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-800">Rs {total.toFixed(2)}</p>
            </div>
            <Button
              onClick={handlePlaceOrder}
              disabled={!isDeliveryComplete()}
              className="px-10 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Place Order
            </Button>
          </div>
        </footer>
      )}
      
      {/* Location Map Modal */}
      {showMap && vendorInfo && (
        <LocationMap
          onLocationSelect={handleMapLocationSelect}
          onClose={() => setShowMap(false)}
          vendorLocation={{
            lat: vendorInfo.latitude,
            lng: vendorInfo.longitude
          }}
          maxRadius={vendorInfo.delivery_radius}
          vendorName={vendorInfo.business_name}
        />
      )}
    </div>
  );
}