import { useNavigate, useLocation } from "react-router-dom";
import { User, Store } from "lucide-react";

interface LoginSwitcherProps {
  currentType: 'customer' | 'vendor';
}

export function LoginSwitcher({ currentType }: LoginSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitch = () => {
    const targetPath = currentType === 'customer' ? '/vendor/login' : '/login';
    navigate(targetPath, { state: location.state });
  };

  return (
    <div className="absolute top-4 right-4">
      <button
        onClick={handleSwitch}
        className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors underline"
      >
        {currentType === 'customer' ? (
          <>
            <Store className="h-4 w-4" />
            Vendor Login
          </>
        ) : (
          <>
            <User className="h-4 w-4" />
            Customer Login
          </>
        )}
      </button>
    </div>
  );
}