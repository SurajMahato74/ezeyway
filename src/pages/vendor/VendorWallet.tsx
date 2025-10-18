import React, { useState, useEffect } from 'react';
import { VendorPage } from "@/components/VendorLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Calendar, Filter, Printer, CreditCard, Smartphone, Eye, EyeOff, TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight, FileText, Download, X } from "lucide-react";
import { toast } from 'sonner';
import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';

interface WalletData {
  id: number;
  balance: string;
  total_earned: string;
  total_spent: string;
  business_name: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: number;
  transaction_type: 'credit' | 'debit';
  amount: string;
  description: string;
  order_amount?: string;
  payment_method?: string;
  reference_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

const VendorWallet: React.FC = () => {
  const [showRechargeSheet, setShowRechargeSheet] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('khalti');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const itemsPerPage = 20;

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      const { response, data } = await apiRequest('vendor-wallet/');
      
      if (response.ok && data) {
        setWalletData(data);
      } else {
        toast.error('Failed to fetch wallet data');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Error loading wallet data');
    } finally {
      setIsLoadingWallet(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        date_filter: dateFilter,
        page: currentPage.toString(),
        page_size: itemsPerPage.toString(),
      });
      
      if (dateFilter === 'custom' && customDateFrom && customDateTo) {
        params.append('date_from', customDateFrom);
        params.append('date_to', customDateTo);
      }
      
      const { response, data } = await apiRequest(`wallet/transactions/?${params}`);
      
      if (response.ok && data) {
        setTransactions(data.transactions);
        setTotalPages(data.total_pages);
        setTotalTransactions(data.total_count);
      } else {
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error loading transactions');
    }
  };

  useEffect(() => {
    fetchWalletData();
    
    // Listen for wallet updates
    const handleWalletUpdate = () => {
      fetchWalletData();
    };
    
    window.addEventListener('walletUpdated', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('walletUpdated', handleWalletUpdate);
    };
  }, []);

  useEffect(() => {
    if (walletData) {
      fetchTransactions();
    }
  }, [walletData, dateFilter, currentPage, customDateFrom, customDateTo]);
  
  // Listen for wallet updates from order acceptance
  useEffect(() => {
    const handleWalletUpdate = () => {
      fetchWalletData();
      fetchTransactions();
    };
    
    window.addEventListener('walletUpdated', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('walletUpdated', handleWalletUpdate);
    };
  }, []);

