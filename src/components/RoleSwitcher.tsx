import { useApp } from '@/contexts/AppContext';
import { switchToVendorRole, switchToCustomerRole } from '@/utils/roleUtils';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { authService } from '@/services/authService';

export function RoleSwitcher() {
  const { state, login } = useApp();
  const navigate = useNavigate();

  console.log('🎭 RoleSwitcher rendered, user:', state.user);
  console.log('🎭 Available roles:', state.user?.available_roles);
  console.log('🎭 Available roles length:', state.user?.available_roles?.length);
  console.log('🎭 Current role:', state.user?.current_role || state.user?.user_type);
  console.log('🎭 User type:', state.user?.user_type);
  console.log('🎭 Roles check condition:', !state.user?.available_roles || state.user.available_roles.length <= 1);

  // Remove the infinite loop causing useEffect

  const handleRoleSwitch = async (newRole: string) => {
    console.log('🔄 handleRoleSwitch called with role:', newRole);
    try {
      if (newRole === 'vendor') {
        // Check if user already has vendor role
        if (state.user?.available_roles?.includes('vendor')) {
          // User has vendor role, just switch
          const switchResult = await switchToVendorRole();
          if (switchResult.success) {
            const updatedUser = { ...state.user!, user_type: 'vendor', current_role: 'vendor' };
            const token = await authService.getToken();
            await login(updatedUser, token);
            // Add a small delay to ensure state is updated
            setTimeout(() => navigate('/vendor/dashboard'), 100);
          }
        } else {
          // User doesn't have vendor role, start onboarding
          console.log('🚀 Starting vendor onboarding for customer');
          navigate('/vendor/onboarding');
        }
      } else {
        // Switch to customer
        const switchResult = await switchToCustomerRole();
        if (switchResult.success) {
          const updatedUser = { ...state.user!, user_type: 'customer', current_role: 'customer' };
          const token = await authService.getToken();
          await login(updatedUser, token);
          // Add a small delay to ensure state is updated
          setTimeout(() => navigate('/home'), 100);
        }
      }
    } catch (error) {
      console.error('💥 Role switch error:', error);
    }
  };

  // Show "Become a Vendor" button for customers without vendor role
  if (!state.user?.available_roles || state.user.available_roles.length <= 1) {
    const isCustomer = state.user?.user_type === 'customer';
    if (isCustomer && !state.user?.available_roles?.includes('vendor')) {
      return (
        <button
          onClick={() => handleRoleSwitch('vendor')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium w-full"
        >
          Become a Vendor
        </button>
      );
    }
    
    console.log('🚫 RoleSwitcher: Not showing button - insufficient roles');
    console.log('Available roles:', state.user?.available_roles);
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Role switching not available</p>
        <p className="text-xs text-gray-500 mt-1">
          Current role: {state.user?.current_role || state.user?.user_type || 'Unknown'}
        </p>
      </div>
    );
  }

  // Determine current role based on URL context
  const isOnVendorPage = window.location.pathname.startsWith('/vendor');
  const currentRole = isOnVendorPage ? 'vendor' : 'customer';
  const otherRole = currentRole === 'vendor' ? 'customer' : 'vendor';
  
  console.log('🌐 Current page context:', { isOnVendorPage, currentRole, otherRole });

  if (!otherRole) {
    console.log('🚫 RoleSwitcher: No other role found');
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">No other roles available</p>
        <p className="text-xs text-gray-500 mt-1">
          Current role: {state.user?.current_role || state.user?.user_type || 'Unknown'}
        </p>
      </div>
    );
  }

  console.log('✅ RoleSwitcher: Showing button for role switch to:', otherRole);

  return (
    <button
      onClick={() => handleRoleSwitch(otherRole)}
      className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 text-sm font-semibold w-full shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20 backdrop-blur-sm"
    >
      <span className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Switch to {otherRole === 'customer' ? 'Customer' : 'Vendor'}
      </span>
    </button>
  );
}