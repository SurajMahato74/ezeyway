interface PendingAction {
  type: 'add_to_cart' | 'buy_now' | 'view_orders' | 'view_profile' | 'navigate';
  data?: any;
  path?: string;
}

class RedirectService {
  private pendingAction: PendingAction | null = null;

  // Store the action user was trying to perform
  setPendingAction(action: PendingAction): void {
    this.pendingAction = action;
    // Also store in localStorage for persistence across page reloads
    localStorage.setItem('pendingAction', JSON.stringify(action));
  }

  // Get the pending action
  getPendingAction(): PendingAction | null {
    if (this.pendingAction) {
      return this.pendingAction;
    }
    
    // Try to get from localStorage
    const stored = localStorage.getItem('pendingAction');
    if (stored) {
      try {
        this.pendingAction = JSON.parse(stored);
        return this.pendingAction;
      } catch (e) {
        console.error('Error parsing pending action:', e);
      }
    }
    
    return null;
  }

  // Clear the pending action
  clearPendingAction(): void {
    this.pendingAction = null;
    localStorage.removeItem('pendingAction');
  }

  // Execute the pending action after login
  async executePendingAction(): Promise<boolean> {
    const action = this.getPendingAction();
    if (!action) {
      console.log('No pending action to execute');
      return false;
    }

    // Double check authentication before executing
    const { authService } = await import('./authService');
    const token = await authService.getToken();
    if (!token) {
      console.log('No token found, clearing pending action');
      this.clearPendingAction();
      return false;
    }

    console.log('Executing pending action:', action);

    try {
      switch (action.type) {
        case 'add_to_cart':
          if (action.data) {
            const { cartService } = await import('./cartService');
            await cartService.addToCart(action.data.productId, action.data.quantity || 1);
            console.log('Added to cart successfully');
            this.clearPendingAction();
            return true;
          }
          break;

        case 'buy_now':
          if (action.data) {
            // Store product for checkout and navigate
            localStorage.setItem('buyNowProduct', JSON.stringify(action.data));
            window.location.href = '/checkout';
            this.clearPendingAction();
            return true;
          }
          break;

        case 'view_orders':
          window.location.href = '/orders';
          this.clearPendingAction();
          return true;

        case 'view_profile':
          window.location.href = '/profile';
          this.clearPendingAction();
          return true;

        case 'navigate':
          if (action.path) {
            window.location.href = action.path;
            this.clearPendingAction();
            return true;
          }
          break;
      }
    } catch (error) {
      console.error('Error executing pending action:', error);
      this.clearPendingAction();
    }

    this.clearPendingAction();
    return false;
  }

  // Redirect to login with return path
  redirectToLogin(currentPath?: string): void {
    const returnPath = currentPath || window.location.pathname + window.location.search;
    window.location.href = `/login?returnTo=${encodeURIComponent(returnPath)}`;
  }
}

export const redirectService = new RedirectService();