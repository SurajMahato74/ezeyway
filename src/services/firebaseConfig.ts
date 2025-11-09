import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDoi4Mmcv0a_zcfHrQClwEKCm3FK5wzNWY",
  authDomain: "ezeyway-2f869.firebaseapp.com",
  projectId: "ezeyway-2f869",
  storageBucket: "ezeyway-2f869.firebasestorage.app",
  messagingSenderId: "413898594267",
  appId: "1:413898594267:android:a1836521ce3ca5252d79fe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;

// Export messaging instance
export const messaging = getMessaging(app);