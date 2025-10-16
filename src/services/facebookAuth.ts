import { apiRequest } from '@/utils/apiUtils';

declare global {
  interface Window {
    FB: any;
  }
}

class FacebookAuthService {
  private isInitialized = false;
  private appId = '650860981240776';
  private isDevelopment = window.location.hostname === 'localhost';

  async initialize() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        window.FB.init({
          appId: this.appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        this.isInitialized = true;
        resolve(true);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Facebook SDK'));
      };
      
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
    try {
      await this.initialize();
      
      // Check if we're on HTTP and show helpful error
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        return {
          success: false,
          error: 'Facebook login requires HTTPS. Please use the ngrok URL: https://61229baf5ec0.ngrok-free.app'
        };
      }
      
      return new Promise((resolve) => {
        window.FB.login((response: any) => {
          if (response.authResponse) {
            this.getUserInfo()
              .then(userInfo => this.authenticateWithBackend(userInfo))
              .then(result => resolve(result))
              .catch(error => resolve({ success: false, error: error.message }));
          } else {
            resolve({ success: false, error: 'Facebook login cancelled' });
          }
        }, { scope: 'email,public_profile' });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async getUserInfo() {
    return new Promise((resolve, reject) => {
      window.FB.api('/me', { fields: 'id,name,email,picture' }, (response: any) => {
        if (response && !response.error) {
          resolve(response);
        } else {
          reject(new Error('Failed to get user info from Facebook'));
        }
      });
    });
  }

  private async authenticateWithBackend(userInfo: any): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
    try {
      const { response, data } = await apiRequest('/auth/facebook/', {
        method: 'POST',
        body: JSON.stringify({
          user_info: {
            email: userInfo.email,
            name: userInfo.name,
            facebook_id: userInfo.id,
            picture: userInfo.picture?.data?.url,
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
            facebook_login: data.facebook_login
          },
          token: data.token
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
}

export const facebookAuthService = new FacebookAuthService();