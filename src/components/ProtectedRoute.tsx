import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useApp } from '@/contexts/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { state } = useApp();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If we have user in context, trust it (faster and more reliable)
        if (state.user) {
          console.log('ProtectedRoute: Using context user:', state.user.user_type);
          setHasAccess(true);
          setIsChecking(false);
          return;
        }

        // Fallback to authService check
        const isAuth = await authService.isAuthenticated();
        if (!isAuth) {
          console.log('ProtectedRoute: Not authenticated, redirecting to login');
          navigate('/login');
          return;
        }

        const user = await authService.getUser();
        if (!user) {
          console.log('ProtectedRoute: No user data, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('ProtectedRoute: Access granted for user:', user.user_type);
        setHasAccess(true);
      } catch (error) {
        console.error('ProtectedRoute auth check failed:', error);
        navigate('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate, state.user]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};