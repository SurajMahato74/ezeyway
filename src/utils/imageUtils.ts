import { API_CONFIG } from '@/config/api';

export const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return '/placeholder-product.jpg';
  }

  // If it's already a full URL with ngrok, add bypass parameters
  if (imageUrl.includes('ngrok-free.app')) {
    const url = new URL(imageUrl);
    url.searchParams.set('ngrok-skip-browser-warning', 'true');
    return url.toString();
  }

  // If it's a relative path, construct full URL with bypass
  if (imageUrl.startsWith('/media/') || imageUrl.startsWith('media/')) {
    const fullUrl = `${API_CONFIG.BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
    const url = new URL(fullUrl);
    url.searchParams.set('ngrok-skip-browser-warning', 'true');
    return url.toString();
  }

  // If it's already a complete URL (not ngrok), return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // Default case - construct URL with bypass
  const fullUrl = `${API_CONFIG.BASE_URL}/media/${imageUrl}`;
  const url = new URL(fullUrl);
  url.searchParams.set('ngrok-skip-browser-warning', 'true');
  return url.toString();
};