import { useState, useEffect } from "react";
import { Heart, ShoppingCart, Loader2, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthAction } from "@/hooks/useAuthAction";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";
import { getDeliveryInfo } from "@/utils/deliveryUtils";

import { API_BASE } from '@/config/api';
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

interface FeaturedProductsProps {
  onDataLoaded?: () => void;
}

export function FeaturedProducts({ onDataLoaded }: FeaturedProductsProps = {}) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { addToCartWithAuth } = useAuthAction();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(locationService.getLocation());

  useEffect(() => {
    const unsubscribe = locationService.subscribe(setUserLocation);
    fetchFeaturedProducts();
    return unsubscribe;
  }, []);

  // Refetch when location changes
  useEffect(() => {
    if (userLocation) {
      fetchFeaturedProducts();
    }
  }, [userLocation]);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);

      const headers = {
        'ngrok-skip-browser-warning': 'true'
      };

      // Get current location from service
      const currentLocation = locationService.getLocation();

      // Build query parameters
      const params = new URLSearchParams({
        page_size: '20' // Get more products to filter for featured
      });

      if (currentLocation) {
        params.append('latitude', currentLocation.latitude.toString());
        params.append('longitude', currentLocation.longitude.toString());
      }

      // Fetch products
      const productsResponse = await fetch(`${API_BASE}search/products/?${params}`, { headers });
      const productsData = await productsResponse.json();

      const filteredProducts = await filterOwnProducts(productsData.results || []);
      const processedProducts = processProducts(filteredProducts);
      setFeaturedProducts(processedProducts);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
      onDataLoaded?.();
    }
  };

  const processProducts = (products) => {
    const currentLocation = locationService.getLocation();

    // Filter for featured products only
    let featuredProducts = products.filter(product => product.featured === true);

    let processedProducts = featuredProducts.map(product => {
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
        distance,
        distanceValue,
        rating: 4.5, // Default rating since API might not have it
        price: `₹${product.price}`,
        priceValue: parseFloat(product.price),
        image: primaryImage?.image_url || "/placeholder-product.jpg",
        inStock: product.quantity > 0,
        category: product.category,
        featured: product.featured,
        totalSold: product.total_sold || 0,
        deliveryInfo
      };
    });

    // Sort by rating (highest first) for featured products
    processedProducts.sort((a, b) => b.rating - a.rating);

    // Return top 6 featured items
    return processedProducts.slice(0, 6);
  };

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const handleBuyNow = async (product: any) => {
    try {
      await addToCartWithAuth(product.id.toString(), 1);
      toast({
        title: "Added to Cart",
        description: `${product.name} added to your cart`,
      });
      navigate("/cart");
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <section className="px-4 py-3 mb-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black">
            Featured Products
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-3 mb-8 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-black">
          Featured Products
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-gray-600 hover:text-gray-800"
          onClick={() => navigate('/featured-items')}
        >
          View All
        </Button>
      </div>

      {/* Responsive layout: horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-3 md:grid md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 md:overflow-visible md:pb-0">
        {featuredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.02, rotate: 0.5 }}
            className="relative flex-shrink-0 w-36 md:w-auto rounded-lg bg-white border border-gray-200 hover:border-[#856043] shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300 overflow-hidden group cursor-pointer"
            onClick={() => handleProductClick(product.id)}
          >
            {/* Featured Badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.2 }}
              className="absolute top-2 left-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-sm"
            >
              Featured
            </motion.span>

            {/* Product Image */}
            <div className="w-full h-28 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
              />
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col justify-between h-36">
              <div>
                <h3 className="font-medium text-sm text-gray-800 mb-1 line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-600 mb-1 truncate">{product.vendor}</p>
              </div>

              <div>
                {/* Price and Delivery */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-[#856043]">
                      {product.price}
                    </span>
                    <span className="text-xs font-medium text-green-600">{product.totalSold || 0} sold</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium">{product.distance}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      product.deliveryInfo.isFreeDelivery 
                        ? 'bg-green-100 text-green-700' 
                        : product.deliveryInfo.deliveryFee === null
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {product.deliveryInfo.isFreeDelivery 
                        ? 'Free' 
                        : product.deliveryInfo.deliveryFee === null 
                        ? 'TBD' 
                        : `₹${product.deliveryInfo.deliveryFee}`}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`text-xs ${
                        idx < Math.floor(product.rating)
                          ? "text-amber-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">
                    {product.rating.toFixed(1)}
                  </span>
                </div>

                {/* Button */}
                <div className="flex justify-center">
                  {product.inStock ? (
                    <Button
                      variant="outline"
                      className="w-full text-xs py-1.5 shadow-sm h-7"
                      style={{
                        borderColor: "#856043",
                        color: "#856043",
                        backgroundColor: "transparent",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#856043";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#856043";
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleBuyNow(product);
                      }}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" /> Buy Now
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="w-full bg-gray-200 text-gray-500 cursor-not-allowed text-xs py-1.5 shadow-sm h-7"
                    >
                      Out of Stock
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {featuredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="font-semibold text-lg mb-2">No featured products</h3>
          <p className="text-muted-foreground">
            Featured products will appear here when available
          </p>
        </div>
      )}
    </section>
  );
}