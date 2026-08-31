/**
 * Formats a numeric value into currency strings
 */
export const formatCurrency = (
  valueInUGX: number,
  currency: string = 'UGX',
  exchangeRate: number = 3700
): string => {
  const val = valueInUGX || 0;
  if (currency === 'USD') {
    const usdVal = val / exchangeRate;
    return `$${usdVal.toLocaleString(undefined, {
      minimumFractionDigits: usdVal % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Default format as Ugandan Shillings (UGX)
  return `UGX ${Math.round(val).toLocaleString()}`;
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

/**
 * Returns current Date object for East Africa Time (EAT / UTC+3)
 */
export const getEATDate = (baseDate: Date = new Date()): Date => {
  return baseDate;
};

/**
 * Formats a Date into EAT formatted time string (e.g. 01:42:11 PM) using Africa/Nairobi timezone (UTC+3)
 */
export const formatEATTime = (date: Date = new Date()): string => {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Formats a Date into EAT formatted date string (e.g. Thu, 20 Aug) using Africa/Nairobi timezone
 */
export const formatEATDate = (date: Date = new Date()): string => {
  return date.toLocaleDateString('en-GB', {
    timeZone: 'Africa/Nairobi',
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};


