import React, { useState, useEffect } from 'react';
import { VendorPage } from "@/components/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Package, Calendar, ArrowUpRight, ArrowDownLeft, Filter, Download, RefreshCw, Printer, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiRequest } from '@/utils/apiUtils';

interface SalesTransaction {
  id: number;
  order_number: string;
  customer_name: string;
  amount: number;
  type: 'sale' | 'refund';
  status: string;
  created_at: string;
  items_count: number;
}

const VendorSales: React.FC = () => {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalRefunds: 0,
    netEarnings: 0,
    todaySales: 0,
    monthSales: 0
  });

  useEffect(() => {
    fetchSalesData();
  }, [dateFrom, dateTo, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: itemsPerPage.toString()
      });
      
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const { response, data } = await apiRequest(`/vendor/orders/?${params}`);
      
      if (response.ok && data) {
        const orders = data.results || data || [];
        setTotalPages(Math.ceil((data.count || orders.length) / itemsPerPage));
        setTotalCount(data.count || orders.length);
        
        // Convert orders to sales transactions
        const salesTransactions: SalesTransaction[] = [];
        
        orders.forEach(order => {
          // Add sale transaction for delivered orders
          if (order.status === 'delivered') {
            salesTransactions.push({
              id: order.id,
              order_number: order.order_number,
              customer_name: order.customer_details?.username || order.delivery_name,
              amount: parseFloat(order.total_amount),
              type: 'sale',
              status: 'completed',
              created_at: order.created_at,
              items_count: order.items?.length || 0
            });
          }
          
          // Add refund transactions for orders with refunds
          if (order.refunds?.length > 0) {
            order.refunds.forEach(refund => {
              if (refund.status === 'completed') {
                salesTransactions.push({
                  id: `refund-${refund.id}`,
                  order_number: order.order_number,
                  customer_name: order.customer_details?.username || order.delivery_name,
                  amount: -parseFloat(refund.approved_amount || refund.requested_amount),
                  type: 'refund',
                  status: 'completed',
                  created_at: refund.completed_at || refund.created_at,
                  items_count: order.items?.length || 0
                });
              }
            });
          }
        });
        
        // Sort by date (newest first)
        salesTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Apply date filter if set
        let filteredTransactions = salesTransactions;
        if (dateFrom && dateTo) {
          const fromDate = new Date(dateFrom);
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // Include full end date
          
          filteredTransactions = salesTransactions.filter(t => {
            const transactionDate = new Date(t.created_at);
            return transactionDate >= fromDate && transactionDate <= toDate;
          });
        }
        
        setTransactions(filteredTransactions);
        
        // Calculate stats
        const totalSales = salesTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
        const totalRefunds = Math.abs(salesTransactions.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0));
        const netEarnings = totalSales - totalRefunds;
        
        const today = new Date().toDateString();
        const todaySales = salesTransactions
          .filter(t => new Date(t.created_at).toDateString() === today && t.type === 'sale')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthSales = salesTransactions
          .filter(t => {
            const date = new Date(t.created_at);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.type === 'sale';
          })
          .reduce((sum, t) => sum + t.amount, 0);
        
        setSalesStats({
          totalSales,
          totalRefunds,
          netEarnings,
          todaySales,
          monthSales
        });
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = (type: string) => {
    if (type === 'all') return transactions;
    if (type === 'sales') return transactions.filter(t => t.type === 'sale');
    if (type === 'refunds') return transactions.filter(t => t.type === 'refund');
    return transactions;
  };

  const exportCSV = () => {
    const csvContent = [
      ['Date', 'Time', 'Type', 'Order Number', 'Customer', 'Amount', 'Status', 'Items'].join(','),
      ...transactions.map(t => [
        formatDate(t.created_at),
        formatTime(t.created_at),
        t.type,
        t.order_number,
        `"${t.customer_name}"`,
        Math.abs(t.amount).toFixed(2),
        t.status,
        t.items_count
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateFrom || 'all'}-${dateTo || new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const dateRange = dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time';
    const report = `
===========================================
           SALES & EARNINGS REPORT
===========================================
Generated: ${currentDate}
Period: ${dateRange}

SUMMARY
-------------------------------------------
Total Sales: Rs${salesStats.totalSales.toFixed(2)}
Total Refunds: Rs${salesStats.totalRefunds.toFixed(2)}
Net Earnings: Rs${salesStats.netEarnings.toFixed(2)}
Today's Sales: Rs${salesStats.todaySales.toFixed(2)}
This Month: Rs${salesStats.monthSales.toFixed(2)}

TRANSACTIONS (${transactions.length} records)
-------------------------------------------
${transactions.map(t => `${formatDate(t.created_at)} ${formatTime(t.created_at)} | ${t.type.toUpperCase().padEnd(6)} | ${t.order_number.padEnd(12)} | Rs${Math.abs(t.amount).toFixed(2).padStart(8)} | ${t.customer_name}`).join('\n')}

===========================================
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`<pre style="font-family: monospace; font-size: 12px; line-height: 1.4;">${report}</pre>`);
    printWindow?.print();
  };

  const shareReport = () => {
    const summary = `Sales Report\n\nTotal Sales: Rs ${salesStats.totalSales.toFixed(2)}\nTotal Refunds: Rs ${salesStats.totalRefunds.toFixed(2)}\nNet Earnings: Rs ${salesStats.netEarnings.toFixed(2)}\n\nTransactions: ${transactions.length}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Sales Report',
        text: summary
      });
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(summary)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const applyDateFilter = () => {
    setCurrentPage(1);
    fetchSalesData();
    setShowFilterSheet(false);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    fetchSalesData();
    setShowFilterSheet(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <VendorPage title="Sales & Earnings">
      <div className="min-h-screen bg-gray-50 pb-20">
        
        {/* Stats Cards */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Sales</p>
                    <p className="text-sm font-bold text-green-600">Rs{salesStats.totalSales.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Refunds</p>
                    <p className="text-sm font-bold text-red-600">Rs{salesStats.totalRefunds.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Net Earnings</p>
                <p className="text-2xl font-bold text-blue-600">Rs{salesStats.netEarnings.toFixed(2)}</p>
                <div className="flex justify-between mt-3 text-xs">
                  <div>
                    <p className="text-gray-600">Today</p>
                    <p className="font-semibold">Rs{salesStats.todaySales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">This Month</p>
                    <p className="font-semibold">Rs{salesStats.monthSales.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <div className="px-4">
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Sales Transactions</h2>
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
                <Button variant="outline" size="sm" onClick={() => setShowFilterSheet(true)}>
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={fetchSalesData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-100 overflow-x-auto">
                <TabsList className="flex w-max bg-transparent h-auto p-2 gap-3">
                  <TabsTrigger value="all" className="text-xs py-2 px-3">
                    All ({transactions.length})
                  </TabsTrigger>
                  <TabsTrigger value="sales" className="text-xs py-2 px-3">
                    Sales ({transactions.filter(t => t.type === 'sale').length})
                  </TabsTrigger>
                  <TabsTrigger value="refunds" className="text-xs py-2 px-3">
                    Refunds ({transactions.filter(t => t.type === 'refund').length})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <div className="divide-y divide-gray-100">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading transactions...</p>
                    </div>
                  ) : filterTransactions('all').length === 0 ? (
                    <div className="p-8 text-center">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No transactions found</p>
                    </div>
                  ) : (
                    filterTransactions('all').map((transaction) => (
                      <div key={transaction.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'sale' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {transaction.type === 'sale' ? 
                                <ArrowDownLeft className="h-5 w-5 text-green-600" /> : 
                                <ArrowUpRight className="h-5 w-5 text-red-600" />
                              }
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {transaction.type === 'sale' ? 'Sale' : 'Refund'} - {transaction.order_number}
                              </p>
                              <p className="text-xs text-gray-600">
                                {transaction.customer_name} • {transaction.items_count} items
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(transaction.created_at)} at {formatTime(transaction.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'sale' ? '+' : ''}Rs{Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            <Badge variant="default" className="text-xs">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="sales" className="mt-0">
                <div className="divide-y divide-gray-100">
                  {filterTransactions('sales').map((transaction) => (
                    <div key={transaction.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <ArrowDownLeft className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Sale - {transaction.order_number}</p>
                            <p className="text-xs text-gray-600">
                              {transaction.customer_name} • {transaction.items_count} items
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(transaction.created_at)} at {formatTime(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            +Rs{transaction.amount.toFixed(2)}
                          </p>
                          <Badge variant="default" className="text-xs">completed</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="refunds" className="mt-0">
                <div className="divide-y divide-gray-100">
                  {filterTransactions('refunds').map((transaction) => (
                    <div key={transaction.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Refund - {transaction.order_number}</p>
                            <p className="text-xs text-gray-600">
                              {transaction.customer_name} • {transaction.items_count} items
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(transaction.created_at)} at {formatTime(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">
                            Rs{Math.abs(transaction.amount).toFixed(2)}
                          </p>
                          <Badge variant="secondary" className="text-xs">refunded</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} transactions
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

export default VendorSales;