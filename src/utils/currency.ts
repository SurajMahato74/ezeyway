// Currency formatting utility
export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return 'Rs 0';
  return `Rs ${numAmount.toFixed(2)}`;
};

export const formatPrice = (price: number | string): string => {
  return formatCurrency(price);
};

// Replace ₹ symbol with Rs in any string
export const replaceRupeeSymbol = (text: string): string => {
  return text.replace(/₹/g, 'Rs ');
};