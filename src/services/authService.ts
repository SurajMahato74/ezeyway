import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

interface AuthData {
  token: string;
  user: any;
  lastActivity: number;
}

class AuthService {
  private isNative = Capacitor.isNativePlatform();

  // Set authentication data
  async setAuth(token: string, user: any): Promise<void> {
    const authData: AuthData = {
      token,
      user,
      lastActivity: Date.now()
    };

    if (this.isNative) {
      // Use Capacitor Preferences for mobile
      await Preferences.set({
        key: 'auth_token',
        value: token
      });
      await Preferences.set({
        key: 'auth_user',
        value: JSON.stringify(user)
      });
      await Preferences.set({
        key: 'last_activity',
        value: Date.now().toString()
      });
    } else {
      // Use localStorage for web
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  }

  // Get authentication token
  async getToken(): Promise<string | null> {
    if (this.isNative) {
      const result = await Preferences.get({ key: 'auth_token' });
      return result.value;
    } else {
      return localStorage.getItem('token');
    }
  }

  
  // Get user data
  async getUser(): Promise<any | null> {
    if (this.isNative) {
      const result = await Preferences.get({ key: 'auth_user' });
      return result.value ? JSON.parse(result.value) : null;
    } else {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    const user = await this.getUser();
    return !!(token && user);
  }

  // Update last activity
  async updateActivity(): Promise<void> {
    if (this.isNative) {
      await Preferences.set({
        key: 'last_activity',
        value: Date.now().toString()
      });
    } else {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  }

  // Get last activity
  async getLastActivity(): Promise<number | null> {
    if (this.isNative) {
      const result = await Preferences.get({ key: 'last_activity' });
      return result.value ? parseInt(result.value) : null;
    } else {
      const activity = localStorage.getItem('lastActivity');
      return activity ? parseInt(activity) : null;
      
    }
  }

  // Clear authentication data
  async clearAuth(): Promise<void> {
    console.log('🚨 clearAuth() called - Stack trace:');
    console.trace();
    
    if (this.isNative) {
      console.log('📱 Clearing native storage (Capacitor Preferences)');
      await Preferences.remove({ key: 'auth_token' });
      await Preferences.remove({ key: 'auth_user' });
      await Preferences.remove({ key: 'last_activity' });
      await Preferences.remove({ key: 'cart' });
      await Preferences.remove({ key: 'wishlist' });
    } else {
      console.log('🌐 Clearing web storage (localStorage)');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('cart');
      localStorage.removeItem('wishlist');
      localStorage.removeItem('userLocation');
      localStorage.removeItem('userLocationTimestamp');
    }
    
    console.log('✅ Auth cleared successfully');
  }

  // Set cart data
  async setCart(cart: any[]): Promise<void> {
    if (this.isNative) {
      await Preferences.set({
        key: 'cart',
        value: JSON.stringify(cart)
      });
    } else {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }

  // Get cart data
  async getCart(): Promise<any[]> {
    if (this.isNative) {
      const result = await Preferences.get({ key: 'cart' });
      return result.value ? JSON.parse(result.value) : [];
    } else {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
    }
  }

  // Set wishlist data
  async setWishlist(wishlist: any[]): Promise<void> {
    if (this.isNative) {
      await Preferences.set({
        key: 'wishlist',
        value: JSON.stringify(wishlist)
      });
    } else {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }

  // Get wishlist data
  async getWishlist(): Promise<any[]> {
    if (this.isNative) {
      const result = await Preferences.get({ key: 'wishlist' });
      return result.value ? JSON.parse(result.value) : [];
    } else {
      const wishlist = localStorage.getItem('wishlist');
      return wishlist ? JSON.parse(wishlist) : [];
    }
  }

  // Check session validity (7 days for mobile vendors - like Yango Pro)
  async isSessionValid(): Promise<boolean> {
    const lastActivity = await this.getLastActivity();
    if (!lastActivity) return false;
    
    // Extended session for mobile vendors (7 days)
    const sessionTimeout = this.isNative ? 
      7 * 24 * 60 * 60 * 1000 : // 7 days for mobile
      24 * 60 * 60 * 1000;      // 24 hours for web
    
    const timeDiff = Date.now() - lastActivity;
    
    return timeDiff <= sessionTimeout;
  }
  
  // Auto-login for vendors (persistent session)
  async autoLogin(): Promise<boolean> {
    const token = await this.getToken();
    const user = await this.getUser();
    
    if (token && user && user.user_type === 'vendor') {
      // Check if session is still valid
      const isValid = await this.isSessionValid();
      if (isValid) {
        // Update activity to keep session alive
        await this.updateActivity();
        console.log('🚀 Auto-login successful for vendor:', user.username);
        return true;
      } else {
        console.log('❌ Session expired, clearing auth');
        await this.clearAuth();
      }
    }
    
    return false;
  }
  
  // Keep vendor session alive (call periodically)
  async keepAlive(): Promise<void> {
    const isAuth = await this.isAuthenticated();
    if (isAuth) {
      await this.updateActivity();
    }
  }

  // Update user data
  async updateUser(user: any): Promise<void> {
    if (this.isNative) {
      await Preferences.set({
        key: 'auth_user',
        value: JSON.stringify(user)
      });
    } else {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
}

export const authService = new AuthService();