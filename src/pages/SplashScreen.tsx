import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from '@capacitor/core';
import logo from "@/assets/ezeywaylogo.png";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Check for persistent vendor authentication
        const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
        const isVendorLoggedIn = await simplePersistentAuth.isVendorLoggedIn();
        
        if (isVendorLoggedIn) {
          console.log('✅ Vendor already logged in, redirecting to dashboard');
          navigate("/vendor/dashboard");
          return;
        }
        
        // Check for regular customer authentication
        const { authService } = await import('@/services/authService');
        const isCustomerAuth = await authService.isAuthenticated();
        const user = await authService.getUser();
        
        if (isCustomerAuth && user && user.user_type === 'customer') {
          console.log('✅ Customer already logged in, redirecting to home');
          navigate("/home");
          return;
        }
        
        // No authentication found, go to home page
        console.log('❌ No authentication found, redirecting to home');
        navigate("/home");
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate("/home");
      }
    };
    
    checkAuthAndNavigate();
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <img 
          src={logo} 
          alt="ezeyway" 
          className="w-32 h-32 mx-auto animate-pulse object-contain"
        />
        <div className="mt-4">
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
