import { useState, useEffect } from "react";
import { ArrowLeft, User, Store, MapPin, Clock, Phone, Mail, Camera, Save, Edit3, Shield, Star, Package, Truck, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorPage } from "@/components/VendorLayout";
import { apiRequest } from '@/utils/apiUtils';

interface VendorProfileData {
  // Basic Info
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsapp: string;
  avatar: string;
  
  // Business Details
  businessType: string;
  description: string;
  categories: string[];
  establishedYear: string;
  gstNumber: string;
  panNumber: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  
  // Operations
  deliveryRadius: string;
  minOrderAmount: string;
  deliveryFee: string;
  freeDeliveryAbove: string;
  estimatedDeliveryTime: string;
  
  // Timing
  isOpen: boolean;
  openingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  
  // Banking
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  upiId: string;
  
  // Documents
  businessLicense: string;
  gstCertificate: string;
  fssaiLicense: string;
  
  // Settings
  autoAcceptOrders: boolean;
  notificationSettings: {
    orderAlerts: boolean;
    messageAlerts: boolean;
    promotionalEmails: boolean;
  };
}

const VendorProfileManagement = () => {
  const [activeTab, setActiveTab] = useState("basic");
  const [isEditing, setIsEditing] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [shopImages, setShopImages] = useState<any[]>([]);
  
  const [profileData, setProfileData] = useState<VendorProfileData>({
    businessName: "Fresh Farm Valley",
    ownerName: "Ram Sharma",
    email: "ram@freshfarm.com",
    phone: "+977 9841234567",
    whatsapp: "+977 9841234567",
    avatar: "👨‍🌾",
    
    businessType: "grocery",
    description: "Certified organic farm serving Kathmandu Valley for 10+ years. We specialize in fresh vegetables, fruits, and dairy products.",
    categories: ["Vegetables", "Fruits", "Dairy", "Organic"],
    establishedYear: "2014",
    gstNumber: "27AABCU9603R1ZX",
    panNumber: "AABCU9603R",
    
    address: "Balkumari, Lalitpur",
    city: "Kathmandu",
    state: "Bagmati",
    pincode: "44700",
    landmark: "Near Balkumari Temple",
    
    deliveryRadius: "5",
    minOrderAmount: "200",
    deliveryFee: "50",
    freeDeliveryAbove: "500",
    estimatedDeliveryTime: "30-45",
    
    isOpen: true,
    openingHours: {
      monday: { open: "06:00", close: "21:00", closed: false },
      tuesday: { open: "06:00", close: "21:00", closed: false },
      wednesday: { open: "06:00", close: "21:00", closed: false },
      thursday: { open: "06:00", close: "21:00", closed: false },
      friday: { open: "06:00", close: "21:00", closed: false },
      saturday: { open: "06:00", close: "21:00", closed: false },
      sunday: { open: "07:00", close: "20:00", closed: false },
    },
    
    bankName: "Nepal Bank Limited",
    accountNumber: "1234567890123456",
    ifscCode: "NBLNPKA",
    accountHolderName: "Ram Sharma",
    upiId: "ram@nbl",
    
    businessLicense: "",
    gstCertificate: "",
    fssaiLicense: "",
    
    autoAcceptOrders: false,
    notificationSettings: {
      orderAlerts: true,
      messageAlerts: true,
      promotionalEmails: false,
    },
  });

  const businessTypes = [
    { value: "grocery", label: "Grocery Store" },
    { value: "restaurant", label: "Restaurant" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "electronics", label: "Electronics" },
    { value: "clothing", label: "Clothing" },
    { value: "bakery", label: "Bakery" },
    { value: "meat", label: "Meat Shop" },
    { value: "dairy", label: "Dairy Products" },
  ];

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { response, data } = await apiRequest('/categories/');
        if (response.ok && data.categories) {
          setAvailableCategories(data.categories.map((cat: any) => cat.name));
        } else {
          // Fallback categories
          setAvailableCategories([
            "Vegetables", "Fruits", "Dairy", "Meat", "Bakery", "Beverages", 
            "Snacks", "Organic", "Frozen", "Spices", "Grains", "Oil", "Electronics", "Decoration"
          ]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback categories
        setAvailableCategories([
          "Vegetables", "Fruits", "Dairy", "Meat", "Bakery", "Beverages", 
          "Snacks", "Organic", "Frozen", "Spices", "Grains", "Oil", "Electronics", "Decoration"
        ]);
      }
    };
    fetchCategories();
  }, []);

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const updateProfileData = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedData = (parent: string, field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [parent]: { ...prev[parent as keyof VendorProfileData], [field]: value }
    }));
  };

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const { response, data } = await apiRequest('/vendor-profiles/');

      if (response.ok && data) {
        console.log('Full API Response:', data);
        if (data.results && data.results.length > 0) {
          const vendorProfile = data.results[0];
          console.log('Vendor Profile:', vendorProfile);
          console.log('Documents:', vendorProfile.documents);
          console.log('Shop Images:', vendorProfile.shop_images);
          console.log('Categories:', vendorProfile.categories);
          
          // Store documents and shop images
          setDocuments(vendorProfile.documents || []);
          setShopImages(vendorProfile.shop_images || []);
          
          // Map API response to local state
          setProfileData({
            businessName: vendorProfile.business_name || '',
            ownerName: vendorProfile.owner_name || '',
            email: vendorProfile.business_email || '',
            phone: vendorProfile.business_phone || '',
            whatsapp: vendorProfile.business_phone || '',
            avatar: '🏪',
            businessType: vendorProfile.business_type || 'grocery',
            description: vendorProfile.description || '',
            categories: vendorProfile.categories || [],
            establishedYear: vendorProfile.established_year || '',
            gstNumber: vendorProfile.gst_number || '',
            panNumber: vendorProfile.pan_number || '',
            address: vendorProfile.business_address || '',
            city: vendorProfile.city || '',
            state: vendorProfile.state || '',
            pincode: vendorProfile.pincode || '',
            landmark: vendorProfile.landmark || '',
            deliveryRadius: vendorProfile.delivery_radius?.toString() || '5',
            minOrderAmount: vendorProfile.min_order_amount?.toString() || '200',
            deliveryFee: vendorProfile.delivery_fee?.toString() || '50',
            freeDeliveryAbove: vendorProfile.free_delivery_above?.toString() || '500',
            estimatedDeliveryTime: vendorProfile.estimated_delivery_time || '30-45',
            isOpen: vendorProfile.is_active || false,
            openingHours: {
              monday: { open: vendorProfile.monday_open || '06:00', close: vendorProfile.monday_close || '21:00', closed: vendorProfile.monday_closed || false },
              tuesday: { open: vendorProfile.tuesday_open || '06:00', close: vendorProfile.tuesday_close || '21:00', closed: vendorProfile.tuesday_closed || false },
              wednesday: { open: vendorProfile.wednesday_open || '06:00', close: vendorProfile.wednesday_close || '21:00', closed: vendorProfile.wednesday_closed || false },
              thursday: { open: vendorProfile.thursday_open || '06:00', close: vendorProfile.thursday_close || '21:00', closed: vendorProfile.thursday_closed || false },
              friday: { open: vendorProfile.friday_open || '06:00', close: vendorProfile.friday_close || '21:00', closed: vendorProfile.friday_closed || false },
              saturday: { open: vendorProfile.saturday_open || '06:00', close: vendorProfile.saturday_close || '21:00', closed: vendorProfile.saturday_closed || false },
              sunday: { open: vendorProfile.sunday_open || '07:00', close: vendorProfile.sunday_close || '20:00', closed: vendorProfile.sunday_closed || false },
            },
            bankName: vendorProfile.bank_name || '',
            accountNumber: vendorProfile.account_number || '',
            ifscCode: vendorProfile.ifsc_code || '',
            accountHolderName: vendorProfile.account_holder_name || '',
            upiId: vendorProfile.upi_id || '',
            businessLicense: vendorProfile.business_license_file_url || vendorProfile.business_license_file || '',
            gstCertificate: vendorProfile.gst_certificate_url || vendorProfile.gst_certificate || '',
            fssaiLicense: vendorProfile.fssai_license_url || vendorProfile.fssai_license || '',
            autoAcceptOrders: vendorProfile.auto_accept_orders || false,
            notificationSettings: {
              orderAlerts: true,
              messageAlerts: true,
              promotionalEmails: false,
            },
          });
        } else {
          setIsFirstTime(true);
        }
      } else {
        throw new Error('Failed to fetch vendor profile');
      }
    } catch (err) {
      console.error('Error fetching vendor profile:', err);
      setError('Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = {
        business_name: profileData.businessName,
        owner_name: profileData.ownerName,
        business_email: profileData.email,
        business_phone: profileData.phone,
        business_type: profileData.businessType,
        description: profileData.description,
        categories: profileData.categories,
        established_year: profileData.establishedYear,
        gst_number: profileData.gstNumber,
        pan_number: profileData.panNumber,
        business_address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
        landmark: profileData.landmark,
        delivery_radius: parseFloat(profileData.deliveryRadius),
        min_order_amount: parseFloat(profileData.minOrderAmount),
        delivery_fee: parseFloat(profileData.deliveryFee),
        free_delivery_above: parseFloat(profileData.freeDeliveryAbove),
        estimated_delivery_time: profileData.estimatedDeliveryTime,
        is_active: profileData.isOpen,
        monday_open: profileData.openingHours.monday.open,
        monday_close: profileData.openingHours.monday.close,
        monday_closed: profileData.openingHours.monday.closed,
        tuesday_open: profileData.openingHours.tuesday.open,
        tuesday_close: profileData.openingHours.tuesday.close,
        tuesday_closed: profileData.openingHours.tuesday.closed,
        wednesday_open: profileData.openingHours.wednesday.open,
        wednesday_close: profileData.openingHours.wednesday.close,
        wednesday_closed: profileData.openingHours.wednesday.closed,
        thursday_open: profileData.openingHours.thursday.open,
        thursday_close: profileData.openingHours.thursday.close,
        thursday_closed: profileData.openingHours.thursday.closed,
        friday_open: profileData.openingHours.friday.open,
        friday_close: profileData.openingHours.friday.close,
        friday_closed: profileData.openingHours.friday.closed,
        saturday_open: profileData.openingHours.saturday.open,
        saturday_close: profileData.openingHours.saturday.close,
        saturday_closed: profileData.openingHours.saturday.closed,
        sunday_open: profileData.openingHours.sunday.open,
        sunday_close: profileData.openingHours.sunday.close,
        sunday_closed: profileData.openingHours.sunday.closed,
        bank_name: profileData.bankName,
        account_number: profileData.accountNumber,
        ifsc_code: profileData.ifscCode,
        account_holder_name: profileData.accountHolderName,
        upi_id: profileData.upiId,
        auto_accept_orders: profileData.autoAcceptOrders,
      };

      const profileId = isFirstTime ? null : (await apiRequest('/vendor-profiles/')).data?.results?.[0]?.id;
      const url = isFirstTime ? '/vendor-profiles/' : `/vendor-profiles/${profileId}/`;
      const method = isFirstTime ? 'POST' : 'PATCH';
      
      const { response } = await apiRequest(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsEditing(false);
        setIsFirstTime(false);
        alert('Profile saved successfully!');
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleDocumentUpload = async (file: File, documentType: string) => {
    if (!file) return;
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only PDF, JPG, JPEG, or PNG files.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }
    
    setUploadingDocument(documentType);
    
    try {
      const formData = new FormData();
      formData.append(documentType, file);
      
      // Get the vendor profile ID first
      const profileResponse = await apiRequest('/vendor-profiles/');
      const profileId = profileResponse.data?.results?.[0]?.id;
      
      if (!profileId) {
        throw new Error('Vendor profile not found');
      }
      
      const { response, data } = await apiRequest(`/vendor-profiles/${profileId}/`, {
        method: 'PATCH',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const fileUrl = data[`${documentType}_url`] || data[documentType];
      updateProfileData(documentType, fileUrl);
      alert(`Document uploaded successfully!`);
      
      // Refresh the profile data
      await fetchVendorProfile();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingDocument(null);
    }
  };

  const tabsConfig = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "business", label: "Business", icon: Store },
    { id: "location", label: "Location", icon: MapPin },
    { id: "operations", label: "Operations", icon: Package },
    { id: "timing", label: "Timing", icon: Clock },
    { id: "banking", label: "Banking", icon: CreditCard },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "debug", label: "Debug", icon: Shield },
    { id: "settings", label: "Settings", icon: Shield },
  ];

  if (loading) {
    return (
      <VendorPage title="Profile Management">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </VendorPage>
    );
  }

  if (error) {
    return (
      <VendorPage title="Profile Management">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchVendorProfile}>Retry</Button>
          </div>
        </div>
      </VendorPage>
    );
  }

  return (
    <VendorPage title="Profile Management">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg">Profile Management</h1>
                {isFirstTime && (
                  <p className="text-sm text-gray-600">Complete your profile setup</p>
                )}
              </div>
            </div>
            <Button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                {profileData.avatar}
              </div>
              {isEditing && (
                <Button size="sm" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full p-0">
                  <Camera className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{profileData.businessName}</h2>
              <p className="text-gray-600 text-sm">{profileData.ownerName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={profileData.isOpen ? "default" : "destructive"} className="text-xs">
                  {profileData.isOpen ? "Open" : "Closed"}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>4.8 (342 reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="grid grid-cols-4 lg:grid-cols-9 w-full min-w-max">
                {tabsConfig.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 text-xs">
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={profileData.businessName}
                    onChange={(e) => updateProfileData("businessName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    value={profileData.ownerName}
                    onChange={(e) => updateProfileData("ownerName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => updateProfileData("email", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => updateProfileData("phone", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={profileData.whatsapp}
                    onChange={(e) => updateProfileData("whatsapp", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Business Tab */}
            <TabsContent value="business" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select
                    value={profileData.businessType}
                    onValueChange={(value) => updateProfileData("businessType", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input
                    id="establishedYear"
                    value={profileData.establishedYear}
                    onChange={(e) => updateProfileData("establishedYear", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={profileData.gstNumber}
                    onChange={(e) => updateProfileData("gstNumber", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={profileData.panNumber}
                    onChange={(e) => updateProfileData("panNumber", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  value={profileData.description}
                  onChange={(e) => updateProfileData("description", e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
              <div>
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Show current categories first */}
                  {profileData.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => {
                        if (!isEditing) return;
                        const newCategories = profileData.categories.filter(c => c !== category);
                        updateProfileData("categories", newCategories);
                      }}
                    >
                      {category} {isEditing && '×'}
                    </Badge>
                  ))}
                  {/* Show available categories that are not selected */}
                  {availableCategories
                    .filter(category => !profileData.categories.includes(category))
                    .map((category) => (
                    <Badge
                      key={category}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => {
                        if (!isEditing) return;
                        const newCategories = [...profileData.categories, category];
                        updateProfileData("categories", newCategories);
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
                {profileData.categories.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No categories selected</p>
                )}
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) => updateProfileData("address", e.target.value)}
                    disabled={!isEditing}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={profileData.city}
                    onChange={(e) => updateProfileData("city", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={profileData.state}
                    onChange={(e) => updateProfileData("state", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={profileData.pincode}
                    onChange={(e) => updateProfileData("pincode", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input
                    id="landmark"
                    value={profileData.landmark}
                    onChange={(e) => updateProfileData("landmark", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryRadius">Delivery Radius (km) *</Label>
                  <Input
                    id="deliveryRadius"
                    value={profileData.deliveryRadius}
                    onChange={(e) => updateProfileData("deliveryRadius", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="minOrderAmount">Minimum Order Amount (₹) *</Label>
                  <Input
                    id="minOrderAmount"
                    value={profileData.minOrderAmount}
                    onChange={(e) => updateProfileData("minOrderAmount", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryFee">Delivery Fee (₹) *</Label>
                  <Input
                    id="deliveryFee"
                    value={profileData.deliveryFee}
                    onChange={(e) => updateProfileData("deliveryFee", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="freeDeliveryAbove">Free Delivery Above (₹)</Label>
                  <Input
                    id="freeDeliveryAbove"
                    value={profileData.freeDeliveryAbove}
                    onChange={(e) => updateProfileData("freeDeliveryAbove", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedDeliveryTime">Estimated Delivery Time (mins) *</Label>
                  <Input
                    id="estimatedDeliveryTime"
                    value={profileData.estimatedDeliveryTime}
                    onChange={(e) => updateProfileData("estimatedDeliveryTime", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Timing Tab */}
            <TabsContent value="timing" className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Label>Store Status</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Closed</span>
                  <Switch
                    checked={profileData.isOpen}
                    onCheckedChange={(checked) => updateProfileData("isOpen", checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">Open</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Opening Hours</Label>
                {days.map((day) => (
                  <div key={day} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                    <div className="w-20 text-sm font-medium capitalize">{day}</div>
                    <Switch
                      checked={!profileData.openingHours[day].closed}
                      onCheckedChange={(checked) => 
                        updateNestedData("openingHours", day, {
                          ...profileData.openingHours[day],
                          closed: !checked
                        })
                      }
                      disabled={!isEditing}
                    />
                    {!profileData.openingHours[day].closed && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={profileData.openingHours[day].open}
                          onChange={(e) =>
                            updateNestedData("openingHours", day, {
                              ...profileData.openingHours[day],
                              open: e.target.value
                            })
                          }
                          disabled={!isEditing}
                          className="w-32"
                        />
                        <span className="text-sm">to</span>
                        <Input
                          type="time"
                          value={profileData.openingHours[day].close}
                          onChange={(e) =>
                            updateNestedData("openingHours", day, {
                              ...profileData.openingHours[day],
                              close: e.target.value
                            })
                          }
                          disabled={!isEditing}
                          className="w-32"
                        />
                      </div>
                    )}
                    {profileData.openingHours[day].closed && (
                      <span className="text-sm text-gray-500">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Banking Tab */}
            <TabsContent value="banking" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={profileData.bankName}
                    onChange={(e) => updateProfileData("bankName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    value={profileData.accountHolderName}
                    onChange={(e) => updateProfileData("accountHolderName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={profileData.accountNumber}
                    onChange={(e) => updateProfileData("accountNumber", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    value={profileData.ifscCode}
                    onChange={(e) => updateProfileData("ifscCode", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    value={profileData.upiId}
                    onChange={(e) => updateProfileData("upiId", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="p-4 space-y-4">
              {/* Show existing documents */}
              {profileData.businessName && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Show documents from API */}
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">Additional Documents ({documents.length})</h4>
                      <div className="space-y-2">
                        {documents.length > 0 ? (
                          documents.map((doc, index) => (
                            <div key={doc.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Document {index + 1}</span>
                              <a 
                                href={doc.document_url || doc.document} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm hover:underline"
                              >
                                View
                              </a>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-600">No additional documents uploaded</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Show shop images */}
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">Shop Images ({shopImages.length})</h4>
                      <div className="space-y-2">
                        {shopImages.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {shopImages.map((image, index) => (
                              <div key={image.id || index} className="relative">
                                <img 
                                  src={image.image_url || image.image} 
                                  alt={`Shop ${index + 1}`}
                                  className="w-full h-20 object-cover rounded border"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                {image.is_primary && (
                                  <Badge className="absolute top-1 left-1 text-xs">Primary</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">No shop images uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Business License */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-base font-medium">Business License</Label>
                      <p className="text-sm text-gray-600">Upload your business registration certificate</p>
                    </div>
                    <Badge variant={profileData.businessLicense ? "default" : "outline"}>
                      {profileData.businessLicense ? "Uploaded" : "Required"}
                    </Badge>
                  </div>
                  {profileData.businessLicense ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 p-2 bg-gray-50 rounded border text-sm">
                        Business License Document
                      </div>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf,.jpg,.jpeg,.png';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleDocumentUpload(file, 'business_license_file');
                            };
                            input.click();
                          }}
                          disabled={uploadingDocument === 'business_license_file'}
                        >
                          {uploadingDocument === 'business_license_file' ? 'Uploading...' : 'Replace'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.jpg,.jpeg,.png';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleDocumentUpload(file, 'business_license_file');
                        };
                        input.click();
                      }}
                      disabled={uploadingDocument === 'business_license_file'}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {uploadingDocument === 'business_license_file' ? 'Uploading...' : 'Upload Business License'}
                    </Button>
                  )}
                </div>

                {/* GST Certificate */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-base font-medium">GST Certificate</Label>
                      <p className="text-sm text-gray-600">Upload your GST registration certificate</p>
                    </div>
                    <Badge variant={profileData.gstCertificate ? "default" : "outline"}>
                      {profileData.gstCertificate ? "Uploaded" : "Optional"}
                    </Badge>
                  </div>
                  {profileData.gstCertificate ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 p-2 bg-gray-50 rounded border text-sm">
                        GST Certificate Document
                      </div>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf,.jpg,.jpeg,.png';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleDocumentUpload(file, 'gst_certificate');
                            };
                            input.click();
                          }}
                          disabled={uploadingDocument === 'gst_certificate'}
                        >
                          {uploadingDocument === 'gst_certificate' ? 'Uploading...' : 'Replace'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.jpg,.jpeg,.png';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleDocumentUpload(file, 'gst_certificate');
                        };
                        input.click();
                      }}
                      disabled={uploadingDocument === 'gst_certificate'}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {uploadingDocument === 'gst_certificate' ? 'Uploading...' : 'Upload GST Certificate'}
                    </Button>
                  )}
                </div>

                {/* FSSAI License */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-base font-medium">FSSAI License</Label>
                      <p className="text-sm text-gray-600">Upload your food safety license (for food businesses)</p>
                    </div>
                    <Badge variant={profileData.fssaiLicense ? "default" : "outline"}>
                      {profileData.fssaiLicense ? "Uploaded" : "Optional"}
                    </Badge>
                  </div>
                  {profileData.fssaiLicense ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 p-2 bg-gray-50 rounded border text-sm">
                        FSSAI License Document
                      </div>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf,.jpg,.jpeg,.png';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleDocumentUpload(file, 'fssai_license');
                            };
                            input.click();
                          }}
                          disabled={uploadingDocument === 'fssai_license'}
                        >
                          {uploadingDocument === 'fssai_license' ? 'Uploading...' : 'Replace'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.jpg,.jpeg,.png';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleDocumentUpload(file, 'fssai_license');
                        };
                        input.click();
                      }}
                      disabled={uploadingDocument === 'fssai_license'}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {uploadingDocument === 'fssai_license' ? 'Uploading...' : 'Upload FSSAI License'}
                    </Button>
                  )}
                </div>

                <div className="text-center py-2 text-gray-500 text-xs">
                  Supported formats: PDF, JPG, JPEG, PNG (Max 5MB)
                </div>
              </div>
            </TabsContent>

            {/* Debug Tab - Show raw API data */}
            <TabsContent value="debug" className="p-4 space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold">API Response Debug</h3>
                <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                  <pre className="text-xs">
                    {JSON.stringify({
                      documents: documents,
                      shopImages: shopImages,
                      categories: profileData.categories,
                      availableCategories: availableCategories
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="p-4 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <Label>Auto Accept Orders</Label>
                    <p className="text-sm text-gray-600">Automatically accept new orders</p>
                  </div>
                  <Switch
                    checked={profileData.autoAcceptOrders}
                    onCheckedChange={(checked) => updateProfileData("autoAcceptOrders", checked)}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Notification Settings</Label>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <Label>Order Alerts</Label>
                      <p className="text-sm text-gray-600">Get notified for new orders</p>
                    </div>
                    <Switch
                      checked={profileData.notificationSettings.orderAlerts}
                      onCheckedChange={(checked) => 
                        updateNestedData("notificationSettings", "orderAlerts", checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <Label>Message Alerts</Label>
                      <p className="text-sm text-gray-600">Get notified for new messages</p>
                    </div>
                    <Switch
                      checked={profileData.notificationSettings.messageAlerts}
                      onCheckedChange={(checked) => 
                        updateNestedData("notificationSettings", "messageAlerts", checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <Label>Promotional Emails</Label>
                      <p className="text-sm text-gray-600">Receive promotional emails</p>
                    </div>
                    <Switch
                      checked={profileData.notificationSettings.promotionalEmails}
                      onCheckedChange={(checked) => 
                        updateNestedData("notificationSettings", "promotionalEmails", checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* First Time Setup Progress */}
        {isFirstTime && (
          <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-gray-600">6/8 sections</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: "75%" }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-2">Complete all sections to activate your store</p>
          </div>
        )}
      </div>
    </VendorPage>
  );
};

export default VendorProfileManagement;