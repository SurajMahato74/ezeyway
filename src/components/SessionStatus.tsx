import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { appLifecycleService } from '@/services/appLifecycleService';

export const SessionStatus = () => {
  const { state } = useApp();
  const [appState, setAppState] = useState<'active' | 'background'>('active');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = appLifecycleService.onAppStateChange((newState) => {
      setAppState(newState);
      if (newState === 'background') {
        setLastSaved(new Date());
      }
    });

    return unsubscribe;
  }, []);

  if (!state.user) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border text-xs">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${appState === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        <span>Session: {appState}</span>
      </div>
      {lastSaved && (
        <div className="text-gray-500 mt-1">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};