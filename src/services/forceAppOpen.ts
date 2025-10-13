import { registerPlugin } from '@capacitor/core';

export interface ForceAppOpenPlugin {
  bringToForeground(): Promise<void>;
}

const ForceAppOpen = registerPlugin<ForceAppOpenPlugin>('ForceAppOpen');

export default ForceAppOpen;