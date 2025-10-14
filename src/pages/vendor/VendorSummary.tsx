import React, { useState, useEffect } from 'react';
import { VendorPage } from "@/components/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Package, TrendingUp, Store, Users, ArrowUpRight, ArrowDownLeft, Filter, Download, RefreshCw, Printer, Share2, Calendar, Eye, ShoppingCart } from "lucide-react";
import { apiRequest } from '@/utils/apiUtils';

const VendorSummary: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'orders';
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    completed: 0
  });

  useEffect(() => {
    fetchData();
  }, [type, dateFrom, dateTo, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      if (type === 'orders') {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: itemsPerPage.toString()
        });
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        
        const { response, data: ordersData } = await apiRequest(`/vendor/orders/?${params}`);
        if (response.ok && ordersData) {
          let orders = ordersData.results || ordersData || [];
          setTotalPages(Math.ceil((ordersData.count || orders.length) / itemsPerPage));
          setTotalCount(ordersData.count || orders.length);
          
          // Apply date filter
          if (dateFrom && dateTo) {
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            
            orders = orders.filter(order => {
              const orderDate = new Date(order.created_at);
              return orderDate >= fromDate && orderDate <= toDate;
            });
          }
          
          setData(orders);
          setStats({
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            completed: orders.filter(o => o.status === 'delivered').length,
            active: orders.filter(o => ['confirmed', 'out_for_delivery'].includes(o.status)).length
          });
        }
      } else if (type === 'products') {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: itemsPerPage.toString()
        });
        
        const { response, data: productsData } = await apiRequest(`/products/?${params}`);
        if (response.ok && productsData) {
          const products = productsData.results || productsData || [];
          setTotalPages(Math.ceil((productsData.count || products.length) / itemsPerPage));
          setTotalCount(productsData.count || products.length);
          setData(products);
          setStats({
            total: products.length,
            active: products.filter(p => p.quantity > 10).length,
            pending: products.filter(p => p.quantity > 0 && p.quantity <= 10).length,
            completed: products.filter(p => p.quantity === 0).length
          });
        }
      } else if (type === 'revenue') {
        const { response, data: ordersData } = await apiRequest('/vendor/orders/');
        if (response.ok && ordersData) {
          let orders = ordersData.results || ordersData || [];
          const deliveredOrders = orders.filter(o => o.status === 'delivered');
          
          // Apply date filter
          if (dateFrom && dateTo) {
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            
            orders = deliveredOrders.filter(order => {
              const orderDate = new Date(order.created_at);
              return orderDate >= fromDate && orderDate <= toDate;
            });
          } else {
            orders = deliveredOrders;
          }
          
          setData(orders);
          const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
          setStats({
            total: totalRevenue,
            active: orders.length,
            pending: totalRevenue > 0 ? (totalRevenue / orders.length) : 0,
            completed: orders.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth()).length
          });
        }
      } else if (type === 'customers') {
        const { response, data: ordersData } = await apiRequest('/vendor/orders/');
        if (response.ok && ordersData) {
          const orders = ordersData.results || ordersData || [];
          const customerMap = new Map();
          
          orders.forEach(order => {
            const customerId = order.customer_details?.id || order.delivery_phone;
            if (!customerMap.has(customerId)) {
              customerMap.set(customerId, {
                id: customerId,
                name: order.customer_details?.username || order.delivery_name,
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
          });
          
          const customers = Array.from(customerMap.values());
          setData(customers);
          setStats({
            total: customers.length,
            active: customers.filter(c => c.orders > 1).length,
            pending: customers.filter(c => c.orders === 1).length,
            completed: customers.filter(c => c.totalSpent > 0).length
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'orders': return 'Orders Management';
      case 'revenue': return 'Revenue Analytics';
      case 'products': return 'Products Overview';
      case 'customers': return 'Customer Insights';
      default: return 'Summary';
    }
  };

  const getStatsLabels = () => {
    switch (type) {
      case 'orders':
        return { total: 'Total Orders', active: 'Processing', pending: 'Pending', completed: 'Delivered' };
      case 'products':
        return { total: 'Total Products', active: 'In Stock', pending: 'Low Stock', completed: 'Out of Stock' };
      case 'revenue':
        return { total: 'Total Revenue', active: 'Orders', pending: 'Avg Order', completed: 'This Month' };
      case 'customers':
        return { total: 'Total Customers', active: 'Repeat Buyers', pending: 'New Customers', completed: 'Paid Customers' };
      default:
        return { total: 'Total', active: 'Active', pending: 'Pending', completed: 'Completed' };
    }
  };

  const formatValue = (key: string, value: number) => {
    if (type === 'revenue' && (key === 'total' || key === 'pending')) {
      return `Rs${value.toFixed(2)}`;
    }
    return value.toString();
  };

  const exportCSV = () => {
    let csvContent = '';
    let filename = '';
    
    if (type === 'orders') {
      csvContent = [
        ['Date', 'Order Number', 'Customer', 'Amount', 'Status', 'Items'].join(','),
        ...data.map(order => [
          new Date(order.created_at).toLocaleDateString(),
          order.order_number,
          `"${order.delivery_name || 'N/A'}"`,
          parseFloat(order.total_amount || 0).toFixed(2),
          order.status,
          order.items?.length || 0
        ].join(','))
      ].join('\n');
      filename = 'orders-report';
    } else if (type === 'products') {
      csvContent = [
        ['Name', 'Price', 'Stock', 'Status', 'Category'].join(','),
        ...data.map(product => [
          `"${product.name}"`,
          parseFloat(product.price).toFixed(2),
          product.quantity,
          product.quantity > 10 ? 'In Stock' : product.quantity > 0 ? 'Low Stock' : 'Out of Stock',
          `"${product.category || 'N/A'}"`
        ].join(','))
      ].join('\n');
      filename = 'products-report';
    } else if (type === 'revenue') {
      csvContent = [
        ['Date', 'Order Number', 'Customer', 'Revenue'].join(','),
        ...data.map(order => [
          new Date(order.created_at).toLocaleDateString(),
          order.order_number,
          `"${order.delivery_name || 'N/A'}"`,
          parseFloat(order.total_amount || 0).toFixed(2)
        ].join(','))
      ].join('\n');
      filename = 'revenue-report';
    } else if (type === 'customers') {
      csvContent = [
        ['Name', 'Phone', 'Orders', 'Total Spent', 'Last Order'].join(','),
        ...data.map(customer => [
          `"${customer.name}"`,
          customer.phone,
          customer.orders,
          customer.totalSpent.toFixed(2),
          new Date(customer.lastOrder).toLocaleDateString()
        ].join(','))
      ].join('\n');
      filename = 'customers-report';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${dateFrom || 'all'}-${dateTo || new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const dateRange = dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time';
    const labels = getStatsLabels();
    
    const report = `
===========================================
           ${getTitle().toUpperCase()}
===========================================
Generated: ${currentDate}
Period: ${dateRange}

SUMMARY
-------------------------------------------
${labels.total}: ${formatValue('total', stats.total)}
${labels.active}: ${formatValue('active', stats.active)}
${labels.pending}: ${formatValue('pending', stats.pending)}
${labels.completed}: ${formatValue('completed', stats.completed)}

DETAILS (${data.length} records)
-------------------------------------------
${type === 'orders' ? data.map(o => `${new Date(o.created_at).toLocaleDateString()} | ${o.order_number} | ${o.delivery_name} | Rs${parseFloat(o.total_amount || 0).toFixed(2)} | ${o.status}`).join('\n') :
  type === 'products' ? data.map(p => `${p.name} | Rs${parseFloat(p.price).toFixed(2)} | Stock: ${p.quantity}`).join('\n') :
  type === 'revenue' ? data.map(o => `${new Date(o.created_at).toLocaleDateString()} | ${o.order_number} | Rs${parseFloat(o.total_amount || 0).toFixed(2)}`).join('\n') :
  data.map(c => `${c.name} | ${c.phone} | ${c.orders} orders | Rs${c.totalSpent.toFixed(2)}`).join('\n')}

===========================================
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`<pre style="font-family: monospace; font-size: 12px; line-height: 1.4;">${report}</pre>`);
    printWindow?.print();
  };

  const shareReport = () => {
    const labels = getStatsLabels();
    const summary = `${getTitle()}\\n\\n${labels.total}: ${formatValue('total', stats.total)}\\n${labels.active}: ${formatValue('active', stats.active)}\\n${labels.pending}: ${formatValue('pending', stats.pending)}\\n${labels.completed}: ${formatValue('completed', stats.completed)}\\n\\nTotal Records: ${data.length}`;
    
    if (navigator.share) {
      navigator.share({
        title: getTitle(),
        text: summary
      });
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(summary)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const applyDateFilter = () => {
    setCurrentPage(1);
    fetchData();
    setShowFilterSheet(false);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    fetchData();
    setShowFilterSheet(false);
  };

  const filterData = (filterType: string) => {
    if (filterType === 'all') return data;
    
    if (type === 'orders') {
      if (filterType === 'pending') return data.filter(o => o.status === 'pending');
      if (filterType === 'active') return data.filter(o => ['confirmed', 'out_for_delivery'].includes(o.status));
      if (filterType === 'completed') return data.filter(o => o.status === 'delivered');
    } else if (type === 'products') {
      if (filterType === 'active') return data.filter(p => p.quantity > 10);
      if (filterType === 'pending') return data.filter(p => p.quantity > 0 && p.quantity <= 10);
      if (filterType === 'completed') return data.filter(p => p.quantity === 0);
    }
    
    return data;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const labels = getStatsLabels();

  return (
    <VendorPage title={getTitle()}>
      <div className="min-h-screen bg-gray-50 pb-20">
        
        {/* Stats Cards */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{labels.total}</p>
                    <p className="text-sm font-bold text-blue-600">{formatValue('total', stats.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{labels.active}</p>
                    <p className="text-sm font-bold text-green-600">{formatValue('active', stats.active)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{labels.pending}</p>
                    <p className="text-sm font-bold text-orange-600">{formatValue('pending', stats.pending)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{labels.completed}</p>
                    <p className="text-sm font-bold text-purple-600">{formatValue('completed', stats.completed)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data List */}
        <div className="px-4">
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={printReport}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={shareReport}>
                  <Share2 className="h-4 w-4" />
                </Button>
                {(type === 'orders' || type === 'revenue') && (
                  <Button variant="outline" size="sm" onClick={() => setShowFilterSheet(true)}>
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-100 overflow-x-auto">
                <TabsList className="flex w-max bg-transparent h-auto p-2 gap-3">
                  <TabsTrigger value="all" className="text-xs py-2 px-3">
                    All ({data.length})
                  </TabsTrigger>
                  {type === 'orders' && (
                    <>
                      <TabsTrigger value="pending" className="text-xs py-2 px-3">
                        Pending ({stats.pending})
                      </TabsTrigger>
                      <TabsTrigger value="active" className="text-xs py-2 px-3">
                        Processing ({stats.active})
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs py-2 px-3">
                        Delivered ({stats.completed})
                      </TabsTrigger>
                    </>
                  )}
                  {type === 'products' && (
                    <>
                      <TabsTrigger value="active" className="text-xs py-2 px-3">
                        In Stock ({stats.active})
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="text-xs py-2 px-3">
                        Low Stock ({stats.pending})
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs py-2 px-3">
                        Out of Stock ({stats.completed})
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <div className="divide-y divide-gray-100">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading data...</p>
                    </div>
                  ) : filterData('all').length === 0 ? (
                    <div className="p-8 text-center">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No data found</p>
                    </div>
                  ) : (
                    filterData('all').map((item, index) => (
                      <div key={item.id || index} className="p-4">
                        {type === 'orders' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">#{item.order_number}</p>
                                <p className="text-xs text-gray-600">{item.delivery_name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(item.created_at)} at {formatTime(item.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">
                                Rs{parseFloat(item.total_amount || 0).toFixed(2)}
                              </p>
                              <Badge variant="default" className="text-xs">
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        {type === 'products' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Store className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-600">Rs{parseFloat(item.price).toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Stock: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`text-xs ${
                                item.quantity > 10 ? 'bg-green-100 text-green-800' :
                                item.quantity > 0 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.quantity > 10 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        {type === 'revenue' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">#{item.order_number}</p>
                                <p className="text-xs text-gray-600">{item.delivery_name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(item.created_at)} at {formatTime(item.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">
                                Rs{parseFloat(item.total_amount || 0).toFixed(2)}
                              </p>
                              <Badge variant="default" className="text-xs">revenue</Badge>
                            </div>
                          </div>
                        )}
                        
                        {type === 'customers' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-600">{item.phone}</p>
                                <p className="text-xs text-gray-500">
                                  Last order: {formatDate(item.lastOrder)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">
                                Rs{item.totalSpent.toFixed(2)}
                              </p>
                              <Badge variant="default" className="text-xs">
                                {item.orders} orders
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              
              {(type === 'orders' || type === 'products') && ['pending', 'active', 'completed'].map(tabType => (
                <TabsContent key={tabType} value={tabType} className="mt-0">
                  <div className="divide-y divide-gray-100">
                    {filterData(tabType).map((item, index) => (
                      <div key={item.id || index} className="p-4">
                        {/* Same content structure as above */}
                        {type === 'orders' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">#{item.order_number}</p>
                                <p className="text-xs text-gray-600">{item.delivery_name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(item.created_at)} at {formatTime(item.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">
                                Rs{parseFloat(item.total_amount || 0).toFixed(2)}
                              </p>
                              <Badge variant="default" className="text-xs">
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        {type === 'products' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Store className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-600">Rs{parseFloat(item.price).toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Stock: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`text-xs ${
                                item.quantity > 10 ? 'bg-green-100 text-green-800' :
                                item.quantity > 0 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.quantity > 10 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Filter Sheet */}
        <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
          <SheetContent side="right" className="w-full sm:w-80">
            <SheetHeader className="pb-4">
              <SheetTitle>Filter by Date Range</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={applyDateFilter} className="flex-1">
                  Apply Filter
                </Button>
                <Button variant="outline" onClick={clearDateFilter} className="flex-1">
                  Clear
                </Button>
              </div>
              
              {(dateFrom || dateTo) && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    {dateFrom && dateTo ? `Showing: ${dateFrom} to ${dateTo}` : 
                     dateFrom ? `From: ${dateFrom}` : 
                     dateTo ? `Until: ${dateTo}` : ''}
                  </p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </VendorPage>
  );
};

export default VendorSummary;