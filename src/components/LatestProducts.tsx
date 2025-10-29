import { useState, useEffect } from "react";
import { Heart, ShoppingCart, Loader2, Truck, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthAction } from "@/hooks/useAuthAction";
import { locationService } from "@/services/locationService";
import { getDeliveryInfo } from "@/utils/deliveryUtils";
import { API_BASE } from '@/config/api';
import { filterOwnProducts } from '@/utils/productFilter';

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

interface LatestProductsProps {
  onDataLoaded?: () => void;
}

export function LatestProducts({ onDataLoaded }: LatestProductsProps = {}) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { addToCartWithAuth } = useAuthAction();
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(locationService.getLocation());

  useEffect(() => {
    const unsubscribe = locationService.subscribe(setUserLocation);
    
    // Start location tracking immediately
    locationService.startTracking();
    
    // Only fetch if we already have location, otherwise wait for location update
    const currentLocation = locationService.getLocation();
    if (currentLocation) {
      fetchLatestProducts();
    } else {
      // If no location after 3 seconds, fetch without location (will show all products)
      const timeoutId = setTimeout(() => {
        if (!locationService.getLocation()) {
          console.log('⚠️ No location available, fetching products without location filter');
          fetchLatestProducts();
        }
      }, 3000);
      
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    }
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchLatestProducts();
    }
  }, [userLocation]);

  const fetchLatestProducts = async () => {
    try {
      setLoading(true);
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      const currentLocation = locationService.getLocation();
      
      const params = new URLSearchParams({ page_size: '40' });
      if (currentLocation) {
        params.append('latitude', currentLocation.latitude.toString());
        params.append('longitude', currentLocation.longitude.toString());
      }

      const productsResponse = await fetch(`${API_BASE}search/products/?${params}`, { headers });
      const productsData = await productsResponse.json();
      const filteredProducts = await filterOwnProducts(productsData.results || []);
      const processedProducts = processProducts(filteredProducts);
      setLatestProducts(processedProducts);
    } catch (error) {
      console.error('Error fetching latest products:', error);
    } finally {
      setLoading(false);
      onDataLoaded?.();
    }
  };

  const processProducts = (products) => {
    const currentLocation = locationService.getLocation();
    const DELIVERY_RADIUS_KM = 10;
    
    let processedProducts = products.map(product => {
      const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
      
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
        rating: 4.5,
        price: `Rs ${product.price}`,
        priceValue: parseFloat(product.price),
        image: primaryImage?.image_url || "/placeholder-product.jpg",
        inStock: product.quantity > 0,
        category: product.category,
        totalSold: product.total_sold || 0,
        deliveryInfo,
        createdAt: product.created_at,
        vendorOnline: product.vendor_online !== false,
        deliveryRadius: product.delivery_radius || DELIVERY_RADIUS_KM,
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

    // Sort by creation date (newest first)
    processedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return processedProducts.slice(0, 40);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    try {
      await addToCartWithAuth(product.id.toString(), 1);
      toast({
        title: "Added to Cart",
        description: `${product.name} added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <section className="px-4 py-3 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">Latest Products</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-3 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-black">Latest Products</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-gray-600 hover:text-gray-800"
          onClick={() => navigate('/latest-products')}
        >
          View All
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {latestProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleProductClick(product.id)}
          >
            <div className="w-full aspect-square overflow-hidden rounded-lg mb-2">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
              />
            </div>
            
            <div>
              <h3 className="font-medium text-xs text-gray-900 line-clamp-2 mb-1">
                {product.name}
              </h3>
              <p className="text-[10px] text-gray-600 mb-1 truncate">{product.vendor}</p>
              
              <div className="flex items-center justify-between text-[10px] mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-green-600 font-medium">{product.totalSold} sold</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <MapPin className="h-2 w-2" />
                  <span className="font-medium">{product.distance}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-green-600">{product.price}</span>
                  <div className="flex items-center gap-1">
                    <Truck className="h-2 w-2 text-gray-400" />
                    <span className={`text-[10px] px-1 py-0.5 rounded-full ${
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
                        : `Rs ${product.deliveryInfo.deliveryFee}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-6 h-6 p-0 border-[#856043] text-[#856043] hover:bg-[#856043] hover:text-white"
                    disabled={!product.inStock}
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    <ShoppingCart className="h-2 w-2" />
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-6 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                    disabled={!product.inStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/checkout", {
                        state: {
                          directBuy: true,
                          product: {
                            id: product.id,
                            name: product.name,
                            price: product.price.replace('Rs ', ''),
                            quantity: 1,
                            vendor_name: product.vendor,
                            vendor_id: product.vendor_id,
                            images: [{ image_url: product.image }],
                            // Include delivery properties
                            free_delivery: product.free_delivery,
                            custom_delivery_fee_enabled: product.custom_delivery_fee_enabled,
                            custom_delivery_fee: product.custom_delivery_fee
                          }
                        }
                      });
                    }}
                  >
                    Buy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {latestProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="font-semibold text-lg mb-2">No products yet</h3>
          <p className="text-gray-600">Latest products will appear here</p>
        </div>
      )}
    </section>
  );
}