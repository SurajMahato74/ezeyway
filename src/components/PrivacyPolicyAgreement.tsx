import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from '@/utils/apiUtils';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { redirectService } from '@/services/redirectService';

interface PrivacyPolicyAgreementProps {
  userId: number;
  userType: string;
  hasVendorProfile: boolean;
  onComplete: (userData: any, token: string) => void;
  onCancel?: () => void;
}

export function PrivacyPolicyAgreement({ 
  userId, 
  userType, 
  hasVendorProfile, 
  onComplete, 
  onCancel 
}: PrivacyPolicyAgreementProps) {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if returning from privacy policy page
  useEffect(() => {
    const savedState = sessionStorage.getItem('privacyAgreementState');
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.returnUrl === window.location.pathname) {
        // Clear the saved state since we're back
        sessionStorage.removeItem('privacyAgreementState');
      }
    }
  }, []);

  const handleAgree = async () => {
    if (!agreed) {
      setError("You must agree to the privacy policy to continue");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { response, data } = await apiRequest('/agree-privacy-policy/', {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          agreed: true
        }),
      }, false);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to agree to privacy policy");
      }

      if (data.success && data.user && data.token) {
        // Set user_type to customer if not specified
        const userData = {
          ...data.user,
          available_roles: data.available_roles || ['customer'],
          user_type: data.user.user_type || 'customer',
          current_role: data.user.user_type || 'customer'
        };

        await login(userData, data.token);
        onComplete(userData, data.token);

        // Navigate after successful agreement
        setTimeout(async () => {
          const executed = await redirectService.executePendingAction();
          if (!executed) {
            const urlParams = new URLSearchParams(window.location.search);
            const returnTo = urlParams.get('returnTo');
            const from = returnTo || location.state?.from?.pathname || '/home';
            navigate(from, { replace: true });
          }
        }, 100);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Privacy Policy Agreement
          </h2>
          
          <div className="mb-4 text-sm text-gray-600">
            <p className="mb-2">
              Before you can continue, please read and agree to our privacy policy.
            </p>
            {hasVendorProfile && (
              <p className="mb-2 text-blue-600 font-medium">
                As a vendor, you need to agree to our privacy policy to access vendor features.
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto text-sm">
            <h3 className="font-semibold mb-2">Privacy Policy Summary</h3>
            <div className="space-y-2 text-gray-700">
              <p>• We collect and process your personal information to provide our services</p>
              <p>• Your data is used to facilitate transactions between customers and vendors</p>
              <p>• We implement security measures to protect your information</p>
              <p>• You have rights regarding your personal data</p>
              <p>• We may share information as required by law or to provide services</p>
              <p>• Cookies and similar technologies are used to improve user experience</p>
            </div>
            <div className="mt-3">
              <button
                onClick={() => {
                  // Save current state before navigating
                  sessionStorage.setItem('privacyAgreementState', JSON.stringify({
                    userId,
                    userType,
                    hasVendorProfile,
                    returnUrl: window.location.pathname
                  }));
                  navigate('/privacy-policy');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm underline"
              >
                Read Full Privacy Policy
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-3 mb-4">
            <Checkbox
              id="privacy-agreement"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="privacy-agreement" className="text-sm text-gray-700 cursor-pointer">
              I have read and agree to the{" "}
              <button
                onClick={() => {
                  // Save current state before navigating
                  sessionStorage.setItem('privacyAgreementState', JSON.stringify({
                    userId,
                    userType,
                    hasVendorProfile,
                    returnUrl: window.location.pathname
                  }));
                  navigate('/privacy-policy');
                }}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Privacy Policy
              </button>
            </label>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAgree}
              disabled={!agreed || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Processing..." : "Agree & Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}