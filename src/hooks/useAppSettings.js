import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Central hook for reading and applying all app settings.
 * - Applies theme (light/dark/system) and high contrast mode to <html>
 * - Returns all settings as a flat object for easy consumption
 */
export function useAppSettings() {
    const { user } = useContext(AuthContext);
    const s = user?.appSettings || {};

    const settings = {
        defaultSplitMethod: s.defaultSplitMethod || 'equally',
        monthlyBudget: Number(s.monthlyBudget) || 0,
        theme: s.theme || 'system',
        highContrastMode: !!s.highContrastMode,
        dateFormat: s.dateFormat || 'MM/DD/YYYY',
        timeFormat: s.timeFormat || '12h',
        language: s.language || 'English',
        profileVisibility: s.profileVisibility !== false,
        autoAcceptFriends: !!s.autoAcceptFriends,
        hideBalance: !!s.hideBalance,
        biometricLock: !!s.biometricLock,
    };

    // Apply theme to <html> element whenever it changes
    useEffect(() => {
        const root = document.documentElement;
        // Remove existing theme classes
        root.classList.remove('theme-light', 'theme-dark', 'dark');
        root.classList.toggle('high-contrast', settings.highContrastMode);

        const applyDark = () => {
            root.classList.add('theme-dark', 'dark');
        };
        const applyLight = () => {
            root.classList.add('theme-light');
        };

        if (settings.theme === 'light') {
            applyLight();
        } else if (settings.theme === 'dark') {
            applyDark();
        } else {
            // System: use prefers-color-scheme
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (mediaQuery.matches) applyDark();
            else applyLight();

            // Also listen for system preference changes in realtime
            const handler = (e) => {
                root.classList.remove('theme-light', 'theme-dark', 'dark');
                if (e.matches) applyDark();
                else applyLight();
            };
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [settings.theme, settings.highContrastMode]);

    return settings;
}

/**
 * Format a date string/object according to user's date format preference.
 * @param {string|Date} date
 * @param {string} format - 'MM/DD/YYYY' | 'DD/MM/YYYY'
 * @param {string} timeFormat - '12h' | '24h' (optional)
 * @param {boolean} includeTime - whether to include time
 */
export function formatDate(date, format = 'MM/DD/YYYY', timeFormat = '12h', includeTime = false) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let datePart;
    if (format === 'DD/MM/YYYY') {
        datePart = `${day}/${month}/${year}`;
    } else {
        datePart = `${month}/${day}/${year}`;
    }

    if (!includeTime) return datePart;

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    if (timeFormat === '12h') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${datePart} ${hours}:${minutes} ${ampm}`;
    } else {
        return `${datePart} ${String(hours).padStart(2, '0')}:${minutes}`;
    }
}

/**
 * Get the currency symbol for a given currency code.
 */
export function getCurrencySymbol(code) {
    const symbols = {
        USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
        CAD: 'CA$', AUD: 'A$', CHF: 'Fr', CNY: '¥', MXN: 'MX$',
        BRL: 'R$', KRW: '₩', SGD: 'S$', HKD: 'HK$',
        SEK: 'kr', NOK: 'kr', DKK: 'kr', NZD: 'NZ$', ZAR: 'R', AED: 'د.إ',
    };
    return symbols[code] || code || '$';
}
