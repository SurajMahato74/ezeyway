import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/ezeywaylogo.png";
import { apiRequest } from '@/utils/apiUtils';
import { useApp } from '@/contexts/AppContext';
import { authService } from '@/services/authService';
import { redirectService } from '@/services/redirectService';
import { LoginSwitcher } from '@/components/LoginSwitcher';
import { googleAuthService } from '@/services/googleAuth';
import { facebookAuthService } from '@/services/facebookAuth';
import { ProfileCompletion } from '@/components/ProfileCompletion';
import { PrivacyPolicyAgreement } from '@/components/PrivacyPolicyAgreement';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();
  const [activeTab, setActiveTab] = useState("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const [showPrivacyAgreement, setShowPrivacyAgreement] = useState(false);
  const [privacyAgreementData, setPrivacyAgreementData] = useState(null);

  // Load saved credentials and check existing session
  useEffect(() => {
    // Check if returning from privacy policy page
    const savedPrivacyState = sessionStorage.getItem('privacyAgreementState');
    if (savedPrivacyState) {
      const state = JSON.parse(savedPrivacyState);
      setPrivacyAgreementData({
        userId: state.userId,
        userType: state.userType,
        hasVendorProfile: state.hasVendorProfile
      });
      setShowPrivacyAgreement(true);
      sessionStorage.removeItem('privacyAgreementState');
      return;
    }

    const checkExistingSession = async () => {
      try {
        // Load saved credentials if remember me was checked
        const savedCredentials = localStorage.getItem('rememberedCredentials');
        if (savedCredentials) {
          const { phone: savedPhone, rememberMe: wasRemembered } = JSON.parse(savedCredentials);
          if (wasRemembered) {
            setPhone(savedPhone);
            setRememberMe(true);
          }
        }

        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          const isSessionValid = await authService.isSessionValid();
          if (!isSessionValid) {
            // Session expired, clear auth data
            await authService.clearAuth();
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };
    
    checkExistingSession();
    
    // Initialize Google Auth
    googleAuthService.initialize().catch(console.error);
    
    // Initialize Facebook Auth
    facebookAuthService.initialize().catch(console.error);
  }, []);

  const handlePasswordLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Clear any existing token before login
      await authService.clearAuth();
      
      const { response, data } = await apiRequest('/login/', {
        method: "POST",
        body: JSON.stringify({ username: phone, password }),
      }, false); // Don't include auth header

      if (!response.ok) {
        throw new Error(data?.error || "Login failed");
      }

      // Check if privacy policy agreement is needed
      if (data.needs_privacy_agreement) {
        setPrivacyAgreementData({
          userId: data.user_id,
          userType: data.user_type,
          hasVendorProfile: data.has_vendor_profile
        });
        setShowPrivacyAgreement(true);
        return;
      }

      // Ensure user data is properly structured
      if (data.user && data.token) {
        // Set user_type to customer if not specified
        const userData = {
          ...data.user,
          available_roles: data.available_roles || ['customer'],
          user_type: data.user.user_type || 'customer',
          current_role: data.user.user_type || 'customer'
        };

        await login(userData, data.token);

        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            phone,
            rememberMe: true
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }

        // Small delay to ensure context is updated
        setTimeout(async () => {
          const executed = await redirectService.executePendingAction();
          if (!executed) {
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect');
            const returnTo = urlParams.get('returnTo');
            const from = redirect || returnTo || location.state?.from?.pathname || '/home';
            navigate(from, { replace: true });
          }
        }, 100);
      } else {
        throw new Error("Invalid login response");
      }
    } catch (e) {
      setError(e.message);
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
        body: JSON.stringify({ email: phone }),
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
        body: JSON.stringify({ email: phone, otp }),
      }, false); // Don't include auth header
      if (!response.ok) {
        throw new Error(data?.error || "OTP verification failed");
      }
      
      // Check if privacy policy agreement is needed
      if (data.needs_privacy_agreement) {
        setPrivacyAgreementData({
          userId: data.user_id,
          userType: data.user_type,
          hasVendorProfile: data.has_vendor_profile
        });
        setShowPrivacyAgreement(true);
        return;
      }
      
      // Store token and user data using authService
      if (data.user && data.token) {
        // Set user_type to customer if not specified
        const userData = {
          ...data.user,
          available_roles: data.available_roles || ['customer'],
          user_type: data.user.user_type || 'customer',
          current_role: data.user.user_type || 'customer'
        };

        await login(userData, data.token);
      }

      // Small delay to ensure context is updated
      setTimeout(async () => {
        const executed = await redirectService.executePendingAction();
        if (!executed) {
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get('redirect');
          const returnTo = urlParams.get('returnTo');
          const from = redirect || returnTo || location.state?.from?.pathname || '/home';
          navigate(from, { replace: true });
        }
      }, 100);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    navigate("/signup");
  };

  const handleFacebookLogin = async () => {
    setIsFacebookLoading(true);
    setError("");
    try {
      const result = await facebookAuthService.signIn();
      
      if (result.success && result.user && result.token) {
        const userData = {
          ...result.user,
          available_roles: result.user.available_roles || ['customer'],
          user_type: result.user.user_type || 'customer',
          current_role: result.user.current_role || result.user.user_type || 'customer'
        };

        await login(userData, result.token);
        await authService.setAuth(result.token, userData);

        // Handle remember me for Facebook login
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            phone: result.user.email,
            rememberMe: true
          }));
        }

        // Check if user needs profile completion (for new Facebook users or missing phone)
        if (result.user.user_created || !result.user.phone_number) {
          setGoogleUserData({ userData, token: result.token });
          setShowProfileCompletion(true);
        } else {
          // Proceed with normal login flow
          proceedAfterLogin();
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
        const userData = {
          ...result.user,
          available_roles: result.user.available_roles || ['customer'],
          user_type: result.user.user_type || 'customer',
          current_role: result.user.current_role || result.user.user_type || 'customer'
        };

        await login(userData, result.token);
        await authService.setAuth(result.token, userData);

        // Handle remember me for Google login
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            phone: result.user.email,
            rememberMe: true
          }));
        }

        // Check if user needs profile completion (for new Google users or missing phone)
        if (result.user.user_created || !result.user.phone_number) {
          setGoogleUserData({ userData, token: result.token });
          setShowProfileCompletion(true);
        } else {
          // Proceed with normal login flow
          proceedAfterLogin();
        }
      } else {
        // Show user-friendly error message for mobile
        if (result.error && (result.error.includes('Native Google Sign-In') || result.error.includes('Google Sign-In setup') || result.error.includes('temporarily unavailable'))) {
          setError('Google login is temporarily unavailable on mobile. Please use email/password login.');
        } else {
          setError(result.error || 'Google login failed');
        }
      }
    } catch (error) {
      setError('Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const proceedAfterLogin = () => {
    setTimeout(async () => {
      const executed = await redirectService.executePendingAction();
      if (!executed) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        const returnTo = urlParams.get('returnTo');
        const from = redirect || returnTo || location.state?.from?.pathname || '/home';
        navigate(from, { replace: true });
      }
    }, 100);
  };

  const handleProfileCompletionComplete = () => {
    setShowProfileCompletion(false);
    proceedAfterLogin();
  };

  const handleProfileCompletionSkip = () => {
    setShowProfileCompletion(false);
    proceedAfterLogin();
  };

  const handlePrivacyAgreementComplete = (userData, token) => {
    setShowPrivacyAgreement(false);
    setPrivacyAgreementData(null);
    // Login is already handled in the PrivacyPolicyAgreement component
  };

  const handlePrivacyAgreementCancel = () => {
    setShowPrivacyAgreement(false);
    setPrivacyAgreementData(null);
    setError("Privacy policy agreement is required to login");
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
      <LoginSwitcher currentType="customer" />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-80 mx-auto px-4">
        <div className="space-y-6">
          <div className="text-center">
            <img src={logo} alt="ezeyway" className="w-16 h-16 mx-auto mb-6" />
          </div>

          {/* Login Type Label */}
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-gray-700 bg-blue-50 px-3 py-1 rounded-full">
              Customer Login
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number or Email"
                className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 w-80"
              />
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
              
              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-center space-x-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-700">
                  Remember my email
                </label>
              </div>


              {error && <p className="text-red-600 text-center">{error}</p>}
              <Button
                onClick={handlePasswordLogin}
                disabled={!phone || !password || isLoading}
                className="w-80 mx-auto bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          )}

          {/* OTP Login */}
          {activeTab === "otp" && (
            <div className="space-y-4 flex flex-col items-center">
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number or email"
                className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 w-80"
              />
              {error && <p className="text-red-600 text-center">{error}</p>}
              {!otpSent ? (
                <Button
                  onClick={handleSendOtp}
                  disabled={!phone || isLoading}
                  className="w-80 mx-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              ) : (
                <div className="flex flex-col items-center space-y-4">
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
                    {isLoading ? "Verifying..." : "Verify & Login"}
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
            
            <div className="flex justify-center">
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
            </div>
          </div>

          <div className="text-center space-y-3 mt-6">
            <button
              onClick={handleSignup}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium block mx-auto"
            >
              Don't have an account? Sign up
            </button>
            <button
              onClick={() => navigate('/privacy-policy')}
              className="text-gray-500 hover:text-gray-700 text-sm block mx-auto"
            >
              Privacy Policy
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
      
      {/* Privacy Policy Agreement Modal */}
      {showPrivacyAgreement && privacyAgreementData && (
        <PrivacyPolicyAgreement
          userId={privacyAgreementData.userId}
          userType={privacyAgreementData.userType}
          hasVendorProfile={privacyAgreementData.hasVendorProfile}
          onComplete={handlePrivacyAgreementComplete}
          onCancel={handlePrivacyAgreementCancel}
        />
      )}
    </div>
  );
}