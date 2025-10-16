import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ensureCorrectRole } from '@/utils/roleUtils';

interface VendorAuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function VendorAuthGuard({ children, redirectTo = '/vendor/login' }: VendorAuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const result = await ensureCorrectRole('vendor');
      
      if (result.success) {
        setHasAccess(true);
      } else if (result.needsLogin) {
        navigate(redirectTo);
      } else if (result.roleNotAvailable) {
        navigate('/vendor/onboarding');
      } else {
        navigate(redirectTo);
      }
    } catch (error) {
      console.error('Vendor auth guard error:', error);
      navigate(redirectTo);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}