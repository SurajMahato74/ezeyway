// Replace the handleNext function in your VendorOnboarding.tsx with this fixed version:

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

      // Upload documents separately
      const documentsToUpload = [];
      if (formData.citizenshipFront) {
        documentsToUpload.push({ 
          file: formData.citizenshipFront, 
          name: "Citizenship Front" 
        });
      }
      if (formData.citizenshipBack) {
        documentsToUpload.push({ 
          file: formData.citizenshipBack, 
          name: "Citizenship Back" 
        });
      }
      
      // Upload documents to vendor-documents endpoint
      for (const doc of documentsToUpload) {
        console.log(`Uploading ${doc.name}...`);
        const docForm = new FormData();
        docForm.append("vendor_profile", data.id.toString());
        docForm.append("document", doc.file);
        const docResponse = await fetch(API_BASE + "vendor-documents/", {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
          body: docForm,
        });
        const docData = await docResponse.json();
        console.log(`${doc.name} upload response:`, docResponse.status, docData);
        if (!docResponse.ok) {
          setErrorMessage(`Profile submitted but failed to upload ${doc.name}.`);
          console.error(`${doc.name} upload failed:`, docData);
          return;
        }
        console.log(`${doc.name} uploaded successfully.`);
      }

      // Upload shop images to separate endpoint
      for (const [index, image] of formData.shopImages.entries()) {
        console.log(`Uploading Shop Image ${index + 1}...`);
        const imageForm = new FormData();
        imageForm.append("vendor_profile", data.id.toString());
        imageForm.append("image", image);
        imageForm.append("is_primary", index === 0 ? "true" : "false");
        
        const imageResponse = await fetch(API_BASE + "vendor-shop-images/", {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
          body: imageForm,
        });
        const imageData = await imageResponse.json();
        console.log(`Shop Image ${index + 1} upload response:`, imageResponse.status, imageData);
        if (!imageResponse.ok) {
          setErrorMessage(`Profile submitted but failed to upload Shop Image ${index + 1}.`);
          console.error(`Shop Image ${index + 1} upload failed:`, imageData);
          return;
        }
        console.log(`Shop Image ${index + 1} uploaded successfully.`);
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