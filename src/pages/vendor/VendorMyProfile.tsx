import { useState, useEffect } from "react";
import { ArrowLeft, User, Store, MapPin, CreditCard, FileText, Camera, Save, Edit3, Upload, AlertCircle, Eye, X, Plus, Trash2, RefreshCw, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VendorPage } from "@/components/VendorLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';
import { useApp } from '@/contexts/AppContext';
import { RoleSwitcher } from '@/components/RoleSwitcher';

interface VendorData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  businessType: string;
  categories: string[];
  description: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  gstNumber: string;
  panNumber: string;
  businessLicense: File | null;
  gstCertificate: File | null;
  fssaiLicense: File | null;
  additionalDocs: File[];
  deliveryRadius: string;
  minOrderAmount: string;
  profileImage: string | null;
}

const VendorMyProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, state, login } = useApp();
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<{name: string, url: string} | null>(null);
  const [documentUploading, setDocumentUploading] = useState<string | null>(null);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [adminDeliveryRadius, setAdminDeliveryRadius] = useState<number | null>(null);

  const [vendorData, setVendorData] = useState<VendorData>({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    businessType: "",
    categories: [],
    description: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    gstNumber: "",
    panNumber: "",
    businessLicense: null,
    gstCertificate: null,
    fssaiLicense: null,
    additionalDocs: [],
    deliveryRadius: "",
    minOrderAmount: "",
    profileImage: null
  });

  useEffect(() => {
    fetchProfileData();
    fetchUserProfileData();
    fetchAdminDeliveryRadius();
  }, []);

  const fetchProfileData = async () => {
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

      // Fetch vendor profile
      const { response, data } = await apiRequest('/vendor-profiles/');

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      if (data && data.results && data.results.length > 0) {
        const profile = data.results[0];

        // Fetch documents for this vendor
        const { response: docsResponse, data: docsData } = await apiRequest('/vendor-documents/');

        let documents = [];
        if (docsResponse.ok && docsData) {
          documents = docsData.results || [];
        }

        setVendorData({
          businessName: profile.business_name || "",
          ownerName: profile.owner_name || "",
          email: profile.business_email || "",
          phone: profile.business_phone || "",
          address: profile.business_address || "",
          city: profile.city || "",
          state: profile.state || "",
          pincode: profile.pincode || "",
          businessType: profile.business_type || "",
          categories: profile.categories || [],
          description: profile.description || "",
          bankName: profile.bank_name || "",
          accountNumber: profile.account_number || "",
          ifscCode: profile.ifsc_code || "",
          accountHolderName: profile.account_holder_name || "",
          gstNumber: profile.gst_number || "",
          panNumber: profile.pan_number || "",
          businessLicense: profile.business_license_file ? { name: "Business License", url: profile.business_license_file } : null,
          gstCertificate: profile.gst_certificate ? { name: "GST Certificate", url: profile.gst_certificate } : null,
          fssaiLicense: profile.fssai_license ? { name: "FSSAI License", url: profile.fssai_license } : null,
          additionalDocs: documents.map(doc => ({ name: `Document ${doc.id}`, url: doc.document })),
          deliveryRadius: profile.delivery_radius?.toString() || "",
          minOrderAmount: profile.min_order_amount || "",
          profileImage: profile.user_info?.profile_picture || null // Use the URL directly
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfileData = async () => {
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

      // Fetch user profile data to get available_roles
      const { response, data } = await apiRequest('/profile/');

      if (response.ok && data) {
        // Update the user data in context with available_roles
        const updatedUser = {
          ...state.user!,
          available_roles: data.available_roles,
          current_role: data.current_role
        };

        // Update user data in context without changing the token
        // We need to dispatch the SET_USER action directly
        // But we can't call useApp() inside a function, so we'll skip this for now
        // The available_roles will be available when the user logs in again
        console.log('Updated user data:', updatedUser);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchAdminDeliveryRadius = async () => {
    try {
      const response = await fetch('/api/delivery-radius/');
      const data = await response.json();
      if (response.ok) {
        setAdminDeliveryRadius(data.delivery_radius);
      }
    } catch (error) {
      console.error("Error fetching admin delivery radius:", error);
    }
  };



  const businessTypes = [
    { value: "retailer", label: "Retailer" },
    { value: "wholesaler", label: "Wholesaler" },
    { value: "manufacturer", label: "Manufacturer" },
    { value: "service_provider", label: "Service Provider" },
    { value: "grocery", label: "Grocery Store" },
    { value: "restaurant", label: "Restaurant" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "electronics", label: "Electronics" },
    { value: "clothing", label: "Clothing" },
    { value: "bakery", label: "Bakery" },
  ];

  const availableCategories = [
    "Electronics",
    "Fashion",
    "Food",
    "Home",
    "Books",
    "Sports",
    "Beauty",
    "Toys",
    "Jewelry",
    "Furniture",
    "Automotive",
    "Health & Wellness",
    "Pet Supplies",
    "Stationery",
    "Garden & Outdoor",
    "Kids & Baby",
    "Appliances",
    "Hardware",
    "Crafts & Hobbies",
    "Travel & Luggage",
  ];

  const updateVendorData = (field: string, value: any) => {
    setVendorData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category: string) => {
    const categories = vendorData.categories.includes(category)
      ? vendorData.categories.filter((c) => c !== category)
      : [...vendorData.categories, category];
    updateVendorData("categories", categories);
  };


  const handleProfileImageUpload = async (file: File) => {
  if (!file) return;
  
  try {
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) return;
    
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    // Update user profile picture using new endpoint
    const { response, data: result } = await apiRequest('/api/profile/upload-picture/', {
      method: "POST",
      body: formData,
    });
    
    if (response.ok && result) {
      console.log('Upload result:', result);
      console.log('Profile picture URL:', result.profile_picture);
      
      // Update local state with the API-provided URL
      setVendorData(prev => ({
        ...prev,
        profileImage: result.profile_picture || null // Use the URL directly
      }));
      
      toast({
        title: "Success",
        description: "Profile image updated successfully!",
      });
      
      // Force refresh after a short delay
      setTimeout(() => {
        fetchProfileData();
      }, 500);
    } else {
      const errorData = await response.json();
      console.error('Profile image upload error:', errorData);
      throw new Error("Profile image upload failed");
    }
  } catch (error) {
    console.error('Profile image upload error:', error);
    toast({
      title: "Error",
      description: "Failed to upload profile image. Please try again.",
      variant: "destructive",
    });
  }
};

  const handleFileUpload = async (field: string, file: File, customName?: string) => {
    if (!file) return;
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload only PDF, JPG, JPEG, or PNG files.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    setDocumentUploading(field);
    
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) return;
      
      const formData = new FormData();
      formData.append(field, file);
      formData.append('business_name', vendorData.businessName);
      formData.append('business_email', vendorData.email);
      formData.append('business_phone', vendorData.phone);
      formData.append('business_address', vendorData.address);
      formData.append('city', vendorData.city);
      formData.append('state', vendorData.state);
      formData.append('pincode', vendorData.pincode);
      formData.append('business_type', vendorData.businessType);
      
      // Get profile ID first
      const { response: profileResponse, data: profileData } = await apiRequest('/vendor-profiles/');
      
      if (!profileResponse.ok) {
        throw new Error("Failed to get profile");
      }
      const profileId = profileData.results[0]?.id;
      
      if (!profileId) {
        throw new Error("Profile not found");
      }
      
      const { response, data: result } = await apiRequest(`/vendor-profiles/${profileId}/`, {
        method: 'PATCH',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      // Update local state based on field
      if (field === 'business_license_file') {
        updateVendorData('businessLicense', { name: 'Business License', url: result.business_license_file_url });
      } else if (field === 'gst_certificate') {
        updateVendorData('gstCertificate', { name: 'GST Certificate', url: result.gst_certificate_url });
      } else if (field === 'fssai_license') {
        updateVendorData('fssaiLicense', { name: 'FSSAI License', url: result.fssai_license_url });
      }
      
      toast({
        title: "Success",
        description: "Document uploaded successfully!",
      });
      
      if (field === 'additionalDocs') {
        setShowAddDocument(false);
        setNewDocumentName("");
        fetchProfileData(); // Refresh to get updated documents
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDocumentUploading(null);
    }
  };
  

  
  const DocumentUploadSection = ({ 
    title, 
    docType, 
    document, 
    onUpload 
  }: { 
    title: string;
    docType: string;
    document: any;
    onUpload: (file: File) => void;
  }) => {
    return (
      <div>
        <Label>{title}</Label>
        <div className="mt-2 p-4 border border-gray-300 rounded-lg bg-gray-50">
          <FileText className="h-6 w-6 mx-auto mb-2 text-gray-500" />
          {document ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-green-600">✓ Uploaded</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={document.url}
                      className="w-full h-full border-0"
                      title={title}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Not uploaded</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-blue-600 hover:text-blue-700"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.jpg,.jpeg,.png';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) onUpload(file);
                  };
                  input.click();
                }}
                disabled={documentUploading === docType}
              >
                {documentUploading === docType ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 mr-1" />
                )}
                Upload
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };



  const handleSave = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) return;

      const updateData = {
        business_name: vendorData.businessName,
        owner_name: vendorData.ownerName,
        business_email: vendorData.email,
        business_phone: vendorData.phone,
        business_address: vendorData.address,
        city: vendorData.city,
        state: vendorData.state,
        pincode: vendorData.pincode,
        business_type: vendorData.businessType,
        categories: vendorData.categories,
        description: vendorData.description,
        bank_name: vendorData.bankName,
        account_number: vendorData.accountNumber,
        account_holder_name: vendorData.accountHolderName,
        gst_number: vendorData.gstNumber,
        pan_number: vendorData.panNumber,
        delivery_radius: vendorData.deliveryRadius ? parseFloat(vendorData.deliveryRadius) : null,
        min_order_amount: vendorData.minOrderAmount
      };

      // First get the profile ID
      const { response, data } = await apiRequest('/vendor-profiles/');

      if (response.ok && data) {
        if (data.results && data.results.length > 0) {
          const profileId = data.results[0].id;
          
          // Update the profile
          const { response: updateResponse } = await apiRequest(`/vendor-profiles/${profileId}/`, {
            method: "PUT",
            body: JSON.stringify(updateData),
          });

          if (updateResponse.ok) {
            setIsEditing(false);
            toast({
              title: "Success",
              description: "Profile updated successfully!",
              variant: "default",
            });
            fetchProfileData(); // Refresh the data
          } else {
            const errorData = await updateResponse.json();
            console.error("Update error:", errorData);
            throw new Error("Failed to update profile");
          }
        }
      } else {
        throw new Error("Failed to fetch profile for update");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const token = await authService.getToken();
      if (token) {
        await apiRequest('/logout/', {
          method: "POST"
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      await logout();
      navigate("/vendor/login");
    }
  };

  const tabsConfig = [
    { id: "personal", label: "Personal", icon: User },
    { id: "business", label: "Business", icon: Store },
    { id: "address", label: "Address", icon: MapPin },
    { id: "banking", label: "Banking", icon: CreditCard },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  if (loading) {
    return (
      <VendorPage title="My Profile">
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
      <VendorPage title="My Profile">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProfileData}>Retry</Button>
          </div>
        </div>
      </VendorPage>
    );
  }

  return (
    <VendorPage title="My Profile">
      <div className="min-h-screen bg-gray-50">
        {/* Profile Header */}
        <div className="bg-white border-b border-gray-100 fixed top-14 sm:top-16 left-0 right-0 z-30">
          <div className="flex items-center justify-between p-3 mx-4">
            <div className="flex items-center gap-3">
            <div className="relative">
              <div 
                className={`w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg overflow-hidden ${isEditing ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                onClick={isEditing ? () => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleProfileImageUpload(file);
                  };
                  input.click();
                } : undefined}
              >
                {vendorData.profileImage ? (
                  <img 
                    src={vendorData.profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-semibold">
                    {vendorData.businessName ? vendorData.businessName.charAt(0).toUpperCase() : 'V'}
                  </span>
                )}
              </div>
              {isEditing && (
                <Button 
                  size="sm" 
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full p-0 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleProfileImageUpload(file);
                    };
                    input.click();
                  }}
                >
                  <Camera className="h-2.5 w-2.5" />
                </Button>
              )}
            </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-base truncate">{vendorData.businessName || 'Business Name'}</h2>
                <p className="text-gray-500 text-sm truncate">{vendorData.ownerName || 'Owner Name'}</p>
              </div>
            </div>
            <Button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {isEditing ? (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </>
              ) : (
                <>
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white pt-16">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="grid grid-cols-5 w-full">
                {tabsConfig.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 text-xs">
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Personal Info Tab */}
            <TabsContent value="personal" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Full Name *</Label>
                  <Input
                    id="ownerName"
                    value={vendorData.ownerName}
                    onChange={(e) => updateVendorData("ownerName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={vendorData.email}
                    onChange={(e) => updateVendorData("email", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={vendorData.phone}
                    onChange={(e) => updateVendorData("phone", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Business Tab */}
            <TabsContent value="business" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={vendorData.businessName}
                    onChange={(e) => updateVendorData("businessName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select
                    value={vendorData.businessType}
                    onValueChange={(value) => updateVendorData("businessType", value)}
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
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={vendorData.gstNumber}
                    onChange={(e) => updateVendorData("gstNumber", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={vendorData.panNumber}
                    onChange={(e) => updateVendorData("panNumber", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                  <Input
                    id="deliveryRadius"
                    value={adminDeliveryRadius ? `${adminDeliveryRadius} (Set by Admin)` : vendorData.deliveryRadius}
                    disabled={true}
                    className="bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Delivery radius is set by the administrator</p>
                </div>
                <div>
                  <Label htmlFor="minOrderAmount">Min Order Amount (₹)</Label>
                  <Input
                    id="minOrderAmount"
                    value={vendorData.minOrderAmount}
                    onChange={(e) => updateVendorData("minOrderAmount", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Product Categories</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      disabled={!isEditing}
                      className={`p-2 text-sm rounded-lg border text-left ${
                        vendorData.categories.includes(category)
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:border-gray-300"
                      } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={vendorData.description}
                  onChange={(e) => updateVendorData("description", e.target.value)}
                  rows={3}
                  disabled={!isEditing}
                />
              </div>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="address" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Textarea
                    id="address"
                    value={vendorData.address}
                    onChange={(e) => updateVendorData("address", e.target.value)}
                    disabled={!isEditing}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={vendorData.city}
                    onChange={(e) => updateVendorData("city", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={vendorData.state}
                    onChange={(e) => updateVendorData("state", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={vendorData.pincode}
                    onChange={(e) => updateVendorData("pincode", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Banking Tab */}
            <TabsContent value="banking" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={vendorData.bankName}
                    onChange={(e) => updateVendorData("bankName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    value={vendorData.accountHolderName}
                    onChange={(e) => updateVendorData("accountHolderName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={vendorData.accountNumber}
                    onChange={(e) => updateVendorData("accountNumber", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    value={vendorData.ifscCode}
                    onChange={(e) => updateVendorData("ifscCode", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="p-4 space-y-4">
              <div className="space-y-4">
                {/* Required Documents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentUploadSection
                    title="Business License"
                    docType="business_license_file"
                    document={vendorData.businessLicense}
                    onUpload={(file) => handleFileUpload('business_license_file', file)}
                  />
                  <DocumentUploadSection
                    title="GST Certificate"
                    docType="gst_certificate"
                    document={vendorData.gstCertificate}
                    onUpload={(file) => handleFileUpload('gst_certificate', file)}
                  />
                  <DocumentUploadSection
                    title="FSSAI License"
                    docType="fssai_license"
                    document={vendorData.fssaiLicense}
                    onUpload={(file) => handleFileUpload('fssai_license', file)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Additional Documents</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-green-600 hover:text-green-700"
                      onClick={() => setShowAddDocument(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Document
                    </Button>
                  </div>
                  
                  {showAddDocument && (
                    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="docName">Document Name</Label>
                          <Input
                            id="docName"
                            value={newDocumentName}
                            onChange={(e) => setNewDocumentName(e.target.value)}
                            placeholder="Enter document name"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShowAddDocument(false);
                              setNewDocumentName("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              if (!newDocumentName.trim()) {
                                toast({
                                  title: "Error",
                                  description: "Please enter a document name",
                                  variant: "destructive",
                                });
                                return;
                              }
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.pdf,.jpg,.jpeg,.png';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleFileUpload('additionalDocs', file, newDocumentName);
                              };
                              input.click();
                            }}
                            disabled={documentUploading === 'additionalDocs'}
                          >
                            {documentUploading === 'additionalDocs' ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3 mr-1" />
                            )}
                            Upload Document
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {vendorData.additionalDocs.length > 0 ? (
                    <div className="space-y-2">
                      {vendorData.additionalDocs.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{doc.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl w-full h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>{doc.name}</DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 overflow-hidden">
                                  <iframe
                                    src={doc.url}
                                    className="w-full h-full border-0"
                                    title={doc.name}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>

                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No additional documents uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Role Switcher */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <RoleSwitcher />
        </div>

        {/* Logout Button */}
        <div className="p-4 pb-20">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center py-6 bg-red-50/40 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span className="font-medium text-base">Logout</span>
          </Button>
        </div>
      </div>
    </VendorPage>
  );
};

export default VendorMyProfile;