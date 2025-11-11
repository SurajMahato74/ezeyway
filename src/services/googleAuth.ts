import { apiRequest } from '@/utils/apiUtils';
import { Capacitor } from '@capacitor/core';
// import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

declare global {
  interface Window {
    google: any;
  }
}

class GoogleAuthService {
  private isInitialized = false;
  private clientId = '413898594267-m6kiake3vs83slgvp3e3uk6kcchlssf5.apps.googleusercontent.com';
  private isDevelopment = false;

  // Method to setup password for Google OAuth users
  async setupPassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { response, data } = await apiRequest('/setup-password/', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      if (response.ok && data.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to setup password'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error during password setup'
      };
    }
  }



  async initialize() {
    if (this.isInitialized) return;

    // In development mode, just mark as initialized for UI testing
    if (this.isDevelopment && this.clientId === 'YOUR_GOOGLE_CLIENT_ID') {
      console.warn('Google Auth: Using development mode - replace with real client ID');
      this.isInitialized = true;
      return Promise.resolve(true);
    }

    return new Promise((resolve, reject) => {
      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: this.clientId,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
            ux_mode: 'popup'
          });
          this.isInitialized = true;
          resolve(true);
        } else {
          reject(new Error('Google Identity Services failed to load'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      
      document.head.appendChild(script);
    });
  }

  private handleCredentialResponse(response: any) {
    // This will be handled by the component that calls signIn
    console.log('Google credential response:', response);
  }

  async signIn(): Promise<{ success: boolean; user?: any; token?: string; error?: string; needs_privacy_agreement?: boolean; user_id?: number; user_type?: string; has_vendor_profile?: boolean }> {
    try {
      // For mobile/native platforms, use the Capacitor Google Auth plugin
      if (Capacitor.isNativePlatform()) {
        return this.signInWithCapacitorPlugin();
      } else {
        await this.initialize();
        // Use popup-only approach to avoid redirect URI issues
        return this.showPopup();
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async signInWithCapacitorPlugin(): Promise<{ success: boolean; user?: any; token?: string; error?: string; needs_privacy_agreement?: boolean; user_id?: number; user_type?: string; has_vendor_profile?: boolean }> {
    try {
      // Import the plugin dynamically to avoid build errors if not installed
      // @ts-ignore
      const plugin = await import('@codetrix-studio/capacitor-google-auth');
      const GoogleAuth = plugin.GoogleAuth;

      // Initialize the plugin with Android client ID
      await GoogleAuth.initialize({
        clientId: '413898594267-83ds3hc1u9um55ps3b490eft15a2bcqq.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });

      // Sign in
      const result = await GoogleAuth.signIn();

      // Extract user info and authenticate with backend
      const userInfo = {
        email: result.email,
        name: result.name,
        google_id: result.id,
        picture: result.imageUrl,
      };

      // Authenticate with your backend
      return this.authenticateWithBackend(userInfo);

    } catch (error) {
      console.error('Capacitor Google Auth error:', error);
      return {
        success: false,
        error: 'Google Sign-In failed. Please try again or use email/password login.'
      };
    }
  }

  private async showPopup(): Promise<{ success: boolean; user?: any; token?: string; error?: string; needs_privacy_agreement?: boolean; user_id?: number; user_type?: string; has_vendor_profile?: boolean }> {
    return new Promise((resolve) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'email profile',
        ux_mode: 'popup',
        callback: async (response: any) => {
          if (response.access_token) {
            try {
              const userInfo = await this.getUserInfo(response.access_token);
              const result = await this.authenticateWithBackend(userInfo);
              resolve(result);
            } catch (error) {
              resolve({ success: false, error: error.message });
            }
          } else if (response.error) {
            resolve({ success: false, error: response.error });
          } else {
            resolve({ success: false, error: 'No access token received' });
          }
        },
      });

      tokenClient.requestAccessToken();
    });
  }

  private async getUserInfo(accessToken: string) {
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
    if (!response.ok) {
      throw new Error('Failed to get user info from Google');
    }
    return response.json();
  }

  private async verifyGoogleToken(credential: string): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
    try {
      // Send the credential to your backend for verification
      const { response, data } = await apiRequest('/auth/google/', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      }, false);

      if (response.ok) {
        return {
          success: true,
          user: data.user,
          token: data.token
        };
      } else {
        return {
          success: false,
          error: data.error || 'Google authentication failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error during Google authentication'
      };
    }
  }

  private async authenticateWithBackend(userInfo: any): Promise<{ success: boolean; user?: any; token?: string; error?: string; needs_privacy_agreement?: boolean; user_id?: number; user_type?: string; has_vendor_profile?: boolean }> {
    try {
      const { response, data } = await apiRequest('/auth/google/', {
        method: 'POST',
        body: JSON.stringify({
          user_info: {
            email: userInfo.email,
            name: userInfo.name,
            google_id: userInfo.id,
            picture: userInfo.picture,
          }
        }),
      }, false);

      if (response.ok && data.success) {
        return {
          success: true,
          user: {
            ...data.user,
            available_roles: data.available_roles,
            profile_exists: data.profile_exists,
            is_approved: data.is_approved,
            is_rejected: data.is_rejected,
            rejection_reason: data.rejection_reason,
            rejection_date: data.rejection_date,
            user_created: data.user_created,
            needs_password_setup: data.needs_password_setup,
            google_login: data.google_login
          },
          token: data.token
        };
      } else if (response.ok && data.needs_privacy_agreement) {
        return {
          success: false,
          needs_privacy_agreement: true,
          user_id: data.user_id,
          user_type: data.user_type,
          has_vendor_profile: data.has_vendor_profile,
          error: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Backend authentication failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error during backend authentication'
      };
    }
  }

  renderButton(containerId: string, theme: 'outline' | 'filled_blue' = 'outline', size: 'large' | 'medium' = 'large') {
    if (!this.isInitialized) {
      console.warn('Google Auth not initialized');
      return;
    }

    window.google.accounts.id.renderButton(
      document.getElementById(containerId),
      {
        theme,
        size,
        type: 'standard',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
        width: 320,
      }
    );
  }
}

export const googleAuthService = new GoogleAuthService();