/**
 * Professional formatting utilities for Paywise
 */

export const CURRENCY_SYMBOLS = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
    CAD: 'CA$', AUD: 'A$', CHF: 'Fr', CNY: '¥', MXN: 'MX$',
    BRL: 'R$', KRW: '₩', SGD: 'S$', HKD: 'HK$',
    AED: 'د.إ', SEK: 'kr', NOK: 'kr', DKK: 'kr', NZD: 'NZ$', ZAR: 'R',
};

/**
 * Common exchange rates based on USD as the base (1 USD = X target).
 * Loaded initially with static defaults as fallback.
 */
export const EXCHANGE_RATES = {
    USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.12, JPY: 150.15,
    CAD: 1.35, AUD: 1.52, CNY: 7.19, CHF: 0.88, MXN: 17.05,
    BRL: 4.97, KRW: 1332.50, SGD: 1.34, HKD: 7.82, SEK: 10.35,
    NOK: 10.55, DKK: 6.85, NZD: 1.63, ZAR: 19.10, AED: 3.67,
};

// Dynamically fetch live global rates on client load to seamlessly transition to real conversions
fetch('https://open.er-api.com/v6/latest/USD')
    .then(res => res.json())
    .then(data => {
        if (data && data.rates) {
            Object.assign(EXCHANGE_RATES, data.rates);
            console.log('[Paywise] Live global exchange rates synced successfully.');
        }
    })
    .catch(err => console.warn('[Paywise] Failed to fetch live global rates, continuing with cache.'));


/**
 * Converts an amount from one currency to another
 * @param {number} amount - The numeric amount
 * @param {string} from - Source ISO code (default: 'USD')
 * @param {string} to - Target ISO code (default: 'USD')
 */
export const convertAmount = (amount, from = 'USD', to = 'USD') => {
    if (!amount || from === to) return amount;
    const rate_from = EXCHANGE_RATES[from] || 1;
    const rate_to = EXCHANGE_RATES[to] || 1;
    return amount * (rate_to / rate_from);
};

/**
 * Formats a number as a currency string, optionally performing conversion
 * @param {number} amount - The amount in the *source* currency
 * @param {string} targetCurrency - ISO code to display in (user's preference)
 * @param {string} sourceCurrency - ISO code the amount is currently in (base)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, targetCurrency = 'USD', sourceCurrency = 'USD') => {
    const converted = convertAmount(amount, sourceCurrency, targetCurrency);
    const symbol = CURRENCY_SYMBOLS[targetCurrency] || targetCurrency || '$';
    return `${symbol}${Math.abs(converted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Formats a date string into a user-friendly month-year label
 * @param {string|Date} date - Date to format
 * @returns {string} - e.g., "March 2024"
 */
export const formatMonthYear = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Unknown Date';
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Formats a date string into a shorthand month label (3 letters)
 * @param {string|Date} date - Date to format
 * @returns {string} - e.g., "MAR"
 */
export const formatShortMonth = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
};

/**
 * Formats a date string into a 2-digit day
 * @param {string|Date} date - Date to format
 * @returns {string} - e.g., "05"
 */
export const formatDay = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return ("0" + d.getDate()).slice(-2);
};

/**
 * Returns the color class based on an amount (lent vs borrowed)
 * @param {number} amount - The balance amount
 * @returns {string} - Tailwind color class
 */
export const getAmountColor = (amount) => {
    if (amount > 0) return 'text-emerald-500';
    if (amount < 0) return 'text-rose-500';
    return 'text-gray-400';
};
