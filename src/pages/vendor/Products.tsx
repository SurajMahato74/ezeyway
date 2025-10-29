import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  TrendingUp,
  AlertTriangle,
  Truck,
  Star,
  X
} from 'lucide-react';
import AddProduct from './AddProduct';
import { productApi, Product } from '@/lib/productApi';
import { toast } from 'sonner';

const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      if (!updatedProduct.id) return;
      await productApi.updateProduct(updatedProduct.id, updatedProduct);
      await loadProducts();
      setEditingProduct(null);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productApi.deleteProduct(id);
      await loadProducts();
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(products.map(p => p.category))].sort();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    } else if (stock <= 5) {
      return <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  const EditProductForm: React.FC<{
    product: Product;
    onSave: (product: Product) => void;
    onCancel: () => void;
  }> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Product>({
      ...product,
      dynamic_fields: product.dynamic_fields || {}
    });
    const [categoryParameters, setCategoryParameters] = useState<any[]>([]);
    const [subcategoryParameters, setSubcategoryParameters] = useState<any[]>([]);

    useEffect(() => {
      if (product.category) {
        fetchCategoryParameters(product.category);
      }
      if (product.subcategory) {
        fetchSubcategoryParameters(product.subcategory);
      }
    }, [product.category, product.subcategory]);

    const fetchCategoryParameters = async (categoryName: string) => {
      try {
        const { apiRequest } = await import('@/utils/apiUtils');
        const { response, data } = await apiRequest(`/accounts/categories/parameters/?target_id=${categoryName}&target_type=category`);
        if (response.ok && data?.parameters) {
          setCategoryParameters(data.parameters);
        }
      } catch (error) {
        console.error('Error fetching category parameters:', error);
      }
    };

    const fetchSubcategoryParameters = async (subcategoryName: string) => {
      try {
        const { apiRequest } = await import('@/utils/apiUtils');
        const { response, data } = await apiRequest(`/accounts/categories/parameters/?target_id=${subcategoryName}&target_type=subcategory`);
        if (response.ok && data?.parameters) {
          setSubcategoryParameters(data.parameters);
        }
      } catch (error) {
        console.error('Error fetching subcategory parameters:', error);
      }
    };

    const renderParameterField = (param: any) => {
      const value = formData.dynamic_fields?.[param.name] || '';
      
      switch (param.field_type) {
        case 'text':
        case 'number':
          return (
            <div key={param.name}>
              <Label>{param.label}</Label>
              <Input
                type={param.field_type}
                value={value}
                placeholder={param.placeholder}
                onChange={(e) => setFormData({
                  ...formData,
                  dynamic_fields: {
                    ...formData.dynamic_fields,
                    [param.name]: param.field_type === 'number' ? Number(e.target.value) : e.target.value
                  }
                })}
              />
            </div>
          );
        case 'select':
          return (
            <div key={param.name}>
              <Label>{param.label}</Label>
              <Select value={value} onValueChange={(val) => setFormData({
                ...formData,
                dynamic_fields: { ...formData.dynamic_fields, [param.name]: val }
              })}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${param.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {param.options?.map((option: string) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        case 'textarea':
          return (
            <div key={param.name}>
              <Label>{param.label}</Label>
              <Textarea
                value={value}
                placeholder={param.placeholder}
                onChange={(e) => setFormData({
                  ...formData,
                  dynamic_fields: { ...formData.dynamic_fields, [param.name]: e.target.value }
                })}
              />
            </div>
          );
        case 'boolean':
          return (
            <div key={param.name} className="flex items-center space-x-2">
              <Switch
                checked={!!value}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  dynamic_fields: { ...formData.dynamic_fields, [param.name]: checked }
                })}
              />
              <Label>{param.label}</Label>
            </div>
          );
        default:
          return null;
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              value={formData.subcategory || ''}
              onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="price">Price (Rs)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
              required
            />
          </div>
          <div>
            <Label htmlFor="cost_price">Cost Price (Rs)</Label>
            <Input
              id="cost_price"
              type="number"
              value={formData.cost_price || ''}
              onChange={(e) => setFormData({...formData, cost_price: Number(e.target.value) || undefined})}
            />
          </div>
          <div>
            <Label htmlFor="quantity">Stock Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
              required
            />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku || ''}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={stripHtml(formData.description)}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={4}
          />
        </div>
        
        {/* Category Parameters */}
        {categoryParameters.length > 0 && (
          <div>
            <Label className="text-sm font-semibold">Category Details</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {categoryParameters.map(renderParameterField)}
            </div>
          </div>
        )}

        {/* Subcategory Parameters */}
        {subcategoryParameters.length > 0 && (
          <div>
            <Label className="text-sm font-semibold">Subcategory Details</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {subcategoryParameters.map(renderParameterField)}
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
            />
            <Label htmlFor="featured">Featured Product</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="free_delivery"
              checked={formData.free_delivery || false}
              onCheckedChange={(checked) => setFormData({...formData, free_delivery: checked})}
            />
            <Label htmlFor="free_delivery">Free Delivery</Label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-4 space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <AddProduct />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-1 sm:gap-4">
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Active Products</p>
                <p className="text-lg sm:text-2xl font-bold">{products.filter(p => p.status === 'active').length}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Low Stock</p>
                <p className="text-lg sm:text-2xl font-bold">{products.filter(p => p.quantity <= 5 && p.quantity > 0).length}</p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Out of Stock</p>
                <p className="text-lg sm:text-2xl font-bold">{products.filter(p => p.quantity === 0).length}</p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Product List ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Product</th>
                  <th className="text-left p-4 font-medium text-gray-600">Category</th>
                  <th className="text-left p-4 font-medium text-gray-600">Price</th>
                  <th className="text-left p-4 font-medium text-gray-600">Stock</th>
                  <th className="text-left p-4 font-medium text-gray-600">Features</th>
                  <th className="text-left p-4 font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Loading products...
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.images?.[0]?.image_url || '/api/placeholder/60/60'} 
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{product.name}</p>
                              {product.featured && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</p>
                            {product.subcategory && (
                              <p className="text-xs text-gray-400">{product.subcategory}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{product.category}</Badge>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">Rs {product.price.toLocaleString()}</p>
                        {product.cost_price && (
                          <p className="text-xs text-gray-500">Cost: Rs {product.cost_price}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="font-medium">{product.quantity}</p>
                          {getStockStatus(product.quantity)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {product.featured && (
                            <Badge variant="secondary" className="text-xs w-fit">
                              <Star className="h-3 w-3 mr-1" />Featured
                            </Badge>
                          )}
                          {product.dynamic_fields?.free_delivery && (
                            <Badge variant="outline" className="text-xs w-fit">
                              <Truck className="h-3 w-3 mr-1" />Free Delivery
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setViewingProduct(product)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Product Details</DialogTitle>
                              </DialogHeader>
                              {viewingProduct && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Name</Label>
                                      <p className="font-medium">{viewingProduct.name}</p>
                                    </div>
                                    <div>
                                      <Label>Category</Label>
                                      <p>{viewingProduct.category}</p>
                                    </div>
                                    {viewingProduct.subcategory && (
                                      <div>
                                        <Label>Subcategory</Label>
                                        <p>{viewingProduct.subcategory}</p>
                                      </div>
                                    )}
                                    <div>
                                      <Label>Price</Label>
                                      <p className="font-medium">Rs {viewingProduct.price}</p>
                                    </div>
                                    <div>
                                      <Label>Stock</Label>
                                      <p>{viewingProduct.quantity}</p>
                                    </div>
                                    <div>
                                      <Label>SKU</Label>
                                      <p>{viewingProduct.sku || 'N/A'}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                      <p>{stripHtml(viewingProduct.description)}</p>
                                    </div>
                                  </div>
                                  {/* Dynamic Fields/Parameters */}
                                  {viewingProduct.dynamic_fields && Object.keys(viewingProduct.dynamic_fields).length > 0 && (
                                    <div>
                                      <Label>Product Details</Label>
                                      <div className="grid grid-cols-2 gap-4 mt-2">
                                        {Object.entries(viewingProduct.dynamic_fields).map(([key, value]) => (
                                          <div key={key}>
                                            <Label className="text-sm text-gray-600">{key.replace('_', ' ').toUpperCase()}</Label>
                                            <p className="font-medium">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {viewingProduct.images && viewingProduct.images.length > 0 && (
                                    <div>
                                      <Label>Images</Label>
                                      <div className="grid grid-cols-3 gap-2 mt-2">
                                        {viewingProduct.images.map((img, idx) => (
                                          <img key={idx} src={img.image_url} alt="Product" className="w-full h-24 object-cover rounded" />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                              </DialogHeader>
                              {editingProduct && (
                                <EditProductForm 
                                  product={editingProduct} 
                                  onSave={handleUpdateProduct}
                                  onCancel={() => setEditingProduct(null)}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => product.id && handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first product'
                }
              </p>
              {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
                <AddProduct />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;