  // Check for payment completion on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_complete') === '1') {
      const pidx = urlParams.get('pidx');
      if (pidx) {
        // Verify payment with backend
        verifyPayment(pidx);
      } else {
        toast.success('Payment completed successfully!');
        fetchWalletData();
      }
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const verifyPayment = async (pidx: string) => {
    try {
      const { response, data } = await apiRequest('wallet/khalti-verify/', {
        method: 'POST',
        body: JSON.stringify({ pidx }),
      });
      
      if (response.ok && data && data.success) {
        toast.success(`Payment verified! Rs${data.amount} added to wallet`);
        fetchWalletData();
      } else {
        toast.error(data?.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Error verifying payment');
    }
  };

  const handleRecharge = async () => {
    if (!selectedPaymentMethod || !rechargeAmount) return;
    
    // Check persistent authentication
    const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
    const isVendorLoggedIn = await simplePersistentAuth.isVendorLoggedIn();
    
    if (!isVendorLoggedIn) {
      toast.error('Please login to continue');
      return;
    }
    
    setIsLoading(true);
    
    if (selectedPaymentMethod === 'khalti') {
      try {
        // Initiate Khalti payment via backend
        const { response, data } = await apiRequest('wallet/khalti-payment/', {
          method: 'POST',
          body: JSON.stringify({
            amount: parseFloat(rechargeAmount)
          }),
        });
        
        if (response.ok && data && data.success) {
          // Redirect to Khalti payment page
          window.location.href = data.payment_url;
        } else {
          toast.error(data?.error || 'Failed to initiate payment');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initiating payment:', error);
        toast.error('Error processing payment');
        setIsLoading(false);
      }
    }
    
    setShowRechargeSheet(false);
    setRechargeAmount('');
  };

  const getTotalCredit = () => {
    return transactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const getTotalDebit = () => {
    return transactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const printSummary = () => {
    const currentDate = new Date().toLocaleDateString();
    const summary = `
===========================================
           WALLET TRANSACTION SUMMARY
===========================================
Generated: ${currentDate}
Store: ${walletData?.business_name || 'N/A'}
Period: ${dateFilter === 'custom' ? `${customDateFrom} to ${customDateTo}` : dateFilter.toUpperCase()}

BALANCE OVERVIEW
-------------------------------------------
Current Balance: Rs${walletData?.balance || '0.00'}
Total Credit: Rs${getTotalCredit().toFixed(2)}
Total Debit: Rs${getTotalDebit().toFixed(2)}
Net Amount: Rs${(getTotalCredit() - getTotalDebit()).toFixed(2)}

TRANSACTION DETAILS (${transactions.length} transactions)
-------------------------------------------
${transactions.map(t => `${formatDate(t.created_at)} ${formatTime(t.created_at)} | ${t.transaction_type.toUpperCase().padEnd(6)} | Rs${parseFloat(t.amount).toFixed(2).padStart(8)} | ${t.description}`).join('\n')}

===========================================
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`<pre style="font-family: monospace; font-size: 12px; line-height: 1.4;">${summary}</pre>`);
    printWindow?.print();
  };

  const exportCSV = () => {
    const csvContent = [
      ['Date', 'Time', 'Type', 'Amount', 'Description', 'Method', 'Status'].join(','),
      ...transactions.map(t => [
        formatDate(t.created_at),
        formatTime(t.created_at),
        t.transaction_type,
        parseFloat(t.amount).toFixed(2),
        `"${t.description}"`,
        t.payment_method || 'N/A',
        t.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-transactions-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <VendorPage title="Wallet">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
        {/* Wallet Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">My Wallet</h2>
                <p className="text-gray-600 text-sm">{walletData?.business_name || 'Loading...'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-gray-100"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900 mb-3">
              {showBalance ? `₹${walletData?.balance || '0.00'}` : '₹****.**'}
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              onClick={() => setShowRechargeSheet(true)}
              disabled
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Money
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">This Month</p>
                    <p className="text-sm font-bold text-green-600">+₹{walletData?.total_earned || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Expenses</p>
                    <p className="text-sm font-bold text-red-600">-₹{walletData?.total_spent || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction Filters */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={printSummary}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowFilterSheet(true)}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'custom', label: 'Custom' }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={dateFilter === filter.key ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setDateFilter(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>


        </div>

        {/* Transactions List */}
        <div className="px-4 space-y-2">
          {isLoadingWallet ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading transactions...</span>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((transaction) => (
              <Card key={transaction.id} className="bg-white shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setSelectedTransaction(transaction)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.transaction_type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.transaction_type === 'credit' ? 
                          <ArrowDownLeft className="h-5 w-5 text-green-600" /> : 
                          <ArrowUpRight className="h-5 w-5 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatDate(transaction.created_at)} at {formatTime(transaction.created_at)}</span>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}₹{parseFloat(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.payment_method || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalTransactions)} of {totalTransactions} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (page > totalPages) return null;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recharge Sheet */}
        <Sheet open={showRechargeSheet} onOpenChange={setShowRechargeSheet}>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader className="pb-6">
              <SheetTitle className="text-center text-xl">Add Money to Wallet</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 overflow-y-auto h-full pb-20">
              {/* Amount Input */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Enter Amount</Label>
                <Input
                  type="number"
                  placeholder="₹ 0.00"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="h-12 text-lg text-center"
                />
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000].map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setRechargeAmount(amount.toString())}
                      className="h-10"
                    >
                      ₹{amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Payment Method</Label>
                <Card 
                  className={`cursor-pointer transition-all ${selectedPaymentMethod === 'khalti' ? 'ring-2 ring-purple-500 bg-purple-50' : 'ring-2 ring-purple-500 bg-purple-50'}`}
                  onClick={() => setSelectedPaymentMethod('khalti')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Khalti</p>
                        <p className="text-xs text-gray-600">Secure digital payment gateway</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recharge Button */}
              <div className="fixed bottom-4 left-4 right-4">
                <Button 
                  className="w-full h-12 text-lg font-medium"
                  disabled={!selectedPaymentMethod || !rechargeAmount || isLoading}
                  onClick={handleRecharge}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Add ₹${rechargeAmount || '0'}`
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Filter Sheet */}
        <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
          <SheetContent side="right" className="w-full sm:w-80">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center justify-between">
                Filter Transactions
                <Button variant="ghost" size="sm" onClick={() => setShowFilterSheet(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Date Range</Label>
                <div className="space-y-2">
                  {[
                    { key: 'all', label: 'All Time' },
                    { key: 'today', label: 'Today' },
                    { key: 'week', label: 'This Week' },
                    { key: 'custom', label: 'Custom Range' }
                  ].map(filter => (
                    <Button
                      key={filter.key}
                      variant={dateFilter === filter.key ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setDateFilter(filter.key);
                        setCurrentPage(1);
                      }}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {dateFilter === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium">From Date</Label>
                    <Input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => {
                        setCustomDateFrom(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">To Date</Label>
                    <Input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => {
                        setCustomDateTo(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Total Transactions: {totalTransactions}</p>
                  <p>Total Credit: ₹{getTotalCredit().toFixed(2)}</p>
                  <p>Total Debit: ₹{getTotalDebit().toFixed(2)}</p>
                  <p className="font-medium">Net: ₹{(getTotalCredit() - getTotalDebit()).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Transaction Details Sheet */}
        <Sheet open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-left">Transaction Details</SheetTitle>
            </SheetHeader>
            
            {selectedTransaction && (
              <div className="space-y-4 overflow-y-auto h-full pb-20">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedTransaction.transaction_type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {selectedTransaction.transaction_type === 'credit' ? 
                        <ArrowDownLeft className="h-6 w-6 text-green-600" /> : 
                        <ArrowUpRight className="h-6 w-6 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{selectedTransaction.description}</p>
                      <p className={`text-xl font-bold ${
                        selectedTransaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedTransaction.transaction_type === 'credit' ? '+' : '-'}₹{parseFloat(selectedTransaction.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Transaction ID</p>
                      <p className="font-medium">TXN-{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <Badge variant={selectedTransaction.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedTransaction.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-600">Date & Time</p>
                      <p className="font-medium">{formatDate(selectedTransaction.created_at)} at {formatTime(selectedTransaction.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Method</p>
                      <p className="font-medium">{selectedTransaction.payment_method || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {(selectedTransaction.order_amount || selectedTransaction.reference_id) && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Additional Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      {selectedTransaction.order_amount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Amount:</span>
                          <span className="font-medium">₹{parseFloat(selectedTransaction.order_amount).toFixed(2)}</span>
                        </div>
                      )}
                      {selectedTransaction.reference_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reference ID:</span>
                          <span className="font-medium">{selectedTransaction.reference_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </VendorPage>
  );
};

export default VendorWallet;