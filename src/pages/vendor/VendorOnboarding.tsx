import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "@/assets/leaflet.css";
import { API_BASE } from '@/config/api';

const customMarkerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #ff0000; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const isUpdate = location.state?.isUpdate;
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    location: { lat: 27.7172, lng: 85.3240, address: "" },
    shopName: "",
    ownerName: "",
    phone: "",
    email: "",
    shopAddress: "",
    city: "",
    state: "",
    pincode: "",
    shopRegDoc: null,
    citizenshipFront: null,
    citizenshipBack: null,
    shopImages: [],
    existingDocuments: { panReg: null, citizenshipFront: null, citizenshipBack: null },
    existingShopImages: [],
    bankAccount: "",
    accountHolderName: "",
    bankName: "",
    ifscCode: "",
    gstNumber: "",
    panNumber: "",
    deliveryRadius: "",
    minOrderAmount: "",
    vendorType: "",
    categories: [],
    description: "",
  });
  const [locationError, setLocationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [categories, setCategories] = useState([]);

  const steps = [
    "Location",
    "Shop Info",
    "Address",
    "Documents",
    "Shop Images",
    "Payment",
    "Business Type",
    "Categories",
    "Review",
  ];

  const vendorTypes = [
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

  // Fetch categories and existing profile data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_BASE + "categories/");
        const data = await response.json();
        if (response.ok) {
          setCategories(data.categories.map(cat => cat.name));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    
    const fetchExistingProfile = async () => {
      if (isUpdate) {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(API_BASE + "vendor-profiles/", {
            headers: { Authorization: `Token ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            // The API returns paginated results, get the first profile from results
            const profile = data.results && data.results.length > 0 ? data.results[0] : null;
            if (profile) {
              setFormData(prev => ({
                ...prev,
                shopName: profile.business_name || "",
                ownerName: profile.owner_name || "",
                phone: profile.business_phone || "",
                email: profile.business_email || "",
                shopAddress: profile.business_address || "",
                city: profile.city || "",
                state: profile.state || "",
                pincode: profile.pincode || "",
                panNumber: profile.pan_number || "",
                gstNumber: profile.gst_number || "",
                bankAccount: profile.account_number || "",
                accountHolderName: profile.account_holder_name || "",
                bankName: profile.bank_name || "",
                ifscCode: profile.ifsc_code || "",
                deliveryRadius: profile.delivery_radius || "",
                minOrderAmount: profile.min_order_amount || "",
                vendorType: profile.business_type || "",
                categories: profile.categories || [],
                description: profile.description || "",
                location: {
                  lat: profile.latitude || 27.7172,
                  lng: profile.longitude || 85.3240,
                  address: profile.location_address || ""
                },
                existingDocuments: {
                  panReg: profile.business_license_file_url || null,
                  citizenshipFront: profile.documents?.find(d => d.document_url?.includes('citizenship_front'))?.document_url || null,
                  citizenshipBack: profile.documents?.find(d => d.document_url?.includes('citizenship_back'))?.document_url || null
                },
                existingShopImages: profile.shop_images || []
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };
    
    fetchCategories();
    fetchExistingProfile();
  }, [isUpdate]);

  const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    map.setView([lat, lng], 13);
    return null;
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setFormData((prev) => ({
          ...prev,
          location: { ...prev.location, lat, lng },
        }));
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then((response) => response.json())
          .then((data) => {
            if (data.display_name) {
              setFormData((prev) => ({
                ...prev,
                location: { ...prev.location, address: data.display_name },
              }));
            }
          })
          .catch((error) => console.error("Error fetching address:", error));
      },
    });
    return null;
  };

  const handleUseLiveLocation = () => {
    setLocationError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData((prev) => ({
            ...prev,
            location: { ...prev.location, lat: latitude, lng: longitude },
          }));
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.display_name) {
                setFormData((prev) => ({
                  ...prev,
                  location: { ...prev.location, address: data.display_name },
                }));
              }
            })
            .catch((error) => {
              console.error("Error fetching address:", error);
              setLocationError("Unable to fetch address for this location.");
            });
        },
        (error) => {
          console.error("Geolocation error:", error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError("Location access denied. Please allow location permissions.");
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              setLocationError("The request to get your location timed out.");
              break;
            default:
              setLocationError("An unknown error occurred while fetching your location.");
              break;
          }
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  };

  const validateForm = () => {
    const requiredFields = [
      { field: 'shopName', label: 'Shop Name' },
      { field: 'ownerName', label: 'Owner Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'panNumber', label: 'PAN Number' },
      { field: 'shopAddress', label: 'Shop Address' },
      { field: 'city', label: 'City' },
      { field: 'state', label: 'State' },
      { field: 'pincode', label: 'PIN Code' },
      { field: 'vendorType', label: 'Business Type' },
    ];
    for (const { field, label } of requiredFields) {
      if (!formData[field]) {
        setErrorMessage(`${label} is required.`);
        return false;
      }
    }
    if (!formData.location.address) {
      setErrorMessage('Location address is required.');
      return false;
    }
    const totalImages = formData.shopImages.length + (isUpdate ? formData.existingShopImages.length : 0);
    if (totalImages < 4) {
      setErrorMessage('Please ensure you have at least 4 shop images total.');
      return false;
    }
    // Final PAN validation
    if (formData.panNumber.length !== 9) {
      setErrorMessage('PAN number must be exactly 9 characters.');
      return false;
    }
    return true;
  };

  const validateCurrentStep = () => {
    setErrorMessage("");
    
    switch (currentStep) {
      case 0: // Location
        if (!formData.location.address) {
          setErrorMessage('Please select a location.');
          return false;
        }
        break;
      case 1: // Shop Info
        if (!formData.shopName || !formData.ownerName || !formData.phone || !formData.email || !formData.panNumber) {
          setErrorMessage('Please fill in all required shop information including PAN number.');
          return false;
        }
        if (formData.panNumber.length !== 9) {
          setErrorMessage('PAN number must be exactly 9 characters.');
          return false;
        }
        break;
      case 2: // Address
        if (!formData.shopAddress || !formData.city || !formData.state || !formData.pincode) {
          setErrorMessage('Please fill in all address fields.');
          return false;
        }
        break;
      case 4: // Shop Images
        const totalImages = formData.shopImages.length + (isUpdate ? formData.existingShopImages.length : 0);
        if (totalImages < 4) {
          setErrorMessage('Please ensure you have at least 4 shop images total.');
          return false;
        }
        break;
      case 6: // Business Type
        if (!formData.vendorType) {
          setErrorMessage('Please select a business type.');
          return false;
        }
        break;
      case 7: // Categories
        if (formData.categories.length === 0) {
          setErrorMessage('Please select at least one category.');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      if (validateCurrentStep()) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      console.log("Starting form submission...");
      if (!validateForm()) {
        console.log("Validation failed:", errorMessage);
        return;
      }
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const formDataToSend = new FormData();
      formDataToSend.append("business_name", formData.shopName);
      formDataToSend.append("owner_name", formData.ownerName);
      formDataToSend.append("business_email", formData.email);
      formDataToSend.append("business_phone", formData.phone);
      formDataToSend.append("business_address", formData.shopAddress);
      formDataToSend.append("location_address", formData.location.address);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("pincode", formData.pincode);
      formDataToSend.append("latitude", formData.location.lat.toString());
      formDataToSend.append("longitude", formData.location.lng.toString());
      formDataToSend.append("business_type", formData.vendorType);
      formDataToSend.append("categories", JSON.stringify(formData.categories));
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("account_number", formData.bankAccount || "");
      formDataToSend.append("account_holder_name", formData.accountHolderName || "");
      formDataToSend.append("bank_name", formData.bankName || "");
      formDataToSend.append("ifsc_code", formData.ifscCode || "");
      formDataToSend.append("gst_number", formData.gstNumber || "");
      formDataToSend.append("pan_number", formData.panNumber || "");
      formDataToSend.append("delivery_radius", formData.deliveryRadius || "");
      formDataToSend.append("min_order_amount", formData.minOrderAmount || "");
      
      // Only add documents if new ones are uploaded
      if (formData.shopRegDoc) {
        formDataToSend.append("business_license_file", formData.shopRegDoc);
      }
      if (formData.citizenshipFront) {
        formDataToSend.append("citizenship_front", formData.citizenshipFront);
      }
      if (formData.citizenshipBack) {
        formDataToSend.append("citizenship_back", formData.citizenshipBack);
      }
      
      // Only add new shop images
      if (formData.shopImages.length > 0) {
        formData.shopImages.forEach((image, index) => {
          formDataToSend.append(`shop_image_${index}`, image);
        });
      }

      try {
        const token = localStorage.getItem("token");
        console.log(isUpdate ? "Updating vendor profile..." : "Submitting complete vendor onboarding...");
        const endpoint = isUpdate ? "complete-onboarding/" : "complete-onboarding/";
        const response = await fetch(API_BASE + endpoint, {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
          body: formDataToSend,
        });
        const data = await response.json();
        console.log("Complete onboarding response:", response.status, data);
        if (!response.ok) {
          // Extract detailed error messages
          let errorMsg = "Failed to submit vendor application.";
          if (data.detail) {
            errorMsg = data.detail;
          } else if (data.error) {
            errorMsg = data.error;
          } else if (data.user) {
            errorMsg = data.user;
          } else if (typeof data === 'object') {
            // Handle field-specific errors
            const errors = Object.entries(data).map(([field, message]) => {
              return `${field}: ${Array.isArray(message) ? message.join(', ') : message}`;
            }).join('; ');
            if (errors) errorMsg = errors;
          }
          setErrorMessage(errorMsg);
          console.error("Complete onboarding failed:", data);
          return;
        }
        console.log(isUpdate ? "Vendor profile updated successfully" : "Vendor onboarding completed successfully");

        // Check approval status
        if (data.is_approved) {
          setSuccessMessage(isUpdate ? "Profile updated and approved successfully!" : "Vendor profile submitted and approved successfully!");
          console.log("Vendor approved. Navigating to dashboard...");
          setTimeout(() => {
            navigate("/vendor/dashboard");
          }, 3000);
        } else {
          setSuccessMessage(isUpdate ? "Your profile has been updated successfully and is pending approval. You will be notified once approved by the admin." : "Your vendor application has been submitted successfully and is pending approval. You will be notified once approved by the admin.");
          console.log("Vendor not approved yet. Redirecting to login page.");
          setTimeout(() => {
            navigate("/vendor/login", { 
              state: { 
                successMessage: isUpdate ? "Profile updated successfully! Pending admin approval." : "Application submitted successfully! Pending admin approval." 
              } 
            });
          }, 3000);
        }
      } catch (error) {
        console.error("Submission error:", error);
        setErrorMessage("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category) => {
    const categories = formData.categories.includes(category)
      ? formData.categories.filter((c) => c !== category)
      : [...formData.categories, category];
    updateFormData("categories", categories);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isUpdate ? "Update Your Application" : "Complete Your Setup"}
          </h1>
          <p className="text-gray-600 text-sm mt-2">Step {currentStep + 1} of {steps.length}</p>
          {isUpdate && (
            <p className="text-orange-600 text-sm mt-1">
              Update your information and resubmit for approval
            </p>
          )}
        </div>
        <div className="flex overflow-x-auto mb-8 pb-2">
          {steps.map((step, index) => (
            <button
              key={step}
              onClick={() => setCurrentStep(index)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-medium whitespace-nowrap ${
                index === currentStep
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : index < currentStep
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {index < currentStep ? "✓" : index + 1}. {step}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          {loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-600">Submitting your application...</p>
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{successMessage}</p>
            </div>
          )}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Choose Your Location</h2>
              <div className="h-48 rounded-lg">
                <MapContainer
                  center={[formData.location.lat, formData.location.lng]}
                  zoom={13}
                  style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker
                    position={[formData.location.lat, formData.location.lng]}
                    icon={customMarkerIcon}
                  />
                  <MapClickHandler />
                  <RecenterMap lat={formData.location.lat} lng={formData.location.lng} />
                </MapContainer>
              </div>
              <Button
                onClick={handleUseLiveLocation}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Use Live Location
              </Button>
              {locationError && (
                <p className="text-red-500 text-sm">{locationError}</p>
              )}
              <Input
                placeholder="Selected address will appear here"
                value={formData.location.address}
                onChange={(e) => updateFormData("location", { ...formData.location, address: e.target.value })}
              />
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Shop Information</h2>
              <Input
                placeholder="Shop Name"
                value={formData.shopName}
                onChange={(e) => updateFormData("shopName", e.target.value)}
              />
              <Input
                placeholder="Owner Name"
                value={formData.ownerName}
                onChange={(e) => updateFormData("ownerName", e.target.value)}
              />
              <Input
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
              />
              <Input
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
              />
              <Input
                placeholder="PAN Number *"
                value={formData.panNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 9) {
                    updateFormData("panNumber", value);
                  }
                }}
                maxLength={9}
                required
              />
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Shop Address</h2>
              <Input
                placeholder="Full Shop Address"
                value={formData.shopAddress}
                onChange={(e) => updateFormData("shopAddress", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                />
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => updateFormData("state", e.target.value)}
                />
              </div>
              <Input
                placeholder="PIN Code"
                value={formData.pincode}
                onChange={(e) => updateFormData("pincode", e.target.value)}
              />
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Upload Documents</h2>
              <div className="space-y-4">
                {/* PAN Registration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN Registration</label>
                  {isUpdate && formData.existingDocuments.panReg && !formData.shopRegDoc && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">✓ Current document uploaded</p>
                      <img src={formData.existingDocuments.panReg} alt="Current PAN" className="w-32 h-20 object-cover rounded border mt-1" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full text-sm border border-gray-300 rounded-md p-2"
                    onChange={(e) => updateFormData("shopRegDoc", e.target.files[0])}
                  />
                  {!isUpdate && <p className="text-xs text-gray-500 mt-1">Upload new document</p>}
                  {isUpdate && <p className="text-xs text-gray-500 mt-1">Upload new document to replace existing</p>}
                  {formData.shopRegDoc && (
                    <div className="mt-2">
                      {formData.shopRegDoc.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(formData.shopRegDoc)}
                          alt="PAN Registration"
                          className="w-32 h-20 object-cover rounded border"
                        />
                      ) : (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700">✓ {formData.shopRegDoc.name}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Citizenship Front */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Citizenship (Front)</label>
                  {isUpdate && formData.existingDocuments.citizenshipFront && !formData.citizenshipFront && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">✓ Current document uploaded</p>
                      <img src={formData.existingDocuments.citizenshipFront} alt="Current Citizenship Front" className="w-32 h-20 object-cover rounded border mt-1" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full text-sm border border-gray-300 rounded-md p-2"
                    onChange={(e) => updateFormData("citizenshipFront", e.target.files[0])}
                  />
                  {isUpdate && <p className="text-xs text-gray-500 mt-1">Upload new document to replace existing</p>}
                  {formData.citizenshipFront && (
                    <div className="mt-2">
                      {formData.citizenshipFront.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(formData.citizenshipFront)}
                          alt="Citizenship Front"
                          className="w-32 h-20 object-cover rounded border"
                        />
                      ) : (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700">✓ {formData.citizenshipFront.name}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Citizenship Back */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Citizenship (Back)</label>
                  {isUpdate && formData.existingDocuments.citizenshipBack && !formData.citizenshipBack && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">✓ Current document uploaded</p>
                      <img src={formData.existingDocuments.citizenshipBack} alt="Current Citizenship Back" className="w-32 h-20 object-cover rounded border mt-1" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full text-sm border border-gray-300 rounded-md p-2"
                    onChange={(e) => updateFormData("citizenshipBack", e.target.files[0])}
                  />
                  {isUpdate && <p className="text-xs text-gray-500 mt-1">Upload new document to replace existing</p>}
                  {formData.citizenshipBack && (
                    <div className="mt-2">
                      {formData.citizenshipBack.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(formData.citizenshipBack)}
                          alt="Citizenship Back"
                          className="w-32 h-20 object-cover rounded border"
                        />
                      ) : (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700">✓ {formData.citizenshipBack.name}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Shop Images</h2>
              <p className="text-sm text-gray-600">{isUpdate ? "Current images shown below. Upload new images to add more." : "Upload at least 4 images of your shop (interior, exterior, products, etc.)"}</p>
              
              {/* Show existing shop images in update mode */}
              {isUpdate && formData.existingShopImages.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Shop Images ({formData.existingShopImages.length})</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {formData.existingShopImages.map((image, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={image.image_url}
                            alt={`Existing shop image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {image.is_primary && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                            Primary
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Existing Image</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="w-full text-sm border border-gray-300 rounded-md p-2"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length + formData.shopImages.length > 10) {
                      alert('Maximum 10 images allowed');
                      return;
                    }
                    updateFormData("shopImages", [...formData.shopImages, ...files]);
                  }}
                />
                
                {/* Camera capture for mobile */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (formData.shopImages.length >= 10) {
                          alert('Maximum 10 images allowed');
                          return;
                        }
                        updateFormData("shopImages", [...formData.shopImages, file]);
                      }
                    };
                    input.click();
                  }}
                >
                  📷 Take Photo
                </Button>
              </div>

              {/* Display newly uploaded images */}
              {formData.shopImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {isUpdate ? "New Images to Add" : "Uploaded Images"} ({formData.shopImages.length}/10)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {formData.shopImages.map((image, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Shop image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.shopImages.filter((_, i) => i !== index);
                            updateFormData("shopImages", newImages);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                      </div>
                    ))}
                  </div>
                  {!isUpdate && formData.shopImages.length < 4 && (
                    <p className="text-sm text-orange-600">
                      Please upload at least 4 images of your shop
                    </p>
                  )}
                  {isUpdate && formData.shopImages.length + formData.existingShopImages.length < 4 && (
                    <p className="text-sm text-orange-600">
                      Total images (existing + new) should be at least 4
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Payment Details</h2>
              <Input
                placeholder="Bank Account Number"
                value={formData.bankAccount}
                onChange={(e) => updateFormData("bankAccount", e.target.value)}
              />
              <Input
                placeholder="Account Holder/Organization Name"
                value={formData.accountHolderName}
                onChange={(e) => updateFormData("accountHolderName", e.target.value)}
              />
              <Input
                placeholder="Bank Name"
                value={formData.bankName}
                onChange={(e) => updateFormData("bankName", e.target.value)}
              />
              <Input
                placeholder="Minimum Order Amount (Optional)"
                value={formData.minOrderAmount}
                onChange={(e) => updateFormData("minOrderAmount", e.target.value)}
              />
            </div>
          )}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Business Type</h2>
              <div className="grid grid-cols-2 gap-3">
                {vendorTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateFormData("vendorType", type.value)}
                    className={`p-3 text-sm rounded-lg border ${
                      formData.vendorType === type.value
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Product Categories</h2>
              <p className="text-sm text-gray-600">Select categories you'll sell</p>
              <div className="grid grid-cols-2 gap-3">
                {categories.length > 0 ? categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`p-3 text-sm rounded-lg border ${
                      formData.categories.includes(category)
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {category}
                  </button>
                )) : (
                  <div className="col-span-2 text-center text-gray-500 py-4">
                    No categories available. Please contact admin.
                  </div>
                )}
              </div>
              <Input
                placeholder="Business Description (Optional)"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
              />
            </div>
          )}
          {currentStep === 8 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Review & Submit</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Shop Information</h3>
                  <p><strong>Shop Name:</strong> {formData.shopName}</p>
                  <p><strong>Owner Name:</strong> {formData.ownerName}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>PAN Number:</strong> {formData.panNumber || "N/A"}</p>
                </div>

                {/* Address */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Address</h3>
                  <p><strong>Shop Address:</strong> {formData.shopAddress}</p>
                  <p><strong>City:</strong> {formData.city}</p>
                  <p><strong>State:</strong> {formData.state}</p>
                  <p><strong>PIN Code:</strong> {formData.pincode}</p>
                  <p><strong>Location:</strong> {formData.location.address}</p>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Documents</h3>
                  
                  {/* PAN Registration */}
                  <div className="mb-3">
                    <p><strong>PAN Registration:</strong> {(formData.shopRegDoc || formData.existingDocuments.panReg) ? "✓ Available" : "❌ Not uploaded"}</p>
                    {formData.shopRegDoc ? (
                      <div className="mt-2">
                        {formData.shopRegDoc.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(formData.shopRegDoc)}
                            alt="New PAN Registration"
                            className="w-24 h-16 object-cover rounded border"
                          />
                        ) : (
                          <div className="p-2 bg-green-50 border border-green-200 rounded-md w-fit">
                            <p className="text-xs text-green-700">📄 {formData.shopRegDoc.name} (New)</p>
                          </div>
                        )}
                      </div>
                    ) : formData.existingDocuments.panReg ? (
                      <div className="mt-2">
                        <img
                          src={formData.existingDocuments.panReg}
                          alt="Current PAN Registration"
                          className="w-24 h-16 object-cover rounded border"
                        />
                        <p className="text-xs text-blue-600">Current document</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Citizenship Front */}
                  <div className="mb-3">
                    <p><strong>Citizenship (Front):</strong> {(formData.citizenshipFront || formData.existingDocuments.citizenshipFront) ? "✓ Available" : "❌ Not uploaded"}</p>
                    {formData.citizenshipFront ? (
                      <div className="mt-2">
                        {formData.citizenshipFront.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(formData.citizenshipFront)}
                            alt="New Citizenship Front"
                            className="w-24 h-16 object-cover rounded border"
                          />
                        ) : (
                          <div className="p-2 bg-green-50 border border-green-200 rounded-md w-fit">
                            <p className="text-xs text-green-700">📄 {formData.citizenshipFront.name} (New)</p>
                          </div>
                        )}
                      </div>
                    ) : formData.existingDocuments.citizenshipFront ? (
                      <div className="mt-2">
                        <img
                          src={formData.existingDocuments.citizenshipFront}
                          alt="Current Citizenship Front"
                          className="w-24 h-16 object-cover rounded border"
                        />
                        <p className="text-xs text-blue-600">Current document</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Citizenship Back */}
                  <div className="mb-3">
                    <p><strong>Citizenship (Back):</strong> {(formData.citizenshipBack || formData.existingDocuments.citizenshipBack) ? "✓ Available" : "❌ Not uploaded"}</p>
                    {formData.citizenshipBack ? (
                      <div className="mt-2">
                        {formData.citizenshipBack.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(formData.citizenshipBack)}
                            alt="New Citizenship Back"
                            className="w-24 h-16 object-cover rounded border"
                          />
                        ) : (
                          <div className="p-2 bg-green-50 border border-green-200 rounded-md w-fit">
                            <p className="text-xs text-green-700">📄 {formData.citizenshipBack.name} (New)</p>
                          </div>
                        )}
                      </div>
                    ) : formData.existingDocuments.citizenshipBack ? (
                      <div className="mt-2">
                        <img
                          src={formData.existingDocuments.citizenshipBack}
                          alt="Current Citizenship Back"
                          className="w-24 h-16 object-cover rounded border"
                        />
                        <p className="text-xs text-blue-600">Current document</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Shop Images */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Shop Images</h3>
                  <p><strong>Total Images:</strong> {formData.shopImages.length + formData.existingShopImages.length}/10</p>
                  <p><strong>Existing:</strong> {formData.existingShopImages.length} | <strong>New:</strong> {formData.shopImages.length}</p>
                  {(formData.shopImages.length + formData.existingShopImages.length) >= 4 ? (
                    <p className="text-green-600 mb-3">✓ Minimum requirement met</p>
                  ) : (
                    <p className="text-red-600 mb-3">❌ Need at least 4 images total</p>
                  )}
                  
                  {/* Existing Shop Images Preview */}
                  {formData.existingShopImages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-blue-600 mb-2">Current Images:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {formData.existingShopImages.slice(0, 4).map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image.image_url}
                              alt={`Current shop ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            {image.is_primary && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                        {formData.existingShopImages.length > 4 && (
                          <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{formData.existingShopImages.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* New Shop Images Preview */}
                  {formData.shopImages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-2">New Images to Add:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {formData.shopImages.slice(0, 4).map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`New shop ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          </div>
                        ))}
                        {formData.shopImages.length > 4 && (
                          <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{formData.shopImages.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Payment Details</h3>
                  <p><strong>Bank Account:</strong> {formData.bankAccount || "N/A"}</p>
                  <p><strong>Account Holder:</strong> {formData.accountHolderName || "N/A"}</p>
                  <p><strong>Bank Name:</strong> {formData.bankName || "N/A"}</p>
                  <p><strong>IFSC Code:</strong> {formData.ifscCode || "N/A"}</p>
                </div>

                {/* Business Details */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Business Details</h3>
                  <p><strong>Business Type:</strong> {vendorTypes.find((type) => type.value === formData.vendorType)?.label || "N/A"}</p>
                  <p><strong>Categories:</strong> {formData.categories.length > 0 ? formData.categories.join(", ") : "None selected"}</p>
                  <p><strong>Description:</strong> {formData.description || "N/A"}</p>
                  <p><strong>GST Number:</strong> {formData.gstNumber || "N/A"}</p>
                  <p><strong>Delivery Radius:</strong> {formData.deliveryRadius || "N/A"} km</p>
                  <p><strong>Minimum Order Amount:</strong> {formData.minOrderAmount || "N/A"}</p>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Your application will be reviewed within 24-48 hours. You'll receive an email notification once approved.
                </p>
              </div>
              
              {/* Error Messages at Bottom */}
              {errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-between mt-6">
          <Button
            onClick={handlePrev}
            disabled={currentStep === 0}
            variant="outline"
            className="px-6"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className="px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : currentStep === steps.length - 1 ? "Submit for Approval" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}