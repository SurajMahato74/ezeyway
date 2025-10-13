import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { authService } from '@/services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { dispatch } = useApp();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        
        if (isAuthenticated) {
          const isSessionValid = await authService.isSessionValid();
          
          if (!isSessionValid) {
            // Session expired, clear auth data
            await authService.clearAuth();
          }
          // Don't set user in context here - let SplashScreen handle routing
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  if (!isInitialized) {
    // Show loading screen while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};