import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';

export interface Product {
  id?: number;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  quantity: number;
  low_stock_threshold?: number;
  description: string;
  short_description?: string;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  free_delivery?: boolean;
  seo_title?: string;
  seo_description?: string;
  dynamic_fields: Record<string, any>;
  images?: Array<{
    id: number;
    image: string;
    image_url: string;
    is_primary: boolean;
  }>;
  image_files?: File[];
  total_sold?: number;
  created_at?: string;
  updated_at?: string;
}



export const productApi = {
  getProducts: async (): Promise<Product[]> => {
    const { response, data } = await apiRequest('/products/');
    if (!response.ok) throw new Error('Failed to fetch products');
    return data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const { response, data } = await apiRequest(`/products/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return data;
  },

  createProduct: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'images'>): Promise<Product> => {
    const formData = new FormData();
    
    // Add product data
    Object.entries(product).forEach(([key, value]) => {
      if (key === 'image_files' && Array.isArray(value)) {
        // Handle file uploads
        value.forEach((file, index) => {
          if (file instanceof File) {
            formData.append('image_files', file);
          }
        });
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    
    const { response, data } = await apiRequest('/products/', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create product');
    return data;
  },

  updateProduct: async (id: number, product: Partial<Product>): Promise<Product> => {
    // Always use FormData to avoid Content-Type issues
    const formData = new FormData();
    
    Object.entries(product).forEach(([key, value]) => {
      if (key === 'image_files' && Array.isArray(value)) {
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append('image_files', file);
          }
        });
      } else if (typeof value === 'boolean') {
        // Explicitly handle boolean values
        formData.append(key, value ? 'true' : 'false');
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    const { response, data } = await apiRequest(`/products/${id}/`, {
      method: 'PATCH',
      body: formData,
    });
    if (!response.ok) {
      console.error('Update failed:', response.status);
      throw new Error(`Failed to update product: ${response.status}`);
    }
    return data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    const { response } = await apiRequest(`/products/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete product');
  },
};