/**
 * Formats a number as PKR (Pakistani Rupee).
 * @param value The number to format.
 * @param options Intl.NumberFormatOptions for customization.
 * @returns A formatted string.
 */
export function formatPKR(
  value: number,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 0 },
): string {
  return value.toLocaleString("en-PK", options);
}

/**
 * Formats a percentage.
 * @param value The number to format (e.g., 0.123 for 12.3%).
 * @param showPlus Whether to show a '+' for positive values.
 * @returns A formatted string.
 */
export function formatPercentage(
  value: number,
  showPlus: boolean = true,
): string {
  const formatted = value.toFixed(2);
  const prefix = showPlus && value >= 0 ? "+" : "";
  return `${prefix}${formatted}%`;
}
