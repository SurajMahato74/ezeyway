import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react';

interface ProductPreviewProps {
  productData: any;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ productData }) => {
  const {
    name,
    category,
    price,
    comparePrice,
    images,
    description,
    tags,
    dynamicFields,
    shortDescription,
    featured,
    status
  } = productData;

  const discount = comparePrice && price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Product Images */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {images && images.length > 0 && (
                <>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={images[0]} 
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.slice(1, 5).map((image: string, index: number) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={image} 
                            alt={`${name} ${index + 2}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{category}</Badge>
                  {featured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                  <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                    {status}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{name}</h1>
                {shortDescription && (
                  <p className="text-gray-600 mb-4">{shortDescription}</p>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.8) 124 reviews</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">₹{price?.toLocaleString()}</span>
                  {comparePrice && comparePrice > price && (
                    <>
                      <span className="text-lg text-gray-500 line-through">₹{comparePrice.toLocaleString()}</span>
                      <Badge className="bg-green-100 text-green-800">{discount}% OFF</Badge>
                    </>
                  )}
                </div>
                <p className="text-sm text-green-600">Inclusive of all taxes</p>
              </div>

              <Separator />

              {/* Dynamic Fields Preview */}
              {dynamicFields && Object.keys(dynamicFields).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Product Details</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(dynamicFields).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex gap-3">
                <Button className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <Truck className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <p className="text-xs text-gray-600">Free Delivery</p>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  <p className="text-xs text-gray-600">Secure Payment</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                  <p className="text-xs text-gray-600">Easy Returns</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Description */}
      {description && (
        <Card>
          <CardHeader>
            <CardTitle>Product Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similar Products */}
      <Card>
        <CardHeader>
          <CardTitle>Similar Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-2">
                <div className="aspect-square bg-gray-100 rounded-lg"></div>
                <p className="text-sm font-medium">Similar Product {item}</p>
                <p className="text-sm text-gray-600">₹{(price * (0.8 + Math.random() * 0.4)).toFixed(0)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductPreview;