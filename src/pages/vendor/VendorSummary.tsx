import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package, TrendingUp, Store, Users, Calendar, Eye, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VendorPage } from "@/components/VendorLayout";
import { apiRequest } from '@/utils/apiUtils';

export default function VendorSummary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type'); // orders, revenue, products, customers
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (type === 'orders') {
        const { response, data: ordersData } = await apiRequest('/vendor/orders/');
        if (response.ok) {
          const orders = ordersData.results || ordersData || [];
          setData(orders);
          setStats({
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
          });
        }
      } else if (type === 'products') {
        const { response, data: productsData } = await apiRequest('/products/');
        if (response.ok) {
          const products = productsData.results || productsData || [];
          setData(products);
          setStats({
            total: products.length,
            active: products.filter(p => p.quantity > 0).length,
            lowStock: products.filter(p => p.quantity > 0 && p.quantity <= 10).length,
            outOfStock: products.filter(p => p.quantity === 0).length
          });
        }
      } else if (type === 'revenue') {
        const { response, data: ordersData } = await apiRequest('/vendor/orders/');
        if (response.ok) {
          const orders = ordersData.results || ordersData || [];
          const deliveredOrders = orders.filter(o => o.status === 'delivered');
          setData(deliveredOrders);
          setStats({
            total: deliveredOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
            thisMonth: deliveredOrders.filter(o => {
              const orderDate = new Date(o.created_at);
              const now = new Date();
              return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
            }).reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
            orders: deliveredOrders.length
          });
        }
      } else if (type === 'customers') {
        const { response, data: ordersData } = await apiRequest('/vendor/orders/');
        if (response.ok) {
          const orders = ordersData.results || ordersData || [];
          const customerMap = new Map();
          orders.forEach(order => {
            const customerId = order.customer;
            if (!customerMap.has(customerId)) {
              customerMap.set(customerId, {
                id: customerId,
                name: order.delivery_name || 'Customer',
                phone: order.delivery_phone,
                orders: 0,
                totalSpent: 0,
                lastOrder: order.created_at
              });
            }
            const customer = customerMap.get(customerId);
            customer.orders += 1;
            if (order.status === 'delivered') {
              customer.totalSpent += parseFloat(order.total_amount || 0);
            }
            if (new Date(order.created_at) > new Date(customer.lastOrder)) {
              customer.lastOrder = order.created_at;
            }
          });
          const customers = Array.from(customerMap.values());
          setData(customers);
          setStats({
            total: customers.length,
            active: customers.filter(c => {
              const lastOrder = new Date(c.lastOrder);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return lastOrder > thirtyDaysAgo;
            }).length
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'orders': return 'Orders Summary';
      case 'revenue': return 'Revenue Summary';
      case 'products': return 'Products Summary';
      case 'customers': return 'Customers Summary';
      default: return 'Summary';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'orders': return Package;
      case 'revenue': return TrendingUp;
      case 'products': return Store;
      case 'customers': return Users;
      default: return Package;
    }
  };

  if (loading) {
    return (
      <VendorPage title={getTitle()}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      </VendorPage>
    );
  }

  const Icon = getIcon();

  return (
    <VendorPage title={getTitle()}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/vendor/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Icon className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">{getTitle()}</h1>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats Cards */}
          {type === 'orders' && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                  <p className="text-sm text-gray-600">Delivered</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">₹{stats.revenue?.toFixed(0)}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </CardContent>
              </Card>
            </div>
          )}

          {type === 'products' && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Products</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-sm text-gray-600">In Stock</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
                  <p className="text-sm text-gray-600">Low Stock</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                  <p className="text-sm text-gray-600">Out of Stock</p>
                </CardContent>
              </Card>
            </div>
          )}

          {type === 'revenue' && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">₹{stats.total?.toFixed(0)}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">₹{stats.thisMonth?.toFixed(0)}</p>
                  <p className="text-sm text-gray-600">This Month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.orders}</p>
                  <p className="text-sm text-gray-600">Delivered Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">₹{stats.orders > 0 ? (stats.total / stats.orders).toFixed(0) : 0}</p>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                </CardContent>
              </Card>
            </div>
          )}

          {type === 'customers' && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Customers</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-sm text-gray-600">Active (30 days)</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data List */}
          <div className="space-y-3">
            {type === 'orders' && data.map((order) => (
              <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/vendor/orders?orderId=${order.id}`)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">#{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.delivery_name}</p>
                    </div>
                    <Badge className={
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <p className="font-bold text-green-600">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {type === 'products' && data.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/vendor/products?productId=${product.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images?.[0]?.image_url || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-600">₹{parseFloat(product.price).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Stock: {product.quantity}</p>
                      <Badge className={
                        product.quantity > 10 ? 'bg-green-100 text-green-800' :
                        product.quantity > 0 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {product.quantity > 10 ? 'In Stock' : product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {type === 'revenue' && data.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">#{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.delivery_name}</p>
                    </div>
                    <p className="font-bold text-green-600">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}

            {type === 'customers' && data.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{customer.totalSpent.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{customer.orders} orders</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Last order: {new Date(customer.lastOrder).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </VendorPage>
  );
}