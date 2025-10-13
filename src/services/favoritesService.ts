import { API_CONFIG } from '@/config/api';
import { authService } from '@/services/authService';
const API_BASE = API_CONFIG.BASE_URL;

export interface FavoriteProduct {
  id: number;
  product: {
    id: number;
    name: string;
    price: string;
    images: Array<{
      id: number;
      image_url: string;
      is_primary: boolean;
    }>;
    vendor_name: string;
    vendor_id: number;
    quantity: number;
    description: string;
  };
  created_at: string;
}

class FavoritesService {
  private async getAuthHeaders() {
    const token = await authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
      'ngrok-skip-browser-warning': 'true',
    };
  }

  async getFavorites(): Promise<FavoriteProduct[]> {
    try {
      const response = await fetch(`${API_BASE}/favorites/`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      return data.results || data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  async toggleFavorite(productId: number): Promise<{ message: string; is_favorite: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/favorites/toggle/`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
}

export const favoritesService = new FavoritesService();