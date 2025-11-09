import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, MapPin, Star, Clock, Loader2, ShoppingCart, Plus, Heart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { getDeliveryInfo, getDeliveryRadius } from '@/utils/deliveryUtils';
import { API_BASE } from '@/config/api';

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

export default function LatestProductsPage() {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState({ products: [] });
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(locationService.getLocation());
  const [pagination, setPagination] = useState({ page: 1, hasMore: true });
  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const { addToCart } = useCart();
  const { toast } = useToast();

  const sortOptions = [
    { value: '', label: 'Default (Newest)' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' }
  ];

  useEffect(() => {
    const unsubscribe = locationService.subscribe(setUserLocation);
    fetchLatestProducts();
    fetchFavorites();
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchLatestProducts(1);
  }, [sortBy]);

  // Refetch when location changes
  useEffect(() => {
    if (userLocation) {
      console.log('📍 Location updated, refetching data:', userLocation);
      fetchLatestProducts(1);
    }
  }, [userLocation]);

  const fetchLatestProducts = async (page = 1) => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Token ${token}` } : {};

      // Get current location from service
      const currentLocation = locationService.getLocation();
      console.log('🔍 Frontend location check:', { userLocation, currentLocation });

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '100' // Get more products to filter on frontend
      });

      if (currentLocation) {
        params.append('latitude', currentLocation.latitude.toString());
        params.append('longitude', currentLocation.longitude.toString());
        console.log('📍 Sending location to API:', currentLocation);
      } else {
        console.log('❌ No location available for API call');
      }

      // Fetch products
      const productsResponse = await fetch(`${API_BASE}search/products/?${params}`, { headers });

      const productsData = await productsResponse.json();

      const processedProducts = processProducts(productsData.results || []);

      if (page === 1) {
        setSearchResults({ products: processedProducts });
      } else {
        setSearchResults(prev => ({
          products: [...prev.products, ...processedProducts]
        }));
      }

      setPagination({
        page,
        hasMore: productsData.next !== null
      });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processProducts = (products) => {
    const currentLocation = locationService.getLocation();

    const computeAggregateRating = (product) => {
      if (!product) return 0;
      if (product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
        const values = product.reviews
          .map(r => Number(r.rating ?? r.stars ?? r.score ?? 0))
          .filter(n => !isNaN(n));
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          return Math.max(0, Math.min(5, sum / values.length));
        }
      }
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
        price: `Rs ${product.price}`,
        priceValue: parseFloat(product.price),
        image: primaryImage?.image_url || "/placeholder-product.jpg",
        rating: computeAggregateRating(product),
        distance,
        distanceValue,
        deliveryTime: "30-45 mins",
        inStock: product.quantity > 0,
        category: product.category,
        totalSold: product.total_sold || 0,
        deliveryInfo,
        vendorOnline: product.vendor_online !== false,
        deliveryRadius: 10, // Use the global delivery radius from API (10km)
        // Include delivery properties
        free_delivery: product.free_delivery,
        custom_delivery_fee_enabled: product.custom_delivery_fee_enabled,
        custom_delivery_fee: product.custom_delivery_fee,
        createdAt: product.created_at
      };
    })
    .filter(product => {
      // Filter out products with zero stock
      if (!product.inStock) {
        console.log(`🚫 Excluding product ${product.name} - out of stock`);
        return false;
      }

      // Filter out products from offline vendors
      if (!product.vendorOnline) {
        console.log(`🚫 Excluding product ${product.name} - vendor offline`);
        return false;
      }

      return true;
    });

    // Apply sorting - default is by creation date (newest first)
    if (sortBy === 'price_low') {
      processedProducts.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sortBy === 'price_high') {
      processedProducts.sort((a, b) => b.priceValue - a.priceValue);
    } else {
      // Default: sort by creation date (newest first)
      processedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return processedProducts;
  };

  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchLatestProducts(pagination.page + 1);
    }
  };

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const fetchFavorites = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}favorites/`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const favoriteIds = new Set(data.results?.map(fav => fav.product.id) || []);
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const toggleFavorite = async (productId, e) => {
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Login Required",
        description: "Please login to add favorites",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}favorites/toggle/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });

      if (response.ok) {
        const data = await response.json();
        const newFavorites = new Set(favorites);

        if (data.is_favorite) {
          newFavorites.add(productId);
        } else {
          newFavorites.delete(productId);
        }

        setFavorites(newFavorites);

        toast({
          title: data.is_favorite ? "Added to Favorites" : "Removed from Favorites",
          description: data.message,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  const renderProducts = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {searchResults.products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="cursor-pointer" onClick={() => handleProductClick(product.id)}>
              <div className="aspect-square relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 left-2 p-1 h-8 w-8 bg-white/80 hover:bg-white rounded-full shadow-sm"
                  onClick={(e) => toggleFavorite(product.id, e)}
                >
                  <Heart className={`h-4 w-4 ${favorites.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </Button>
                <Badge
                  variant={product.inStock ? "default" : "destructive"}
                  className="absolute top-2 right-2 text-xs"
                >
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{product.vendor}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{product.distance}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-primary text-sm">{product.price}</span>
                    <p className="text-xs text-gray-500">{product.totalSold || 0} sold</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      product.deliveryInfo?.isFreeDelivery
                        ? 'bg-green-100 text-green-700'
                        : product.deliveryInfo?.deliveryFee === null
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {product.deliveryInfo?.isFreeDelivery
                        ? 'Free'
                        : product.deliveryInfo?.deliveryFee === null
                        ? 'TBD'
                        : `Rs ${product.deliveryInfo?.deliveryFee}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </div>
            <div className="px-3 pb-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                disabled={!product.inStock}
                onClick={async (e) => {
                  e.stopPropagation();
                  const token = await authService.getToken();
                  if (!token) {
                    localStorage.setItem('pendingAction', JSON.stringify({
                      type: 'add_to_cart',
                      data: {
                        productId: product.id,
                        quantity: 1
                      },
                      path: '/cart',
                      timestamp: Date.now()
                    }));
                    navigate('/login');
                    return;
                  }
                  try {
                    await addToCart(product.id, 1);
                    toast({
                      title: "Added to Cart",
                      description: `${product.name} added to your cart`,
                    });
                    navigate('/cart');
                  } catch (error) {
                    console.error('Error adding to cart:', error);
                  }
                }}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Cart
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                disabled={!product.inStock}
                onClick={async (e) => {
                  e.stopPropagation();
                  const token = await authService.getToken();
                  if (!token) {
                    const productData = {
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
                    };
                    localStorage.setItem('pendingAction', JSON.stringify({
                      type: 'buy_now',
                      data: productData,
                      path: '/checkout',
                      timestamp: Date.now()
                    }));
                    navigate('/login');
                    return;
                  }
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
                <Plus className="h-3 w-3 mr-1" />
                Buy
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {pagination.hasMore && (
        <div className="text-center py-4">
          <Button onClick={loadMore} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Latest Products</h1>
            <p className="text-xs text-muted-foreground">{searchResults.products.length} products found</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => setShowFilters(true)}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <div className="p-4 pb-20">
        {searchResults.products.length > 0 && (
          <div className="mb-6">
            {renderProducts()}
          </div>
        )}

        {searchResults.products.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="font-semibold text-lg mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Latest products will appear here when available
            </p>
          </div>
        )}

        {loading && searchResults.products.length === 0 && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>

      {/* Filter Sidebar */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowFilters(false)}>
          <div
            className="fixed right-0 top-0 h-full w-[55%] bg-white shadow-lg transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  ×
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Sort By */}
              <div>
                <h3 className="font-medium mb-3">Sort By</h3>
                <div className="space-y-2">
                  {sortOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sort"
                        value={option.value}
                        checked={sortBy === option.value}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSortBy('');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}