/**
 * Formats a numeric value into currency strings
 */
export const formatCurrency = (value: number, currency: 'UGX' | 'USD' = 'UGX'): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  // Format as Ugandan Shillings (UGX)
  return `UGX ${value.toLocaleString()}`;
};

/**
 * Formats date strings into human-readable views
 */
export const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};
