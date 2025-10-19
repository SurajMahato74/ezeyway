import { API_BASE } from '@/config/api';
import { authService } from '@/services/authService';
import { tempCartService } from './tempCartService';

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
    vendor_id?: number;
    // Delivery properties
    free_delivery?: boolean;
    custom_delivery_fee_enabled?: boolean;
    custom_delivery_fee?: number | null;
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
    
    try {
      console.log('Fetching cart from:', `${API_BASE}cart/`);
      const response = await fetch(`${API_BASE}cart/`, {
        headers: await this.getAuthHeaders(),
      });
      
      console.log('Cart response status:', response.status);
      const data = await response.json();
      console.log('Cart response data:', data);
      
      // Check if this is the Django welcome message (cart endpoints not implemented)
      if (data.message && data.message.includes('Welcome to Ezeyway Django API')) {
        console.log('Cart endpoints not implemented, using temporary cart service');
        return await tempCartService.getCart();
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.status} - ${JSON.stringify(data)}`);
      }
      
      return data;
    } catch (error) {
      console.log('Cart API failed, using temporary cart service:', error);
      return await tempCartService.getCart();
    }
  }

  async addToCart(productId: number, quantity: number = 1): Promise<Cart> {
    try {
      console.log('Adding to cart:', { productId, quantity });
      console.log('Add to cart URL:', `${API_BASE}cart/add/`);
      
      const response = await fetch(`${API_BASE}cart/add/`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
        }),
      });
      
      console.log('Add to cart response status:', response.status);
      const data = await response.json();
      console.log('Add to cart response data:', data);
      
      // Check if this is the Django welcome message (cart endpoints not implemented)
      if (data.message && data.message.includes('Welcome to Ezeyway Django API')) {
        console.log('Cart endpoints not implemented, using temporary cart service');
        return await tempCartService.addToCart(productId, quantity);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to add item to cart: ${response.status} - ${JSON.stringify(data)}`);
      }
      
      return data.cart || data;
    } catch (error) {
      console.log('Cart API failed, using temporary cart service:', error);
      return await tempCartService.addToCart(productId, quantity);
    }
  }

  async updateCartItem(itemId: number, quantity: number): Promise<Cart> {
    try {
      const response = await fetch(`${API_BASE}cart/items/${itemId}/update/`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ quantity }),
      });
      
      const data = await response.json();
      
      if (data.message && data.message.includes('Welcome to Ezeyway Django API')) {
        return await tempCartService.updateCartItem(itemId, quantity);
      }
      
      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }
      
      return data.cart;
    } catch (error) {
      return await tempCartService.updateCartItem(itemId, quantity);
    }
  }

  async removeFromCart(itemId: number): Promise<Cart> {
    try {
      const response = await fetch(`${API_BASE}cart/items/${itemId}/remove/`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (data.message && data.message.includes('Welcome to Ezeyway Django API')) {
        return await tempCartService.removeFromCart(itemId);
      }
      
      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }
      
      return data.cart;
    } catch (error) {
      return await tempCartService.removeFromCart(itemId);
    }
  }

  async clearCart(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}cart/clear/`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (data.message && data.message.includes('Welcome to Ezeyway Django API')) {
        return await tempCartService.clearCart();
      }
      
      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }
    } catch (error) {
      return await tempCartService.clearCart();
    }
  }
}

export const cartService = new CartService();
export type { Cart, CartItem };