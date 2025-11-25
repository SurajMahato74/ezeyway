import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, MapPin, Star, Clock, ShoppingBag, Heart, Share2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LazyImage } from '@/components/LazyImage';

interface VendorData {
  id: string;
  name: string;
  image: string;
  coverImage: string;
  status: 'open' | 'closed' | 'busy';
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  minOrder: number;
  type: string;
  description: string;
  address: string;
  phone: string;
  coordinates: { lat: number; lng: number };
  gallery: string[];
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    inStock: boolean;
  }>;
  openingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
}

const VendorProfile = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchVendorData = async () => {
      // Simulate API call
      setTimeout(() => {
        setVendor({
          id: vendorId || '1',
          name: 'Fresh Mart Store',
          image: '/placeholder-image.jpg',
          coverImage: '/placeholder-image.jpg',
          status: 'open',
          rating: 4.5,
          reviewCount: 234,
          deliveryTime: '25-35 min',
          minOrder: 500,
          type: 'Grocery Store',
          description: 'Fresh vegetables, fruits, and daily essentials. We provide quality products at affordable prices with fast delivery service.',
          address: 'Thamel, Kathmandu, Nepal',
          phone: '+977-9841234567',
          coordinates: { lat: 27.7172, lng: 85.3240 },
          gallery: [
            '/placeholder-image.jpg',
            '/placeholder-image.jpg',
            '/placeholder-image.jpg',
            '/placeholder-image.jpg',
            '/placeholder-image.jpg',
            '/placeholder-image.jpg'
          ],
          products: [
            { id: '1', name: 'Fresh Tomatoes', price: 80, image: '/placeholder-image.jpg', category: 'vegetables', inStock: true },
            { id: '2', name: 'Organic Apples', price: 200, image: '/placeholder-image.jpg', category: 'fruits', inStock: true },
            { id: '3', name: 'Basmati Rice', price: 150, image: '/placeholder-image.jpg', category: 'grains', inStock: false },
            { id: '4', name: 'Fresh Milk', price: 60, image: '/placeholder-image.jpg', category: 'dairy', inStock: true },
            { id: '5', name: 'Chicken Breast', price: 450, image: '/placeholder-image.jpg', category: 'meat', inStock: true },
            { id: '6', name: 'Whole Wheat Bread', price: 45, image: '/placeholder-image.jpg', category: 'bakery', inStock: true }
          ],
          openingHours: {
            monday: { open: '6:00 AM', close: '10:00 PM', isOpen: true },
            tuesday: { open: '6:00 AM', close: '10:00 PM', isOpen: true },
            wednesday: { open: '6:00 AM', close: '10:00 PM', isOpen: true },
            thursday: { open: '6:00 AM', close: '10:00 PM', isOpen: true },
            friday: { open: '6:00 AM', close: '10:00 PM', isOpen: true },
            saturday: { open: '6:00 AM', close: '10:00 PM', isOpen: true },
            sunday: { open: '7:00 AM', close: '9:00 PM', isOpen: true }
          }
        });
        setLoading(false);
      }, 1000);
    };

    fetchVendorData();
  }, [vendorId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'closed': return 'bg-red-500';
      case 'busy': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Open Now';
      case 'closed': return 'Closed';
      case 'busy': return 'Busy';
      default: return 'Unknown';
    }
  };

  const categories = ['all', 'vegetables', 'fruits', 'grains', 'dairy', 'meat', 'bakery'];

  const filteredProducts = vendor?.products.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  ) || [];

  const handleCall = () => {
    if (vendor?.phone) {
      window.open(`tel:${vendor.phone}`, '_self');
    }
  };

  const handleMessage = () => {
    navigate(`/messages?vendor=${vendorId}`);
  };

  const handleViewMap = () => {
    if (vendor?.coordinates) {
      const { lat, lng } = vendor.coordinates;
      window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vendor?.name,
          text: `Check out ${vendor?.name} on EzeyWay`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Vendor not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
          <LazyImage
            src={vendor.coverImage}
            alt={`${vendor.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>

        {/* Navigation & Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="bg-white bg-opacity-20 backdrop-blur-sm text-white hover:bg-opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFollowing(!isFollowing)}
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white hover:bg-opacity-30"
            >
              <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white hover:bg-opacity-30"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Vendor Info */}
        <div className="absolute -bottom-16 left-4 right-4">
          <div className="flex items-end gap-4">
            <div className="relative">
              <LazyImage
                src={vendor.image}
                alt={vendor.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor(vendor.status)} rounded-full border-2 border-white`}></div>
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-2xl font-bold text-white mb-1">{vendor.name}</h1>
              <div className="flex items-center gap-2 text-white text-sm">
                <Badge variant="secondary" className="bg-white bg-opacity-20 text-white">
                  {vendor.type}
                </Badge>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {vendor.rating} ({vendor.reviewCount})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 px-4 pb-6">
        {/* Status & Quick Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 ${getStatusColor(vendor.status)} rounded-full`}></div>
                <span className="font-medium">{getStatusText(vendor.status)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {vendor.deliveryTime}
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingBag className="h-4 w-4" />
                  Min ₹{vendor.minOrder}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button onClick={handleCall} className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button onClick={handleMessage} variant="outline" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
              <Button onClick={handleViewMap} variant="outline" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Map
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative">
                    <LazyImage
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-lg font-bold text-blue-600">₹{product.price}</p>
                    <Button 
                      size="sm" 
                      className="w-full mt-2" 
                      disabled={!product.inStock}
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.inStock ? 'View Details' : 'Out of Stock'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">About {vendor.name}</h3>
                <p className="text-gray-600 mb-4">{vendor.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {vendor.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {vendor.phone}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Opening Hours</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(vendor.openingHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize font-medium">{day}</span>
                          <span className={hours.isOpen ? 'text-green-600' : 'text-red-600'}>
                            {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {vendor.gallery.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <LazyImage
                    src={image}
                    alt={`${vendor.name} gallery ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorProfile;