import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Share, Star, MapPin, Clock, Shield, Minus, Plus, Loader2, Truck, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { authService } from "@/services/authService";
import { useAuthAction } from "@/hooks/useAuthAction";
import { API_BASE } from '@/config/api';
import { getImageUrl } from '@/utils/imageUtils';
import { getDeliveryInfo } from '@/utils/deliveryUtils';
import { locationService } from '@/services/locationService';
import { filterOwnProducts } from '@/utils/productFilter';
import { reviewService } from '@/services/reviewService';

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
  total_sold?: number;
  vendor_delivery_fee?: number;
  free_delivery?: boolean;
  custom_delivery_fee_enabled?: boolean;
  custom_delivery_fee?: number;
  dynamic_fields?: Record<string, any>;
}

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { addToCartWithAuth, buyNowWithAuth } = useAuthAction();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [productReviews, setProductReviews] = useState<Record<number, { rating: number, total: number }>>({});
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
    const unsubscribe = locationService.subscribe(setUserLocation);
    return unsubscribe;
  }, [id]);

  const [userLocation, setUserLocation] = useState(locationService.getLocation());

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  const fetchRelatedProducts = async () => {
    if (!product) return;
    try {
      const response = await fetch(`${API_BASE}search/products/?page_size=50`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const sameCategoryProducts = data.results?.filter(p => 
          p.id !== product.id &&
          p.category === product.category &&
          p.quantity > 0
        ) || [];
        
        const filteredProducts = await filterOwnProducts(sameCategoryProducts);
        const processedProducts = processRelatedProducts(filteredProducts);
        setRelatedProducts(processedProducts.slice(0, 8));
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const processRelatedProducts = (products) => {
    const currentLocation = locationService.getLocation();
    const DELIVERY_RADIUS_KM = 10;
    
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
        
        return {
          id: product.id,
          name: product.name,
          vendor_name: product.vendor_name,
          price: `Rs ${product.price}`,
          image: primaryImage?.image_url || "/placeholder-product.jpg",
          inStock: product.quantity > 0,
          totalSold: product.total_sold || 0,
          distance,
          distanceValue,
          vendorOnline: product.vendor_online !== false,
          deliveryRadius: product.delivery_radius || DELIVERY_RADIUS_KM
        };
      })
      .filter(product => {
        return product.vendorOnline && 
               (product.distanceValue === Infinity || product.distanceValue <= product.deliveryRadius);
      })
      .sort((a, b) => a.distanceValue - b.distanceValue);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const loadReviewsForProduct = async (productId: number) => {
    try {
      const reviewData = await reviewService.getProductReviews(productId);
      setProductReviews(prev => ({
        ...prev,
        [productId]: {
          rating: reviewData.aggregate?.average_rating || 0,
          total: reviewData.aggregate?.total_reviews || 0
        }
      }));
      // Set the reviews from the API response
      setReviews(reviewData.recent_reviews || []);
    } catch (err) {
      console.error('Failed to load product reviews:', err);
      setReviews([]);
    }
  };

  const updateMetaTags = (product: Product) => {
    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    const imageUrl = primaryImage ? getImageUrl(primaryImage.image_url) : '/ezy-icon.svg';

    // Update Open Graph meta tags
    const ogTitle = document.getElementById('og-title') as HTMLMetaElement;
    const ogDescription = document.getElementById('og-description') as HTMLMetaElement;
    const ogImage = document.getElementById('og-image') as HTMLMetaElement;
    const ogUrl = document.getElementById('og-url') as HTMLMetaElement;

    if (ogTitle) ogTitle.content = `${product.name} - Rs ${product.price} | ezeyway`;
    if (ogDescription) ogDescription.content = `${product.short_description || product.description?.substring(0, 150) + '...'} | ${product.quantity > 0 ? `In Stock (${product.quantity} available)` : 'Out of Stock'} | Same day delivery in Kathmandu Valley`;
    if (ogImage) ogImage.content = imageUrl;
    if (ogUrl) ogUrl.content = window.location.href;

    // Update Twitter meta tags
    const twitterTitle = document.getElementById('twitter-title') as HTMLMetaElement;
    const twitterDescription = document.getElementById('twitter-description') as HTMLMetaElement;
    const twitterImage = document.getElementById('twitter-image') as HTMLMetaElement;

    if (twitterTitle) twitterTitle.content = `${product.name} - Rs ${product.price} | ezeyway`;
    if (twitterDescription) twitterDescription.content = `${product.short_description || product.description?.substring(0, 150) + '...'} | ${product.quantity > 0 ? `In Stock (${product.quantity} available)` : 'Out of Stock'}`;
    if (twitterImage) twitterImage.content = imageUrl;

    // Update document title
    document.title = `${product.name} - Rs ${product.price} | ezeyway`;
  };

  const handleRelatedProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddRelatedProductToCart = async (productId, e) => {
    e.stopPropagation();
    try {
      await addToCartWithAuth(productId.toString(), 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      // Use the public search endpoint to get all products and find by ID
      const response = await fetch(`${API_BASE}search/products/?page_size=1000`, {
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

      // Update meta tags for rich previews
      updateMetaTags(foundProduct);

      // Load reviews for this product
      loadReviewsForProduct(foundProduct.id);

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
      await addToCartWithAuth(product.id.toString(), quantity);
      toast({
        title: "Added to Cart",
        description: `${product.name} added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    console.log('ProductDetail - Original product data:', product);
    
    const productData = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      vendor_name: product.vendor_name,
      vendor_id: product.vendor_id,
      images: product.images,
      // Include delivery properties
      free_delivery: product.free_delivery,
      custom_delivery_fee_enabled: product.custom_delivery_fee_enabled,
      custom_delivery_fee: product.custom_delivery_fee,
      // Include dynamic fields
      dynamic_fields: product.dynamic_fields || {}
    };
    
    console.log('ProductDetail - Prepared product data for buy now:', productData);
    
    await buyNowWithAuth(productData);
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    
    const token = await authService.getToken();
    if (!token) {
      localStorage.setItem('pendingAction', JSON.stringify({
        type: 'toggleFavorite',
        data: {
          productId: product.id
        },
        path: '/wishlist',
        timestamp: Date.now()
      }));
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}favorites/toggle/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      
      if (data.is_favorite) {
        navigate('/wishlist');
      }
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

    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    const imageUrl = primaryImage ? getImageUrl(primaryImage.image_url) : '';

    // Create rich preview text for social sharing
    const shareText = `${product.name}

Price: Rs ${product.price}
${product.quantity > 0 ? `✅ In Stock (${product.quantity} available)` : '❌ Out of Stock'}

${product.short_description || product.description?.substring(0, 150) + '...'}

Shop now at ezeyway - Same day delivery in Kathmandu Valley!`;

    const shareData = {
      title: `${product.name} - Rs ${product.price} | ezeyway`,
      text: shareText,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // For browsers without native share, copy rich text to clipboard
        const richText = `${shareText}\n\n${window.location.href}`;
        await navigator.clipboard.writeText(richText);
        toast({
          title: "Link Copied",
          description: "Product details copied to clipboard for sharing",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy just the URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Product link copied to clipboard",
        });
      } catch (clipboardError) {
        toast({
          title: "Error",
          description: "Failed to share product",
          variant: "destructive",
        });
      }
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
    <>
      {/* Temporarily removed Helmet to fix the error */}
        <title>{product.name} - Rs {product.price} | ezeyway Kathmandu Valley</title>
        <meta name="description" content={`${product.name} - Rs ${product.price}. ${product.short_description || product.description?.substring(0, 150) + '...'} ${product.quantity > 0 ? `In Stock (${product.quantity} available)` : 'Out of Stock'}. Same day delivery in Kathmandu Valley. Shop at ${product.vendor_name}.`} />
        <meta name="keywords" content={`${product.name}, ${product.category}, ${product.vendor_name}, Kathmandu delivery, same day delivery Nepal, ${product.tags?.join(', ') || ''}, buy ${product.name} online, ${product.name} price Nepal, ${product.name} Kathmandu`} />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://ezeyway.com/product/${product.id}`} />

        {/* Open Graph */}
        <meta property="og:title" content={`${product.name} - Rs ${product.price} | ezeyway`} />
        <meta property="og:description" content={`${product.short_description || product.description?.substring(0, 150) + '...'}. ${product.quantity > 0 ? `In Stock (${product.quantity} available)` : 'Out of Stock'}. Same day delivery in Kathmandu Valley.`} />
        <meta property="og:image" content={primaryImage ? getImageUrl(primaryImage.image_url) : 'https://ezeyway.com/ezy-icon.svg'} />
        <meta property="og:url" content={`https://ezeyway.com/product/${product.id}`} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="ezeyway" />
        <meta property="product:price:amount" content={product.price} />
        <meta property="product:price:currency" content="NPR" />
        <meta property="product:availability" content={product.quantity > 0 ? "in stock" : "out of stock"} />
        <meta property="product:category" content={product.category} />
        <meta property="product:brand" content={product.vendor_name} />

        {/* Twitter */}
        <meta name="twitter:title" content={`${product.name} - Rs ${product.price} | ezeyway`} />
        <meta name="twitter:description" content={`${product.short_description || product.description?.substring(0, 150) + '...'}. Same day delivery in Kathmandu Valley.`} />
        <meta name="twitter:image" content={primaryImage ? getImageUrl(primaryImage.image_url) : 'https://ezeyway.com/ezy-icon.svg'} />

        {/* Additional SEO */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="geo.region" content="NP" />
        <meta name="geo.placename" content="Kathmandu Valley" />

        {/* Product Structured Data */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": product.short_description || product.description,
          "image": product.images?.map(img => getImageUrl(img.image_url)) || [],
          "sku": product.id.toString(),
          "brand": {
            "@type": "Brand",
            "name": product.vendor_name
          },
          "category": product.category,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "NPR",
            "availability": product.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": product.vendor_name
            },
            "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          "aggregateRating": productReviews[product.id]?.total > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": productReviews[product.id]?.rating || 0,
            "reviewCount": productReviews[product.id]?.total || 0,
            "bestRating": 5,
            "worstRating": 1
          } : undefined,
          "additionalProperty": product.dynamic_fields ? Object.entries(product.dynamic_fields).map(([key, value]) => ({
            "@type": "PropertyValue",
            "name": key,
            "value": Array.isArray(value) ? value.join(', ') : String(value)
          })) : [],
          "areaServed": {
            "@type": "GeoCircle",
            "geoMidpoint": {
              "@type": "GeoCoordinates",
              "latitude": "27.7172",
              "longitude": "85.3240"
            },
            "geoRadius": "50000"
          }
        })}
        </script>

        {/* Breadcrumb Structured Data */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://ezeyway.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": product.category,
              "item": `https://ezeyway.com/category/${product.category.toLowerCase()}`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": product.name,
              "item": `https://ezeyway.com/product/${product.id}`
            }
          ]
        })}
        </script>
      {/* Temporarily removed Helmet to fix the error */}

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
        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="aspect-square max-w-md mx-auto mb-4 border-t-2 border-b-2 border-gray-100">
            <img
              src={getImageUrl(currentImage?.image_url)}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/placeholder-product.jpg';
                img.onerror = null; // Prevent infinite loop
              }}
              loading="lazy"
            />
          </div>
          
          {/* Mobile Image thumbnails */}
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
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/placeholder-product.jpg';
                        img.onerror = null; // Prevent infinite loop
                      }}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex max-w-4xl mx-auto gap-6">
          {/* Thumbnails on left */}
          {product.images && product.images.length > 1 && (
            <div className="flex flex-col gap-3 w-20">
              {product.images.slice(0, 6).map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square overflow-hidden border-2 transition-all duration-200 ${
                    currentImageIndex === index 
                      ? 'border-blue-500 shadow-md' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={getImageUrl(image.image_url)}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder-product.jpg';
                      img.onerror = null; // Prevent infinite loop
                    }}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* Main image on right */}
          <div className="flex-1 aspect-square max-w-lg">
            <img
              src={getImageUrl(currentImage?.image_url)}
              alt={product.name}
              className="w-full h-full object-cover border border-gray-200"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/placeholder-product.jpg';
                img.onerror = null; // Prevent infinite loop
              }}
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="bg-white px-4 py-6 space-y-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-bold text-green-600">Rs {product.price}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold text-gray-900">
                  {(productReviews[product.id]?.rating ?? 0).toFixed(1)}
                </span>
                {productReviews[product.id]?.total !== undefined && productReviews[product.id]?.total > 0 && (
                  <span className="text-sm text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => setShowAllReviews(true)}>
                    ({productReviews[product.id]?.total} review{productReviews[product.id]?.total !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 capitalize text-sm px-3 py-1">
              {product.category}
            </Badge>
            {product.quantity > 0 ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1">
                In Stock ({product.quantity} available)
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                Out of Stock
              </Badge>
            )}
            {(() => {
              const deliveryInfo = getDeliveryInfo(product, product.vendor_delivery_fee);
              return (
                <Badge 
                  variant="secondary" 
                  className={`flex items-center gap-1 text-sm px-3 py-1 ${
                    deliveryInfo.isFreeDelivery 
                      ? 'bg-green-100 text-green-800' 
                      : deliveryInfo.deliveryFee === null
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  {deliveryInfo.displayText}
                </Badge>
              );
            })()}
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-sm px-3 py-1">
              {product.total_sold || 0} sold
            </Badge>
          </div>
        </div>
      </div>



      {/* Description */}
      <div className="bg-white px-4 py-6 space-y-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-semibold text-lg text-gray-900 mb-3">Product Description</h3>
          {product.short_description && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Quick Summary</h4>
              <p className="text-blue-800 text-sm leading-relaxed">{product.short_description}</p>
            </div>
          )}
          <div 
            className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      </div>

      {/* Product Parameters */}
      {product.dynamic_fields && Object.keys(product.dynamic_fields).length > 0 && (
        <div className="bg-white px-4 py-6 space-y-3 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">Product Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(product.dynamic_fields).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {Array.isArray(value) ? value.join(', ') : 
                     typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                     String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="bg-white px-4 py-6 space-y-3 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">Product Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-sm border-gray-300 text-gray-700 px-3 py-1 hover:bg-gray-50">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vendor Info */}
      <div className="mx-4 my-4 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/vendor/${product.vendor_id}`)}>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-3xl rounded-lg">
              🏪
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{product.vendor_name}</h3>
                <Shield className="h-5 w-5 text-green-600" />
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Active</Badge>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span>Category: {product.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-white px-4 py-6 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Similar Products in {product.category}</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleRelatedProductClick(relatedProduct.id)}
                >
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={getImageUrl(relatedProduct.image)}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/placeholder-product.jpg';
                        img.onerror = null; // Prevent infinite loop
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <h4 className="font-medium text-xs text-gray-900 line-clamp-2 mb-1">
                      {relatedProduct.name}
                    </h4>
                    <p className="text-[10px] text-gray-600 mb-1 truncate">{relatedProduct.vendor_name}</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-green-600 text-xs">{relatedProduct.price}</span>
                      <span className="text-[10px] text-gray-500">{relatedProduct.totalSold} sold</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-blue-600 flex items-center gap-1">
                        <MapPin className="h-2 w-2" />
                        {relatedProduct.distance}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 text-[10px] px-1"
                        disabled={!relatedProduct.inStock}
                        onClick={(e) => handleAddRelatedProductToCart(relatedProduct.id, e)}
                      >
                        <ShoppingCart className="h-2 w-2 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-900">Select Quantity</h3>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(-1)}
              className="h-10 w-10 rounded-full border-2"
            >
              <Minus className="h-5 w-5" />
            </Button>
            <span className="font-bold text-xl w-12 text-center bg-gray-50 py-2 rounded-lg">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(1)}
              className="h-10 w-10 rounded-full border-2"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Modal */}
      {showAllReviews && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Product Reviews</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAllReviews(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < (review.rating || review.stars || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{review.rating || review.stars || 0}/5</span>
                      </div>
                      <p className="text-gray-700 text-sm">{review.comment || review.review || 'No comment'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        By {review.customer_name || review.user_name || 'Anonymous'} • {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet for this product.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
  </>
  );
}