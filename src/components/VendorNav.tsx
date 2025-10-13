import { useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingBag, Plus, Package, Settings } from "lucide-react";
import { useState } from "react";
import AddProduct from "@/pages/vendor/AddProduct";

const vendorNavigationItems = [
  { title: "Home", url: "/vendor/dashboard", icon: Home },
  { title: "Orders", url: "/vendor/orders", icon: ShoppingBag },
  { title: "Products", url: "/vendor/products", icon: Package },
  { title: "Settings", url: "/vendor/settings", icon: Settings },
];

const VendorSidebar: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
    </>
  );
};


// Vendor Bottom Navigation Component
const VendorBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 w-full z-50">
      {/* Floating Add Button */}
      <div className="absolute left-1/2 transform -translate-x-1/2 -top-6 z-10">
        <AddProduct />
      </div>
      
      {/* Navigation Bar with curved cutout */}
      <nav className="bg-gradient-to-r from-slate-50 to-white shadow-2xl border-t border-gray-100 relative overflow-hidden backdrop-blur-sm pb-safe-bottom">
        {/* Create curved cutout using clip-path */}
        <div 
          className="absolute inset-0 bg-white"
          style={{
            clipPath: 'polygon(0 0, calc(50% - 32px) 0, calc(50% - 24px) 16px, calc(50% + 24px) 16px, calc(50% + 32px) 0, 100% 0, 100% 100%, 0 100%)'
          }}
        ></div>
        
        <div className="relative flex justify-around items-center px-safe-x py-2 pt-4">
          {vendorNavigationItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url;

            return (
              <button
                key={item.title}
                onClick={() => navigate(item.url)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                  isActive
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'
                }`}
                aria-label={item.title}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.title}</span>
              </button>
            );
          })}
          
          {/* Spacer for center floating button */}
          <div className="w-16"></div>
          
          {vendorNavigationItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url;

            return (
              <button
                key={item.title}
                onClick={() => navigate(item.url)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                  isActive
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'
                }`}
                aria-label={item.title}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.title}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export { VendorBottomNav };
export default VendorSidebar;