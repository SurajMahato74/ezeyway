import { useApp } from '@/contexts/AppContext';
import { apiRequest } from '@/utils/apiUtils';
import { useNavigate } from 'react-router-dom';

export function RoleSwitcher() {
  const { state, login } = useApp();
  const navigate = useNavigate();

  console.log('🎭 RoleSwitcher rendered, user:', state.user);
  console.log('🎭 Available roles:', state.user?.available_roles);
  console.log('🎭 Current user_type:', state.user?.user_type);

  const handleRoleSwitch = async (newRole: string) => {
    console.log('🔄 handleRoleSwitch called with role:', newRole);
    try {
      console.log('🔄 Attempting role switch to:', newRole);
      console.log('📋 Current user:', state.user);
      console.log('🔑 Current user_type:', state.user?.user_type);

      const { response, data } = await apiRequest('/switch-role/', {
        method: 'POST',
        body: JSON.stringify({ role: newRole })
      });

      console.log('📡 Switch role response:', response.status, data);

      if (response.ok) {
        console.log('✅ Role switch successful');
        // Update user data with new role
        const updatedUser = {
          ...state.user!,
          user_type: newRole
        };
        await login(updatedUser, ''); // Token remains the same

        // Navigate based on new role
        if (newRole === 'customer') {
          console.log('🏠 Navigating to customer home');
          navigate('/home');
        } else {
          console.log('🏪 Navigating to vendor dashboard');
          // For vendor role, check if profile exists and is approved
          try {
            const profileResponse = await apiRequest('/vendor/status/');
            if (profileResponse.response.ok && profileResponse.data.profile_exists && profileResponse.data.is_approved) {
              navigate('/vendor/dashboard');
            } else {
              navigate('/vendor/onboarding');
            }
          } catch (error) {
            // If we can't check profile status, go to onboarding
            navigate('/vendor/onboarding');
          }
        }
      } else {
        console.error('❌ Role switch failed:', data);
      }
    } catch (error) {
      console.error('💥 Role switch error:', error);
    }
  };

  if (!state.user?.available_roles || state.user.available_roles.length <= 1) {
    return null;
  }

  const otherRole = state.user.available_roles.find(role => role !== state.user!.user_type);

  return (
    <button
      onClick={() => handleRoleSwitch(otherRole!)}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
    >
      Switch to {otherRole === 'customer' ? 'Customer' : 'Vendor'}
    </button>
  );
}