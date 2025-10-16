import { authService } from '@/services/authService';
import { apiRequest } from './apiUtils';

export const filterOwnProducts = async (products: any[]) => {
  try {
    const user = await authService.getUser();
    
    // If user is not logged in or doesn't have vendor role, return all products
    if (!user || !user.available_roles?.includes('vendor')) {
      return products;
    }
    
    // Get vendor profile to find vendor ID
    const { response, data } = await apiRequest('/vendor-profiles/');
    
    if (!response.ok || !data?.results?.length) {
      return products;
    }
    
    const vendorProfile = data.results[0];
    const vendorId = vendorProfile.id;
    
    // Filter out products from the same vendor
    return products.filter(product => product.vendor_id !== vendorId);
  } catch (error) {
    console.error('Error filtering own products:', error);
    return products; // Return all products if filtering fails
  }
};