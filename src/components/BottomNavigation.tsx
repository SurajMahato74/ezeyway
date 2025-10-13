import { Home, Search, Package , ShoppingCart, User, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const getNavItems = (cartCount: number) => [
  { icon: Home, label: "Home", id: "home", path: "/home" },
  { icon: Package , label: "Product", id: "search", path: "/search" },
  { icon: ShoppingCart, label: "Cart", id: "cart", path: "/cart", badge: cartCount > 0 ? cartCount : undefined },
  { icon: ClipboardList, label: "Orders", id: "orders", path: "/orders" },
  { icon: User, label: "Profile", id: "profile", path: "/profile" },
];

export function BottomNavigation() {
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  
  const navItems = getNavItems(cart?.total_items || 0);

  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = navItems.find(item => item.path === currentPath);
    if (activeItem) {
      setActiveTab(activeItem.id);
    }
  }, [location.pathname]);

  const handleNavigation = (id: string, path: string) => {
    setActiveTab(id);
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-20 md:h-14 max-w-lg mx-auto py-2 md:py-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.path)}
              className={`relative flex flex-col items-center justify-center p-4 md:p-2 transition-all duration-300 ease-in-out group ${
                isActive ? "text-black" : "text-gray-500 hover:text-black/80"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <item.icon
                  className={`h-6 w-6 md:h-5 md:w-5 transition-all duration-300 ease-in-out ${
                    isActive
                      ? "scale-110 drop-shadow-[0_0_6px_rgba(0,0,0,0.2)]"
                      : "group-hover:scale-105 group-hover:drop-shadow-[0_0_4px_rgba(0,0,0,0.1)]"
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold tracking-wide mt-1.5 font-sans">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-10 h-1 bg-black rounded-full shadow-[0_0_6px_rgba(0,0,0,0.3)] animate-scale-in" />
              )}
              <div
                className={`absolute inset-0 rounded-full bg-black/5 transition-all duration-300 ${
                  isActive ? "opacity-10 scale-105" : "opacity-0 group-hover:opacity-10 group-hover:scale-100"
                }`}
              />
            </button>
          );
        })}
      </div>
      <style>{`
        .animate-scale-in {
          animation: scale-in 0.3s ease-in-out;
        }
        @keyframes scale-in {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        .animate-bounce {
          animation: bounce 1.8s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-20%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </div>
  );
}