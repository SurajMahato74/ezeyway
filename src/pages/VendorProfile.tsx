import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Shield, MessageCircle, Store, Heart, Loader2, ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";
import { useCart } from "@/contexts/CartContext";
import { API_BASE } from '@/config/api';
import { getImageUrl } from '@/utils/imageUtils';

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

export default function VendorProfile() {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(locationService.getLocation());
  const [distance, setDistance] = useState("N/A");
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    const unsubscribe = locationService.subscribe(setUserLocation);
    locationService.startTracking();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (vendorId) {
      fetchVendorProfile();
    }
  }, [vendorId]);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch vendor profile first
      const token = await authService.getToken();
      const headers: any = {
        'ngrok-skip-browser-warning': 'true'
      };

      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }

      const vendorResponse = await fetch(`${API_BASE}vendor-profiles/${vendorId}/`, {
        headers
      });

      if (!vendorResponse.ok) {
        if (vendorResponse.status === 404) {
          throw new Error('Vendor not found');
        } else if (vendorResponse.status === 500) {
          throw new Error('Server error - vendor profile unavailable');
        }
        throw new Error('Failed to fetch vendor profile');
      }

      const vendorData = await vendorResponse.json();

      if (!vendorData) {
        throw new Error('No vendor data received');
      }
      setVendor(vendorData);
      
      // Calculate distance if user location is available
      const currentLocation = locationService.getLocation();
      if (currentLocation && vendorData.latitude && vendorData.longitude) {
        const distanceValue = calculateDistance(
          currentLocation.latitude, currentLocation.longitude,
          vendorData.latitude, vendorData.longitude
        );
        setDistance(`${distanceValue.toFixed(1)} km`);
      }
      
      // Fetch products for this vendor using search API with vendor name
      try {
        const productsResponse = await fetch(`${API_BASE}search/products/?search=${encodeURIComponent(vendorData.business_name)}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          // Filter products to only show ones from this specific vendor
          const vendorProducts = productsData.results?.filter(product =>
            product.vendor_name === vendorData.business_name
          ) || [];
          setProducts(vendorProducts);
        }
      } catch (productsError) {
        console.error('Error fetching products:', productsError);
        // Don't fail the whole page if products can't be loaded
        setProducts([]);
      }

    } catch (err) {
      console.error('Error fetching vendor profile:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to load vendor profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatOperatingHours = (vendor) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const openDays = [];
    
    for (const day of days) {
      const openField = `${day}_open`;
      const closeField = `${day}_close`;
      const closedField = `${day}_closed`;
      
      if (!vendor[closedField] && vendor[openField] && vendor[closeField]) {
        openDays.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: ${vendor[openField]} - ${vendor[closeField]}`);
      }
    }
    
    return openDays.length > 0 ? openDays.join(', ') : 'Hours not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center justify-between p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Vendor Not Found</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Vendor Not Found</h2>
            <p className="text-muted-foreground mb-4">The vendor you're looking for doesn't exist or is not available.</p>
            <Button onClick={() => navigate('/search')}>Browse Vendors</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold truncate">{vendor.business_name}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFollowing(!isFollowing)}
            className="p-2"
          >
            <Heart className={`h-5 w-5 ${isFollowing ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Vendor Header */}
      <div className="p-4 bg-gradient-subtle">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {vendor.shop_images?.length > 0 ? (
              <img
                src={getImageUrl(vendor.shop_images[0].image_url)}
                alt={vendor.business_name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-vendor.jpg'; }}
              />
            ) : vendor.user_info?.profile_picture ? (
              <img
                src={getImageUrl(vendor.user_info.profile_picture)}
                alt={vendor.business_name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-vendor.jpg'; }}
              />
            ) : (
              <Store className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold">{vendor.business_name}</h2>
              {vendor.is_approved && (
                <Shield className="h-5 w-5 text-green-500" />
              )}
              <Badge variant={vendor.is_active ? "default" : "destructive"} className="text-xs">
                {vendor.is_active ? "Open" : "Closed"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{distance}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {vendor.categories && vendor.categories.map((category, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="px-4 py-3 bg-card border-b border-border/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Delivery</p>
            <p className="text-sm font-medium">{vendor.estimated_delivery_time || '30-45 mins'}</p>
          </div>
          <div>
            <Store className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Min Order</p>
            <p className="text-sm font-medium">₹{vendor.min_order_amount || '0'}</p>
          </div>
          <div>
            <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="text-sm font-medium capitalize">{vendor.business_type}</p>
          </div>
        </div>
      </div>

      {/* Contact Actions */}
      <div className="px-4 py-3 flex gap-3">
        <Button 
          variant="brand" 
          className="flex-1 h-10"
          onClick={() => navigate(`/messages?vendor=${vendor.user}`)}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Message
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 h-10"
          onClick={() => {
            if (vendor.latitude && vendor.longitude && userLocation) {
              const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${vendor.latitude},${vendor.longitude}`;
              window.open(url, '_blank');
            } else if (vendor.latitude && vendor.longitude) {
              const url = `https://www.google.com/maps/place/${vendor.latitude},${vendor.longitude}`;
              window.open(url, '_blank');
            }
          }}
        >
          <MapPin className="h-4 w-4 mr-2" />
          View in Map
        </Button>
      </div>

      {/* Content Tabs */}
      <div className="flex-1">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="p-4 space-y-3">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => {
                  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
                  return (
                    <Card key={product.id} className="p-3 cursor-pointer hover:shadow-md transition-smooth" onClick={() => navigate(`/product/${product.id}`)}>
                      <div className="text-center">
                        <div className="aspect-square mb-2 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getImageUrl(primaryImage?.image_url)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                          />
                        </div>
                        <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                        <p className="font-semibold text-primary text-sm mb-2">₹{product.price}</p>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-7 text-xs"
                            disabled={product.quantity === 0}
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
                            disabled={product.quantity === 0}
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
                                    vendor_name: product.vendor_name,
                                    images: product.images
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
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Products Available</h3>
                <p className="text-muted-foreground text-sm">
                  This vendor hasn't added any products yet.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="about" className="p-4 space-y-4">
            {vendor.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {vendor.description}
                </p>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold mb-2">Business Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Owner:</span>
                  <span className="text-sm text-muted-foreground">{vendor.owner_name}</span>
                </div>
                {vendor.business_email && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm text-muted-foreground">{vendor.business_email}</span>
                  </div>
                )}
                {vendor.business_phone && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Phone:</span>
                    <span className="text-sm text-muted-foreground">{vendor.business_phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{vendor.business_address}</p>
                    {vendor.location_address && (
                      <p className="text-xs text-muted-foreground mt-1">{vendor.location_address}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {vendor.city}, {vendor.state} - {vendor.pincode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Operating Hours</h3>
              <p className="text-sm text-muted-foreground">{formatOperatingHours(vendor)}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Services</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.home_delivery && <Badge variant="secondary">Home Delivery</Badge>}
                {vendor.pickup_service && <Badge variant="secondary">Pickup Service</Badge>}
                {vendor.online_ordering && <Badge variant="secondary">Online Ordering</Badge>}
                {vendor.bulk_orders && <Badge variant="secondary">Bulk Orders</Badge>}
                {vendor.subscription_service && <Badge variant="secondary">Subscription</Badge>}
                {vendor.loyalty_program && <Badge variant="secondary">Loyalty Program</Badge>}
              </div>
            </div>

            {vendor.established_year && (
              <div>
                <h3 className="font-semibold mb-2">Established</h3>
                <p className="text-sm text-muted-foreground">{vendor.established_year}</p>
              </div>
            )}

            {vendor.employee_count && (
              <div>
                <h3 className="font-semibold mb-2">Team Size</h3>
                <p className="text-sm text-muted-foreground">{vendor.employee_count} employees</p>
              </div>
            )}

            {vendor.website && (
              <div>
                <h3 className="font-semibold mb-2">Website</h3>
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  {vendor.website}
                </a>
              </div>
            )}

            {(vendor.facebook || vendor.instagram || vendor.twitter) && (
              <div>
                <h3 className="font-semibold mb-2">Social Media</h3>
                <div className="flex gap-3">
                  {vendor.facebook && (
                    <a href={vendor.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                      Facebook
                    </a>
                  )}
                  {vendor.instagram && (
                    <a href={vendor.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                      Instagram
                    </a>
                  )}
                  {vendor.twitter && (
                    <a href={vendor.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="gallery" className="p-4">
            {vendor.shop_images && vendor.shop_images.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Shop Gallery</h3>
                <div className="grid grid-cols-2 gap-3">
                  {vendor.shop_images.map((image, index) => (
                    <div key={image.id || index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={getImageUrl(image.image_url)}
                        alt={`${vendor.business_name} shop image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-vendor.jpg'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No gallery images available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}