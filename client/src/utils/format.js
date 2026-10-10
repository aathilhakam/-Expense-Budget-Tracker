const localeForCurrency = { LKR: 'en-LK', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };

export function formatCurrency(value, currency = 'LKR') {
  if (currency === 'LKR') {
    return `Rs. ${new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0))}`;
  }
  return new Intl.NumberFormat(localeForCurrency[currency] || 'en-LK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en', options).format(new Date(value));
}

export const monthLabel = (month) => new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(2024, month - 1, 1));
