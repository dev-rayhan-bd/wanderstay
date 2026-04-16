export const calculateFinalPrice = (supplierPrice: string | number) => {
  const PLATFORM_FEE_PERCENTAGE = 10;
  
  const originalPrice = typeof supplierPrice === 'string' ? parseFloat(supplierPrice) : supplierPrice;
  
  const markupAmount = (originalPrice * PLATFORM_FEE_PERCENTAGE) / 100;
  const finalPrice = Math.ceil(originalPrice + markupAmount);

  return {
    finalPrice,      // customer amount
    markupAmount,    // my profit
    originalPrice    // supplier's original price
  };
};