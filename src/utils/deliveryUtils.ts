export interface DeliveryInfo {
  isFreeDelivery: boolean;
  deliveryFee: number | null;
  displayText: string;
  badgeColor: string;
}

// Global delivery radius cache
let globalDeliveryRadius: number = 10; // Default fallback
let deliveryRadiusFetched: boolean = false;

export const getDeliveryInfo = (product: any, vendorDeliveryFee?: number): DeliveryInfo => {
  // Check if product has free delivery
  if (product.free_delivery) {
    return {
      isFreeDelivery: true,
      deliveryFee: 0,
      displayText: "Free Delivery",
      badgeColor: "bg-green-100 text-green-800"
    };
  }

  // Check if product has custom delivery fee
  if (product.custom_delivery_fee_enabled && product.custom_delivery_fee !== null && product.custom_delivery_fee !== undefined) {
    return {
      isFreeDelivery: false,
      deliveryFee: product.custom_delivery_fee,
      displayText: `₹${product.custom_delivery_fee} delivery`,
      badgeColor: "bg-blue-100 text-blue-800"
    };
  }

  // If no delivery options are set, show dynamic delivery message
  return {
    isFreeDelivery: false,
    deliveryFee: null, // null indicates dynamic pricing
    displayText: "Delivery at checkout",
    badgeColor: "bg-orange-100 text-orange-800"
  };
};

/**
 * Return the delivery radius (in km) for a product when available.
 * Priority:
 *  - product.delivery_radius
 *  - product.vendor?.delivery_radius
 *  - product.vendor_delivery_radius
 *  - Global delivery radius from API (async fetch if needed)
 */
export const getDeliveryRadius = async (product: any): Promise<number> => {
  if (!product) {
    // For no product, try to get global radius, fallback to 10
    try {
      const globalRadius = await getGlobalDeliveryRadius();
      return globalRadius ?? 10;
    } catch {
      return 10;
    }
  }

  // Check product-specific delivery radius
  if (product.delivery_radius != null) return Number(product.delivery_radius);

  // Check nested vendor object
  if (product.vendor && product.vendor.delivery_radius != null) return Number(product.vendor.delivery_radius);

  // Check alternative vendor field
  if (product.vendor_delivery_radius != null) return Number(product.vendor_delivery_radius);

  // Default to global delivery radius from API
  try {
    const globalRadius = await getGlobalDeliveryRadius();
    return globalRadius ?? 10;
  } catch {
    return 10;
  }
};

/**
 * Synchronous version that returns cached value or fallback
 */
export const getDeliveryRadiusSync = (product: any): number => {
  if (!product) return globalDeliveryRadius;

  // Check product-specific delivery radius
  if (product.delivery_radius != null) return Number(product.delivery_radius);

  // Check nested vendor object
  if (product.vendor && product.vendor.delivery_radius != null) return Number(product.vendor.delivery_radius);

  // Check alternative vendor field
  if (product.vendor_delivery_radius != null) return Number(product.vendor_delivery_radius);

  // Default to global delivery radius (cached value)
  return globalDeliveryRadius;
};

/**
 * Initialize delivery radius by fetching from API
 */
export const initializeDeliveryRadius = async (): Promise<void> => {
  if (deliveryRadiusFetched) return; // Already fetched

  try {
    const response = await fetch('https://ezeyway.com/api/delivery-radius/', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (response.ok) {
      const data = await response.json();
      globalDeliveryRadius = data.delivery_radius || 10;
      deliveryRadiusFetched = true;
      console.log('✅ Delivery radius initialized from API:', globalDeliveryRadius);
    } else {
      console.warn('⚠️ Failed to fetch delivery radius, using default:', globalDeliveryRadius);
    }
  } catch (error) {
    console.error('❌ Error fetching delivery radius:', error);
  }
};

/**
 * Get current global delivery radius
 */
export const getCurrentGlobalDeliveryRadius = (): number => {
  return globalDeliveryRadius;
};

/**
 * Get the global delivery radius from superadmin settings
 * This is used as a fallback when no specific vendor/product radius is set
 */
export const getGlobalDeliveryRadius = async (): Promise<number | null> => {
  try {
    // Import vendorService dynamically to avoid circular dependencies
    const { vendorService } = await import('@/services/vendorService');
    const radius = await vendorService.getGlobalDeliveryRadius();
    if (radius !== null) {
      globalDeliveryRadius = radius; // Update the cached value
      deliveryRadiusFetched = true;
    }
    return radius;
  } catch (error) {
    console.error('Error getting global delivery radius:', error);
    return null;
  }
};

/**
 * Force refresh delivery radius from API
 */
export const refreshDeliveryRadius = async (): Promise<number> => {
  deliveryRadiusFetched = false;
  await initializeDeliveryRadius();
  return globalDeliveryRadius;
};

