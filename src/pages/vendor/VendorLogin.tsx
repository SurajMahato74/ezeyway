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
import { googleAuthService } from '@/services/googleAuth';
import { facebookAuthService } from '@/services/facebookAuth';
import { ProfileCompletion } from '@/components/ProfileCompletion';

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
    
    // Check if user is already logged in and can switch to vendor role
    checkExistingAuth();
    
    // Initialize Google Auth
    googleAuthService.initialize().catch(console.error);
    
    // Initialize Facebook Auth
    facebookAuthService.initialize().catch(console.error);
  }, [location.state]);

  const checkExistingAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const user = await authService.getUser();
        console.log('Existing user:', user);
        
        // Only redirect if already a vendor with approved profile
        if (user?.user_type === 'vendor' && user?.available_roles?.includes('vendor')) {
          navigate('/vendor/dashboard');
        }
      }
    } catch (error) {
      console.log('No existing auth or error:', error);
    }
  };

  const switchToVendorRole = async () => {
    try {
      const { response, data } = await apiRequest('/switch-role/', {
        method: 'POST',
        body: JSON.stringify({ role: 'vendor' })
      }); // apiRequest automatically includes auth token

      if (response.ok) {
        // Update user data with new role
        const user = await authService.getUser();
        const updatedUser = { ...user, user_type: 'vendor' };
        await login(updatedUser, await authService.getToken());
        
        // Save to vendor-specific storage
        const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
        await simplePersistentAuth.saveVendorLogin(await authService.getToken(), updatedUser);
        
        navigate('/vendor/dashboard');
      }
    } catch (error) {
      console.error('Role switch failed:', error);
    }
  };

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
        // Use actual user data from API response
        const userData = {
          ...data.user,
          available_roles: data.available_roles || ['customer'],
          current_role: data.user.user_type || 'customer'
        };
        
        // If user has vendor role available but is currently customer, switch to vendor
        if (userData.user_type === 'customer' && userData.available_roles.includes('vendor')) {
          userData.user_type = 'vendor';
        }
  
        await login(userData, data.token);
        
        // Save to both regular auth and vendor-specific storage
        await authService.setAuth(data.token, userData);
        const simplePersistentAuthModule = await import('@/services/simplePersistentAuth');
        await simplePersistentAuthModule.simplePersistentAuth.saveVendorLogin(data.token, userData);
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
        user_type: data.user.user_type || 'vendor',
        current_role: data.user.user_type || 'vendor'
      };

      await login(userData, data.token);
      
      // Save to both regular auth and vendor-specific storage
      await authService.setAuth(data.token, userData);
      const simplePersistentAuthModule2 = await import('@/services/simplePersistentAuth');
      await simplePersistentAuthModule2.simplePersistentAuth.saveVendorLogin(data.token, userData);
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

  const handleFacebookLogin = async () => {
    setIsFacebookLoading(true);
    setError("");
    try {
      const result = await facebookAuthService.signIn();
      
      if (result.success && result.user && result.token) {
        let userData = {
          ...result.user,
          available_roles: result.user.available_roles || ['customer'],
          current_role: result.user.current_role || result.user.user_type || 'customer'
        };
        
        // If user has vendor role available but is currently customer, switch to vendor
        if (userData.user_type === 'customer' && userData.available_roles.includes('vendor')) {
          userData.user_type = 'vendor';
        }

        await login(userData, result.token);
        
        // Save authentication properly - order matters
        await authService.setAuth(result.token, userData);
        await login(userData, result.token);
        
        // Only save to vendor storage if user has vendor role
        if (userData.available_roles?.includes('vendor')) {
          const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
          await simplePersistentAuth.saveVendorLogin(result.token, userData);
        }
        
        // Check if user needs profile completion (for new Facebook users or missing phone)
        if (result.user.user_created || !result.user.phone_number) {
          setGoogleUserData({ userData, token: result.token, profileData: result.user });
          setShowProfileCompletion(true);
        } else {
          // Proceed with normal vendor login flow
          proceedWithVendorFlow(result.user);
        }
      } else {
        setError(result.error || 'Facebook login failed');
      }
    } catch (error) {
      setError('Facebook login failed. Please try again.');
    } finally {
      setIsFacebookLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      const result = await googleAuthService.signIn();
      
      if (result.success && result.user && result.token) {
        let userData = {
          ...result.user,
          available_roles: result.user.available_roles || ['customer'],
          current_role: result.user.current_role || result.user.user_type || 'customer'
        };
        
        // If user has vendor role available but is currently customer, switch to vendor
        if (userData.user_type === 'customer' && userData.available_roles.includes('vendor')) {
          userData.user_type = 'vendor';
        }

        await login(userData, result.token);
        
        // Save authentication properly - order matters
        await authService.setAuth(result.token, userData);
        await login(userData, result.token);
        
        // Only save to vendor storage if user has vendor role
        if (userData.available_roles?.includes('vendor')) {
          const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
          await simplePersistentAuth.saveVendorLogin(result.token, userData);
        }
        
        // Check if user needs profile completion (for new Google users or missing phone)
        if (result.user.user_created || !result.user.phone_number) {
          setGoogleUserData({ userData, token: result.token, profileData: result.user });
          setShowProfileCompletion(true);
        } else {
          // Proceed with normal vendor login flow
          proceedWithVendorFlow(result.user);
        }
      } else {
        setError(result.error || 'Google login failed');
      }
    } catch (error) {
      setError('Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const proceedWithVendorFlow = (userProfile) => {
    // Check profile and approval status (same logic as password login)
    if (!userProfile.profile_exists) {
      navigate("/vendor/onboarding");
    } else if (userProfile.profile_exists && userProfile.is_approved) {
      navigate("/vendor/dashboard");
    } else if (userProfile.profile_exists && userProfile.is_rejected) {
      navigate("/vendor/rejection", { 
        state: { 
          rejectionReason: userProfile.rejection_reason,
          rejectionDate: userProfile.rejection_date 
        } 
      });
    } else if (userProfile.profile_exists && !userProfile.is_approved) {
      setError("Your vendor application is pending approval. You will be notified once approved.");
      authService.clearAuth();
    }
  };

  const handleProfileCompletionComplete = () => {
    setShowProfileCompletion(false);
    if (googleUserData?.profileData) {
      proceedWithVendorFlow(googleUserData.profileData);
    }
  };

  const handleProfileCompletionSkip = () => {
    setShowProfileCompletion(false);
    if (googleUserData?.profileData) {
      proceedWithVendorFlow(googleUserData.profileData);
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
      <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>
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

          {/* Google Login */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-500">or</span>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-12 h-12 bg-white hover:bg-gray-50 border border-gray-300 rounded-full flex items-center justify-center transition-colors shadow-sm"
              >
                {isGoogleLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
              </button>
              
              <button
                onClick={handleFacebookLogin}
                disabled={isFacebookLoading}
                className="w-12 h-12 bg-white hover:bg-gray-50 border border-gray-300 rounded-full flex items-center justify-center transition-colors shadow-sm"
              >
                {isFacebookLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

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
      
      {/* Profile Completion Modal */}
      {showProfileCompletion && googleUserData && (
        <ProfileCompletion
          user={googleUserData.userData}
          onComplete={handleProfileCompletionComplete}
          onSkip={handleProfileCompletionSkip}
        />
      )}
    </div>
  );
}