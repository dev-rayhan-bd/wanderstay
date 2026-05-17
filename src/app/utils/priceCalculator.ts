export const calculateFinalPrice = (supplierPrice: any, msp: number = 0) => {
  const PLATFORM_FEE_PERCENTAGE = 10;
  const originalPrice = typeof supplierPrice === 'string' ? parseFloat(supplierPrice) : supplierPrice;
  
  const markupAmount = (originalPrice * PLATFORM_FEE_PERCENTAGE) / 100;
  let finalPrice = Math.ceil(originalPrice + markupAmount);

  if (finalPrice < msp) {
    finalPrice = msp;
  }

  return { finalPrice, markupAmount, originalPrice };
};