import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/ezeywaylogo.png";
import { apiRequest } from '@/utils/apiUtils';
import { useApp } from '@/contexts/AppContext';
import { authService } from '@/services/authService';
import { LoginSwitcher } from '@/components/LoginSwitcher';

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

  // Clear any expired sessions but don't redirect - let SplashScreen handle routing
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
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

      // Ensure user data is properly structured
      if (data.user && data.token) {
        // Set user_type to customer if not specified
        const userData = {
          ...data.user,
          available_roles: data.available_roles || ['customer'],
          user_type: data.user.user_type || 'customer'
        };

        await login(userData, data.token);

        // Navigate to intended page or home
        const from = location.state?.from?.pathname || '/home';
        navigate(from, { replace: true });
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
      
      // Store token and user data using authService
      if (data.user && data.token) {
        // Set user_type to customer if not specified
        const userData = {
          ...data.user,
          available_roles: data.available_roles || ['customer'],
          user_type: data.user.user_type || 'customer'
        };

        await login(userData, data.token);
      }

      // Navigate to intended page or home
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    navigate("/signup");
  };



  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative">
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