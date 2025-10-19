import { authService } from '@/services/authService';

export const verifyAuthentication = async () => {
  try {
    console.log('🔍 Starting authentication verification...');
    
    // Check main auth service
    const mainToken = await authService.getToken();
    const mainUser = await authService.getUser();
    
    console.log('📊 Main Auth Service:', {
      hasToken: !!mainToken,
      tokenPreview: mainToken ? `${mainToken.substring(0, 10)}...` : 'NO TOKEN',
      hasUser: !!mainUser,
      userType: mainUser?.user_type,
      availableRoles: mainUser?.available_roles
    });
    
    // Check vendor persistent auth
    try {
      const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
      const vendorAuth = await simplePersistentAuth.getVendorAuth();
      
      console.log('📊 Vendor Persistent Auth:', {
        hasVendorAuth: !!vendorAuth,
        tokenPreview: vendorAuth?.token ? `${vendorAuth.token.substring(0, 10)}...` : 'NO TOKEN',
        hasUser: !!vendorAuth?.user,
        userType: vendorAuth?.user?.user_type,
        isVendorLoggedIn: await simplePersistentAuth.isVendorLoggedIn()
      });
      
      // Check token consistency
      if (mainToken && vendorAuth?.token && mainToken !== vendorAuth.token) {
        console.log('⚠️ TOKEN MISMATCH DETECTED!');
        console.log('Main token:', mainToken.substring(0, 15) + '...');
        console.log('Vendor token:', vendorAuth.token.substring(0, 15) + '...');
        
        // Sync tokens - use vendor token as source of truth for vendor pages
        if (window.location.pathname.startsWith('/vendor')) {
          console.log('🔄 Syncing main auth with vendor token...');
          await authService.setAuth(vendorAuth.token, vendorAuth.user);
        }
      }
      
    } catch (vendorAuthError) {
      console.error('❌ Error checking vendor auth:', vendorAuthError);
    }
    
    // Check localStorage directly
    if (typeof localStorage !== 'undefined') {
      const localToken = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      const vendorToken = localStorage.getItem('vendor_token');
      const vendorUser = localStorage.getItem('vendor_user');
      
      console.log('📊 LocalStorage Direct Check:', {
        hasLocalToken: !!localToken,
        hasLocalUser: !!localUser,
        hasVendorToken: !!vendorToken,
        hasVendorUser: !!vendorUser,
        localTokenPreview: localToken ? `${localToken.substring(0, 10)}...` : 'NO TOKEN',
        vendorTokenPreview: vendorToken ? `${vendorToken.substring(0, 10)}...` : 'NO TOKEN'
      });
    }
    
    return {
      mainAuth: { token: mainToken, user: mainUser },
      isAuthenticated: !!(mainToken && mainUser)
    };
    
  } catch (error) {
    console.error('❌ Authentication verification failed:', error);
    return {
      mainAuth: { token: null, user: null },
      isAuthenticated: false,
      error: error.message
    };
  }
};

export const fixAuthenticationIssues = async () => {
  try {
    console.log('🔧 Attempting to fix authentication issues...');
    
    const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
    const vendorAuth = await simplePersistentAuth.getVendorAuth();
    
    if (vendorAuth?.token && vendorAuth?.user) {
      console.log('🔄 Found vendor auth, syncing with main auth...');
      await authService.setAuth(vendorAuth.token, vendorAuth.user);
      console.log('✅ Auth sync completed');
      return true;
    } else {
      console.log('❌ No valid vendor auth found to sync');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to fix authentication issues:', error);
    return false;
  }
};