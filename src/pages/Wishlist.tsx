import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ArrowLeft, Zap, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { favoritesService, FavoriteProduct } from "@/services/favoritesService";
import { useCart } from "@/contexts/CartContext";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";
import { getApiUrl } from "@/config/api";

const WishlistPage = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [userLocation, setUserLocation] = useState(locationService.getLocation());

  useEffect(() => {
    fetchFavorites();
    const unsubscribe = locationService.subscribe(setUserLocation);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (favorites.length > 0) {
      fetchRelatedProducts();
    }
  }, [favorites, userLocation]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = (deg) => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchFavorites = async () => {
    const token = await authService.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await favoritesService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const categories = [...new Set(favorites.map(f => f.product.category).filter(Boolean))];
      if (categories.length === 0) return;

      const token = await authService.getToken();
      const headers = token ? { Authorization: `Token ${token}` } : {};
      const params = new URLSearchParams({ page_size: '12' });
      
      if (userLocation) {
        params.append('latitude', userLocation.latitude.toString());
        params.append('longitude', userLocation.longitude.toString());
      }

      const response = await fetch(getApiUrl(`/search/products/?${params}`), { headers });
      const data = await response.json();
      
      const processedProducts = (data.results || [])
        .filter(product => categories.includes(product.category))
        .map(product => {
          const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
          let distance = "N/A";
          let distanceValue = Infinity;
          
          if (userLocation && product.vendor_latitude && product.vendor_longitude) {
            distanceValue = calculateDistance(
              userLocation.latitude, userLocation.longitude,
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
            category: product.category
          };
        })
        .sort((a, b) => a.distanceValue - b.distanceValue)
        .slice(0, 8);
      
      setRelatedProducts(processedProducts);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await favoritesService.toggleFavorite(productId);
      setFavorites(prev => prev.filter(fav => fav.product.id !== productId));
      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = async (favorite: FavoriteProduct, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await addToCart(favorite.product.id, 1);
      toast({
        title: "Added to Cart",
        description: `${favorite.product.name} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = async (favorite: FavoriteProduct, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate("/checkout", {
      state: {
        directBuy: true,
        product: {
          id: favorite.product.id,
          name: favorite.product.name,
          price: favorite.product.price,
          quantity: 1,
          vendor_name: favorite.product.vendor_name,
          vendor_id: favorite.product.vendor_id,
          images: favorite.product.images
        }
      }
    });
  };

  const handleCardClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = await authService.getToken();
      setIsAuthenticated(!!token);
      setAuthLoading(false);
    };
    checkAuth();
  }, []);
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 flex items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Please Login</h3>
          <p className="text-gray-500 mb-4">You need to login to view your wishlist</p>
          <Button onClick={() => navigate('/login')} className="bg-emerald-600 hover:bg-emerald-700">
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b py-4 px-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>
          <div></div>
          <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
            {favorites.length} items
          </span>
        </div>
      </header>

      <div className="p-4 max-w-3xl mx-auto">

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div 
                key={favorite.id} 
                className="bg-white rounded-xl shadow-lg hover:shadow-xl border p-4 flex items-center transition-all duration-300 cursor-pointer hover:bg-gray-50"
                onClick={() => handleCardClick(favorite.product.id)}
              >
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={favorite.product.images?.[0]?.image_url || '/placeholder-product.jpg'}
                    alt={favorite.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-6 flex-1">
                  <h3 className="font-semibold text-xl text-gray-900 truncate">{favorite.product.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{favorite.product.vendor_name}</p>
                  <p className="font-bold text-2xl text-emerald-600 mt-1">₹{parseFloat(favorite.product.price).toFixed(2)}</p>
                  <div className="flex items-center mt-2">
                    {favorite.product.quantity > 0 ? (
                      <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">In Stock</span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded-full">Out of Stock</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end space-y-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromWishlist(favorite.product.id);
                    }}
                    className="text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={favorite.product.quantity <= 0}
                      onClick={(e) => handleAddToCart(favorite, e)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      
                    </Button>
                    <Button
                      size="sm"
                      disabled={favorite.product.quantity <= 0}
                      onClick={(e) => handleBuyNow(favorite, e)}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-full disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Buy
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border">
            <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-6">Start adding items you love!</p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-2"
              onClick={() => navigate("/")}
            >
              Browse Products
            </Button>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Products Near You</h2>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.map((product) => (
                <Card key={product.id} className="p-3 cursor-pointer hover:shadow-md transition-smooth" onClick={() => navigate(`/product/${product.id}`)}>
                  <div className="text-center">
                    <div className="aspect-square mb-2 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                      />
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-1">{product.vendor}</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-2">
                      <MapPin className="h-3 w-3" />
                      <span>{product.distance}</span>
                    </div>
                    <p className="font-semibold text-emerald-600 text-sm mb-2">₹{product.price}</p>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-7 text-xs"
                        disabled={!product.inStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product.id, 1);
                        }}
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                        disabled={!product.inStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/checkout", {
                            state: {
                              directBuy: true,
                              product: {
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                quantity: 1,
                                vendor_name: product.vendor,
                                images: [{ image_url: product.image }]
                              }
                            }
                          });
                        }}
                      >
                        <Plus className="h-3 w-3" />Buy
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default WishlistPage;