import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Package,
  TrendingUp,
  AlertTriangle,
  X,
  Power,
  Minus,
  Plus as PlusIcon,
  Edit,
  Eye,
  Trash2,
  Save,
  Loader2,
  Upload,
  Camera
} from 'lucide-react';
import { VendorPage } from '@/components/VendorLayout';
import { productApi, Product } from '@/lib/productApi';
import { useNavigate } from 'react-router-dom';

const ProductManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    stock: 'all',
    sortBy: 'name'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getProducts();
      const products = data?.results || data || [];
      setProducts(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (id: number, updates: Partial<Product>) => {
    try {
      await productApi.updateProduct(id, updates);
      await fetchProducts();
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productApi.deleteProduct(id);
        await fetchProducts();
        setSelectedProduct(null);
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (selectedProduct?.id && editData) {
      try {
        const updateData = { ...editData };
        if (newImages.length > 0) {
          updateData.image_files = newImages;
        }
        await handleUpdateProduct(selectedProduct.id, updateData);
        setEditMode(false);
        setEditData({});
        setNewImages([]);
        setNewImagePreviews([]);
        setSelectedProduct(null);
      } catch (error) {
        console.error('Failed to save changes:', error);
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const imageUrls = fileArray.map(file => URL.createObjectURL(file));
      setNewImages(prev => [...prev, ...fileArray]);
      setNewImagePreviews(prev => [...prev, ...imageUrls]);
    }
  };

  const removeNewImage = (indexToRemove: number) => {
    // Revoke the blob URL to prevent memory leaks
    URL.revokeObjectURL(newImagePreviews[indexToRemove]);
    setNewImages(prev => prev.filter((_, i) => i !== indexToRemove));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const deleteExistingImage = async (imageId: number) => {
    if (!selectedProduct?.id) return;
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      await apiRequest(`/products/${selectedProduct.id}/images/${imageId}/`, {
        method: 'DELETE'
      });
      await fetchProducts();
      // Update selected product
      const updatedProduct = await productApi.getProduct(selectedProduct.id);
      setSelectedProduct(updatedProduct);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const setPrimaryImage = async (imageId: number) => {
    if (!selectedProduct?.id) return;
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      await apiRequest(`/products/${selectedProduct.id}/images/${imageId}/set-primary/`, {
        method: 'POST'
      });
      await fetchProducts();
      // Update selected product
      const updatedProduct = await productApi.getProduct(selectedProduct.id);
      setSelectedProduct(updatedProduct);
    } catch (error) {
      console.error('Failed to set primary image:', error);
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filters.category === 'all' || product.category === filters.category;
    const matchesStatus = filters.status === 'all' || product.status === filters.status;
    const matchesStock = filters.stock === 'all' || 
      (filters.stock === 'low' && product.quantity <= 5 && product.quantity > 0) ||
      (filters.stock === 'out' && product.quantity === 0) ||
      (filters.stock === 'available' && product.quantity > 0);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'price': return b.price - a.price;
      case 'stock': return b.quantity - a.quantity;
      default: return a.name.localeCompare(b.name);
    }
  }) : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="text-xs font-medium text-green-600">Active</span>;
      case 'draft':
        return <span className="text-xs font-medium text-yellow-600">Draft</span>;
      case 'archived':
        return <span className="text-xs font-medium text-gray-600">Archived</span>;
      default:
        return <span className="text-xs font-medium text-gray-600">{status}</span>;
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return <span className="text-xs font-medium text-red-600">Out of Stock</span>;
    } else if (stock <= 5) {
      return <span className="text-xs font-medium text-orange-600">Low Stock</span>;
    }
    return <span className="text-xs font-medium text-green-600">In Stock</span>;
  };

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
      return primaryImage.image_url;
    }
    return null;
  };

  const getCategoryEmoji = (category: string) => {
    const categoryMap: Record<string, string> = {
      'Vegetables': '🥬',
      'Fruits': '🍎',
      'Dairy': '🥛',
      'Meat': '🍗',
      'Bakery': '🍞',
      'Beverages': '🥤',
      'Snacks': '🍿',
      'Grains': '🌾'
    };
    return categoryMap[category] || '📦';
  };

  return (
    <VendorPage title="Product Management">
      <div className="p-3 space-y-3">
        {/* Stats Cards - Mobile Optimized Grid */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="">
            <CardContent className="p-1.5">
              <div className="text-center">
                <Package className="h-4 w-4 mx-auto mb-0.5 text-blue-500" />
                <p className="text-xs font-bold">{products?.length || 0}</p>
                <p className="text-[10px] text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="">
            <CardContent className="p-1.5">
              <div className="text-center">
                <TrendingUp className="h-4 w-4 mx-auto mb-0.5 text-green-500" />
                <p className="text-xs font-bold">{products?.filter(p => p.status === 'active').length || 0}</p>
                <p className="text-[10px] text-gray-600">Active</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="">
            <CardContent className="p-1.5">
              <div className="text-center">
                <AlertTriangle className="h-4 w-4 mx-auto mb-0.5 text-orange-500" />
                <p className="text-xs font-bold">{products?.filter(p => p.quantity <= 5 && p.quantity > 0).length || 0}</p>
                <p className="text-[10px] text-gray-600">Low</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="">
            <CardContent className="p-1.5">
              <div className="text-center">
                <AlertTriangle className="h-4 w-4 mx-auto mb-0.5 text-red-500" />
                <p className="text-xs font-bold">{products?.filter(p => p.quantity === 0).length || 0}</p>
                <p className="text-[10px] text-gray-600">Out</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowFilters(true)}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading products...</span>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      <div className="text-center">
                        {getProductImage(product) ? (
                          <img 
                            src={getProductImage(product)!} 
                            alt={product.name}
                            className="w-12 h-12 mx-auto object-cover rounded"
                          />
                        ) : (
                          <div className="text-xl">{getCategoryEmoji(product.category)}</div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                        
                        <p className="text-sm font-semibold text-gray-900">₹{product.price}</p>
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Stock: {product.quantity}</span>
                          {getStockStatus(product.quantity)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">{product.category}</span>
                          {getStatusBadge(product.status)}
                        </div>
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 p-1"
                          onClick={() => {
                            setSelectedProduct(product);
                            setEditMode(false);
                            setEditData({});
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 p-1"
                          onClick={() => {
                            setSelectedProduct(product);
                            setEditMode(true);
                            setEditData(product);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 p-1"
                          onClick={() => handleDeleteProduct(product.id!)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No products found</p>
              <Button 
                className="mt-4"
                onClick={() => navigate('/vendor/add-product')}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </div>
          )}
        </div>

        {/* Filters Sheet */}
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="bottom" className="h-[400px]">
            <SheetHeader>
              <SheetTitle>Filter Products</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Array.from(new Set((products || []).map(p => p.category))).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Stock Level</Label>
                <Select value={filters.stock} onValueChange={(value) => setFilters({...filters, stock: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="available">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Product Detail/Edit Sheet */}
        <Sheet open={!!selectedProduct} onOpenChange={() => {
          setSelectedProduct(null);
          setEditMode(false);
          setEditData({});
          setNewImages([]);
          setNewImagePreviews([]);
        }}>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <span>{editMode ? 'Edit Product' : 'Product Details'}</span>
                <div className="flex gap-2">
                  {!editMode ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditMode(true);
                        setEditData(selectedProduct || {});
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditMode(false);
                          setEditData({});
                          setNewImages([]);
                          setNewImagePreviews([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSaveEdit}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </SheetTitle>
            </SheetHeader>
            
            {selectedProduct && (
              <div className="space-y-4 mt-4">
                {/* Product Images */}
                <div>
                  <Label>Product Images</Label>
                  
                  {/* Current Images */}
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedProduct.images.map((image, index) => (
                        <div key={`existing-image-${image.id}`} className="relative group">
                          <img 
                            src={image.image_url} 
                            alt={`Product ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                            onError={(e) => {
                              console.log('Image failed to load:', image.image_url);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-20 bg-gray-100 rounded border flex items-center justify-center">
                            <div className="text-center">
                              <Camera className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                              <p className="text-xs text-gray-500">Failed to load</p>
                            </div>
                          </div>
                          
                          {/* Delete button */}
                          {editMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteExistingImage(image.id);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                          
                          {/* Primary badge/button */}
                          {image.is_primary ? (
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                              Main
                            </div>
                          ) : editMode ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPrimaryImage(image.id);
                              }}
                              className="absolute top-1 left-1 bg-gray-500 hover:bg-blue-500 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Set Main
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No images uploaded</p>
                    </div>
                  )}
                  
                  {/* New Images Preview */}
                  {newImagePreviews.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">New Images:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {newImagePreviews.map((imageUrl, index) => (
                          <div key={`new-image-${index}`} className="relative">
                            <img 
                              src={imageUrl} 
                              alt={`New ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeNewImage(index);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  {editMode && (
                    <div className="mt-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                          <Camera className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Add More Images</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <Label>Product Name</Label>
                    {editMode ? (
                      <Input 
                        value={editData.name || ''}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm font-medium">{selectedProduct.name}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Price</Label>
                      {editMode ? (
                        <Input 
                          type="number"
                          value={editData.price || ''}
                          onChange={(e) => setEditData({...editData, price: Number(e.target.value)})}
                        />
                      ) : (
                        <p className="text-sm font-medium">₹{selectedProduct.price}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Stock</Label>
                      {editMode ? (
                        <Input 
                          type="number"
                          value={editData.quantity || ''}
                          onChange={(e) => setEditData({...editData, quantity: Number(e.target.value)})}
                        />
                      ) : (
                        <p className="text-sm font-medium">{selectedProduct.quantity}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Category</Label>
                      {editMode ? (
                        <Input 
                          value={editData.category || ''}
                          onChange={(e) => setEditData({...editData, category: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm font-medium">{selectedProduct.category}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label>SKU</Label>
                      {editMode ? (
                        <Input 
                          value={editData.sku || ''}
                          onChange={(e) => setEditData({...editData, sku: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm font-medium">{selectedProduct.sku || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Status</Label>
                    {editMode ? (
                      <Select 
                        value={editData.status || selectedProduct.status} 
                        onValueChange={(value) => setEditData({...editData, status: value as 'active' | 'draft' | 'archived'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div>{getStatusBadge(selectedProduct.status)}</div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    {editMode ? (
                      <Textarea 
                        value={editData.description || ''}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label>Featured Product</Label>
                    {editMode ? (
                      <Switch 
                        checked={editData.featured ?? selectedProduct.featured}
                        onCheckedChange={(checked) => setEditData({...editData, featured: checked})}
                      />
                    ) : (
                      <Switch checked={selectedProduct.featured} disabled />
                    )}
                  </div>
                  
                  {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProduct.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </VendorPage>
  );
};

export default ProductManagement;