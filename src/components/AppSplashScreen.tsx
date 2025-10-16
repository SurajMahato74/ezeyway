import { useState, useEffect } from 'react';
import tiharGif from '@/assets/tihar.gif';

interface AppSplashScreenProps {
  onComplete: () => void;
}

export const AppSplashScreen = ({ onComplete }: AppSplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

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