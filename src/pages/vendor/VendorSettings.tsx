import { useState, useEffect } from "react";
import { User, Bell, Shield, CreditCard, ChevronRight, Package, BarChart3, Store, TrendingUp, LogOut as LucideLogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VendorPage } from "@/components/VendorLayout";
import { useNavigate } from "react-router-dom";
import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';

const settingsMenu = [
  {
    category: "Account",
    items: [
      { id: "profile", title: "Profile Management", subtitle: "Complete profile setup and management", icon: User, action: "navigate" },
      { id: "company", title: "Company Information", subtitle: "Business details and verification", icon: Store, action: "navigate" },
      { id: "security", title: "Security & Login", subtitle: "Password and authentication", icon: Shield, action: "navigate" },
    ]
  },
  {
    category: "Business",
    items: [
      { id: "products", title: "Product Management", subtitle: "Inventory, pricing, and catalog", icon: Package, action: "navigate" },
      { id: "analytics", title: "Business Analytics", subtitle: "Sales reports and insights", icon: BarChart3, action: "navigate" },
    ]
  },

];

export default function VendorSettings() {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [vendorProfile, setVendorProfile] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    avatar: "/api/placeholder/120/120",
    isOnline: true,
    autoOnlineTime: "09:00",
    autoOfflineTime: "22:00",
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Check persistent authentication
      const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
      const isVendorLoggedIn = await simplePersistentAuth.isVendorLoggedIn();
      
      if (!isVendorLoggedIn) {
        navigate("/vendor/login");
        return;
      }
      
      // Restore auth for API calls
      const vendorAuth = await simplePersistentAuth.getVendorAuth();
      if (vendorAuth) {
        await authService.setAuth(vendorAuth.token, vendorAuth.user);
      }

      const { response: userResponse, data: userData } = await apiRequest('/profile/');

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const { response: vendorResponse, data: vendorData } = await apiRequest('/vendor-profiles/');

      if (vendorResponse.ok && vendorData) {
        if (vendorData.results && vendorData.results.length > 0) {
          const profile = vendorData.results[0];
          setVendorProfile({
            businessName: profile.business_name || "N/A",
            ownerName: profile.owner_name || userData.username,
            email: profile.business_email || userData.email,
            phone: profile.business_phone || userData.phone_number || "N/A",
            address: profile.business_address || "N/A",
            description: profile.description || "No description",
            avatar: userData.profile_picture ? (userData.profile_picture.startsWith('http') ? userData.profile_picture : userData.profile_picture) : "/api/placeholder/120/120",
            isOnline: true,
            autoOnlineTime: "09:00",
            autoOfflineTime: "22:00",
            totalProducts: 24,
            activeProducts: 22,
            totalSales: 1250,
            monthlyRevenue: 45000
          });
        }
      } else {
        setVendorProfile(prev => ({
          ...prev,
          businessName: userData.username,
          ownerName: userData.username,
          email: userData.email,
          phone: userData.phone_number || "N/A",
          avatar: userData.profile_picture ? (userData.profile_picture.startsWith('http') ? userData.profile_picture : userData.profile_picture) : "/api/placeholder/120/120"
        }));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const [paymentSettings, setPaymentSettings] = useState({
    esewa: {
      enabled: false,
      merchantId: '',
      secretKey: ''
    },
    khalti: {
      enabled: false,
      publicKey: '',
      secretKey: ''
    }
  });

  const handleSectionClick = (sectionId) => {
    if (sectionId === 'profile') {
      navigate('/vendor/profile');
    } else if (sectionId === 'security') {
      navigate('/vendor/security');
    } else if (sectionId === 'company') {
      navigate('/vendor/company');
    } else if (sectionId === 'products') {
      navigate('/vendor/products');
    } else if (sectionId === 'analytics') {
      navigate('/vendor/analytics');
    } else {
      setSelectedSection(sectionId);
    }
  };

  const handleProfileUpdate = (field, value) => {
    setVendorProfile(prev => ({ ...prev, [field]: value }));
  };

  if (selectedSection) {
    return (
      <VendorPage title="Settings">
        <div className="min-h-screen bg-gray-50">
          <div className="p-4">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedSection(null)}
              className="mb-4"
            >
              ← Back to Settings
            </Button>

            {selectedSection === 'analytics' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Business Analytics</h2>
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Revenue Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">₹{vendorProfile.monthlyRevenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">This Month</p>
                        <p className="text-xs text-green-600">+12% from last month</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">₹{(vendorProfile.monthlyRevenue * 0.85).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Last Month</p>
                        <p className="text-xs text-gray-600">Previous period</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Sales Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Total Orders</span>
                        </div>
                        <p className="text-xl font-bold">{vendorProfile.totalSales}</p>
                        <p className="text-xs text-gray-600">This month</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Avg Order Value</span>
                        </div>
                        <p className="text-xl font-bold">₹{Math.round(vendorProfile.monthlyRevenue / vendorProfile.totalSales)}</p>
                        <p className="text-xs text-gray-600">Per order</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Product Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Products</span>
                        <span className="font-semibold">{vendorProfile.activeProducts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Products</span>
                        <span className="font-semibold">{vendorProfile.totalProducts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Best Seller</span>
                        <span className="font-semibold text-green-600">Chicken Momo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Weekly Sales</h3>
                    <div className="flex items-end justify-between h-32 gap-2">
                      {[65, 45, 78, 52, 89, 67, 43].map((value, index) => {
                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        const height = (value / 100) * 100;
                        return (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div 
                              className="w-full bg-blue-500 rounded-t mb-1"
                              style={{ height: `${height}px` }}
                            ></div>
                            <span className="text-xs text-gray-600">{days[index]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedSection === 'payment' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Payment Settings</h2>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 font-bold text-lg">eS</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">eSewa Integration</h3>
                          <p className="text-sm text-gray-600">Receive payments through eSewa</p>
                        </div>
                      </div>
                      <Switch 
                        checked={paymentSettings.esewa.enabled}
                        onCheckedChange={(checked) => 
                          setPaymentSettings(prev => ({
                            ...prev,
                            esewa: { ...prev.esewa, enabled: checked }
                          }))
                        }
                      />
                    </div>
                    
                    {paymentSettings.esewa.enabled && (
                      <div className="space-y-3 pt-3 border-t">
                        <div>
                          <Label className="text-sm font-medium">Merchant ID</Label>
                          <Input 
                            placeholder="Enter your eSewa Merchant ID"
                            value={paymentSettings.esewa.merchantId}
                            onChange={(e) => 
                              setPaymentSettings(prev => ({
                                ...prev,
                                esewa: { ...prev.esewa, merchantId: e.target.value }
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Secret Key</Label>
                          <Input 
                            type="password"
                            placeholder="Enter your eSewa Secret Key"
                            value={paymentSettings.esewa.secretKey}
                            onChange={(e) => 
                              setPaymentSettings(prev => ({
                                ...prev,
                                esewa: { ...prev.esewa, secretKey: e.target.value }
                              }))
                            }
                          />
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> You can get your eSewa API credentials from your eSewa merchant dashboard.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 font-bold text-lg">K</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">Khalti Integration</h3>
                          <p className="text-sm text-gray-600">Receive payments through Khalti</p>
                        </div>
                      </div>
                      <Switch 
                        checked={paymentSettings.khalti.enabled}
                        onCheckedChange={(checked) => 
                          setPaymentSettings(prev => ({
                            ...prev,
                            khalti: { ...prev.khalti, enabled: checked }
                          }))
                        }
                      />
                    </div>
                    
                    {paymentSettings.khalti.enabled && (
                      <div className="space-y-3 pt-3 border-t">
                        <div>
                          <Label className="text-sm font-medium">Public Key</Label>
                          <Input 
                            placeholder="Enter your Khalti Public Key"
                            value={paymentSettings.khalti.publicKey}
                            onChange={(e) => 
                              setPaymentSettings(prev => ({
                                ...prev,
                                khalti: { ...prev.khalti, publicKey: e.target.value }
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Secret Key</Label>
                          <Input 
                            type="password"
                            placeholder="Enter your Khalti Secret Key"
                            value={paymentSettings.khalti.secretKey}
                            onChange={(e) => 
                              setPaymentSettings(prev => ({
                                ...prev,
                                khalti: { ...prev.khalti, secretKey: e.target.value }
                              }))
                            }
                          />
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-sm text-purple-800">
                            <strong>Note:</strong> You can get your Khalti API credentials from your Khalti merchant dashboard.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Payment Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">eSewa Status</span>
                        <Badge className={paymentSettings.esewa.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {paymentSettings.esewa.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Khalti Status</span>
                        <Badge className={paymentSettings.khalti.enabled ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                          {paymentSettings.khalti.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Save Payment Settings
                  </Button>
                </div>
              </div>
            )}

            {selectedSection === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
                

                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Notification Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">New Orders</span>
                          <p className="text-xs text-gray-600">Get notified when you receive new orders</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">Payment Updates</span>
                          <p className="text-xs text-gray-600">Notifications for payment confirmations</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">Low Stock Alerts</span>
                          <p className="text-xs text-gray-600">Alert when products are running low</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">System Updates</span>
                          <p className="text-xs text-gray-600">Important system and policy updates</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Delivery Methods</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Push Notifications</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email Notifications</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SMS Notifications</span>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </VendorPage>
    );
  }

  if (loading) {
    return (
      <VendorPage title="Settings">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </VendorPage>
    );
  }

  if (error) {
    return (
      <VendorPage title="Settings">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchUserProfile}>Retry</Button>
          </div>
        </div>
      </VendorPage>
    );
  }

  return (
    <VendorPage title="Settings">
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="p-4 flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={vendorProfile.avatar} />
              <AvatarFallback className="text-lg font-bold">
                {vendorProfile.businessName ? vendorProfile.businessName.charAt(0) : 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-lg font-semibold">{vendorProfile.businessName || 'Business Name'}</h1>
              <p className="text-gray-500 text-xs">{vendorProfile.email}</p>
            </div>

            <Badge className={vendorProfile.isOnline ? 'bg-green-100 text-green-800 text-xs' : 'bg-gray-100 text-gray-800 text-xs'}>
              {vendorProfile.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {settingsMenu.map((section) => (
            <div key={section.category} className="bg-white rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">{section.category}</h2>
              </div>
              <div className="divide-y">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSectionClick(item.id)}
                      data-section={item.id}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.subtitle}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Logout Button */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center py-6 bg-red-50/40 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            onClick={async () => {
              await authService.clearAuth();
              navigate("/vendor/login");
            }}
          >
            <LucideLogOut className="h-5 w-5 mr-2" />
            <span className="font-medium text-base">Logout</span>
          </Button>
        </div>
      </div>
    </VendorPage>
  );
}