import { useState, useEffect } from "react";
import { Star, MapPin, Flame, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";

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

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
      ))}
      {halfStar && <Star key="half" className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-2.5 w-2.5 stroke-yellow-400 text-transparent" />
      ))}
    </>
  );
}

interface TrendingItemsProps {
  onDataLoaded?: () => void;
}

export function TrendingItems({ onDataLoaded }: TrendingItemsProps = {}) {
  const navigate = useNavigate();
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(locationService.getLocation());

  useEffect(() => {
    const unsubscribe = locationService.subscribe(setUserLocation);
    fetchTrendingItems();
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
    } catch (error) {
      console.error('Error fetching trending items:', error);
      // Set empty array on error to prevent UI issues
      setTrendingItems([]);
    } finally {
      setLoading(false);
      onDataLoaded?.();
    }
  };

  const processProducts = (products) => {
    const currentLocation = locationService.getLocation();

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
        category: product.category
      };
    });

    // Sort by rating (highest first) to simulate trending/popular items
    processedProducts.sort((a, b) => b.rating - a.rating);

    // Return top 6 items for trending
    return processedProducts.slice(0, 6);
  };

  const handleItemClick = (itemId: number) => {
    navigate(`/product/${itemId}`);
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
      <div className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar pb-3 snap-x snap-mandatory">
        {trendingItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
            whileHover={{ scale: 1.03, boxShadow: "0 12px 24px rgba(0,0,0,0.15)" }}
            whileTap={{ scale: 0.97 }}
            className="relative min-w-[120px] sm:min-w-[140px] md:min-w-[120px] bg-gradient-to-br from-card/90 to-card rounded-xl p-3 shadow-lg border border-border/20 hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer group snap-start"
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
              <div className="flex gap-0.5">
                {renderStars(item.rating)}
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
            <p className="font-bold text-primary text-sm">{item.price}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}