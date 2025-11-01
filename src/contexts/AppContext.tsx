import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { locationService } from '@/services/locationService';
import { authService } from '@/services/authService';

// Types
export interface Product {
  id: number;
  name: string;
  vendor: string;
  price: string;
  image: string;
  inStock: boolean;
  rating?: number;
  description?: string;
  category?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Vendor {
  id: number;
  name: string;
  image: string;
  rating: number;
  distance: string;
  deliveryTime: string;
  categories: string[];
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  phone_number?: string;
  address?: string;
  avatar?: string;
  user_type: string;
  available_roles: string[];
  isLoggedIn: boolean;
  first_name?: string;
  last_name?: string;
  google_id?: string;
  profile_picture_url?: string;
}

interface AppState {
  user: User | null;
  cart: CartItem[];
  wishlist: Product[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_WISHLIST'; payload: Product[] }
  | { type: 'ADD_TO_WISHLIST'; payload: Product }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: number }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_FROM_STORAGE' };

const initialState: AppState = {
  user: null,
  cart: [],
  wishlist: [],
  searchQuery: '',
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      };

    case 'SET_CART':
      return { ...state, cart: action.payload };

    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: 1 }],
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload),
      };

    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item
        ).filter(item => item.quantity > 0),
      };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SET_WISHLIST':
      return { ...state, wishlist: action.payload };

    case 'ADD_TO_WISHLIST': {
      const exists = state.wishlist.find(item => item.id === action.payload.id);
      if (exists) return state;
      return {
        ...state,
        wishlist: [...state.wishlist, action.payload],
      };
    }

    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        wishlist: state.wishlist.filter(item => item.id !== action.payload),
      };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'LOAD_FROM_STORAGE':
      // This will be handled asynchronously in useEffect
      return state;

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateCartQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (id: number) => void;
  setSearchQuery: (query: string) => void;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  user: User | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from persistent storage on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [cart, wishlist, user, isAuthenticated] = await Promise.all([
          authService.getCart(),
          authService.getWishlist(),
          authService.getUser(),
          authService.isAuthenticated()
        ]);
        
        if (isAuthenticated && user) {
          // Check if session is still valid
          const isValid = await authService.isSessionValid();
          if (isValid) {
            // Restore user to context
            dispatch({ type: 'SET_USER', payload: { ...user, isLoggedIn: true } });
          } else {
            // Session expired, clear auth data
            await authService.clearAuth();
          }
        }
        
        // Load cart and wishlist regardless of auth status
        dispatch({ type: 'SET_CART', payload: cart });
        dispatch({ type: 'SET_WISHLIST', payload: wishlist });

        // Force re-render
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Failed to load stored data:', error);
      }
    };
    
    loadStoredData();
  }, []);

  // Save to persistent storage whenever state changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await Promise.all([
          authService.setCart(state.cart),
          authService.setWishlist(state.wishlist)
        ]);
        
        if (state.user) {
          await authService.updateActivity();
        }
      } catch (error) {
        console.error('Failed to save data:', error);
      }
    };
    
    saveData();
  }, [state.cart, state.wishlist, state.user]);

  // Helper functions
  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (id: number) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const updateCartQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const addToWishlist = (product: Product) => {
    dispatch({ type: 'ADD_TO_WISHLIST', payload: product });
  };

  const removeFromWishlist = (id: number) => {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: id });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const login = async (user: User, token: string) => {
    try {
      // Update context state immediately
      dispatch({ type: 'SET_USER', payload: { ...user, isLoggedIn: true } });
      
      // Then save to storage (async)
      await authService.setAuth(token, user);
      locationService.startTracking();
      
      console.log('Login completed, user authenticated:', !!user);
    } catch (error) {
      console.error('Failed to save login data:', error);
    }
  };

  const logout = async () => {
    try {
      await authService.clearAuth();
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'CLEAR_CART' });
      locationService.stopTracking();
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      dispatch({ type: 'UPDATE_USER', payload: updates });
      
      // Update stored user data
      if (state.user) {
        const updatedUser = { ...state.user, ...updates };
        await authService.updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    setSearchQuery,
    login,
    logout,
    updateUser,
    user: state.user,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}