import { createContext, useContext, useState, ReactNode } from 'react';

interface AppLoadingContextType {
  isHomeDataLoaded: boolean;
  setHomeDataLoaded: (loaded: boolean) => void;
}

const AppLoadingContext = createContext<AppLoadingContextType | undefined>(undefined);

export const AppLoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isHomeDataLoaded, setIsHomeDataLoaded] = useState(false);

  const setHomeDataLoaded = (loaded: boolean) => {
    setIsHomeDataLoaded(loaded);
  };

  return (
    <AppLoadingContext.Provider value={{ isHomeDataLoaded, setHomeDataLoaded }}>
      {children}
    </AppLoadingContext.Provider>
  );
};

export const useAppLoading = () => {
  const context = useContext(AppLoadingContext);
  if (!context) {
    throw new Error('useAppLoading must be used within AppLoadingProvider');
  }
  return context;
};