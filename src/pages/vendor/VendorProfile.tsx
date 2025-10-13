import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Shield, Phone, MessageCircle, Store, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock vendor data
const vendor = {
  name: "Fresh Farm Valley",
  image: "👨‍🌾",
  rating: 4.8,
  reviews: 342,
  distance: "0.5 km",
  verified: true,
  description: "Certified organic farm serving Kathmandu Valley for 10+ years. We specialize in fresh vegetables, fruits, and dairy products.",
  address: "Balkumari, Lalitpur, Kathmandu Valley",
  phone: "+977 9841234567",
  deliveryTime: "30-45 mins",
  minOrder: "₹200",
  categories: ["Vegetables", "Fruits", "Dairy", "Organic"],
  isOpen: true,
  openHours: "6:00 AM - 9:00 PM",
  products: [
    { id: 1, name: "Organic Tomatoes", price: "₹80/kg", image: "🍅", inStock: true },
    { id: 2, name: "Fresh Carrots", price: "₹60/kg", image: "🥕", inStock: true },
    { id: 3, name: "Spinach", price: "₹40/kg", image: "🥬", inStock: false },
    { id: 4, name: "Fresh Milk", price: "₹80/liter", image: "🥛", inStock: true },
  ]
};

export default function VendorProfile() {
  const navigate = useNavigate();
  const { vendorName } = useParams();
  const decodedVendorName = decodeURIComponent(vendorName || '');
  const [isFollowing, setIsFollowing] = useState(false);

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
          <h1 className="font-semibold truncate">{decodedVendorName}</h1>
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
          <div className="text-5xl">{vendor.image}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold">{vendor.name}</h2>
              {vendor.verified && (
                <Shield className="h-5 w-5 text-green-500" />
              )}
              <Badge variant={vendor.isOpen ? "default" : "destructive"} className="text-xs">
                {vendor.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{vendor.rating}</span>
                <span>({vendor.reviews})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{vendor.distance}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {vendor.categories.map((category, index) => (
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
            <p className="text-sm font-medium">{vendor.deliveryTime}</p>
          </div>
          <div>
            <Store className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Min Order</p>
            <p className="text-sm font-medium">{vendor.minOrder}</p>
          </div>
          <div>
            <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Hours</p>
            <p className="text-sm font-medium">6AM-9PM</p>
          </div>
        </div>
      </div>

      {/* Contact Actions */}
      <div className="px-4 py-3 flex gap-3">
        <Button variant="outline" className="flex-1 h-10">
          <Phone className="h-4 w-4 mr-2" />
          Call
        </Button>
        <Button variant="brand" className="flex-1 h-10">
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      </div>

      {/* Content Tabs */}
      <div className="flex-1">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {vendor.products.map((product) => (
                <Card key={product.id} className="p-3 cursor-pointer hover:shadow-md transition-smooth">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{product.image}</div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="font-semibold text-primary text-sm mb-2">{product.price}</p>
                    <Button 
                      variant={product.inStock ? "brand" : "outline"} 
                      size="sm" 
                      className="w-full h-7 text-xs"
                      disabled={!product.inStock}
                    >
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="about" className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {vendor.description}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">{vendor.address}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Opening Hours</h3>
              <p className="text-sm text-muted-foreground">{vendor.openHours}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="p-4">
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Reviews coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}