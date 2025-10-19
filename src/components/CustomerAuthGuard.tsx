import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useApp } from '@/contexts/AppContext';

interface CustomerAuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function CustomerAuthGuard({ children, redirectTo = '/login' }: CustomerAuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const { state } = useApp();

  useEffect(() => {
    checkAccess();
  }, [state.user]);

  const checkAccess = async () => {
    try {
      // Get user from context first (most reliable)
      const user = state.user;
      if (user) {
        // User is in context, check if they have customer access
        if (!user.available_roles?.includes('customer')) {
          console.log('CustomerAuthGuard: Customer role not available, user type:', user.user_type);
          setHasAccess(false);
          return;
        }
        console.log('CustomerAuthGuard: Access granted for user:', user.user_type);
        setHasAccess(true);
        return;
      }

      // Fallback to authService if no context user
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        console.log('CustomerAuthGuard: Not authenticated');
        setHasAccess(false);
        return;
      }

      const authUser = await authService.getUser();
      if (!authUser) {
        console.log('CustomerAuthGuard: No user data');
        setHasAccess(false);
        return;
      }

      // Check if user has customer role available
      if (!authUser.available_roles?.includes('customer')) {
        console.log('CustomerAuthGuard: Customer role not available, user type:', authUser.user_type);
        setHasAccess(false);
        return;
      }

      console.log('CustomerAuthGuard: Access granted for user:', authUser.user_type);
      setHasAccess(true);
    } catch (error) {
      console.error('Customer auth guard error:', error);
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // Always render children - let the Orders page handle unauthenticated state
  // if (!hasAccess) {
  //   return null;
  // }

  return <>{children}</>;
}