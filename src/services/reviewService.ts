import { getApiUrl } from '@/config/api';

interface ProductReviews {
  product_id: number;
  product_name: string;
  aggregate: {
    average_rating: number;
    total_reviews: number;
    average_quality: number;
    average_value: number;
    average_service: number;
  };
  recent_reviews: Array<{
    rating: number;
    comment: string;
    customer_name: string;
    created_at: string;
    quality_rating: number;
    value_rating: number;
    service_rating: number;
  }>;
}

interface VendorReviews {
  vendor_id: number;
  vendor_name: string;
  aggregate: {
    average_rating: number;
    total_reviews: number;
    average_quality: number;
    average_value: number;
    average_service: number;
  };
  recent_reviews: Array<{
    rating: number;
    comment: string;
    customer_name: string;
    created_at: string;
    quality_rating: number;
    value_rating: number;
    service_rating: number;
    product_name: string | null;
  }>;
}

class ReviewService {
  async getProductReviews(productId: number): Promise<ProductReviews> {
    try {
  const response = await fetch(getApiUrl(`/products/${productId}/reviews/`));
      if (!response.ok) {
        throw new Error('Failed to fetch product reviews');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return {
        product_id: productId,
        product_name: '',
        aggregate: {
          average_rating: 0,
          total_reviews: 0,
          average_quality: 0,
          average_value: 0,
          average_service: 0
        },
        recent_reviews: []
      };
    }
  }

  async getVendorReviews(vendorId: number): Promise<VendorReviews> {
    try {
  const response = await fetch(getApiUrl(`/vendors/${vendorId}/reviews/`));
      if (!response.ok) {
        throw new Error('Failed to fetch vendor reviews');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching vendor reviews:', error);
      return {
        vendor_id: vendorId,
        vendor_name: '',
        aggregate: {
          average_rating: 0,
          total_reviews: 0,
          average_quality: 0,
          average_value: 0,
          average_service: 0
        },
        recent_reviews: []
      };
    }
  }

  async getOrderReviews(orderId: number): Promise<any[]> {
    try {
      const response = await fetch(getApiUrl(`/orders/${orderId}/review/`));
      if (!response.ok) {
        throw new Error('Failed to fetch order reviews');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      console.error('Error fetching order reviews:', error);
      return [];
    }
  }
}

export const reviewService = new ReviewService();