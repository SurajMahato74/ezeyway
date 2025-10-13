import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export class CapacitorUtils {
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  static async setupAppStateListener(onAppStateChange: (isActive: boolean) => void): Promise<void> {
    if (this.isNative()) {
      App.addListener('appStateChange', ({ isActive }) => {
        onAppStateChange(isActive);
      });
    }
  }

  static async setupBackButtonHandler(handler: () => boolean): Promise<void> {
    if (this.isNative()) {
      App.addListener('backButton', handler);
    }
  }

  static removeAllListeners(): void {
    if (this.isNative()) {
      App.removeAllListeners();
    }
  }
}

// App lifecycle management for authentication persistence
export const setupAppLifecycle = (
  onAppActive: () => void,
  onAppInactive: () => void
) => {
  if (CapacitorUtils.isNative()) {
    CapacitorUtils.setupAppStateListener((isActive) => {
      if (isActive) {
        onAppActive();
      } else {
        onAppInactive();
      }
    });
  } else {
    // Web fallback using visibility API
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        onAppActive();
      } else {
        onAppInactive();
      }
    });
  }
};