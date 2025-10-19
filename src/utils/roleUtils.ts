import { apiRequest } from './apiUtils';
import { authService } from '@/services/authService';

export const ensureCorrectRole = async (requiredRole: 'customer' | 'vendor') => {
  try {
    const user = await authService.getUser();
    
    if (!user) {
      return { success: false, needsLogin: true };
    }
    
    // If user is already in the correct role, return success
    if (user.user_type === requiredRole) {
      return { success: true };
    }
    
    // Check if user has the required role available
    if (!user.available_roles?.includes(requiredRole)) {
      return { success: false, roleNotAvailable: true };
    }
    
    // Switch to the required role
    const switchResult = requiredRole === 'vendor' 
      ? await switchToVendorRole() 
      : await switchToCustomerRole();
    
    return switchResult;
  } catch (error) {
    console.error('Role ensure error:', error);
    return { success: false, error: error.message };
  }
};

export const switchToVendorRole = async () => {
  try {
    const user = await authService.getUser();
    
    if (!user?.available_roles?.includes('vendor')) {
      throw new Error('Vendor role not available');
    }
    
    if (user.user_type === 'vendor') {
      console.log('✅ Already in vendor role');
      return { success: true, message: 'Already in vendor role' };
    }
    
    console.log('🔄 Switching to vendor role...');
    const { response, data } = await apiRequest('/switch-role/', {
      method: 'POST',
      body: JSON.stringify({ role: 'vendor' })
    });

    if (response.ok) {
      console.log('✅ Role switch API call successful');
      
      // Get fresh token from response if provided
      const newToken = data?.token || await authService.getToken();
      const updatedUser = { ...user, user_type: 'vendor', current_role: 'vendor' };
      
      console.log('🔄 Updating auth services with vendor role...');
      
      // Update main auth service first
      await authService.setAuth(newToken, updatedUser);
      
      // Update vendor persistent auth
      const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
      await simplePersistentAuth.saveVendorLogin(newToken, updatedUser);
      
      console.log('✅ Auth services updated successfully');
      
      // Check if vendor profile exists, create if not
      try {
        const { response: profileResponse } = await apiRequest('/vendor-profiles/');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (!profileData.results || profileData.results.length === 0) {
            console.log('🏪 Creating vendor profile...');
            await createVendorProfile(user);
          }
        }
      } catch (profileError) {
        console.log('Profile check failed, will create on first access:', profileError);
      }
      
      return { success: true, message: 'Switched to vendor role', user: updatedUser };
    } else {
      console.error('❌ Role switch API failed:', response.status, data);
      throw new Error(data?.error || 'Role switch failed');
    }
  } catch (error) {
    console.error('💥 Role switch error:', error);
    return { success: false, error: error.message };
  }
};

export const switchToCustomerRole = async () => {
  try {
    const user = await authService.getUser();
    
    if (!user?.available_roles?.includes('customer')) {
      throw new Error('Customer role not available');
    }
    
    if (user.user_type === 'customer') {
      console.log('✅ Already in customer role');
      return { success: true, message: 'Already in customer role' };
    }
    
    console.log('🔄 Switching to customer role...');
    const { response, data } = await apiRequest('/switch-role/', {
      method: 'POST',
      body: JSON.stringify({ role: 'customer' })
    });

    if (response.ok) {
      console.log('✅ Role switch API call successful');
      
      // Get fresh token from response if provided
      const newToken = data?.token || await authService.getToken();
      const updatedUser = { ...user, user_type: 'customer', current_role: 'customer' };
      
      console.log('🔄 Updating auth services with customer role...');
      
      // Update main auth service
      await authService.setAuth(newToken, updatedUser);
      
      // Keep vendor auth for future role switches but don't clear it
      // This allows seamless switching between roles
      
      console.log('✅ Auth services updated successfully');
      
      return { success: true, message: 'Switched to customer role', user: updatedUser };
    } else {
      console.error('❌ Role switch API failed:', response.status, data);
      throw new Error(data?.error || 'Role switch failed');
    }
  } catch (error) {
    console.error('💥 Role switch error:', error);
    return { success: false, error: error.message };
  }
};

export const checkVendorAccess = async () => {
  try {
    const user = await authService.getUser();
    
    if (!user) {
      return { hasAccess: false, needsLogin: true };
    }
    
    const hasVendorRole = user.available_roles?.includes('vendor');
    
    if (!hasVendorRole) {
      return { hasAccess: false, needsOnboarding: true };
    }
    
    if (user.user_type === 'customer') {
      return { hasAccess: true, needsRoleSwitch: true };
    }
    
    return { hasAccess: true, needsRoleSwitch: false };
  } catch (error) {
    console.error('Vendor access check error:', error);
    return { hasAccess: false, needsLogin: true };
  }
};

const createVendorProfile = async (user: any) => {
  try {
    const profileData = {
      business_name: user.username || 'My Business',
      owner_name: user.username || 'Owner',
      business_email: user.email || '',
      business_phone: user.phone_number || '',
      business_address: '',
      city: '',
      state: '',
      pincode: '',
      business_type: 'retailer',
      categories: [],
      description: '',
      is_active: true
    };
    
    const { response } = await apiRequest('/vendor-profiles/', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
    
    if (response.ok) {
      console.log('Vendor profile created successfully');
    }
  } catch (error) {
    console.error('Failed to create vendor profile:', error);
  }
};

export const checkCustomerAccess = async () => {
  try {
    const user = await authService.getUser();
    
    if (!user) {
      return { hasAccess: false, needsLogin: true };
    }
    
    const hasCustomerRole = user.available_roles?.includes('customer');
    
    if (!hasCustomerRole) {
      return { hasAccess: false, needsLogin: true };
    }
    
    if (user.user_type === 'vendor') {
      return { hasAccess: true, needsRoleSwitch: true };
    }
    
    return { hasAccess: true, needsRoleSwitch: false };
  } catch (error) {
    console.error('Customer access check error:', error);
    return { hasAccess: false, needsLogin: true };
  }
};