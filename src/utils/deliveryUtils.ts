export interface DeliveryInfo {
  isFreeDelivery: boolean;
  deliveryFee: number | null;
  displayText: string;
  badgeColor: string;
}

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

