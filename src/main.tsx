import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { fcmService } from './services/fcmService'
import { Capacitor } from '@capacitor/core'

// Initialize FCM service for push notifications
if (Capacitor.isNativePlatform()) {
  fcmService.initialize().then(() => {
    console.log('✅ FCM Service initialized on app startup')
  }).catch(error => {
    console.error('❌ FCM Service initialization failed:', error)
  })
}

createRoot(document.getElementById("root")!).render(<App />);
