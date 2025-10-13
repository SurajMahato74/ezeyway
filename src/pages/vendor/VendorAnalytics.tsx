import { useState, useEffect } from "react";
import { ArrowLeft, BarChart3, TrendingUp, Package, Users, Calendar, Filter, Download, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VendorPage } from "@/components/VendorLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/utils/apiUtils';

export default function VendorAnalytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topProducts: [],
    revenueChart: [],
    orderChart: [],
    productPerformance: [],
    customerInsights: {
      totalCustomers: 0,
      returningCustomers: 0,
      newCustomers: 0
    }
  });

  useEffect(() => {
    fetchData();
  }, [dateRange, dateFrom, dateTo, selectedProduct]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const { response: ordersResponse, data: ordersData } = await apiRequest('/vendor/orders/');
      if (ordersResponse.ok) {
        const allOrders = ordersData.results || ordersData || [];
        setOrders(allOrders);
        
        // Fetch products
        const { response: productsResponse, data: productsData } = await apiRequest('/products/');
        if (productsResponse.ok) {
          const allProducts = productsData.results || productsData || [];
          setProducts(allProducts);
          
          // Process analytics
          processAnalytics(allOrders, allProducts);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (ordersData, productsData) => {
    // Filter orders by date range
    const filteredOrders = filterOrdersByDate(ordersData);
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
    
    // Calculate basic metrics
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / deliveredOrders.length : 0;
    
    // Generate charts data
    const revenueChart = generateRevenueChart(deliveredOrders);
    const orderChart = generateOrderChart(filteredOrders);
    
    // Product performance
    const productPerformance = calculateProductPerformance(deliveredOrders, productsData);
    
    // Customer insights
    const customerInsights = calculateCustomerInsights(filteredOrders);
    
    setAnalytics({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      topProducts: productPerformance.slice(0, 5),
      revenueChart,
      orderChart,
      productPerformance,
      customerInsights
    });
  };

  const filterOrdersByDate = (ordersData) => {
    let filtered = ordersData;
    
    if (dateRange !== "custom") {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = ordersData.filter(o => new Date(o.created_at) >= cutoffDate);
    } else if (dateFrom && dateTo) {
      filtered = ordersData.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= new Date(dateFrom) && orderDate <= new Date(dateTo);
      });
    }
    
    if (selectedProduct !== "all") {
      filtered = filtered.filter(o => 
        o.items?.some(item => item.product_details?.id === parseInt(selectedProduct))
      );
    }
    
    return filtered;
  };

  const generateRevenueChart = (orders) => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOrders = orders.filter(o => 
        new Date(o.created_at).toDateString() === date.toDateString()
      );
      const revenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        orders: dayOrders.length
      });
    }
    return last30Days;
  };

  const generateOrderChart = (orders) => {
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status]++;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : 0
    }));
  };

  const calculateProductPerformance = (orders, productsData) => {
    const productStats = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        const productId = item.product_details?.id;
        if (productId) {
          if (!productStats[productId]) {
            productStats[productId] = {
              id: productId,
              name: item.product_name,
              totalSold: 0,
              totalRevenue: 0,
              orders: 0
            };
          }
          productStats[productId].totalSold += item.quantity;
          productStats[productId].totalRevenue += parseFloat(item.total_price || 0);
          productStats[productId].orders++;
        }
      });
    });
    
    return Object.values(productStats).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const calculateCustomerInsights = (orders) => {
    const customers = new Set();
    const customerOrders = {};
    
    orders.forEach(order => {
      customers.add(order.customer);
      if (!customerOrders[order.customer]) {
        customerOrders[order.customer] = [];
      }
      customerOrders[order.customer].push(order);
    });
    
    const returningCustomers = Object.values(customerOrders).filter(orders => orders.length > 1).length;
    
    return {
      totalCustomers: customers.size,
      returningCustomers,
      newCustomers: customers.size - returningCustomers
    };
  };

  const tabsConfig = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "sales", label: "Sales Report", icon: TrendingUp },
    { id: "products", label: "Product Report", icon: Package },
    { id: "customers", label: "Customer Report", icon: Users },
  ];

  if (loading) {
    return (
      <VendorPage title="Business Analytics">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </VendorPage>
    );
  }

  return (
    <VendorPage title="Business Analytics">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="p-2" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg">Business Analytics</h1>
                <p className="text-sm text-gray-600">Comprehensive business insights</p>
              </div>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <Label className="text-sm font-medium">Filters:</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm">Period:</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">From:</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">To:</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-36"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Label className="text-sm">Product:</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="grid grid-cols-4 w-full min-w-max">
                {tabsConfig.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 text-xs">
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-4 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">₹{analytics.totalRevenue.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.totalOrders}</div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">₹{analytics.avgOrderValue.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">Avg Order Value</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.customerInsights.totalCustomers}</div>
                    <div className="text-sm text-gray-600">Total Customers</div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-1">
                    {analytics.revenueChart.map((day, index) => {
                      const maxRevenue = Math.max(...analytics.revenueChart.map(d => d.revenue), 1);
                      const height = (day.revenue / maxRevenue) * 200;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div
                            className="bg-green-500 rounded-t w-full min-h-[4px] hover:bg-green-600 transition-colors cursor-pointer"
                            style={{ height: `${height}px` }}
                            title={`${day.date}: ₹${day.revenue.toFixed(0)}`}
                          />
                          <div className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-left">
                            {day.date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top Performing Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-600">{product.totalSold} units sold</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">₹{product.totalRevenue.toFixed(0)}</div>
                          <div className="text-sm text-gray-600">{product.orders} orders</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales Report Tab */}
            <TabsContent value="sales" className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.orderChart.map((status) => (
                        <div key={status.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              status.status === 'Delivered' ? 'bg-green-500' :
                              status.status === 'Pending' ? 'bg-yellow-500' :
                              status.status === 'Cancelled' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`} />
                            <span className="text-sm">{status.status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{status.count}</span>
                            <span className="text-sm text-gray-600">({status.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Sales */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Sales Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analytics.revenueChart.slice(-7).reverse().map((day, index) => (
                        <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                          <span className="text-sm">{day.date}</span>
                          <div className="text-right">
                            <div className="font-medium">₹{day.revenue.toFixed(0)}</div>
                            <div className="text-xs text-gray-600">{day.orders} orders</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Product Report Tab */}
            <TabsContent value="products" className="p-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Performance Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.productPerformance.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-600">
                              {product.totalSold} units • {product.orders} orders
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">₹{product.totalRevenue.toFixed(0)}</div>
                          <div className="text-sm text-gray-600">
                            ₹{(product.totalRevenue / product.totalSold).toFixed(0)} per unit
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customer Report Tab */}
            <TabsContent value="customers" className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.customerInsights.totalCustomers}</div>
                    <div className="text-sm text-gray-600">Total Customers</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.customerInsights.returningCustomers}</div>
                    <div className="text-sm text-gray-600">Returning Customers</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.customerInsights.newCustomers}</div>
                    <div className="text-sm text-gray-600">New Customers</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Customer Retention Rate</span>
                      <span className="font-bold text-green-600">
                        {analytics.customerInsights.totalCustomers > 0 
                          ? ((analytics.customerInsights.returningCustomers / analytics.customerInsights.totalCustomers) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Average Orders per Customer</span>
                      <span className="font-bold text-blue-600">
                        {analytics.customerInsights.totalCustomers > 0 
                          ? (analytics.totalOrders / analytics.customerInsights.totalCustomers).toFixed(1)
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium">Average Revenue per Customer</span>
                      <span className="font-bold text-purple-600">
                        ₹{analytics.customerInsights.totalCustomers > 0 
                          ? (analytics.totalRevenue / analytics.customerInsights.totalCustomers).toFixed(0)
                          : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </VendorPage>
  );
}