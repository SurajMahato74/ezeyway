import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService, Cart } from '@/services/cartService';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCart = async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        // User not authenticated, don't fetch cart
        return;
      }
      
      setLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (error) {
      // Only log error if it's not an authentication issue
      if (!error.message.includes('not authenticated')) {
        console.error('Failed to fetch cart:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    try {
      const token = await authService.getToken();
      if (!token) {
        toast({
          title: "Login Required",
          description: "Please login to add items to cart",
          variant: "destructive",
        });
        return;
      }
      
      const updatedCart = await cartService.addToCart(productId, quantity);
      setCart(updatedCart);
      toast({
        title: "Success",
        description: "Item added to cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const updateCartItem = async (itemId: number, quantity: number) => {
    try {
      const updatedCart = await cartService.updateCartItem(itemId, quantity);
      setCart(updatedCart);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item quantity",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      const updatedCart = await cartService.removeFromCart(itemId);
      setCart(updatedCart);
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCart({ ...cart!, items: [], total_items: 0, subtotal: 0 });
      toast({
        title: "Success",
        description: "Cart cleared",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const checkAuthAndFetchCart = async () => {
      const token = await authService.getToken();
      if (token) {
        fetchCart();
      }
    };
    checkAuthAndFetchCart();
  }, []);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};