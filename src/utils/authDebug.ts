import { authService } from '@/services/authService';

export const debugAuth = async () => {
  console.log('🔍 AUTH DEBUG START');
  
  const token = await authService.getToken();
  const user = await authService.getUser();
  const isAuth = await authService.isAuthenticated();
  
  console.log('📋 Auth Status:', {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 10)}...` : 'null',
    hasUser: !!user,
    userId: user?.id,
    userType: user?.user_type,
    isAuthenticated: isAuth
  });
  
  // Check localStorage directly
  const directToken = localStorage.getItem('token');
  const directUser = localStorage.getItem('user');
  
  console.log('💾 Direct Storage:', {
    directToken: directToken ? `${directToken.substring(0, 10)}...` : 'null',
    directUser: directUser ? 'exists' : 'null',
    allKeys: Object.keys(localStorage)
  });
  
  console.log('🔍 AUTH DEBUG END');
  
  return { token, user, isAuth };
};

export const testAuthHeaders = async () => {
  const token = await authService.getToken();
  
  const headers = {
    'Bearer': `Bearer ${token}`,
    'Token': `Token ${token}`,
    'JWT': `JWT ${token}`,
    'Authorization': token,
  };
  
  console.log('🔑 Possible Auth Headers:', headers);
  return headers;
};