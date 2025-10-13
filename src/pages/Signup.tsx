import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/ezeywaylogo.png";
import { API_BASE } from '@/config/api';

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE + "register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          username: email,
          email, 
          password, 
          user_type: "customer",
          phone_number: phone
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.username?.[0] || data.email?.[0] || data.message || Object.values(data)[0]?.[0] || "Registration failed";
        throw new Error(errorMessage);
      }
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value) => {
    setOtp(value);
    if (value.length === 6) {
      verifyOtp(value);
    }
  };

  const verifyOtp = async (currentOtp) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE + "verify-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, otp: currentOtp }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }
      localStorage.setItem("token", data.token);
      navigate("/home");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE + "send-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }
      setError("OTP resent successfully");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-80 mx-auto px-4">
        {/* Step 1: Registration */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <img src={logo} alt="ezeyway" className="w-24 h-24 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900">Customer Signup</h1>
            </div>
            <div className="space-y-4 flex flex-col items-center">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 w-80"
              />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 w-80"
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
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
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 w-80"
              />
              {error && <p className="text-red-600 text-center">{error}</p>}
              <Button
                onClick={handleSignup}
                disabled={!name || !phone || !email || !password || !confirmPassword || password !== confirmPassword || isLoading}
                className="w-80 mx-auto bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
            </div>
            <div className="text-center">
              <button
                onClick={handleLogin}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Already have an account? Login
              </button>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <img src={logo} alt="ezeyway" className="w-24 h-24 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900">Verify Email</h1>
              <p className="text-gray-600 mt-2">Code sent to {email}</p>
            </div>
            <div className="space-y-4 flex flex-col items-center">
              <Input
                type="text"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest w-80"
              />
              {isLoading && (
                <div className="text-center text-blue-600">
                  Verifying...
                </div>
              )}
              {error && <p className="text-red-600 text-center">{error}</p>}
              <button
                onClick={() => setStep(1)}
                className="w-80 mx-auto block text-blue-600 hover:text-blue-700 text-sm"
              >
                Change details
              </button>
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="w-80 mx-auto block text-blue-600 hover:text-blue-700 text-sm"
              >
                Resend code
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}