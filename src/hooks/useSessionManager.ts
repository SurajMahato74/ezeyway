import { useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { authService } from '@/services/authService';

export const useSessionManager = () => {
  const { state, dispatch } = useApp();

  // Simple session extension using authService
  const extendSession = useCallback(async () => {
    if (state.user) {
      await authService.updateActivity();
    }
  }, [state.user]);

  // Save app state using authService
  const saveState = useCallback(async () => {
    if (state.user) {
      await Promise.all([
        authService.setCart(state.cart),
        authService.setWishlist(state.wishlist),
        authService.updateActivity()
      ]);
    }
  }, [state.user, state.cart, state.wishlist]);

  // Check session validity - DISABLED to prevent conflicts
  const checkSession = useCallback(async () => {
    // Disabled - let individual pages handle their own authentication
    return;
  }, [dispatch]);

  // DISABLED - All session management disabled to prevent conflicts
  useEffect(() => {
    // Completely disabled
    return;
  }, []);

  useEffect(() => {
    // Completely disabled
    return;
  }, []);

  // Save state on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState().catch(console.error);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  return {
    extendSession,
    saveState
  };
};