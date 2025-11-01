import { useState, useEffect } from 'react';
import tiharGif from '@/assets/tihar.gif';

interface AppSplashScreenProps {
  onComplete: () => void;
}

export const AppSplashScreen = ({ onComplete }: AppSplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log('AppSplashScreen mounted, starting timer');
    const timer = setTimeout(() => {
      console.log('Splash timer completed, hiding splash');
      setIsVisible(false);
      setTimeout(() => {
        console.log('Calling onComplete callback');
        onComplete();
      }, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    console.log('Splash screen not visible, returning null');
    return null;
  }

  console.log('Rendering splash screen');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <img
        src={tiharGif}
        alt="Loading..."
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};