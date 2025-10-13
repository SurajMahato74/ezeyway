import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Share, Star, MapPin, Clock, Shield, Minus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { authService } from "@/services/authService";
import { API_BASE } from '@/config/api';
import { getImageUrl } from '@/utils/imageUtils';

interface ProductImage {
  id: number;
  image: string;
  image_url: string;
  is_primary: boolean;
}

interface Product {
  id: number;
  name: string;
  category: string;
  subcategory: string | null;
  price: string;
  quantity: number;
  description: string;
  short_description: string | null;
  tags: string[];
  images: ProductImage[];
  vendor_name: string;
  vendor_id: number;
  created_at: string;
}

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      // Use the public search endpoint to get all products and find by ID
      const response = await fetch(`${API_BASE}api/search/products/?page_size=1000`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const searchData = await response.json();
      const foundProduct = searchData.results?.find(p => p.id === parseInt(id));
      
      if (!foundProduct) {
        throw new Error('Product not found');
      }
      
      setProduct(foundProduct);
      
      // Check if product is in favorites (if user is logged in)
      const token = await authService.getToken();
      if (token) {
        try {
          const favResponse = await fetch(`${API_BASE}favorites/`, {
            headers: {
              'Authorization': `Token ${token}`,
              'ngrok-skip-browser-warning': 'true'
            },
          });
          
          if (favResponse.ok) {
            const favData = await favResponse.json();
            const isFav = favData.results?.some(fav => fav.product.id === foundProduct.id);
            setIsFavorite(isFav || false);
          }
        } catch (favError) {
          console.log('Could not fetch favorites:', favError);
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsLoading(true);
    try {
      await addToCart(product.id, quantity);
    } catch (error) {
      // Error handling is done in the cart context
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    // Navigate directly to checkout with the product (don't add to cart)
    navigate("/checkout", {
      state: {
        directBuy: true,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          vendor_name: product.vendor_name,
          vendor_id: product.vendor_id,
          images: product.images
        }
      }
    });
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    
    const token = await authService.getToken();
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
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ product_id: product.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }
      
      const data = await response.json();
      setIsFavorite(data.is_favorite);
      
      toast({
        title: data.is_favorite ? "Added to Favorites" : "Removed from Favorites",
        description: data.message,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };
  
  const handleShare = async () => {
    if (!product) return;
    
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - ₹${product.price}`,
      url: window.location.href,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Product link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error",
        description: "Failed to share product",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  const currentImage = product.images?.[currentImageIndex] || primaryImage;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-800" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className="rounded-full hover:bg-gray-100"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-800"}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleShare}
              className="rounded-full hover:bg-gray-100"
            >
              <Share className="h-5 w-5 text-gray-800" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div className="relative bg-white p-4">
        <div className="aspect-square max-w-md mx-auto mb-4 border-t-2 border-b-2 border-gray-100">
          <img
            src={getImageUrl(currentImage?.image_url)}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
          />
        </div>
        
        {/* Image thumbnails */}
        {product.images && product.images.length > 1 && (
          <div className="border-t border-b border-gray-200 py-3">
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {product.images.slice(0, 4).map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square overflow-hidden border-2 transition-all duration-200 ${
                    currentImageIndex === index 
                      ? 'border-blue-500 shadow-md scale-105' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={getImageUrl(image.image_url)}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="bg-white px-4 py-6 space-y-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">₹{product.price}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700">4.5</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 capitalize">
            {product.category}
          </Badge>
          {product.quantity > 0 ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              In Stock ({product.quantity} available)
            </Badge>
          ) : (
            <Badge variant="destructive">
              Out of Stock
            </Badge>
          )}
        </div>
      </div>



      {/* Description */}
      <div className="bg-white px-4 py-6 space-y-2 shadow-sm">
        <h3 className="font-semibold text-base text-gray-900">Description</h3>
        <div 
          className="text-sm text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
        {product.short_description && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Summary:</span> {product.short_description}
          </p>
        )}
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="bg-white px-4 py-6 space-y-2 shadow-sm">
          <h3 className="font-semibold text-base text-gray-900">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-gray-300 text-gray-700">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Vendor Info */}
      <div className="mx-4 my-4 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/vendor/${product.vendor_id}`)}>
        <div className="p-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 flex items-center justify-center text-2xl">
            🏪
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base text-gray-900">{product.vendor_name}</h3>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>4.8</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>30-45 mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="bg-white px-4 py-6 flex items-center justify-between shadow-sm">
        <h3 className="font-semibold text-base text-gray-900">Quantity</h3>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            className="h-8 w-8 rounded-full"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-lg w-8 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            className="h-8 w-8 rounded-full"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-lg text-gray-800 font-semibold"
            onClick={handleAddToCart}
            disabled={isLoading || product.quantity === 0}
          >
            {isLoading ? "Adding..." : "Add to Cart"}
          </Button>
          <Button
            className="flex-1 h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={handleBuyNow}
            disabled={isLoading || product.quantity === 0}
          >
            {isLoading ? "Processing..." : "Buy Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}