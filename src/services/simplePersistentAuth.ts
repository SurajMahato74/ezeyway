import { Capacitor } from '@capacitor/core';

class SimplePersistentAuth {
  async saveVendorLogin(token: string, user: any) {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key: 'vendor_token', value: token });
        await Preferences.set({ key: 'vendor_user', value: JSON.stringify(user) });
        await Preferences.set({ key: 'vendor_time', value: Date.now().toString() });
      } else {
        localStorage.setItem('vendor_token', token);
        localStorage.setItem('vendor_user', JSON.stringify(user));
        localStorage.setItem('vendor_time', Date.now().toString());
      }
      console.log('✅ Vendor login saved');
    } catch (error) {
      console.error('Save vendor login failed:', error);
    }
  }

  async getVendorAuth(): Promise<{ token: string; user: any } | null> {
    try {
      let token: string | null = null;
      let userStr: string | null = null;
      let timeStr: string | null = null;

      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        const tokenResult = await Preferences.get({ key: 'vendor_token' });
        const userResult = await Preferences.get({ key: 'vendor_user' });
        const timeResult = await Preferences.get({ key: 'vendor_time' });
        
        token = tokenResult.value;
        userStr = userResult.value;
        timeStr = timeResult.value;
      } else {
        token = localStorage.getItem('vendor_token');
        userStr = localStorage.getItem('vendor_user');
        timeStr = localStorage.getItem('vendor_time');
      }

      if (!token || !userStr || !timeStr) {
        return null;
      }

      // Check if still valid (30 days)
      const loginTime = parseInt(timeStr);
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      if (Date.now() - loginTime > maxAge) {
        await this.clearVendorAuth();
        return null;
      }

      const user = JSON.parse(userStr);
      console.log('✅ Vendor auth found:', user.username);
      return { token, user };
    } catch (error) {
      console.error('Get vendor auth failed:', error);
      return null;
    }
  }

  async clearVendorAuth() {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: 'vendor_token' });
        await Preferences.remove({ key: 'vendor_user' });
        await Preferences.remove({ key: 'vendor_time' });
      } else {
        localStorage.removeItem('vendor_token');
        localStorage.removeItem('vendor_user');
        localStorage.removeItem('vendor_time');
      }
      console.log('🗑️ Vendor auth cleared');
    } catch (error) {
      console.error('Clear vendor auth failed:', error);
    }
  }

  async isVendorLoggedIn(): Promise<boolean> {
    const auth = await this.getVendorAuth();
    return auth !== null && auth.user?.user_type === 'vendor';
  }
}

export const simplePersistentAuth = new SimplePersistentAuth();