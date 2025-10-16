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
      return { success: true, message: 'Already in vendor role' };
    }
    
    const { response, data } = await apiRequest('/switch-role/', {
      method: 'POST',
      body: JSON.stringify({ role: 'vendor' })
    });

    if (response.ok) {
      const updatedUser = { ...user, user_type: 'vendor' };
      const token = await authService.getToken();
      
      await authService.setAuth(token, updatedUser);
      const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
      await simplePersistentAuth.saveVendorLogin(token, updatedUser);
      
      return { success: true, message: 'Switched to vendor role' };
    } else {
      throw new Error(data?.error || 'Role switch failed');
    }
  } catch (error) {
    console.error('Role switch error:', error);
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
      return { success: true, message: 'Already in customer role' };
    }
    
    const { response, data } = await apiRequest('/switch-role/', {
      method: 'POST',
      body: JSON.stringify({ role: 'customer' })
    });

    if (response.ok) {
      const updatedUser = { ...user, user_type: 'customer' };
      const token = await authService.getToken();
      
      // Update main auth service
      await authService.setAuth(token, updatedUser);
      
      // Clear vendor-specific storage when switching to customer
      const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
      await simplePersistentAuth.clearVendorAuth();
      
      return { success: true, message: 'Switched to customer role' };
    } else {
      throw new Error(data?.error || 'Role switch failed');
    }
  } catch (error) {
    console.error('Role switch error:', error);
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