import React, { useEffect, useState } from 'react';
import { VendorPage } from "@/components/VendorLayout";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Package, TrendingUp, Users, ArrowRight, Wallet, ShoppingCart, Clock, AlertCircle, CheckCircle, Star, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useGlobalOrderNotification } from "@/contexts/GlobalOrderNotificationContext";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VendorDebugInfo } from "@/components/VendorDebugInfo";
import { Capacitor } from '@capacitor/core';
import { fcmService } from '@/services/fcmService';

import { API_BASE, getApiUrl } from '@/config/api';
import { authService } from '@/services/authService';

const VendorHome: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const { pendingOrdersCount, isModalOpen } = useGlobalOrderNotification();
  
  // Real data states
  const [vendorProfile, setVendorProfile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    monthlyEarnings: 0,
    monthlyGrowth: 0
  });
  const [todayOrders, setTodayOrders] = useState([]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [isLoadingSliders, setIsLoadingSliders] = useState(true);
  
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const extendedSlides = sliders.length > 0 ? [
    sliders[sliders.length - 1], // Last slide at beginning
    ...sliders,
    sliders[0] // First slide at end
  ] : [];
  
  useEffect(() => {
    if (sliders.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => prev + 1);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [sliders.length]);
  
  useEffect(() => {
    if (sliders.length > 0) {
      if (currentSlide === extendedSlides.length - 1) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentSlide(1);
          setTimeout(() => setIsTransitioning(true), 50);
        }, 500);
      } else if (currentSlide === 0) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentSlide(sliders.length);
          setTimeout(() => setIsTransitioning(true), 50);
        }, 500);
      }
    }
  }, [currentSlide, sliders.length]);

  const handleTouchStart = (e) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < sliders.length) {
      setCurrentSlide(prev => prev + 1);
    }
    if (isRightSwipe && currentSlide > 1) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  useEffect(() => {
    // Simple fast loading
    setIsApproved(true);
    setIsLoading(false);
    
    // Initialize FCM service for push notifications
    if (Capacitor.isNativePlatform()) {
      fcmService.initialize().then(() => {
        console.log('✅ FCM Service initialized on vendor home');
        // Register token after a short delay to ensure auth is ready
        setTimeout(() => {
          fcmService.registerToken();
        }, 2000);
      }).catch(error => {
        console.error('❌ FCM Service initialization failed:', error);
      });
    }
    
    // Fetch data immediately
    fetchDashboardData();
    fetchSliders();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      
      // Fetch vendor profile
      const { response: profileResponse, data: profileData } = await apiRequest('/vendor-profiles/');
      if (profileResponse.ok && profileData?.results?.[0]) {
        setVendorProfile(profileData.results[0]);
      }
      
      // Fetch wallet balance
      const { response: walletResponse, data: walletData } = await apiRequest('/api/accounts/wallet/');
      if (walletResponse.ok && walletData) {
        setWalletBalance(parseFloat(walletData.balance) || 0);
      }
      
      // Fetch orders data
      const { response: ordersResponse, data: ordersData } = await apiRequest('/api/vendor/orders/');
      if (ordersResponse.ok && ordersData) {
        const orders = ordersData.results || ordersData || [];
        const totalOrders = orders.length;
        const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        
        setDashboardStats({
          totalOrders,
          totalRevenue,
          totalProducts: 0,
          totalCustomers: 0,
          monthlyEarnings: totalRevenue * 0.2,
          monthlyGrowth: 15
        });
        
        const today = new Date().toDateString();
        const todaysOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
        setTodayOrders(todaysOrders.slice(0, 5));
      }
      
      // Fetch products
      const { response: productsResponse, data: productsData } = await apiRequest('/api/products/');
      if (productsResponse.ok && productsData) {
        const products = productsData.results || productsData || [];
        setMyProducts(products.slice(0, 6));
        setDashboardStats(prev => ({ ...prev, totalProducts: products.length }));
      }
    } catch (error) {
      console.warn('Dashboard data fetch error:', error);
    }
  };
  
  const fetchSliders = async () => {
    try {
      const { apiRequest } = await import('@/utils/apiUtils');
      const { response, data } = await apiRequest('/api/sliders/?user_type=vendor');
      
      if (response.ok && data && data.sliders) {
        setSliders(data.sliders);
        if (data.sliders.length > 0) {
          setCurrentSlide(1);
        }
      }
    } catch (error) {
      console.warn('Sliders fetch error:', error);
    } finally {
      setIsLoadingSliders(false);
    }
  };
  
  const getOrderStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { icon: AlertCircle, color: 'red', bgColor: 'red-50', textColor: 'red-600', label: 'Action Required' };
      case 'confirmed':
      case 'preparing':
        return { icon: Clock, color: 'orange', bgColor: 'orange-50', textColor: 'orange-600', label: 'Processing' };
      case 'delivered':
        return { icon: CheckCircle, color: 'green', bgColor: 'green-50', textColor: 'green-600', label: 'Completed' };
      default:
        return { icon: Clock, color: 'blue', bgColor: 'blue-50', textColor: 'blue-600', label: 'In Progress' };
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verifying your account...</p>
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Under Review</h2>
          <p className="text-gray-600 mb-4">
            Your vendor application is being reviewed by our team. You'll receive an email notification once approved.
          </p>
          <Button
            onClick={() => navigate("/vendor/onboarding")}
            variant="outline"
            className="w-full"
          >
            Back to Application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Debug Info Component */}
      <VendorDebugInfo />
      
      {/* Dashboard Overlay when modal is open */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 z-[9998] pointer-events-none" />
      )}
      
      <VendorPage title="Dashboard">
        <div className={`space-y-4 pb-16 max-w-full overflow-x-hidden ${isModalOpen ? 'pointer-events-none' : ''}`}>

        {/* Store Info Header */}
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={vendorProfile?.user_info?.profile_picture} />
              <AvatarFallback className="bg-[#A98D7E] text-white">
                {vendorProfile?.business_name?.[0] || vendorProfile?.owner_name?.[0] || 'V'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{vendorProfile?.business_name || 'My Store'}</h2>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <Wallet className="h-3 w-3" /> ₹{(walletBalance || 0).toFixed(2)} Available
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="text-gray-700 text-xs px-2 py-1 h-auto flex items-center gap-1"
            onClick={() => navigate('/vendor/wallet')}
          >
            <Wallet className="h-3 w-3" />
            Wallet
          </Button>
        </div>



        {/* Analytics */}
        <div className="px-4">
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/vendor/summary?type=orders')}>
              <CardContent className="p-1.5">
                <div className="text-center">
                  <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Package className="h-2.5 w-2.5 text-teal-600" />
                  </div>
                  <p className="text-[9px] font-medium text-gray-600">Orders</p>
                  <p className="text-xs font-bold text-gray-900">{dashboardStats.totalOrders}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/vendor/summary?type=revenue')}>
              <CardContent className="p-1.5">
                <div className="text-center">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <TrendingUp className="h-2.5 w-2.5 text-blue-600" />
                  </div>
                  <p className="text-[9px] font-medium text-gray-600">Revenue</p>
                  <p className="text-xs font-bold text-gray-900">₹{dashboardStats.totalRevenue.toFixed(0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/vendor/summary?type=products')}>
              <CardContent className="p-1.5">
                <div className="text-center">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Store className="h-2.5 w-2.5 text-purple-600" />
                  </div>
                  <p className="text-[9px] font-medium text-gray-600">Products</p>
                  <p className="text-xs font-bold text-gray-900">{dashboardStats.totalProducts}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/vendor/summary?type=customers')}>
              <CardContent className="p-1.5">
                <div className="text-center">
                  <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Users className="h-2.5 w-2.5 text-orange-600" />
                  </div>
                  <p className="text-[9px] font-medium text-gray-600">Customers</p>
                  <p className="text-xs font-bold text-gray-900">{dashboardStats.totalCustomers}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Banner Slider */}
        <div>
          {isLoadingSliders ? (
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading sliders...</span>
            </div>
          ) : sliders.length > 0 ? (
            <div className="relative h-32">
              <div 
                className="overflow-visible"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                  style={{ transform: `translateX(calc(-${currentSlide * 95}% + 2.5%))` }}
                >
                  {extendedSlides.map((slider, index) => (
                    <div 
                      key={`${slider.id}-${index}`} 
                      className={`flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                        index === currentSlide ? 'scale-100 opacity-100 z-10' : 'scale-90 opacity-50 z-0'
                      }`}
                      style={{ width: '95%', marginRight: '1%' }}
                      onClick={() => {
                        if (slider.link_url) {
                          window.open(slider.link_url, '_blank');
                        }
                      }}
                    >
                      <div className="relative h-32">
                        {slider.image_url ? (
                          <img 
                            src={slider.image_url} 
                            alt={slider.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-purple-600/80 flex items-center justify-center" style={{ display: slider.image_url ? 'none' : 'flex' }}>
                          <h3 className="text-white text-lg font-bold text-center px-4">{slider.title}</h3>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dots Indicator */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                {sliders.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index + 1)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === ((currentSlide - 1 + sliders.length) % sliders.length) ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No promotional banners available</p>
              </div>
            </div>
          )}
        </div>

        {/* Earnings */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Earnings</h3>
            <Button 
              variant="outline" 
              className="text-gray-700 text-sm px-3 py-2 h-auto flex items-center gap-2"
              onClick={() => navigate('/vendor/wallet')}
            >
              <TrendingUp className="h-4 w-4" />
              View Transactions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Earnings</p>
            <p className="text-2xl font-bold text-gray-900">₹{(dashboardStats.totalRevenue || 0).toFixed(2)}</p>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Earning in {new Date().toLocaleDateString('en-US', { month: 'long' })}</p>
                  <p className="text-lg font-bold text-gray-900">₹{dashboardStats.monthlyEarnings.toFixed(2)} <span className="text-green-600">+{dashboardStats.monthlyGrowth}%</span></p>
                </div>
                <div className="flex items-end gap-1 h-8">
                  {monthlyChart.map((value, index) => {
                    const maxValue = Math.max(...monthlyChart, 1);
                    const height = value > 0 ? Math.max(4, (value / maxValue) * 24) : 2;
                    const isCurrentMonth = index === monthlyChart.length - 1;
                    return (
                      <div
                        key={index}
                        className={`w-2 rounded-t ${isCurrentMonth ? 'bg-green-500' : value > 0 ? 'bg-blue-400' : 'bg-gray-200'}`}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Orders */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Today's Orders</h3>
            <Button variant="outline" className="text-gray-700 text-xs px-2 py-1 h-auto" onClick={() => navigate('/vendor/orders')}>
              View All
            </Button>
          </div>
          <div className={`space-y-3 ${todayOrders.length > 7 ? 'max-h-96 overflow-y-auto' : ''}`}>
            {todayOrders.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No orders today</p>
                </CardContent>
              </Card>
            ) : (
              todayOrders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status);
                const Icon = statusInfo.icon;
                const orderDate = order.created_at ? new Date(order.created_at) : new Date();
                const timeAgo = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60));
                return (
                  <Card 
                    key={order.id} 
                    className={`border-l-4 border-l-${statusInfo.color}-500 cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => navigate(`/vendor/orders?tab=${order.status}&orderId=${order.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 text-${statusInfo.color}-500`} />
                          <span className={`text-xs font-medium text-${statusInfo.textColor} bg-${statusInfo.bgColor} px-2 py-1 rounded-full`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">#{order.order_number}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {order.status === 'pending' ? 'New order received' :
                         order.status === 'delivered' ? 'Order delivered successfully' :
                         'Order in progress'}
                      </p>
                      <p className="text-xs text-gray-600">
                        ₹{parseFloat(order.total_amount || 0).toFixed(2)} • {order.items?.length || 0} items • {timeAgo < 60 ? `${timeAgo} min ago` : `${Math.floor(timeAgo / 60)} hours ago`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Best Selling Products</h3>
            <Button variant="outline" className="text-gray-700 text-xs px-2 py-1 h-auto">
              View All
            </Button>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {bestSellingProducts.map((product) => (
                <Card key={product.id} className="w-32 flex-shrink-0">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={product.images?.[0]?.image_url || '/api/placeholder/80/80'} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-xs text-gray-600">₹{parseFloat(product.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 font-medium">{product.sold} sold</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-gray-600">{product.rating}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">Stock: {product.quantity}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* My Products Grid */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">My Products</h3>
            <Button 
              variant="outline" 
              className="text-gray-700 text-xs px-2 py-1 h-auto flex items-center gap-1"
              onClick={() => navigate('/vendor/products')}
            >
              <Eye className="h-3 w-3" />
              Manage
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-full">
            {myProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="w-full h-12 bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={product.images?.[0]?.image_url || '/api/placeholder/60/60'} 
                        alt={product.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                      <p className="text-xs text-gray-600">₹{parseFloat(product.price).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Stock: {product.quantity}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.quantity > 10 ? 'bg-green-100 text-green-700' :
                        product.quantity > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.quantity > 10 ? 'Active' : product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </div>
      </VendorPage>
    </>
  );
};

export default VendorHome;