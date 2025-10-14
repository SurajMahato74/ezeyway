import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, MapPin, Star, Clock, Loader2, ShoppingCart, Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { locationService } from "@/services/locationService";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
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

// Test function - compare with Google Maps
const testDistance = () => {
  // Test with your exact coordinates
  const userLat = 27.6398805;
  const userLon = 85.3303725;
  const vendorLat = 27.66424179701499;
  const vendorLon = 85.3465231243003;

  const calculated = calculateDistance(userLat, userLon, vendorLat, vendorLon);
  console.log(`🧪 Your coordinates test: ${calculated.toFixed(3)} km (Google shows: 5.1 km)`);

  // Test coordinates: New York to Los Angeles
  const nyc = { lat: 40.7128, lon: -74.0060 };
  const la = { lat: 34.0522, lon: -118.2437 };
  const calculated2 = calculateDistance(nyc.lat, nyc.lon, la.lat, la.lon);
  console.log(`Test: NYC to LA = ${calculated2.toFixed(2)} km (Google: ~3944 km)`);

  // Google Maps URL for verification
  console.log(`🔗 Verify on Google Maps: https://www.google.com/maps/dir/${userLat},${userLon}/${vendorLat},${vendorLon}`);
};

export default function CategoryItems() {
  const navigate = useNavigate();
  const { categoryName } = useParams();
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
    { value: '', label: 'Default' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' }
  ];

  useEffect(() => {
    const unsubscribe = locationService.subscribe(setUserLocation);
    // Force location update immediately
    locationService.startTracking();
    // Test distance calculation accuracy
    testDistance();
    fetchData();
    fetchFavorites();
    return unsubscribe;
  }, [categoryName]);

  useEffect(() => {
    fetchData(1);
  }, [sortBy, categoryName]);

  // Refetch when location changes
  useEffect(() => {
    if (userLocation) {
      console.log('📍 Location updated, refetching data:', userLocation);
      fetchData(1);
    }
  }, [userLocation]);

  const fetchData = async (page = 1) => {
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

      // Since we're filtering on frontend, check if we have enough filtered products
      const allProducts = productsData.results || [];
      const filteredCount = allProducts.filter(product =>
        product.category && product.category.toLowerCase() === categoryName.toLowerCase()
      ).length;

      setPagination({
        page,
        hasMore: productsData.next !== null && filteredCount >= 10 // Continue if API has more and we got enough filtered results
      });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processProducts = (products) => {
    const currentLocation = locationService.getLocation();

    // Filter products by category first
    let filteredProducts = products.filter(product =>
      product.category && product.category.toLowerCase() === categoryName.toLowerCase()
    );

    let processedProducts = filteredProducts.map(product => {
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
        price: `₹${product.price}`,
        priceValue: parseFloat(product.price),
        image: primaryImage?.image_url || "/placeholder-product.jpg",
        rating: 4.5,
        distance,
        distanceValue,
        deliveryTime: "30-45 mins",
        inStock: product.quantity > 0,
        category: product.category
      };
    });

    // Apply sorting
    if (sortBy === 'price_low') {
      processedProducts.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sortBy === 'price_high') {
      processedProducts.sort((a, b) => b.priceValue - a.priceValue);
    } else {
      processedProducts.sort((a, b) => a.distanceValue - b.distanceValue);
    }

    return processedProducts;
  };

  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchData(pagination.page + 1);
    }
  };

  const handleProductClick = (productId) => {
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
      <div className="grid grid-cols-2 gap-3">
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
                  <span className="font-bold text-primary text-sm">{product.price}</span>
                  <span className="text-xs text-muted-foreground">{product.deliveryTime}</span>
                </div>
              </CardContent>
            </div>
            <div className="px-3 pb-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                disabled={!product.inStock}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product.id, 1);
                }}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Cart
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                disabled={!product.inStock}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/checkout", {
                    state: {
                      directBuy: true,
                      product: {
                        id: product.id,
                        name: product.name,
                        price: product.price.replace('₹', ''),
                        quantity: 1,
                        vendor_name: product.vendor,
                        images: [{ image_url: product.image }]
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
            <h1 className="text-lg font-semibold">{categoryName}</h1>
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
              No products available in {categoryName} category
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