import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/ezeywaylogo.png";
import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';
import { useApp } from '@/contexts/AppContext';
import { VendorDebugInfo } from '@/components/VendorDebugInfo';
import { LoginSwitcher } from '@/components/LoginSwitcher';

export default function VendorLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();
  const [activeTab, setActiveTab] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handlePasswordLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Clear any existing token before login
      await authService.clearAuth();
      
      const { response, data } = await apiRequest('/login/', {
        method: "POST",
        body: JSON.stringify({ username: email, password }),
      }, false); // Don't include auth header
      if (!response.ok) {
        throw new Error(data?.error || "Login failed");
      }
      if (data.needs_verification) {
        setNeedsVerification(true);
        setUserId(data.user_id);
        setOtpSent(true);
        setError("Email not verified. Please verify your email with the OTP sent.");
      } else {
        // Ensure user_type is set to vendor for proper routing
        const userData = {
          ...data.user || { id: data.user_id, email, user_type: 'vendor' },
          available_roles: data.available_roles || ['vendor'],
          user_type: data.user.user_type || 'vendor'
        };
  
        await login(userData, data.token);
        
        // Save persistent login for mobile
        const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
        await simplePersistentAuth.saveVendorLogin(data.token, userData);
        console.log("Login response:", data);
        console.log("profile_exists:", data.profile_exists, "is_approved:", data.is_approved);
        
        // Check profile and approval status
        if (!data.profile_exists) {
          console.log("No profile exists, redirecting to onboarding");
          navigate("/vendor/onboarding");
        } else if (data.profile_exists && data.is_approved) {
          console.log("Profile exists and approved, redirecting to dashboard");
          navigate("/vendor/dashboard");
        } else if (data.profile_exists && data.is_rejected) {
          console.log("Profile exists but rejected");
          navigate("/vendor/rejection", { 
            state: { 
              rejectionReason: data.rejection_reason,
              rejectionDate: data.rejection_date 
            } 
          });
        } else if (data.profile_exists && !data.is_approved) {
          console.log("Profile exists but not approved");
          setError("Your vendor application is pending approval. You will be notified once approved.");
          await authService.clearAuth(); // Remove token since they can't access
        }
      }
    } catch (e) {
      console.error('Vendor login error:', e);
      if (e.message?.includes('fetch')) {
        setError("Connection failed. Please check if the server is running on localhost:8000");
      } else {
        setError(e.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { response, data } = await apiRequest('/send-otp/', {
        method: "POST",
        body: JSON.stringify({ email }),
      }, false); // Don't include auth header
      if (!response.ok) {
        throw new Error(data?.error || "Failed to send OTP");
      }
      setOtpSent(true);
      setError("OTP sent successfully");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { response, data } = await apiRequest('/verify-otp/', {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      }, false); // Don't include auth header
      if (!response.ok) {
        throw new Error(data?.error || "OTP verification failed");
      }
      
      // Ensure user_type is set to vendor for proper routing
      const userData = {
        ...data.user || { id: data.user_id, email, user_type: 'vendor' },
        available_roles: data.available_roles || ['vendor'],
        user_type: data.user.user_type || 'vendor'
      };

      await login(userData, data.token);
      
      // Save persistent login for mobile
      const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
      await simplePersistentAuth.saveVendorLogin(data.token, userData);
      console.log("OTP verification response:", data);
      console.log("profile_exists:", data.profile_exists, "is_approved:", data.is_approved);
      
      // Check profile and approval status
      if (!data.profile_exists) {
        console.log("No profile exists, redirecting to onboarding");
        navigate("/vendor/onboarding");
      } else if (data.profile_exists && data.is_approved) {
        console.log("Profile exists and approved, redirecting to dashboard");
        navigate("/vendor/dashboard");
      } else if (data.profile_exists && data.is_rejected) {
        console.log("Profile exists but rejected");
        navigate("/vendor/rejection", { 
          state: { 
            rejectionReason: data.rejection_reason,
            rejectionDate: data.rejection_date 
          } 
        });
      } else if (data.profile_exists && !data.is_approved) {
        console.log("Profile exists but not approved");
        setError("Your vendor application is pending approval. You will be notified once approved.");
        await authService.clearAuth(); // Remove token since they can't access
      }
    } catch (e) {
      console.error('Vendor OTP verification error:', e);
      setError(e.message || "OTP verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { response, data } = await apiRequest('/update-email/', {
        method: "POST",
        body: JSON.stringify({ email: newEmail, user_id: userId }),
      }, false); // Don't include auth header
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update email");
      }
      setEmail(newEmail);
      setNewEmail("");
      setOtpSent(true);
      setError("Email updated. OTP sent to new email.");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    navigate("/vendor/signup");
  };



  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative">
      <LoginSwitcher currentType="vendor" />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-80 mx-auto px-4">
        <div className="space-y-6">
          <div className="text-center">
            <img src={logo} alt="ezeyway" className="w-16 h-16 mx-auto mb-6" />
          </div>

          {/* Login Type Label */}
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-gray-700 bg-blue-50 px-3 py-1 rounded-full">
              Vendor Login
            </span>
          </div>

          {/* Tabs */}
          <div className="flex justify-center">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("password")}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "password"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Password
              </button>
              <button
                onClick={() => setActiveTab("otp")}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "otp"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                OTP
              </button>
            </div>
          </div>

          {/* Password Login */}
          {activeTab === "password" && (
            <div className="space-y-4 flex flex-col items-center">
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username or Email"
                className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 w-80"
              />
              {!needsVerification && (
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 pr-10 w-80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              )}
              {successMessage && <p className="text-green-600 text-center">{successMessage}</p>}
              {error && <p className="text-red-600 text-center">{error}</p>}
              {needsVerification && (
                <div className="space-y-4">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Update email if incorrect"
                    className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 w-80"
                  />
                  <Button
                    onClick={handleUpdateEmail}
                    disabled={!newEmail || isLoading}
                    className="w-80 mx-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? "Updating..." : "Update Email and Resend OTP"}
                  </Button>
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    maxLength={6}
                    className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 text-center tracking-widest w-80"
                  />
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6 || isLoading}
                    className="w-80 mx-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <button
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="w-80 mx-auto block text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Resend OTP
                  </button>
                </div>
              )}
              {!needsVerification && (
                <Button
                  onClick={handlePasswordLogin}
                  disabled={!email || !password || isLoading}
                  className="w-80 mx-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              )}
            </div>
          )}

          {/* OTP Login */}
          {activeTab === "otp" && (
            <div className="space-y-4 flex flex-col items-center">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 w-80"
              />
              {!otpSent ? (
                <Button
                  onClick={handleSendOtp}
                  disabled={!email || isLoading}
                  className="w-80 mx-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              ) : (
                <>
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    maxLength={6}
                    className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 text-center tracking-widest w-80"
                  />
                  {successMessage && <p className="text-green-600 text-center">{successMessage}</p>}
                  {error && <p className="text-red-600 text-center">{error}</p>}
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6 || isLoading}
                    className="w-80 mx-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <button
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="w-80 mx-auto block text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Resend OTP
                  </button>
                </>
              )}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleSignup}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}