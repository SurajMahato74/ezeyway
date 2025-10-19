import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { redirectService } from '@/services/redirectService';

export const useAuthAction = () => {
  const navigate = useNavigate();
  const { user, state } = useApp();

  const executeWithAuth = async (
    action: () => Promise<void> | void,
    pendingActionData?: {
      type: 'add_to_cart' | 'buy_now' | 'view_orders' | 'view_profile' | 'navigate';
      data?: any;
      path?: string;
    }
  ) => {
    // Simple check using only context state to avoid async issues
    const isAuthenticated = user && state.isAuthenticated;
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      // Store the pending action
      if (pendingActionData) {
        redirectService.setPendingAction(pendingActionData);
      }
      
      // Redirect to login
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?returnTo=${encodeURIComponent(currentPath)}`);
      return;
    }

    console.log('User authenticated, executing action');
    // User is authenticated, execute the action
    try {
      await action();
    } catch (error) {
      console.error('Error executing authenticated action:', error);
    }
  };

  const addToCartWithAuth = (productId: string, quantity: number = 1) => {
    return executeWithAuth(
      async () => {
        const { cartService } = await import('@/services/cartService');
        await cartService.addToCart(productId, quantity);
      },
      {
        type: 'add_to_cart',
        data: { productId, quantity }
      }
    );
  };

  const buyNowWithAuth = (productData: any) => {
    return executeWithAuth(
      async () => {
        console.log('useAuthAction - Setting buyNowProduct in localStorage:', productData);
        localStorage.setItem('buyNowProduct', JSON.stringify(productData));
        console.log('useAuthAction - Navigating to checkout with directBuy=true');
        navigate('/checkout?directBuy=true');
      },
      {
        type: 'buy_now',
        data: productData
      }
    );
  };

  const navigateWithAuth = (path: string) => {
    return executeWithAuth(
      () => navigate(path),
      {
        type: 'navigate',
        path
      }
    );
  };

  return {
    executeWithAuth,
    addToCartWithAuth,
    buyNowWithAuth,
    navigateWithAuth,
    isAuthenticated: !!(user && state.isAuthenticated)
  };
};