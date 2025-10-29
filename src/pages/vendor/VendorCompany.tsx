import { useState, useEffect } from "react";

import { ArrowLeft, Store, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorPage } from "@/components/VendorLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';

interface OperatingHours {
  open: string;
  close: string;
  closed: boolean;
}

interface DeliverySettings {
  deliveryRadius: string;
  minOrderAmount: string;
}

interface CompanyData {
  businessName: string;
  ownerName: string;
  categories: string[];
  operatingHours: {
    monday: OperatingHours;
    tuesday: OperatingHours;
    wednesday: OperatingHours;
    thursday: OperatingHours;
    friday: OperatingHours;
    saturday: OperatingHours;
    sunday: OperatingHours;
  };
  deliverySettings: DeliverySettings;
  profileImage: string | null;
  isActive: boolean;
  statusOverride: boolean;
}

const VendorCompany = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("business");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileId, setProfileId] = useState<number | null>(null);

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData>({
    businessName: "Business Name",
    ownerName: "Owner Name",
    categories: [],
    operatingHours: {
      monday: { open: "06:00", close: "21:00", closed: false },
      tuesday: { open: "06:00", close: "21:00", closed: false },
      wednesday: { open: "06:00", close: "21:00", closed: false },
      thursday: { open: "06:00", close: "21:00", closed: false },
      friday: { open: "06:00", close: "21:00", closed: false },
      saturday: { open: "06:00", close: "21:00", closed: false },
      sunday: { open: "07:00", close: "20:00", closed: false },
    },
    deliverySettings: {
      deliveryRadius: "5",
      minOrderAmount: "200",
    },
    profileImage: null,
    isActive: false,
    statusOverride: false,
  });

  // Convert 24-hour time to AM/PM format
  const toAmPm = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  useEffect(() => {
    fetchCompanyData();
    fetchAvailableCategories();
  }, []);

  const fetchAvailableCategories = async () => {
    try {
      const { response, data } = await apiRequest('/categories/');
      if (response.ok && data.categories) {
        setAvailableCategories(data.categories.map((cat: any) => cat.name));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCompanyData = async () => {
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

      const { response, data } = await apiRequest('/vendor-profiles/');

      if (!response.ok) {
        throw new Error("Failed to fetch company data");
      }
      if (data.results && data.results.length > 0) {
        const profile = data.results[0];
        setProfileId(profile.id);
        setCompanyData({
          businessName: profile.business_name || "Business Name",
          ownerName: profile.owner_name || "Owner Name",
          categories: Array.isArray(profile.categories) ? profile.categories : 
                     (typeof profile.categories === 'string' ? JSON.parse(profile.categories || '[]') : []),
          operatingHours: {
            monday: {
              open: profile.monday_open || "",
              close: profile.monday_close || "",
              closed: profile.monday_closed || false,
            },
            tuesday: {
              open: profile.tuesday_open || "",
              close: profile.tuesday_close || "",
              closed: profile.tuesday_closed || false,
            },
            wednesday: {
              open: profile.wednesday_open || "",
              close: profile.wednesday_close || "",
              closed: profile.wednesday_closed || false,
            },
            thursday: {
              open: profile.thursday_open || "",
              close: profile.thursday_close || "",
              closed: profile.thursday_closed || false,
            },
            friday: {
              open: profile.friday_open || "",
              close: profile.friday_close || "",
              closed: profile.friday_closed || false,
            },
            saturday: {
              open: profile.saturday_open || "",
              close: profile.saturday_close || "",
              closed: profile.saturday_closed || false,
            },
            sunday: {
              open: profile.sunday_open || "",
              close: profile.sunday_close || "",
              closed: profile.sunday_closed || false,
            },
          },
          deliverySettings: {
            deliveryRadius: profile.delivery_radius?.toString() || "5",
            minOrderAmount: profile.min_order_amount?.toString() || "200",
          },
          profileImage: profile.user_info?.profile_picture || null,
          isActive: profile.is_active || false,
          statusOverride: profile.status_override || false,
        });
      }
    } catch (err) {
      console.error("Error fetching company data:", err);
      setError("Failed to load company data");
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyData = async () => {
    try {
      setSaving(true);
      // Check persistent authentication
      const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
      const isVendorLoggedIn = await simplePersistentAuth.isVendorLoggedIn();
      
      if (!isVendorLoggedIn) {
        navigate("/vendor/login");
        return;
      }

      if (!profileId) {
        throw new Error("Profile ID not found");
      }

      const formData = new FormData();
      formData.append('business_name', companyData.businessName);
      formData.append('owner_name', companyData.ownerName);
      formData.append('categories', JSON.stringify(companyData.categories));
      formData.append('delivery_radius', companyData.deliverySettings.deliveryRadius);
      formData.append('min_order_amount', companyData.deliverySettings.minOrderAmount);

      const { response } = await apiRequest(`/vendor-profiles/${profileId}/`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update company data");
      }

      toast({
        title: "Success",
        description: "Company information updated successfully!",
      });

      setIsEditing(false);
      fetchCompanyData();
    } catch (err) {
      console.error("Error saving company data:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save company data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    try {
      // Check persistent authentication
      const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
      const isVendorLoggedIn = await simplePersistentAuth.isVendorLoggedIn();
      
      if (!isVendorLoggedIn) {
        navigate("/vendor/login");
        return;
      }

      if (!profileId) {
        throw new Error("Profile ID not found");
      }

      const newStatus = !companyData.isActive;
      const { response, data } = await apiRequest(`/vendor-profiles/${profileId}/toggle-status/`, {
        method: "POST",
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) {
        throw new Error(data?.error || "Failed to toggle status");
      }
      setCompanyData((prev) => ({
        ...prev,
        isActive: data.vendor.is_active,
        statusOverride: data.vendor.status_override,
      }));

      toast({
        title: "Success",
        description: `Status set to ${newStatus ? "Active" : "Inactive"}`,
      });
    } catch (err) {
      console.error("Error toggling status:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to toggle status",
        variant: "destructive",
      });
    }
  };



  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const tabsConfig = [
    { id: "business", label: "Business Details", icon: Store },
    { id: "timing", label: "Timing", icon: Clock },
  ];

  const updateCompanyData = (field: string, value: any) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNestedData = (parent: string, field: string, value: any) => {
    setCompanyData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent as keyof CompanyData], [field]: value },
    }));
  };

  if (loading) {
    return (
      <VendorPage title="Company Information">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading company information...</p>
          </div>
        </div>
      </VendorPage>
    );
  }

  if (error) {
    return (
      <VendorPage title="Company Information">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchCompanyData}>Retry</Button>
          </div>
        </div>
      </VendorPage>
    );
  }

  return (
    <VendorPage title="Company Information">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="p-2" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg">Company Information</h1>
              </div>
            </div>
            <Button
              onClick={() => (isEditing ? saveCompanyData() : setIsEditing(true))}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Edit"}
            </Button>
          </div>
        </div>

        {/* Company Header with Status */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative">
              {companyData.profileImage ? (
                <img
                  src={companyData.profileImage || "/images/default-profile.png"}
                  alt="Business Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    console.error("Image failed to load:", e.currentTarget.src);
                    e.currentTarget.src = "/images/default-profile.png";
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl border-2 border-gray-200">
                  🏪
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{companyData.businessName}</h2>
              <p className="text-gray-600 text-sm">{companyData.ownerName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Label>Status:</Label>
                <Switch
                  checked={companyData.isActive}
                  onCheckedChange={toggleStatus}
                  disabled={!isEditing}
                />
                <span className="text-sm">
                  {companyData.isActive ? "Active" : "Inactive"}
                  {companyData.statusOverride && " (Overridden)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="grid grid-cols-2 w-full min-w-max">
                {tabsConfig.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 text-xs">
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Business Details Tab */}
            <TabsContent value="business" className="p-4 space-y-6">
              <div className="space-y-4 max-w-3xl">
                <Label>Business Categories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={companyData.categories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (!isEditing) return;
                        const newCategories = companyData.categories.includes(category)
                          ? companyData.categories.filter((c) => c !== category)
                          : [...companyData.categories, category];
                        updateCompanyData("categories", newCategories);
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <div>
                  <Label>Delivery Radius (km) *</Label>
                  <Input
                    value={companyData.deliverySettings.deliveryRadius}
                    onChange={(e) => updateNestedData("deliverySettings", "deliveryRadius", e.target.value)}
                    disabled={!isEditing}
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <Label>Minimum Order Amount (Rs) *</Label>
                  <Input
                    value={companyData.deliverySettings.minOrderAmount}
                    onChange={(e) => updateNestedData("deliverySettings", "minOrderAmount", e.target.value)}
                    disabled={!isEditing}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Timing Tab */}
            <TabsContent value="timing" className="p-4 space-y-4">
              <div className="space-y-3 max-w-3xl">
                <Label>Operating Hours</Label>
                {days.map((day) => (
                  <div
                    key={day}
                    className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg flex-wrap"
                  >
                    <div className="w-20 text-sm font-medium capitalize">{day}</div>
                    <Switch
                      checked={!companyData.operatingHours[day].closed}
                      onCheckedChange={(checked) =>
                        updateNestedData("operatingHours", day, {
                          ...companyData.operatingHours[day],
                          closed: !checked,
                        })
                      }
                      disabled={!isEditing}
                    />
                    {!companyData.operatingHours[day].closed && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input
                          type="time"
                          value={toAmPm(companyData.operatingHours[day].open)}
                          onChange={(e) =>
                            updateNestedData("operatingHours", day, {
                              ...companyData.operatingHours[day],
                              open: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                          className="w-32"
                        />
                        <span className="text-sm">to</span>
                        <Input
                          type="time"
                          value={toAmPm(companyData.operatingHours[day].close)}
                          onChange={(e) =>
                            updateNestedData("operatingHours", day, {
                              ...companyData.operatingHours[day],
                              close: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                          className="w-32"
                        />
                      </div>
                    )}
                    {companyData.operatingHours[day].closed && (
                      <span className="text-sm text-gray-500">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </VendorPage>
  );
};

export default VendorCompany;