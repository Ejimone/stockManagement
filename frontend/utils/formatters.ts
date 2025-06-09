/**
 * Helper functions for formatting and validating data
 */

/**
 * Safely formats a price value to 2 decimal places.
 * Returns a formatted price string even if the input is undefined or not a number.
 *
 * @param price - The price value to format
 * @returns A string representation of the price, formatted to 2 decimal places
 */
export const formatPrice = (price: any): string => {
  // Check if price exists and is a valid number or numeric string
  if (price !== undefined && price !== null) {
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    if (!isNaN(numericPrice) && isFinite(numericPrice)) {
      return numericPrice.toFixed(2);
    }
  }
  // Return a default value for invalid prices
  return "0.00";
};

/**
 * Formats a number as currency with the specified currency symbol
 *
 * @param value - The numeric value to format
 * @param currencySymbol - The currency symbol to use (default: $)
 * @returns A formatted currency string
 */
export const formatCurrency = (
  value: any,
  currencySymbol: string = "$"
): string => {
  return `${currencySymbol}${formatPrice(value)}`;
};

export default {
  formatPrice,
  formatCurrency,
};
