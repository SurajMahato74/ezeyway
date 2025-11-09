import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, Filter, MapPin, Star, Clock, Loader2, ShoppingCart, Plus, Heart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { performanceMonitor, debounce, imagePreloader } from "@/utils/performance";
import { getDeliveryInfo, getDeliveryRadius } from '@/utils/deliveryUtils';
import { FloatingChat } from "@/components/FloatingChat";
import { API_BASE } from '@/config/api';
import { reviewService } from '@/services/reviewService';

// Lazy load heavy components
const LazyImage = lazy(() => import('@/components/LazyImage'));

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

// Test function - compare with Google Maps (silent in production)
const testDistance = () => {
  if (process.env.NODE_ENV === 'development') {
    const userLat = 27.6398805;
    const userLon = 85.3303725;
    const vendorLat = 27.66424179701499;
    const vendorLon = 85.3465231243003;
    
    const calculated = calculateDistance(userLat, userLon, vendorLat, vendorLon);
    console.log(`🧪 Distance test: ${calculated.toFixed(3)} km`);
  }
};

// Memoized Product Card Component
interface ProductCardProps { product: any; onProductClick: (id: any) => void; onToggleFavorite: (id: any, e?: any) => void; onAddToCart: (id: any, qty?: number) => void; onBuyNow: (e: any, product: any) => void; isFavorite: boolean; productReviews?: Record<number, { rating: number, total: number }>; }
const ProductCard = memo<ProductCardProps>(({ product, onProductClick, onToggleFavorite, onAddToCart, onBuyNow, isFavorite, productReviews }) => {
  return (
    <Card className="overflow-hidden">
      <div className="cursor-pointer" onClick={() => onProductClick(product.id)}>
        <div className="aspect-square md:aspect-[4/3] relative">
          <Suspense fallback={<div className="w-full h-full bg-gray-200 animate-pulse" />}>
            <LazyImage
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              fallback='/placeholder.svg'
            />
          </Suspense>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 left-2 p-1 h-8 w-8 bg-white/80 hover:bg-white rounded-full shadow-sm"
            onClick={(e) => onToggleFavorite(product.id, e)}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
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
              <span>{(productReviews[product.id]?.rating ?? product.rating ?? 0).toFixed(1)}</span>
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
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product.id, 1);
          }}
        >
          <ShoppingCart className="h-3 w-3 mr-1" />
          Cart
        </Button>
        <Button 
          size="sm" 
          className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
          disabled={!product.inStock}
          onClick={(e) => onBuyNow(e, product)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Buy
        </Button>
      </div>
    </Card>
  );
});

