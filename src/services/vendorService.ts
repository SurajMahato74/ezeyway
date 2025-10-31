import { API_BASE } from '@/config/api';

interface VendorProfile {
  id: number;
  delivery_radius: number;
  // Add other fields as needed
}

class VendorService {
  private vendorCache: Map<number, VendorProfile> = new Map();
  private fetchingVendors = false;
  private lastFetchTime = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
}

export const vendorService = new VendorService();