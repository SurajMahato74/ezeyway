import { Smartphone, Shield, FileText, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/ezeywaylogo.png";

export function Footer() {
  const navigate = useNavigate();
  
  return (
    <footer className="bg-gray-900 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* App Download Section */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold mb-4">Download Our App</h3>
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              className="bg-black text-white border-gray-600 hover:bg-gray-800 flex items-center gap-2"
              onClick={() => window.open('#', '_blank')}
            >
              <Smartphone className="h-5 w-5" />
              <div className="text-left">
                <div className="text-xs">Download on</div>
                <div className="text-sm font-semibold">Google Play</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="bg-black text-white border-gray-600 hover:bg-gray-800 flex items-center gap-2"
              onClick={() => window.open('#', '_blank')}
            >
              <Smartphone className="h-5 w-5" />
              <div className="text-left">
                <div className="text-xs">Download on</div>
                <div className="text-sm font-semibold">App Store</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="flex justify-center mb-6">
          <div className="text-center">
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button 
                  onClick={() => navigate('/privacy-policy')} 
                  className="hover:text-white flex items-center gap-2 justify-center cursor-pointer"
                >
                  <Shield className="h-3 w-3" />
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-4 text-center text-sm text-gray-400">
          <p>&copy; 2024 Ezeyway. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}