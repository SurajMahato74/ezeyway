import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle forgot password logic here
    navigate("/login");
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleResendLink = () => {
    // Handle resend link logic here
    console.log("Resend link clicked");
  };

  return (
    <div 
      className="min-h-screen flex items-end justify-center bg-cover bg-center bg-no-repeat p-4 pb-12"
      style={{ backgroundImage: 'url(/images/forgot.png)' }}
    >
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-4" style={{ backgroundColor: "#856043" }}>
        <h2 className="text-xl font-bold text-white text-center mb-5">Forgot Password</h2>
        <div className="space-y-5">
          <div>
            <Label htmlFor="email" className="text-white font-medium">Email or Phone Number</Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or phone"
              className="mt-1 w-full rounded-md border-gray-300 focus:border-white focus:ring-white text-gray-900"
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full bg-[#a67c5b] text-white hover:bg-[#b88f6e] font-semibold transition-colors"
          >
            Submit
          </Button>
          <Button
            onClick={handleResendLink}
            className="w-full bg-[#a67c5b] text-white hover:bg-[#b88f6e] font-semibold transition-colors"
          >
            Resend Link
          </Button>
          <Button
            onClick={handleBackToLogin}
            className="w-full bg-[#a67c5b] text-white hover:bg-[#b88f6e] font-semibold transition-colors"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}