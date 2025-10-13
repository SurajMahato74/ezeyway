import { getApiUrl } from '@/config/api';
import { authService } from '@/services/authService';
const API_BASE_URL = getApiUrl('');

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    images: Array<{
      id: number;
      image_url: string;
      is_primary: boolean;
    }>;
    vendor_name: string;
  };
  quantity: number;
  total_price: number;
}

interface Cart {
  id: number;
  items: CartItem[];
  total_items: number;
  subtotal: number;
}

class CartService {
  private async getAuthHeaders() {
    const token = await authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
      'ngrok-skip-browser-warning': 'true',
    };
  }

  async getCart(): Promise<Cart> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch(`${API_BASE_URL}cart/`, {
      headers: await this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }
    
    return response.json();
  }

  async addToCart(productId: number, quantity: number = 1): Promise<Cart> {
    const response = await fetch(`${API_BASE_URL}/cart/add/`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        product_id: productId,
        quantity: quantity,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add item to cart');
    }
    
    const data = await response.json();
    return data.cart;
  }

  async updateCartItem(itemId: number, quantity: number): Promise<Cart> {
    const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}/update/`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update cart item');
    }
    
    const data = await response.json();
    return data.cart;
  }

  async removeFromCart(itemId: number): Promise<Cart> {
    const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}/remove/`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove item from cart');
    }
    
    const data = await response.json();
    return data.cart;
  }

  async clearCart(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cart/clear/`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }
  }
}

export const cartService = new CartService();
export type { Cart, CartItem };