import { useState, useEffect } from "react";
import { Star, MapPin, Flame, Loader2, Truck, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthAction } from "@/hooks/useAuthAction";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";
import { getDeliveryInfo, getDeliveryRadius } from "@/utils/deliveryUtils";

import { API_BASE } from '@/config/api';
import { reviewService } from '@/services/reviewService';
import { filterOwnProducts } from '@/utils/productFilter';

// Google Maps precision Haversine formula with higher precision
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Convert to numbers with full precision
  const lat1Num = parseFloat(lat1);
  const lon1Num = parseFloat(lon1);
  const lat2Num = parseFloat(lat2);
  const lon2Num = parseFloat(lon2);

  const R = 6371000; // Earth's radius in meters for higher precision
  const toRad = (deg) => deg * (Math.PI / 180);

  const dLat = toRad(lat2Num - lat1Num);
  const dLon = toRad(lon2Num - lon1Num);
  const lat1Rad = toRad(lat1Num);
  const lat2Rad = toRad(lat2Num);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c) / 1000; // Convert back to km
};

// Import the ReviewStars component
import { ReviewStars } from "@/components/ReviewStars";

interface TrendingItemsProps {
  onDataLoaded?: () => void;
}

export function TrendingItems({ onDataLoaded }: TrendingItemsProps = {}) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { addToCartWithAuth } = useAuthAction();
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(locationService.getLocation());
  const [productReviews, setProductReviews] = useState<Record<number, { rating: number, total: number }>>({});

  useEffect(() => {
    const unsubscribe = locationService.subscribe(setUserLocation);
    
    // Start location tracking immediately
    locationService.startTracking();
    
    // Only fetch if we already have location, otherwise wait for location update
    const currentLocation = locationService.getLocation();
    if (currentLocation) {
      fetchTrendingItems();
    } else {
      // If no location after 3 seconds, fetch without location (will show all products)
      const timeoutId = setTimeout(() => {
        if (!locationService.getLocation()) {
          console.log('⚠️ No location available, fetching products without location filter');
          fetchTrendingItems();
        }
      }, 3000);
      
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    }
    
    return unsubscribe;
  }, []);

  // Refetch when location changes
  useEffect(() => {
    if (userLocation) {
      fetchTrendingItems();
    }
  }, [userLocation]);

  const fetchTrendingItems = async () => {
    try {
      setLoading(true);

      const headers = {
        'ngrok-skip-browser-warning': 'true'
      };

      // Get current location from service
      const currentLocation = locationService.getLocation();

      // Build query parameters
      const params = new URLSearchParams({
        page_size: '20' // Get more products for trending
      });

      if (currentLocation) {
        params.append('latitude', currentLocation.latitude.toString());
        params.append('longitude', currentLocation.longitude.toString());
      }

      // Fetch products
      const productsResponse = await fetch(`${API_BASE}search/products/?${params}`, { headers });
      
      if (!productsResponse.ok) {
        throw new Error(`HTTP ${productsResponse.status}`);
      }
      
  const productsData = await productsResponse.json();
  const filteredProducts = await filterOwnProducts(productsData.results || []);
  const processedProducts = processProducts(filteredProducts);
  setTrendingItems(processedProducts);

  // After setting products, load reviews for visible products
  const ids = processedProducts.map(p => p.id);
  loadReviewsForProducts(ids);
    } catch (error) {
      console.error('Error fetching trending items:', error);
      // Set empty array on error to prevent UI issues
      setTrendingItems([]);
    } finally {
      setLoading(false);
      onDataLoaded?.();
    }
  };

  const loadReviewsForProducts = async (productIds: number[]) => {
    try {
      const promises = productIds.map((id) => reviewService.getProductReviews(id));
      const results = await Promise.all(promises);
      const mapped = results.reduce((acc, r) => {
        acc[r.product_id] = {
          rating: r.aggregate?.average_rating || 0,
          total: r.aggregate?.total_reviews || 0
        };
        return acc;
      }, {} as Record<number, { rating: number; total: number }>);
      setProductReviews(prev => ({ ...prev, ...mapped }));
    } catch (err) {
      console.error('Failed to load product reviews:', err);
    }
  };

  const processProducts = (products) => {
    const currentLocation = locationService.getLocation();
  // Use delivery radius from product/vendor when available. If not provided,
  // treat as no client-side limit (Infinity) and rely on the backend to filter by vendor radius.

    const computeAggregateRating = (product) => {
      // Prefer explicit reviews array if present
      if (product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
        const values = product.reviews
          .map(r => Number(r.rating ?? r.stars ?? r.score ?? 0))
          .filter(n => !isNaN(n));
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          return Math.max(0, Math.min(5, sum / values.length));
        }
      }

      // Fallbacks: average_rating, rating, or default 0
      if (product.average_rating != null) return Number(product.average_rating);
      if (product.rating != null) return Number(product.rating);
      return 0;
    };

    let processedProducts = products.map(product => {
      const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

      // Calculate distance if location is available
      let distance = "N/A";
      let distanceValue = Infinity;
      
      if (currentLocation && product.vendor_latitude && product.vendor_longitude) {
        distanceValue = calculateDistance(
          currentLocation.latitude, currentLocation.longitude,
          product.vendor_latitude, product.vendor_longitude
        );
        distance = `${distanceValue.toFixed(1)} km`;
      }

      const deliveryInfo = getDeliveryInfo(product, product.vendor_delivery_fee);

      return {
        id: product.id,
        name: product.name,
        vendor: product.vendor_name || "Unknown Vendor",
        vendor_id: product.vendor_id,
        distance,
        distanceValue,
  rating: computeAggregateRating(product),
        price: `Rs ${product.price}`,
        priceValue: parseFloat(product.price),
        image: primaryImage?.image_url || "/placeholder-product.jpg",
        inStock: product.quantity > 0,
        category: product.category,
        totalSold: product.total_sold || 0,
        deliveryInfo,
        vendorOnline: product.vendor_online !== false,
  deliveryRadius: getDeliveryRadius(product) ?? 5,
        // Include delivery properties for checkout
        free_delivery: product.free_delivery,
        custom_delivery_fee_enabled: product.custom_delivery_fee_enabled,
        custom_delivery_fee: product.custom_delivery_fee
      };
    })
    .filter(product => {
      return product.vendorOnline && 
             (product.distanceValue === Infinity || product.distanceValue <= product.deliveryRadius);
    });

    // Sort by rating (highest first) to simulate trending/popular items
    processedProducts.sort((a, b) => b.rating - a.rating);

    // Return top 6 items for trending
    return processedProducts.slice(0, 6);
  };

  const handleItemClick = (itemId: number) => {
    navigate(`/product/${itemId}`);
  };

  const handleBuyNow = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Find the original product data to get delivery properties
    const originalProduct = trendingItems.find(item => item.id === product.id);
    
    navigate("/checkout", {
      state: {
        directBuy: true,
        product: {
          id: product.id,
          name: product.name,
          price: product.price.replace('Rs ', ''),
          quantity: 1,
          vendor_name: product.vendor,
          vendor_id: originalProduct?.vendor_id,
          images: [{ image_url: product.image }],
          // Include delivery properties
          free_delivery: originalProduct?.free_delivery,
          custom_delivery_fee_enabled: originalProduct?.custom_delivery_fee_enabled,
          custom_delivery_fee: originalProduct?.custom_delivery_fee
        }
      }
    });
  };

  if (loading) {
    return (
      <section className="px-4 sm:px-6 md:px-8 mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Trending Now 🔥</h2>
          <Button
            variant="outline"
            size="sm"
            style={{
              borderColor: "#856043",
              color: "#856043",
              backgroundColor: "transparent",
            }}
            className="rounded-full hover:bg-[#856043] hover:text-white text-sm"
            onClick={() => navigate('/trending-items')}
          >
            View All
          </Button>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 md:px-8 mb-6 lg:mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Trending Now 🔥</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-gray-600 hover:text-gray-800"
          onClick={() => navigate('/trending-items')}
        >
          View All
        </Button>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar pb-3 snap-x snap-mandatory">
        {trendingItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
            whileHover={{ scale: 1.03, boxShadow: "0 12px 24px rgba(0,0,0,0.15)" }}
            whileTap={{ scale: 0.97 }}
            className="relative min-w-[130px] sm:min-w-[150px] md:min-w-[130px] bg-gradient-to-br from-card/90 to-card rounded-xl p-3 shadow-lg border border-border/20 hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer group snap-start"
            onClick={() => handleItemClick(item.id)}
            aria-label={`View ${item.name} from ${item.vendor}`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full p-1 shadow-md group-hover:animate-bounce">
                  <Flame className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Hot Item!</TooltipContent>
            </Tooltip>
            <div className="w-full h-20 mb-2 overflow-hidden rounded-md">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
              />
            </div>
            <h3 className="font-semibold text-xs mb-1 text-foreground line-clamp-1">
              {item.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-1 truncate">{item.vendor}</p>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {/* Single star symbol and numeric aggregate rating */}
                <Star className="h-3 w-3 text-yellow-400" />
                <span>
                  {(productReviews[item.id]?.rating ?? item.rating ?? 0).toFixed(1)}
                </span>
                {/* Optional total reviews count */}
                {productReviews[item.id]?.total !== undefined && (
                  <span className="text-xs text-muted-foreground">({productReviews[item.id]?.total})</span>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">{item.distance}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Distance from you</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary text-sm">{item.price}</p>
                  <p className="text-xs text-gray-500">{item.totalSold || 0} sold</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-0.5">
                      <Truck className="h-3 w-3 text-muted-foreground" />
                      <span className={`text-xs px-1 py-0.5 rounded-full ${
                        item.deliveryInfo.isFreeDelivery 
                          ? 'bg-green-100 text-green-700' 
                          : item.deliveryInfo.deliveryFee === null
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.deliveryInfo.isFreeDelivery 
                          ? 'Free' 
                          : item.deliveryInfo.deliveryFee === null 
                          ? 'TBD' 
                          : `Rs ${item.deliveryInfo.deliveryFee}`}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {item.deliveryInfo.isFreeDelivery 
                      ? 'Free Delivery' 
                      : item.deliveryInfo.deliveryFee === null 
                      ? 'Delivery fee determined at checkout' 
                      : `Delivery: Rs ${item.deliveryInfo.deliveryFee}`}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-6 h-6 p-0 border-[#856043] text-[#856043] hover:bg-[#856043] hover:text-white"
                  disabled={!item.inStock}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const token = await authService.getToken();
                    if (!token) {
                      localStorage.setItem('pendingAction', JSON.stringify({
                        type: 'add_to_cart',
                        data: {
                          productId: item.id,
                          quantity: 1
                        },
                        path: '/cart',
                        timestamp: Date.now()
                      }));
                      navigate('/login');
                      return;
                    }
                    try {
                      await addToCartWithAuth(item.id.toString(), 1);
                      toast({
                        title: "Added to Cart",
                        description: `${item.name} added to your cart`,
                      });
                      navigate('/cart');
                    } catch (error) {
                      console.error('Error adding to cart:', error);
                    }
                  }}
                >
                  <ShoppingCart className="h-3 w-3" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 h-6 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                  disabled={!item.inStock}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const token = await authService.getToken();
                    if (!token) {
                      localStorage.setItem('pendingAction', JSON.stringify({
                        type: 'buy_now',
                        data: {
                          id: item.id,
                          name: item.name,
                          price: item.price.replace('Rs ', ''),
                          quantity: 1,
                          vendor_name: item.vendor,
                          vendor_id: item.vendor_id,
                          images: [{ image_url: item.image }],
                          // Include delivery properties
                          free_delivery: item.free_delivery,
                          custom_delivery_fee_enabled: item.custom_delivery_fee_enabled,
                          custom_delivery_fee: item.custom_delivery_fee
                        },
                        path: '/checkout',
                        timestamp: Date.now()
                      }));
                      navigate('/login');
                      return;
                    }
                    handleBuyNow(item, e);
                  }}
                >
                  Buy
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}