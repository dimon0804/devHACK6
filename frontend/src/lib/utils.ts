/**
 * Safely format a number to fixed decimal places with currency
 */
export function formatBalance(value: any, currency: string = '₽'): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value || 0))
  if (isNaN(num)) return `0.00 ${currency}`
  return `${num.toFixed(2)} ${currency}`
}

/**
 * Format balance without currency symbol (for display with separate symbol)
 */
export function formatBalanceNumber(value: any): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value || 0))
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
}

/**
 * Safely convert value to number
 */
export function toNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number') return value
  const num = parseFloat(String(value || defaultValue))
  return isNaN(num) ? defaultValue : num
}
