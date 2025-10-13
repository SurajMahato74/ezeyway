import { Capacitor } from '@capacitor/core';
import { authService } from './authService';

class MobilePersistentAuth {
  private isInitialized = false;
  private isRestoring = false;

  async initialize() {
    if (this.isInitialized || !Capacitor.isNativePlatform()) return;

    try {
      const { App } = await import('@capacitor/app');
      
      // Handle app resume - restore session (with debounce)
      App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive && !this.isRestoring) {
          console.log('📱 App resumed - checking persistent login');
          await this.restoreSession();
        }
      });

      // Initial session restore
      await this.restoreSession();
      
      this.isInitialized = true;
      console.log('🔐 Mobile persistent auth initialized');
    } catch (error) {
      console.warn('Mobile persistent auth failed:', error);
    }
  }

  async restoreSession(): Promise<boolean> {
    if (this.isRestoring) return false;
    
    this.isRestoring = true;
    try {
      const token = await authService.getToken();
      const user = await authService.getUser();
      
      if (token && user && user.user_type === 'vendor') {
        // Update activity to keep session alive
        await authService.updateActivity();
        console.log('✅ Session restored for vendor:', user.username);
        return true;
      }
      
      console.log('❌ No valid session to restore');
      return false;
    } catch (error) {
      console.error('Session restore failed:', error);
      return false;
    } finally {
      this.isRestoring = false;
    }
  }

  async ensureAuthenticated(): Promise<boolean> {
    // First try to restore existing session
    const restored = await this.restoreSession();
    if (restored) return true;

    // Check if we have valid auth data
    const isAuth = await authService.isAuthenticated();
    if (isAuth) {
      const isValid = await authService.isSessionValid();
      if (isValid) {
        await authService.updateActivity();
        return true;
      }
    }

    return false;
  }
}

export const mobilePersistentAuth = new MobilePersistentAuth();