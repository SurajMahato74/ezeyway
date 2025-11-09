import { API_BASE } from '@/config/api';

interface VendorProfile {
  id: number;
  delivery_radius: number;
  // Add other fields as needed
}

interface DeliveryRadiusSettings {
  id: number;
  radius: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class VendorService {
  private vendorCache: Map<number, VendorProfile> = new Map();
  private fetchingVendors = false;
  private lastFetchTime = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Delivery radius settings cache
  private deliveryRadiusCache: DeliveryRadiusSettings | null = null;
  private deliveryRadiusLastFetch = 0;
  private DELIVERY_RADIUS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  async getVendorProfile(vendorId: number): Promise<VendorProfile | null> {
    // Check cache first
    const cachedVendor = this.vendorCache.get(vendorId);
    if (cachedVendor && Date.now() - this.lastFetchTime < this.CACHE_TTL) {
      return cachedVendor;
    }

    // Fetch from API if not in cache or cache expired
    try {
      const response = await fetch(`${API_BASE}vendor-profiles/${vendorId}/`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch vendor profile for ID ${vendorId}`);
        return null;
      }

      const vendor = await response.json();
      this.vendorCache.set(vendorId, vendor);
      return vendor;
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      return null;
    }
  }

  async refreshVendorProfiles() {
    if (this.fetchingVendors) return;
    this.fetchingVendors = true;

    try {
      const response = await fetch(`${API_BASE}vendor-profiles/`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch vendor profiles');

      const data = await response.json();
      const vendors = data.results || [];

      // Update cache
      vendors.forEach((vendor: VendorProfile) => {
        this.vendorCache.set(vendor.id, vendor);
      });

      this.lastFetchTime = Date.now();
    } catch (error) {
      console.error('Error refreshing vendor profiles:', error);
    } finally {
      this.fetchingVendors = false;
    }
  }

  getDeliveryRadius(vendorId: number): number | null {
    const vendor = this.vendorCache.get(vendorId);
    return vendor?.delivery_radius ?? null;
  }

  async getGlobalDeliveryRadius(): Promise<number | null> {
    // Check cache first
    if (this.deliveryRadiusCache &&
        Date.now() - this.deliveryRadiusLastFetch < this.DELIVERY_RADIUS_CACHE_TTL) {
      return this.deliveryRadiusCache.is_active ? this.deliveryRadiusCache.radius : null;
    }

    try {
      // Use the correct API endpoint from api_urls.py
      const response = await fetch(`${API_BASE}delivery-radius/`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch global delivery radius, using fallback');
        return null;
      }

      const data = await response.json();
      console.log('Delivery radius API response:', data);

      // The API returns { delivery_radius: number }
      if (data && typeof data.delivery_radius === 'number') {
        // Create a mock DeliveryRadiusSettings object for caching
        this.deliveryRadiusCache = {
          id: 1,
          radius: data.delivery_radius,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.deliveryRadiusLastFetch = Date.now();
        return data.delivery_radius;
      }

      return null;
    } catch (error) {
      console.error('Error fetching global delivery radius:', error);
      return null;
    }
  }
}

export const vendorService = new VendorService();