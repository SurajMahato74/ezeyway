import React, { createContext, useContext, useEffect, useState } from 'react';
import { OrderNotificationModal } from '@/components/OrderNotificationModal';
import { MobileOrderAlert } from '@/components/MobileOrderAlert';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { simpleNotificationService } from '@/services/simpleNotificationService';
import { Capacitor } from '@capacitor/core';

interface GlobalOrderNotificationContextType {
  pendingOrdersCount: number;
  isModalOpen: boolean;
  closeModal: () => void;
}

const GlobalOrderNotificationContext = createContext<GlobalOrderNotificationContextType | undefined>(undefined);

export function GlobalOrderNotificationProvider({ children }: { children: React.ReactNode }) {
  const { pendingOrders, isModalOpen, acceptOrder, rejectOrder } = useOrderNotifications();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Initialize notification service and request permissions
  useEffect(() => {
    const initNotifications = async () => {
      await simpleNotificationService.requestPermissions();
      
      // Skip complex mobile services to prevent crashes
      console.log('Notification service initialized for platform:', Capacitor.isNativePlatform() ? 'mobile' : 'web');
    };
    initNotifications();
  }, []);

  // Show modal when there are pending orders
  useEffect(() => {
    setIsModalVisible(isModalOpen);
  }, [isModalOpen]);

  // Play sound and show notifications for new orders
  useEffect(() => {
    if (pendingOrders.length > 0) {
      // Show notifications for each new order
      pendingOrders.forEach((order) => {
        simpleNotificationService.showOrderNotification(
          order.order_number,
          order.total_amount,
          order.id
        );
        
        // Simple mobile vibration
        if (Capacitor.isNativePlatform() && 'vibrate' in navigator) {
          navigator.vibrate([300, 100, 300]);
        }
      });
    }
  }, [pendingOrders]);

  // Listen for service worker and mobile app messages to show modal
  useEffect(() => {
    const handleShowOrderModal = async (event: CustomEvent) => {
      console.log('Order modal event received:', event.detail);
      const orderData = event.detail;
      
      setIsModalVisible(true);
      
      // If this is from an auto-opened notification, start beeping
      if (orderData?.startBeeping || orderData?.autoOpened || orderData?.fromPush) {
        console.log('🔊 Starting beeping for auto-opened notification');
        
        // Start continuous beeping and vibration
        await startOrderBeeping();
      }
      
      // Simple mobile feedback when modal opens
      if (Capacitor.isNativePlatform() && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    };

    window.addEventListener('showOrderModal', handleShowOrderModal as EventListener);
    return () => {
      window.removeEventListener('showOrderModal', handleShowOrderModal as EventListener);
    };
  }, []);
  
  // Function to start continuous beeping for auto-opened notifications
  const startOrderBeeping = async () => {
    try {
      console.log('🔊 Starting order notification beeping sequence...');
      
      // Play notification sound immediately
      await simpleNotificationService.playNotificationSound();
      
      // Continue beeping every 2 seconds for 20 seconds
      let beepCount = 0;
      const maxBeeps = 10;
      
      const beepInterval = setInterval(async () => {
        if (beepCount < maxBeeps && isModalVisible) {
          await simpleNotificationService.playNotificationSound();
          
          // Vibrate on mobile
          if (Capacitor.isNativePlatform() && 'vibrate' in navigator) {
            navigator.vibrate([150, 50, 150]);
          }
          
          beepCount++;
          console.log(`🔊 Beep ${beepCount}/${maxBeeps}`);
        } else {
          clearInterval(beepInterval);
          console.log('🔇 Beeping sequence completed');
        }
      }, 2000);
      
      // Store interval reference to clear when modal closes
      (window as any).orderBeepInterval = beepInterval;
      
    } catch (error) {
      console.error('Failed to start order beeping:', error);
    }
  };

  // Handle app resume on mobile (when app opens from notification)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const handleAppStateChange = () => {
        // Use web visibility API for all platforms
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            console.log('Page visible - checking for pending orders');
            window.dispatchEvent(new CustomEvent('refreshPendingOrders'));
          }
        });
      };
      
      handleAppStateChange();
    }
  }, []);

  const closeModal = () => {
    setIsModalVisible(false);
    
    // Stop beeping when modal closes
    if ((window as any).orderBeepInterval) {
      clearInterval((window as any).orderBeepInterval);
      (window as any).orderBeepInterval = null;
      console.log('🔇 Stopped beeping - modal closed');
    }
  };

  return (
    <GlobalOrderNotificationContext.Provider 
      value={{ 
        pendingOrdersCount: pendingOrders.length, 
        isModalOpen: isModalVisible,
        closeModal 
      }}
    >
      {children}
      
      {/* Mobile Order Alert */}
      <MobileOrderAlert />
      
      {/* Global Order Notification Modal */}
      <OrderNotificationModal
        isOpen={isModalVisible}
        orders={pendingOrders}
        onAccept={acceptOrder}
        onReject={rejectOrder}
      />
    </GlobalOrderNotificationContext.Provider>
  );
}

export function useGlobalOrderNotification() {
  const context = useContext(GlobalOrderNotificationContext);
  if (context === undefined) {
    // Return default values if provider is not available
    return {
      pendingOrdersCount: 0,
      isModalOpen: false,
      closeModal: () => {}
    };
  }
  return context;
}