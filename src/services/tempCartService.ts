import { API_BASE } from '@/config/api';
import { authService } from '@/services/authService';

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

class TempCartService {
  private CART_STORAGE_KEY = 'temp_cart';

  private async getAuthHeaders() {
    const token = await authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
      'ngrok-skip-browser-warning': 'true',
    };
  }

  private getStoredCart(): Cart {
    const stored = localStorage.getItem(this.CART_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored cart:', e);
      }
    }
    return {
      id: 1,
      items: [],
      total_items: 0,
      subtotal: 0
    };
  }

  private saveCart(cart: Cart): void {
    localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
  }

  private async fetchProductDetails(productId: number) {
    try {
      const response = await fetch(`${API_BASE}search/products/?search=${productId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      const product = data.results?.find(p => p.id === productId);
      
      if (product) {
        const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
        return {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          images: product.images || [],
          vendor_name: product.vendor_name || 'Unknown Vendor',
          vendor_id: product.vendor_id,
          // Include delivery properties
          free_delivery: product.free_delivery,
          custom_delivery_fee_enabled: product.custom_delivery_fee_enabled,
          custom_delivery_fee: product.custom_delivery_fee
        };
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    }
    
    // Fallback product data
    return {
      id: productId,
      name: `Product ${productId}`,
      price: 0,
      images: [],
      vendor_name: 'Unknown Vendor',
      vendor_id: null,
      // Default delivery properties
      free_delivery: false,
      custom_delivery_fee_enabled: false,
      custom_delivery_fee: null
    };
  }

  async getCart(): Promise<Cart> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    return this.getStoredCart();
  }

  async addToCart(productId: number, quantity: number = 1): Promise<Cart> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const cart = this.getStoredCart();
    const existingItem = cart.items.find(item => item.product.id === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total_price = existingItem.product.price * existingItem.quantity;
    } else {
      const productDetails = await this.fetchProductDetails(productId);
      const newItem: CartItem = {
        id: Date.now(), // Temporary ID
        product: productDetails,
        quantity: quantity,
        total_price: productDetails.price * quantity
      };
      cart.items.push(newItem);
    }
    
    // Recalculate totals
    cart.total_items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total_price, 0);
    
    this.saveCart(cart);
    return cart;
  }

  async updateCartItem(itemId: number, quantity: number): Promise<Cart> {
    const cart = this.getStoredCart();
    const item = cart.items.find(item => item.id === itemId);
    
    if (item) {
      item.quantity = quantity;
      item.total_price = item.product.price * quantity;
      
      // Recalculate totals
      cart.total_items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      cart.subtotal = cart.items.reduce((sum, item) => sum + item.total_price, 0);
      
      this.saveCart(cart);
    }
    
    return cart;
  }

  async removeFromCart(itemId: number): Promise<Cart> {
    const cart = this.getStoredCart();
    cart.items = cart.items.filter(item => item.id !== itemId);
    
    // Recalculate totals
    cart.total_items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total_price, 0);
    
    this.saveCart(cart);
    return cart;
  }

  async clearCart(): Promise<void> {
    localStorage.removeItem(this.CART_STORAGE_KEY);
  }
}

export const tempCartService = new TempCartService();
export type { Cart, CartItem };