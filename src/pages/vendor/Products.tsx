import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import AddProduct from './AddProduct';

const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock product data
  const products = [
    {
      id: 1,
      name: 'Samsung Galaxy S24',
      category: 'Electronics',
      price: 89999,
      stock: 15,
      status: 'active',
      image: '/api/placeholder/60/60',
      sku: 'SGS24-001',
      sales: 45,
      featured: true
    },
    {
      id: 2,
      name: 'Chicken Momo (8pcs)',
      category: 'Food',
      price: 180,
      stock: 25,
      status: 'active',
      image: '/api/placeholder/60/60',
      sku: 'MOMO-001',
      sales: 120,
      featured: false
    },
    {
      id: 3,
      name: 'Cotton T-Shirt',
      category: 'Clothing',
      price: 599,
      stock: 5,
      status: 'active',
      image: '/api/placeholder/60/60',
      sku: 'TSH-001',
      sales: 32,
      featured: false
    },
    {
      id: 4,
      name: 'Baby Diapers (Pack of 50)',
      category: 'Baby & Kids',
      price: 1299,
      stock: 0,
      status: 'active',
      image: '/api/placeholder/60/60',
      sku: 'DIA-001',
      sales: 78,
      featured: true
    },
    {
      id: 5,
      name: 'Organic Rice (5kg)',
      category: 'Grocery',
      price: 450,
      stock: 100,
      status: 'draft',
      image: '/api/placeholder/60/60',
      sku: 'RICE-001',
      sales: 0,
      featured: false
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
                <p className="text-lg sm:text-2xl font-bold">{products.filter(p => p.stock <= 5 && p.stock > 0).length}</p>
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
                <p className="text-lg sm:text-2xl font-bold">{products.filter(p => p.stock === 0).length}</p>
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
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Baby & Kids">Baby & Kids</SelectItem>
                <SelectItem value="Grocery">Grocery</SelectItem>
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
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Product</th>
                  <th className="text-left p-4 font-medium text-gray-600">Category</th>
                  <th className="text-left p-4 font-medium text-gray-600">Price</th>
                  <th className="text-left p-4 font-medium text-gray-600">Stock</th>
                  <th className="text-left p-4 font-medium text-gray-600">Sales</th>
                  <th className="text-left p-4 font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.featured && (
                              <Badge variant="secondary" className="text-xs">Featured</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">₹{product.price.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-medium">{product.stock}</p>
                        {getStockStatus(product.stock)}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{product.sales}</p>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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