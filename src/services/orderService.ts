import { API_BASE } from '@/config/api';
import { authService } from '@/services/authService';

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface CreateOrderData {
  items: OrderItem[];
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_instructions?: string;
  payment_method: string;
  notes?: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_instructions?: string;
  subtotal: string;
  delivery_fee: string;
  tax_amount: string;
  total_amount: string;
  created_at: string;
  items: any[];
  can_be_cancelled: boolean;
  can_be_reviewed: boolean;
}

class OrderService {
  private async getAuthHeaders() {
    const token = await authService.getToken();
    return {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token && { 'Authorization': `Token ${token}` })
    };
  }

  async createOrder(orderData: CreateOrderData): Promise<{ order: Order; message: string }> {
    const response = await fetch(`${API_BASE}api/orders/create/`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }

    const result = await response.json();
    
    // Send notification to vendor via WebSocket
    this.notifyVendorOfNewOrder(result.order);
    
    return result;
  }

  private notifyVendorOfNewOrder(order: Order) {
    // This will be handled by the backend WebSocket, but we can also
    // dispatch a local event for immediate UI updates
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('orderCreated', { 
        detail: { order } 
      }));
    }
  }

  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE}api/orders/`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const data = await response.json();
    return data.results || data;
  }

  async getOrder(orderId: number): Promise<Order> {
    const response = await fetch(`${API_BASE}api/orders/${orderId}/`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return response.json();
  }

  async cancelOrder(orderId: number, reason: string = 'Cancelled by customer'): Promise<{ order: Order; message: string }> {
    const response = await fetch(`${API_BASE}api/orders/${orderId}/cancel/`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel order');
    }

    return response.json();
  }

  async createReview(orderId: number, reviewData: {
    overall_rating: number;
    food_quality_rating?: number;
    delivery_rating?: number;
    vendor_rating?: number;
    review_text?: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE}api/orders/${orderId}/review/`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create review');
    }

    return response.json();
  }

  async requestRefund(orderId: number, refundData: {
    refund_type: 'full' | 'partial' | 'item_specific';
    requested_amount: number;
    reason: string;
    customer_notes?: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE}api/orders/${orderId}/refund/`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(refundData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request refund');
    }

    return response.json();
  }

  // Vendor-specific methods
  async getPendingOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE}orders/vendor/pending/`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending orders');
    }

    return response.json();
  }

  async acceptOrder(orderId: number): Promise<{ order: Order; message: string }> {
    const response = await fetch(`${API_BASE}api/orders/${orderId}/accept/`, {
      method: 'POST',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to accept order');
    }

    const result = await response.json();
    
    // Notify customer of order acceptance
    this.notifyCustomerOfOrderUpdate(result.order, 'accepted');
    
    return result;
  }

  private notifyCustomerOfOrderUpdate(order: Order, status: string) {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { 
        detail: { order, status } 
      }));
    }
  }

  async rejectOrder(orderId: number, reason: string = 'Rejected by vendor'): Promise<{ order: Order; message: string }> {
    const response = await fetch(`${API_BASE}api/orders/${orderId}/reject/`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject order');
    }

    const result = await response.json();
    
    // Notify customer of order rejection
    this.notifyCustomerOfOrderUpdate(result.order, 'rejected');
    
    return result;
  }
}

export const orderService = new OrderService();

// Vendor notification methods
export const sendVendorNotification = (vendorId: number, notification: {
  type: 'order' | 'payment' | 'system';
  title: string;
  message: string;
  data?: any;
  action_url?: string;
}) => {
  // This would typically be handled by the backend WebSocket
  // For now, we'll use a custom event system
  if (window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('vendorNotification', { 
      detail: { vendorId, notification } 
    }));
  }
};