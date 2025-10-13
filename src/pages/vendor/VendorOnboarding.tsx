import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    extraDoc: null,
    bankAccount: "",
    accountHolderName: "",
    bankName: "", // Changed from bankBranch to bankName
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

  // Fetch categories from API
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
    fetchCategories();
  }, []);

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
    return true;
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
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
      if (formData.shopRegDoc) {
        formDataToSend.append("business_license_file", formData.shopRegDoc);
      }

      try {
        const token = localStorage.getItem("token");
        console.log("Submitting vendor profile to backend...");
        const response = await fetch(API_BASE + "vendor-profiles/", {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
          body: formDataToSend,
        });
        const data = await response.json();
        console.log("Profile submission response:", response.status, data);
        if (!response.ok) {
          setErrorMessage(data.detail || data.error || "Failed to submit vendor profile. Please check your inputs.");
          console.error("Profile submission failed:", data);
          return;
        }
        console.log("Profile created with ID:", data.id);

        // Submit extraDoc to VendorDocument if present
        if (formData.extraDoc) {
          console.log("Uploading extra document...");
          const extraDocForm = new FormData();
          extraDocForm.append("vendor_profile", data.id.toString());
          extraDocForm.append("document", formData.extraDoc);
          const docResponse = await fetch(API_BASE + "vendor-documents/", {
            method: "POST",
            headers: {
              Authorization: `Token ${token}`,
            },
            body: extraDocForm,
          });
          const docData = await docResponse.json();
          console.log("Extra document upload response:", docResponse.status, docData);
          if (!docResponse.ok) {
            setErrorMessage("Profile submitted but failed to upload extra document.");
            console.error("Extra document upload failed:", docData);
            return;
          }
          console.log("Extra document uploaded successfully.");
        }

        // Check approval status
        if (data.is_approved) {
          setSuccessMessage("Vendor profile submitted and approved successfully!");
          console.log("Vendor approved. Navigating to dashboard...");
          navigate("/vendor/dashboard");
        } else {
          setSuccessMessage("Your vendor application has been submitted successfully and is pending approval. You will be notified once approved by the admin.");
          console.log("Vendor not approved yet. Redirecting to login page.");
          setTimeout(() => {
            navigate("/vendor/login");
          }, 2000);
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
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Setup</h1>
          <p className="text-gray-600 text-sm mt-2">Step {currentStep + 1} of {steps.length}</p>
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
                placeholder="PAN Number (Optional)"
                value={formData.panNumber}
                onChange={(e) => updateFormData("panNumber", e.target.value)}
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
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Shop Registration Document</label>
                  <input
                    type="file"
                    className="w-full text-sm"
                    onChange={(e) => updateFormData("shopRegDoc", e.target.files[0])}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Additional Document (Optional)</label>
                  <input
                    type="file"
                    className="w-full text-sm"
                    onChange={(e) => updateFormData("extraDoc", e.target.files[0])}
                  />
                </div>
              </div>
            </div>
          )}
          {currentStep === 4 && (
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
          {currentStep === 5 && (
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
          {currentStep === 6 && (
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
          {currentStep === 7 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Review & Submit</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Shop:</strong> {formData.shopName}</p>
                <p><strong>Owner:</strong> {formData.ownerName}</p>
                <p><strong>Type:</strong> {vendorTypes.find((type) => type.value === formData.vendorType)?.label || formData.vendorType}</p>
                <p><strong>Categories:</strong> {formData.categories.join(", ")}</p>
                <p><strong>Location:</strong> {formData.city}, {formData.state}</p>
                <p><strong>GST Number:</strong> {formData.gstNumber || "N/A"}</p>
                <p><strong>PAN Number:</strong> {formData.panNumber || "N/A"}</p>
                <p><strong>Delivery Radius:</strong> {formData.deliveryRadius || "N/A"} km</p>
                <p><strong>Minimum Order Amount:</strong> {formData.minOrderAmount || "N/A"}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Your application will be reviewed within 24-48 hours. You'll receive an email notification once approved.
                </p>
              </div>
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