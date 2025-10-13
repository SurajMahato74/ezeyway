import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export interface AppState {
  user: any;
  cart: any[];
  wishlist: any[];
  currentRoute: string;
  lastActiveTime: number;
  isAuthenticated: boolean;
}

class AppLifecycleService {
  private static instance: AppLifecycleService;
  private appStateListeners: ((state: 'active' | 'background') => void)[] = [];
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  static getInstance(): AppLifecycleService {
    if (!AppLifecycleService.instance) {
      AppLifecycleService.instance = new AppLifecycleService();
    }
    return AppLifecycleService.instance;
  }

  async initialize() {
    try {
      // Only add listeners on native platforms
      if (Capacitor.isNativePlatform()) {
        // Listen for app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            this.handleAppResume();
          } else {
            this.handleAppPause();
          }
        });

        // Listen for back button
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            this.handleAppPause();
            App.exitApp();
          }
        });
      } else {
        // Web fallback - use visibility API
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
              this.handleAppPause();
            } else {
              this.handleAppResume();
            }
          });
        }
      }

      // Restore app state on startup
      await this.restoreAppState();
    } catch (error) {
      console.error('Failed to initialize app lifecycle service:', error);
    }
  }

  private async handleAppPause() {
    console.log('App paused - saving state');
    await this.saveAppState();
    this.notifyListeners('background');
  }

  private async handleAppResume() {
    console.log('App resumed - checking session');
    const isSessionValid = await this.checkSessionValidity();
    
    if (isSessionValid) {
      await this.restoreAppState();
      this.notifyListeners('active');
    } else {
      await this.clearExpiredSession();
    }
  }

  async saveAppState() {
    try {
      const currentState: AppState = {
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        cart: JSON.parse(localStorage.getItem('cart') || '[]'),
        wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]'),
        currentRoute: window.location.pathname,
        lastActiveTime: Date.now(),
        isAuthenticated: !!localStorage.getItem('token')
      };

      if (Capacitor.isNativePlatform()) {
        await Preferences.set({
          key: 'appState',
          value: JSON.stringify(currentState)
        });

        // Also save token separately for security
        const token = localStorage.getItem('token');
        if (token) {
          await Preferences.set({
            key: 'authToken',
            value: token
          });
        }
      } else {
        // Web fallback - use localStorage with prefix
        localStorage.setItem('capacitor_appState', JSON.stringify(currentState));
        const token = localStorage.getItem('token');
        if (token) {
          localStorage.setItem('capacitor_authToken', token);
        }
      }

      console.log('App state saved successfully');
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  }

  async restoreAppState() {
    try {
      let value: string | null = null;
      
      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key: 'appState' });
        value = result.value;
      } else {
        // Web fallback
        value = localStorage.getItem('capacitor_appState');
      }
      
      if (value) {
        const appState: AppState = JSON.parse(value);
        
        // Check if session is still valid
        const timeDiff = Date.now() - appState.lastActiveTime;
        if (timeDiff < this.sessionTimeout) {
          // Restore state to localStorage
          if (appState.user) {
            localStorage.setItem('user', JSON.stringify(appState.user));
          }
          localStorage.setItem('cart', JSON.stringify(appState.cart));
          localStorage.setItem('wishlist', JSON.stringify(appState.wishlist));
          
          // Restore auth token
          let token: string | null = null;
          if (Capacitor.isNativePlatform()) {
            const result = await Preferences.get({ key: 'authToken' });
            token = result.value;
          } else {
            token = localStorage.getItem('capacitor_authToken');
          }
          
          if (token && appState.isAuthenticated) {
            localStorage.setItem('token', token);
          }

          console.log('App state restored successfully');
          return appState;
        } else {
          console.log('Session expired, clearing state');
          await this.clearExpiredSession();
        }
      }
    } catch (error) {
      console.error('Failed to restore app state:', error);
    }
    return null;
  }

  private async checkSessionValidity(): Promise<boolean> {
    try {
      let value: string | null = null;
      
      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key: 'appState' });
        value = result.value;
      } else {
        value = localStorage.getItem('capacitor_appState');
      }
      
      if (!value) return false;

      const appState: AppState = JSON.parse(value);
      const timeDiff = Date.now() - appState.lastActiveTime;
      
      return timeDiff < this.sessionTimeout && appState.isAuthenticated;
    } catch {
      return false;
    }
  }

  private async clearExpiredSession() {
    try {
      if (Capacitor.isNativePlatform()) {
        // Clear Capacitor preferences
        await Preferences.remove({ key: 'appState' });
        await Preferences.remove({ key: 'authToken' });
      } else {
        // Clear web storage
        localStorage.removeItem('capacitor_appState');
        localStorage.removeItem('capacitor_authToken');
      }
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login
      window.location.href = '/login';
      
      console.log('Expired session cleared');
    } catch (error) {
      console.error('Failed to clear expired session:', error);
    }
  }

  onAppStateChange(callback: (state: 'active' | 'background') => void) {
    this.appStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.appStateListeners.indexOf(callback);
      if (index > -1) {
        this.appStateListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(state: 'active' | 'background') {
    this.appStateListeners.forEach(callback => callback(state));
  }

  async extendSession() {
    try {
      let value: string | null = null;
      
      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key: 'appState' });
        value = result.value;
      } else {
        value = localStorage.getItem('capacitor_appState');
      }
      
      if (value) {
        const appState: AppState = JSON.parse(value);
        appState.lastActiveTime = Date.now();
        
        if (Capacitor.isNativePlatform()) {
          await Preferences.set({
            key: 'appState',
            value: JSON.stringify(appState)
          });
        } else {
          localStorage.setItem('capacitor_appState', JSON.stringify(appState));
        }
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  }

  setSessionTimeout(timeout: number) {
    this.sessionTimeout = timeout;
  }
}

export const appLifecycleService = AppLifecycleService.getInstance();