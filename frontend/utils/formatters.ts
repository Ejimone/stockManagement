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
 * @param currencySymbol - The currency symbol to use (default: ₦)
 * @returns A formatted currency string
 */
export const formatCurrency = (
  value: any,
  currencySymbol: string = "₦"
): string => {
  return `${currencySymbol}${formatPrice(value)}`;
};

/**
 * Formats a date string to a readable format
 *
 * @param dateString - The date string to format
 * @returns A formatted date string
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
};

/**
 * Formats a date string to include both date and time
 *
 * @param dateString - The date string to format
 * @returns A formatted date-time string
 */
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Invalid Date";
  }
};

/**
 * Formats a date for input fields (YYYY-MM-DD)
 *
 * @param date - The date to format
 * @returns A formatted date string for inputs
 */
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export default {
  formatPrice,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateForInput,
};