// Memoized Vendor Card Component
interface VendorCardProps { vendor: any; onVendorClick: (vendor: any) => void; }
const VendorCard = memo<VendorCardProps>(({ vendor, onVendorClick }) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onVendorClick(vendor)}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Suspense fallback={<div className="w-16 h-16 bg-gray-200 animate-pulse rounded-full" />}>
            <LazyImage
              src={vendor.image}
              alt={vendor.name}
              className="w-16 h-16 object-cover rounded-full"
              fallback='/placeholder.svg'
            />
          </Suspense>
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{vendor.name}</h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{vendor.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{vendor.distance}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{vendor.deliveryTime}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {vendor.categories.map((category, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState({ products: [], vendors: [] });
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userLocation, setUserLocation] = useState(locationService.getLocation());
  const [pagination, setPagination] = useState({
    products: { page: 1, hasMore: true, total: 0 },
    vendors: { page: 1, hasMore: true, total: 0 }
  });
  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [productReviews, setProductReviews] = useState<Record<number, { rating: number, total: number }>>({});
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Handle pending actions after login
  useEffect(() => {
    const handlePendingAction = async () => {
      const pendingAction = localStorage.getItem('pendingAction');
      if (!pendingAction) return;

      try {
        const action = JSON.parse(pendingAction);
        const token = await authService.getToken();

        if (token && action.timestamp > Date.now() - 300000) { // 5 minutes expiry
          if (action.type === 'add_to_cart') {
            await addToCart(action.data.productId, action.data.quantity || 1);
            toast({
              title: "Added to Cart",
              description: "Product added successfully",
            });
            navigate('/cart');
          } else if (action.type === 'buy_now') {
            navigate("/checkout", {
              state: {
                directBuy: true,
                product: action.data
              }
            });
          } else if (action.type === 'toggleFavorite') {
            // Execute favorite toggle directly
            const response = await fetch(`${API_BASE}favorites/toggle/`, {
              method: 'POST',
              headers: {
                'Authorization': `Token ${token}`,
                'ngrok-skip-browser-warning': 'true',
              },
              body: JSON.stringify({ product_id: action.productId }),
            });

            if (response.ok) {
              const data = await response.json();
              const newFavorites = new Set(favorites);

              if (data.is_favorite) {
                newFavorites.add(action.productId);
              } else {
                newFavorites.delete(action.productId);
              }

              setFavorites(newFavorites);

              toast({
                title: data.is_favorite ? "Added to Favorites" : "Removed from Favorites",
                description: data.message,
              });
            }
          }
          localStorage.removeItem('pendingAction');
        } else {
          localStorage.removeItem('pendingAction');
        }
      } catch (error) {
        console.error('Failed to execute pending action:', error);
        localStorage.removeItem('pendingAction');
      }
    };

    handlePendingAction();
  }, [addToCart, favorites, toast]);

  const [availableCategories, setAvailableCategories] = useState([]);
  const sortOptions = [
    { value: '', label: 'Default' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' }
  ];

  // Optimized fetch with separate product/vendor pagination
  const fetchData = useCallback(async (page = 1, query = "", type = 'both') => {
    const isInitialLoad = page === 1;
    const timerLabel = `fetch-${type}-page-${page}`;
    
    performanceMonitor.startTimer(timerLabel);
    
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const headers = {
        'ngrok-skip-browser-warning': 'true'
      };
      
      const currentLocation = locationService.getLocation();
      
      const buildParams = (pageNum) => {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          page_size: '20' // Increased page size for better performance
        });
        
        if (query) params.append('search', query);
        if (sortBy) params.append('sort', sortBy);
        if (selectedCategories.length > 0) {
          params.append('categories', selectedCategories.join(','));
        }
        
        if (currentLocation) {
          params.append('latitude', currentLocation.latitude.toString());
          params.append('longitude', currentLocation.longitude.toString());
        }
        
        return params;
      };
      
      const requests = [];
      
      if (type === 'both' || type === 'products') {
        const productPage = type === 'products' ? page : pagination.products.page;
        requests.push(
          fetch(`${API_BASE}search/products/?${buildParams(productPage)}`, { headers })
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              }
              return res.json();
            })
            .then(data => ({ type: 'products', data, page: productPage }))
        );
      }
      
      if (type === 'both' || type === 'vendors') {
        const vendorPage = type === 'vendors' ? page : pagination.vendors.page;
        requests.push(
          fetch(`${API_BASE}search/vendors/?${buildParams(vendorPage)}`, { headers })
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              }
              return res.json();
            })
            .then(data => ({ type: 'vendors', data, page: vendorPage }))
        );
      }
      
      const results = await performanceMonitor.measureAsync('api-requests', () => 
        Promise.allSettled(requests)
      );
      
      // Preload images for better UX
      const imagesToPreload: string[] = [];
      
      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('API request failed:', result.reason);
          return;
        }
        
        const { type: resultType, data, page: resultPage } = result.value;
        if (resultType === 'products') {
          const processedProducts = processProducts(data.results || []);
          
          // Extract categories only on initial load
          if (isInitialLoad) {
            const categories = [...new Set(data.results?.map(p => p.category).filter(Boolean) || [])];
            setAvailableCategories(categories);
          }
          
          // Collect images for preloading
          processedProducts.forEach(product => {
            if (product.image && !imagesToPreload.includes(product.image)) {
              imagesToPreload.push(product.image);
            }
          });
          
          setSearchResults(prev => ({
            ...prev,
            products: resultPage === 1 ? processedProducts : [...prev.products, ...processedProducts]
          }));

          // After setting products, load reviews for visible products
          if (resultPage === 1) {
            const ids = processedProducts.map(p => p.id);
            loadReviewsForProducts(ids);
          }
          
          setPagination(prev => ({
            ...prev,
            products: {
              page: resultPage,
              hasMore: data.next !== null,
              total: data.count || 0
            }
          }));
        } else if (resultType === 'vendors') {
          const processedVendors = processVendors(data.results || []);
          
          // Collect vendor images for preloading
          processedVendors.forEach(vendor => {
            if (vendor.image && !imagesToPreload.includes(vendor.image)) {
              imagesToPreload.push(vendor.image);
            }
          });
          
          setSearchResults(prev => ({
            ...prev,
            vendors: resultPage === 1 ? processedVendors : [...prev.vendors, ...processedVendors]
          }));
          
          setPagination(prev => ({
            ...prev,
            vendors: {
              page: resultPage,
              hasMore: data.next !== null,
              total: data.count || 0
            }
          }));
        }
      });
      
      // Handle failed requests by stopping pagination for specific API types
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const isVendorRequest = (type === 'both' && index === 1) || type === 'vendors';
          const failedType = isVendorRequest ? 'vendors' : 'products';
          setPagination(prev => ({
            ...prev,
            [failedType]: { ...prev[failedType], hasMore: false }
          }));
        }
      });
      
      // Preload images in background
      if (imagesToPreload.length > 0) {
        imagePreloader.preload(imagesToPreload.slice(0, 10)) // Preload first 10 images
          .catch(err => console.warn('Image preload failed:', err));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load search results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      performanceMonitor.endTimer(timerLabel);
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        performanceMonitor.logMemoryUsage();
      }
    }
  }, [sortBy, selectedCategories, toast]);

  useEffect(() => {
    if (!fetchAttempted) {
      console.log('Search: Initial load, fetching data');
      setFetchAttempted(true);

      performanceMonitor.startTimer('initial-load');

      const unsubscribe = locationService.subscribe(setUserLocation);
      locationService.startTracking();
      testDistance();
      fetchData();
      fetchFavorites();

      performanceMonitor.endTimer('initial-load');

      setTimeout(() => {
        performanceMonitor.logRenderMetrics();
      }, 1000);

      return unsubscribe;
    }
  }, [fetchAttempted]);

  // Optimized debounced search effect
  useEffect(() => {
    const debouncedSearch = debounce(() => {
      console.log('Search: Query changed, performing search for:', searchQuery);
      performanceMonitor.startTimer('search-query');

      if (searchQuery) {
        setSearchParams({ q: searchQuery });
      } else {
        setSearchParams({});
      }
      setPagination({
        products: { page: 1, hasMore: true, total: 0 },
        vendors: { page: 1, hasMore: true, total: 0 }
      });
      fetchData(1, searchQuery);

      performanceMonitor.endTimer('search-query');
    }, 300);

    debouncedSearch();
  }, [searchQuery, setSearchParams]);

  useEffect(() => {
    console.log('Search: Filters changed, refetching data');
    setPagination({
      products: { page: 1, hasMore: true, total: 0 },
      vendors: { page: 1, hasMore: true, total: 0 }
    });
    fetchData(1, searchQuery);
  }, [sortBy, selectedCategories]);

  useEffect(() => {
    if (userLocation) {
      console.log('Search: User location changed, refetching data');
      setPagination({
        products: { page: 1, hasMore: true, total: 0 },
        vendors: { page: 1, hasMore: true, total: 0 }
      });
      fetchData(1, searchQuery);
    }
  }, [userLocation]);

  // Memoized and optimized product processing
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

  const processProducts = useCallback((products) => {
    const currentLocation = locationService.getLocation();

    return products
      .map(product => {
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
          price: `Rs ${product.price}`,
          priceValue: parseFloat(product.price),
          image: primaryImage?.image_url || "/placeholder.svg",
          rating: computeAggregateRating(product),
          distance,
          distanceValue,
          deliveryTime: "30-45 mins",
          inStock: product.quantity > 0,
          category: product.category,
          totalSold: product.total_sold || 0,
          deliveryInfo,
          vendorOnline: product.vendor_online !== false,
          deliveryRadius: getDeliveryRadius(product) ?? Infinity,
          // Include delivery properties
          free_delivery: product.free_delivery,
          custom_delivery_fee_enabled: product.custom_delivery_fee_enabled,
          custom_delivery_fee: product.custom_delivery_fee
        };
      })
      .filter(product => {
        return product.vendorOnline && 
               (product.distanceValue === Infinity || product.distanceValue <= product.deliveryRadius);
      });
  }, []);

  // Memoized vendor processing
  const processVendors = useCallback((vendors) => {
    const currentLocation = locationService.getLocation();
    
    return vendors
      .map(vendor => {
        let distance = "N/A";
        let distanceValue = Infinity;
        
        if (currentLocation && vendor.latitude && vendor.longitude) {
          distanceValue = calculateDistance(
            currentLocation.latitude, currentLocation.longitude,
            vendor.latitude, vendor.longitude
          );
          distance = `${distanceValue.toFixed(1)} km`;
        }

        return {
          id: vendor.id,
          name: vendor.business_name,
          image: vendor.shop_images?.find(img => img.is_primary)?.image_url ||
                 vendor.shop_images?.[0]?.image_url ||
                 vendor.user_info?.profile_picture ||
                 "/placeholder.svg",
          rating: computeAggregateRating(vendor),
          distance,
          distanceValue,
          deliveryTime: "30-45 mins",
          categories: vendor.categories || [],
          isOnline: vendor.is_online !== false,
          deliveryRadius: getDeliveryRadius(vendor) ?? Infinity
        };
      })
      .filter(vendor => {
        return vendor.isOnline && 
               (vendor.distanceValue === Infinity || vendor.distanceValue <= vendor.deliveryRadius);
      })
      .sort((a, b) => a.distanceValue - b.distanceValue);
  }, []);

  // Separate load more functions for products and vendors
  const loadMoreProducts = useCallback(() => {
    if (!loadingMore && pagination.products.hasMore) {
      fetchData(pagination.products.page + 1, searchQuery, 'products');
    }
  }, [loadingMore, pagination.products.hasMore, pagination.products.page, searchQuery]);

  const loadMoreVendors = useCallback(() => {
    if (!loadingMore && pagination.vendors.hasMore) {
      fetchData(pagination.vendors.page + 1, searchQuery, 'vendors');
    }
  }, [loadingMore, pagination.vendors.hasMore, pagination.vendors.page, searchQuery]);

  // Infinite scroll for products and vendors
  const { sentinelRef: productsSentinelRef } = useInfiniteScroll({
    hasMore: pagination.products.hasMore,
    isLoading: loadingMore,
    onLoadMore: loadMoreProducts,
    threshold: 300
  });

  const { sentinelRef: vendorsSentinelRef } = useInfiniteScroll({
    hasMore: pagination.vendors.hasMore,
    isLoading: loadingMore,
    onLoadMore: loadMoreVendors,
    threshold: 300
  });



  // Memoized event handlers
  const handleProductClick = useCallback((productId) => {
    navigate(`/product/${productId}`);
  }, [navigate]);

  const handleVendorClick = useCallback((vendor) => {
    navigate(`/vendor/${vendor.id}`);
  }, [navigate]);

  const handleAddToCart = useCallback(async (productId, quantity = 1) => {
    const token = await authService.getToken();
    if (!token) {
      // Store pending action and redirect to login
      localStorage.setItem('pendingAction', JSON.stringify({
        type: 'add_to_cart',
        data: {
          productId,
          quantity
        },
        path: '/cart',
        timestamp: Date.now()
      }));
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      await addToCart(productId, quantity);
      toast({
        title: "Added to Cart",
        description: "Product added successfully",
      });
      navigate('/cart');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    }
  }, [addToCart, navigate, toast]);

  const handleBuyNow = useCallback(async (e, product) => {
    e.stopPropagation();
    
    const token = await authService.getToken();
    if (!token) {
      // Store pending action and redirect to login
      const productData = {
        id: product.id,
        name: product.name,
        price: product.price.replace('₹', ''),
        quantity: 1,
        vendor_name: product.vendor,
        vendor_id: product.vendor_id,
        images: [{ image_url: product.image }],
        // Include delivery properties
        free_delivery: product.free_delivery,
        custom_delivery_fee_enabled: product.custom_delivery_fee_enabled,
        custom_delivery_fee: product.custom_delivery_fee,
        // Include dynamic fields
        dynamic_fields: product.dynamic_fields || {}
      };
      
        console.log('Search Buy Now - Product data:', productData);
      console.log('Search Buy Now - Delivery info:', product.deliveryInfo);
      
      localStorage.setItem('pendingAction', JSON.stringify({
        type: 'buy_now',
        data: productData,
        path: '/checkout',
        timestamp: Date.now()
      }));
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    navigate("/checkout", {
      state: {
        directBuy: true,
        product: {
          id: product.id,
          name: product.name,
          price: product.price.replace('₹', ''),
          quantity: 1,
          vendor_name: product.vendor,
          vendor_id: product.vendor_id,
          images: [{ image_url: product.image }],
          // Include delivery properties
          free_delivery: product.free_delivery,
          custom_delivery_fee_enabled: product.custom_delivery_fee_enabled,
          custom_delivery_fee: product.custom_delivery_fee,
          // Include dynamic fields
          dynamic_fields: product.dynamic_fields || {}
        }
      }
    });
  }, [navigate]);

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

  const fetchFavorites = async () => {
    const token = await authService.getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}favorites/`, {
        headers: {
          Authorization: `Token ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
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

    const token = await authService.getToken();
    if (!token) {
      // Store pending action and redirect to login
      localStorage.setItem('pendingAction', JSON.stringify({
        type: 'toggleFavorite',
        productId,
        timestamp: Date.now()
      }));
      navigate('/login', { state: { from: '/search' } });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}favorites/toggle/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'ngrok-skip-browser-warning': 'true',
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

  // Memoized render functions with performance optimizations
  const renderProducts = useMemo(() => {
    if (searchResults.products.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {searchResults.products.map((product, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={product}
              onProductClick={handleProductClick}
              onToggleFavorite={toggleFavorite}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              isFavorite={favorites.has(product.id)}
              productReviews={productReviews}
            />
          ))}
        </div>
        {pagination.products.hasMore && (
          <div className="text-center py-4">
            <div ref={productsSentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading more products...</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [searchResults.products, handleProductClick, toggleFavorite, addToCart, handleBuyNow, favorites, pagination.products.hasMore, loadingMore, productsSentinelRef]);

  const renderVendors = useMemo(() => {
    if (searchResults.vendors.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3">
        {searchResults.vendors.map((vendor, index) => (
          <VendorCard
            key={`${vendor.id}-${index}`}
            vendor={vendor}
            onVendorClick={handleVendorClick}
          />
        ))}
        {pagination.vendors.hasMore && (
          <div className="text-center py-4">
            <div ref={vendorsSentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading more vendors...</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [searchResults.vendors, handleVendorClick, pagination.vendors.hasMore, loadingMore, vendorsSentinelRef]);

  return (
    <>
      {/* Temporarily removed Helmet to fix the error */}
        <title>{searchQuery ? `${searchQuery} - Search Results | ezeyway Kathmandu Valley` : "Search Products & Vendors | ezeyway Kathmandu Valley"}</title>
        <meta name="description" content={searchQuery ? `Find ${searchQuery} and similar products with same-day delivery in Kathmandu Valley. Shop groceries, electronics, fashion & more at ezeyway.` : "Search and discover products, vendors, and services with same-day delivery in Kathmandu Valley. Find groceries, electronics, fashion, food and more."} />
        <meta name="keywords" content={`search ${searchQuery || ''}, Kathmandu delivery, same day delivery Nepal, instant shopping Kathmandu, groceries delivery, electronics delivery, fashion delivery, food delivery Kathmandu Valley, online shopping Nepal`} />
        <link rel="canonical" href={`https://ezeyway.com/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`} />

        {/* Open Graph */}
        <meta property="og:title" content={searchQuery ? `${searchQuery} - Search Results | ezeyway` : "Search Products & Vendors | ezeyway Kathmandu Valley"} />
        <meta property="og:description" content={searchQuery ? `Find ${searchQuery} and similar products with same-day delivery in Kathmandu Valley` : "Search and discover products, vendors, and services with same-day delivery in Kathmandu Valley"} />
        <meta property="og:image" content="https://ezeyway.com/ezy-icon.svg" />
        <meta property="og:url" content={`https://ezeyway.com/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`} />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:title" content={searchQuery ? `${searchQuery} - Search Results | ezeyway` : "Search Products & Vendors | ezeyway Kathmandu Valley"} />
        <meta name="twitter:description" content={searchQuery ? `Find ${searchQuery} and similar products with same-day delivery in Kathmandu Valley` : "Search and discover products, vendors, and services with same-day delivery in Kathmandu Valley"} />
        <meta name="twitter:image" content="https://ezeyway.com/ezy-icon.svg" />

        {/* Additional SEO */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="geo.region" content="NP" />
        <meta name="geo.placename" content="Kathmandu Valley" />

        {/* Structured Data */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          "name": searchQuery ? `${searchQuery} Search Results` : "Product Search",
          "description": searchQuery ? `Search results for ${searchQuery} in Kathmandu Valley` : "Search for products and vendors in Kathmandu Valley",
          "url": `https://ezeyway.com/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`,
          "mainEntity": {
            "@type": "ItemList",
            "name": "Search Results",
            "description": `Found ${pagination.products.total} products and ${pagination.vendors.total} vendors${searchQuery ? ` for "${searchQuery}"` : ''}`
          }
        })}
        </script>
      {/* Temporarily removed Helmet to fix the error */}

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
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
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

      {/* Search Tabs */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex gap-2">
          {[
            { id: "all", label: "All" },
            { id: "products", label: "Products" },
            { id: "vendors", label: "Vendors" }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex-1"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="p-4 pb-20">
        {searchQuery && (
          <p className="text-sm text-muted-foreground mb-4">
            {activeTab === "all" && `Found ${pagination.products.total} products and ${pagination.vendors.total} vendors`}
            {activeTab === "products" && `Found ${pagination.products.total} products`}
            {activeTab === "vendors" && `Found ${pagination.vendors.total} vendors`}
            {searchQuery && " for "}
            <span className="font-medium">"{searchQuery}"</span>
          </p>
        )}

        {(activeTab === "all" || activeTab === "products") && (
          <div className="mb-6">
            {searchResults.products.length > 0 && (
              <>
                <h2 className="font-semibold text-lg mb-3">Products</h2>
                {renderProducts}
              </>
            )}
          </div>
        )}

        {(activeTab === "all" || activeTab === "vendors") && (
          <div>
            {searchResults.vendors.length > 0 && (
              <>
                <h2 className="font-semibold text-lg mb-3">Vendors</h2>
                {renderVendors}
              </>
            )}
          </div>
        )}

        {searchQuery && searchResults.products.length === 0 && searchResults.vendors.length === 0 && !loading && (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try searching for products or vendors with different keywords
            </p>
          </div>
        )}

        {!searchQuery && !loading && (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">Search for anything</h3>
            <p className="text-muted-foreground">
              Find products, vendors, and more in your area
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

              {/* Categories */}
              <div>
                <h3 className="font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  {availableCategories.map(category => (
                    <label key={category} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== category));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{category}</span>
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
                  setSelectedCategories([]);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </div>
      )}

        <FloatingChat />
        <BottomNavigation />
      </div>
    </>
  );
}