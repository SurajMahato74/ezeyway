import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, UserCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleAccessHelperProps {
  requiredRole: 'customer' | 'vendor';
  currentPage: string;
}

export function RoleAccessHelper({ requiredRole, currentPage }: RoleAccessHelperProps) {
  const { state } = useApp();
  const navigate = useNavigate();

  const user = state.user;
  const currentRole = user?.user_type;
  const availableRoles = user?.available_roles || [];

  // If user has the required role available, show switch option
  const canSwitchRole = availableRoles.includes(requiredRole);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <CardTitle>Role Access Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            <p>You need <strong>{requiredRole}</strong> access to view this page.</p>
            <p className="text-sm mt-2">
              Current role: <span className="font-medium">{currentRole}</span>
            </p>
          </div>

          {canSwitchRole ? (
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Good news!</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  You have {requiredRole} access available. Switch your role to continue.
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>{currentRole}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-medium">{requiredRole}</span>
              </div>

              <Button 
                onClick={() => {
                  // The RoleSwitcher component will handle the actual switching
                  // For now, we'll redirect to a page that has the role switcher
                  if (requiredRole === 'vendor') {
                    navigate('/vendor/onboarding');
                  } else {
                    navigate('/home');
                  }
                }}
                className="w-full"
              >
                Switch to {requiredRole === 'vendor' ? 'Vendor' : 'Customer'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-700">
                  You don't have {requiredRole} access yet.
                </p>
              </div>

              {requiredRole === 'vendor' ? (
                <Button 
                  onClick={() => navigate('/vendor/onboarding')}
                  className="w-full"
                >
                  Complete Vendor Onboarding
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/home')}
                  className="w-full"
                >
                  Go to Customer Area
                </Button>
              )}
            </div>
          )}

          <div className="pt-2 border-t">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}