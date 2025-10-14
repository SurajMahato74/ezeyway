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
  Camera,
  Star
} from 'lucide-react';
import { VendorPage } from '@/components/VendorLayout';
import { productApi, Product } from '@/lib/productApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [selectedProductForFeatured, setSelectedProductForFeatured] = useState<Product | null>(null);
  const [featuredPackages, setFeaturedPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchasing, setPurchasing] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    stock: 'all',
    sortBy: 'name'
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { data } = await apiRequest('/categories/');
      setCategories(data.categories?.map((cat: any) => cat.name) || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSubcategories = async (categoryName: string) => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { data } = await apiRequest(`/categories/${categoryName}/subcategories/`);
      setSubcategories(data.subcategories || []);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
      setSubcategories([]);
    }
  };

  const fetchFeaturedPackages = async () => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { data } = await apiRequest('/featured-packages/');
      setFeaturedPackages(data.packages || []);
    } catch (error) {
      console.error('Failed to fetch featured packages:', error);
      setFeaturedPackages([]);
    }
  };

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

  const toggleFeatured = async (product: Product) => {
    if (product.featured) {
      // Check if featured period can be modified
      try {
        const { apiRequest } = await import('@/utils/apiUtils');
        const { data } = await apiRequest(`/products/${product.id}/featured-info/`);
        
        if (!data.can_modify) {
          // Featured period has started, cannot cancel
          toast.error('Cannot Cancel Featured', {
            description: 'Featured period has already started and cannot be cancelled.',
            duration: 4000,
          });
          return;
        }
        
        // Can modify - show reschedule dialog
        setSelectedProductForFeatured(product);
        setShowRescheduleDialog(true);
        
      } catch (error) {
        console.error('Failed to check featured info:', error);
      }
    } else {
      // If not featured, show package selection dialog
      setSelectedProductForFeatured(product);
      await fetchFeaturedPackages();
      setShowPackageDialog(true);
    }
  };

  const handlePackageSelect = (packageData: any) => {
    setSelectedPackage(packageData);
  };

  const handleRescheduleConfirm = async () => {
    if (!selectedProductForFeatured) return;
    
    try {
      setRescheduling(true);
      const { apiRequest } = await import('@/utils/apiUtils');
      
      const { response, data } = await apiRequest(`/products/${selectedProductForFeatured.id}/reschedule-featured/`, {
        method: 'POST',
        body: JSON.stringify({
          start_date: startDate
        })
      });
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reschedule');
      }
      
      // Success - refresh products and close dialog
      await fetchProducts();
      setShowRescheduleDialog(false);
      setSelectedProductForFeatured(null);
      setStartDate(new Date().toISOString().split('T')[0]);
      
      toast.success('Featured Package Rescheduled!', {
        description: `Start date updated to ${new Date(startDate).toLocaleDateString()}`,
        duration: 4000,
      });
      
    } catch (error: any) {
      console.error('Failed to reschedule featured package:', error);
      toast.error('Reschedule Failed', {
        description: error.message || 'Failed to reschedule package',
        duration: 4000,
      });
    } finally {
      setRescheduling(false);
    }
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedProductForFeatured || !selectedPackage) return;
    
    try {
      setPurchasing(true);
      const { apiRequest } = await import('@/utils/apiUtils');
      
      const { response, data } = await apiRequest('/featured-packages/purchase/', {
        method: 'POST',
        body: JSON.stringify({
          product_id: selectedProductForFeatured.id,
          package_id: selectedPackage.id,
          start_date: startDate
        })
      });
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase package');
      }
      
      // Success - refresh products and close dialog
      await fetchProducts();
      setShowPackageDialog(false);
      setSelectedProductForFeatured(null);
      setSelectedPackage(null);
      setStartDate(new Date().toISOString().split('T')[0]);
      
      // Show success toast
      toast.success('Featured Package Purchased!', {
        description: `${selectedProductForFeatured.name} is now featured until ${new Date(data.end_date).toLocaleDateString()}. Wallet balance: ₹${data.new_wallet_balance}`,
        duration: 5000,
      });
      
    } catch (error: any) {
      console.error('Failed to purchase featured package:', error);
      toast.error('Purchase Failed', {
        description: error.message || 'Failed to purchase package',
        duration: 4000,
      });
    } finally {
      setPurchasing(false);
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

  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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
                      <div className="text-center relative">
                        {getProductImage(product) ? (
                          <img 
                            src={getProductImage(product)!} 
                            alt={product.name}
                            className="w-12 h-12 mx-auto object-cover rounded"
                          />
                        ) : (
                          <div className="text-xl">{getCategoryEmoji(product.category)}</div>
                        )}
                        {product.featured && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-bold shadow-md">
                            FEATURED
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                        
                        <p className="text-sm font-semibold text-gray-900">₹{product.price}</p>
                        {product.cost_price && (
                          <p className="text-xs text-gray-500">Cost: ₹{product.cost_price}</p>
                        )}
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
                        {product.subcategory && (
                          <div className="text-xs text-gray-500 truncate">{product.subcategory}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Sold: {product.total_sold || 0}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {product.featured && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">★</span>
                          )}
                          {product.free_delivery && (
                            <span className="text-xs bg-green-100 text-green-800 px-1 rounded">🚚</span>
                          )}
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
                            if (product.category) {
                              fetchSubcategories(product.category);
                            }
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
                      <Button 
                        variant={product.featured ? "default" : "outline"}
                        size="sm"
                        className="w-full mt-1 p-1"
                        onClick={() => toggleFeatured(product)}
                      >
                        <Star className={`h-3 w-3 mr-1 ${product.featured ? 'fill-current' : ''}`} />
                        {product.featured ? 'Reschedule' : 'Mark Featured'}
                      </Button>
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

        {/* Featured Package Selection Dialog */}
        <Sheet open={showPackageDialog} onOpenChange={(open) => {
          setShowPackageDialog(open);
          if (!open) {
            setSelectedPackage(null);
            setStartDate(new Date().toISOString().split('T')[0]);
          }
        }}>
          <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Choose Featured Package</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">
                Select a package to feature your product: <strong>{selectedProductForFeatured?.name}</strong>
              </p>
              
              {!selectedPackage ? (
                featuredPackages.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {featuredPackages.map((pkg) => (
                      <div key={pkg.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{pkg.name}</h3>
                            <p className="text-sm text-gray-600">{pkg.duration_days} days</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">₹{pkg.amount}</p>
                            <p className="text-xs text-gray-500 capitalize">{pkg.package_type}</p>
                          </div>
                        </div>
                        {pkg.description && (
                          <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                        )}
                        <Button 
                          className="w-full"
                          onClick={() => handlePackageSelect(pkg)}
                        >
                          Select This Package
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No featured packages available</p>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-blue-900">{selectedPackage.name}</h3>
                    <p className="text-sm text-blue-700">{selectedPackage.duration_days} days - ₹{selectedPackage.amount}</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Featured until: {new Date(new Date(startDate).getTime() + selectedPackage.duration_days * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSelectedPackage(null)}
                      disabled={purchasing}
                    >
                      Back
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handlePurchaseConfirm}
                      disabled={purchasing}
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay ₹${selectedPackage.amount}`
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Reschedule Featured Dialog */}
        <Sheet open={showRescheduleDialog} onOpenChange={(open) => {
          setShowRescheduleDialog(open);
          if (!open) {
            setStartDate(new Date().toISOString().split('T')[0]);
          }
        }}>
          <SheetContent side="bottom" className="h-[40vh]">
            <SheetHeader>
              <SheetTitle>Reschedule Featured Package</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">
                Update the start date for: <strong>{selectedProductForFeatured?.name}</strong>
              </p>
              
              <div>
                <Label htmlFor="reschedule-date">New Start Date</Label>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowRescheduleDialog(false)}
                  disabled={rescheduling}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleRescheduleConfirm}
                  disabled={rescheduling}
                >
                  {rescheduling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Date'
                  )}
                </Button>
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
                      <Label>Selling Price</Label>
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
                      <Label>Stock Quantity</Label>
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
                        <Select 
                          value={editData.category || selectedProduct.category} 
                          onValueChange={(value) => {
                            setEditData({...editData, category: value, subcategory: ''});
                            fetchSubcategories(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">{selectedProduct.category}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Subcategory</Label>
                      {editMode ? (
                        <Select 
                          value={editData.subcategory || selectedProduct.subcategory || ''} 
                          onValueChange={(value) => setEditData({...editData, subcategory: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategories.map(subcategory => (
                              <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">{selectedProduct.subcategory || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Cost Price</Label>
                      {editMode ? (
                        <Input 
                          type="number"
                          value={editData.cost_price || ''}
                          onChange={(e) => setEditData({...editData, cost_price: Number(e.target.value) || undefined})}
                        />
                      ) : (
                        <p className="text-sm font-medium">{selectedProduct.cost_price ? `₹${selectedProduct.cost_price}` : 'N/A'}</p>
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
                        value={stripHtml(editData.description || '')}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{stripHtml(selectedProduct.description)}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label>Free Delivery</Label>
                    {editMode ? (
                      <Switch 
                        checked={editData.free_delivery ?? selectedProduct.free_delivery}
                        onCheckedChange={(checked) => setEditData({...editData, free_delivery: checked})}
                      />
                    ) : (
                      <Switch checked={selectedProduct.free_delivery} disabled />
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
                  
                  {/* Additional Product Info */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                    <div>
                      <Label className="text-xs text-gray-500">Total Sold</Label>
                      <p className="text-sm font-medium">{selectedProduct.total_sold || 0} units</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Created</Label>
                      <p className="text-xs">{selectedProduct.created_at ? new Date(selectedProduct.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Updated</Label>
                      <p className="text-xs">{selectedProduct.updated_at ? new Date(selectedProduct.updated_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
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