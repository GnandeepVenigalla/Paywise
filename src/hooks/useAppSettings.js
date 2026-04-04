import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

// ─── Shared helper — called from both hook and AppSettings page ───────────────
export function applyCustomTheme(ct) {
    if (!ct) return;
    const root = document.documentElement;

    // ── Accent color ──────────────────────────────────────────────────────────
    if (ct.useCustomAccent) {
        const accent = ct.customAccentHex
            ? (ct.customAccentHex.startsWith('#') ? ct.customAccentHex : `#${ct.customAccentHex}`)
            : (ct.accentColor || '#059669');

        root.style.setProperty('--pw-accent', accent);
        root.style.setProperty('--pw-accent-light', hexToRgba(accent, 0.12));
        root.style.setProperty('--pw-accent-text', accent);
        root.classList.add('pw-custom-accent');
    } else {
        root.style.removeProperty('--pw-accent');
        root.style.removeProperty('--pw-accent-light');
        root.style.removeProperty('--pw-accent-text');
        root.classList.remove('pw-custom-accent');
    }

    // ── Border radius — injected via <style> tag to beat all specificity ──────
    root.classList.remove('pw-radius-sharp', 'pw-radius-soft', 'pw-radius-round', 'pw-radius-pill');
    const radiusKey = ct.borderRadius || 'round';
    root.classList.add(`pw-radius-${radiusKey}`);

    const RADIUS_MAP = {
        sharp:  { sm: '2px',   md: '4px',   lg: '4px',   xl: '4px',   '2xl': '4px',   '3xl': '4px',   full: '4px',   arb: '4px'   },
        soft:   { sm: '4px',   md: '6px',   lg: '8px',   xl: '10px',  '2xl': '14px',  '3xl': '18px',  full: '9999px', arb: '18px'  },
        round:  { sm: '4px',   md: '8px',   lg: '12px',  xl: '16px',  '2xl': '20px',  '3xl': '28px',  full: '9999px', arb: '32px'  },
        pill:   { sm: '12px',  md: '18px',  lg: '24px',  xl: '32px',  '2xl': '48px',  '3xl': '64px',  full: '9999px', arb: '9999px' },
    };
    const r = RADIUS_MAP[radiusKey] || RADIUS_MAP.round;

    // Remove old injected style if present
    const existing = document.getElementById('pw-radius-style');
    if (existing) existing.remove();

    const styleTag = document.createElement('style');
    styleTag.id = 'pw-radius-style';
    styleTag.textContent = `
        .rounded-sm  { border-radius: ${r.sm}  !important; }
        .rounded     { border-radius: ${r.sm}  !important; }
        .rounded-md  { border-radius: ${r.md}  !important; }
        .rounded-lg  { border-radius: ${r.lg}  !important; }
        .rounded-xl  { border-radius: ${r.xl}  !important; }
        .rounded-2xl { border-radius: ${r['2xl']} !important; }
        .rounded-3xl { border-radius: ${r['3xl']} !important; }
        .rounded-full { border-radius: ${r.full} !important; }
        [class*="rounded-["] { border-radius: ${r.arb} !important; }
        button, input, select, textarea { border-radius: ${r.md} !important; }
    `;
    document.head.appendChild(styleTag);

    // ── Font scale ────────────────────────────────────────────────────────────
    const scale = ct.fontScale || 1.0;
    root.style.setProperty('--pw-font-scale', scale);
    // Also set on #root zoom AND html font-size for maximum browser compatibility
    const appRoot = document.getElementById('root');
    if (appRoot) appRoot.style.zoom = scale;

    // ── Surface style — use data attribute for reliable targeting ─────────────
    root.removeAttribute('data-pw-surface');
    root.setAttribute('data-pw-surface', ct.surfaceStyle || 'default');
    // Also keep class for CSS fallback
    root.classList.remove('pw-surface-default', 'pw-surface-glass', 'pw-surface-flat', 'pw-surface-bordered');
    root.classList.add(`pw-surface-${ct.surfaceStyle || 'default'}`);
}


/** Convert a hex color + alpha to rgba() string */
function hexToRgba(hex, alpha) {
    try {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    } catch (_) {
        return `rgba(5,150,105,${alpha})`;
    }
}

// ─── Persist custom theme to localStorage (called after save) ─────────────────
export function persistCustomTheme(ct) {
    try {
        localStorage.setItem('pw_custom_theme', JSON.stringify(ct));
    } catch (_) {}
}

// ─── Restore custom theme from localStorage on cold load ─────────────────────
export function restoreCustomThemeFromStorage() {
    try {
        const raw = localStorage.getItem('pw_custom_theme');
        if (raw) {
            const ct = JSON.parse(raw);
            applyCustomTheme(ct);
        }
    } catch (_) {}
}

/**
 * Central hook for reading and applying all app settings.
 * - Applies theme (light/dark/system) and high contrast mode to <html>
 * - Applies custom theme CSS variables (accent, radius, font scale, surface)
 * - Returns all settings as a flat object for easy consumption
 */
export function useAppSettings() {
    const { user } = useContext(AuthContext);
    const s = user?.appSettings || {};
    const ct = s.customTheme || {};

    // Extract flat primitives for stable dependency comparison
    const theme = s.theme || 'system';
    const highContrastMode = !!s.highContrastMode;
    const useCustomAccent = !!ct.useCustomAccent;
    const accentColor = ct.accentColor || '#059669';
    const customAccentHex = ct.customAccentHex || null;
    const borderRadius = ct.borderRadius || 'round';
    const fontScale = ct.fontScale || 1.0;
    const surfaceStyle = ct.surfaceStyle || 'default';

    const settings = {
        defaultSplitMethod: s.defaultSplitMethod || 'equally',
        monthlyBudget: Number(s.monthlyBudget) || 0,
        theme,
        highContrastMode,
        dateFormat: s.dateFormat || 'MM/DD/YYYY',
        timeFormat: s.timeFormat || '12h',
        language: s.language || 'English',
        profileVisibility: s.profileVisibility !== false,
        autoAcceptFriends: !!s.autoAcceptFriends,
        hideBalance: !!s.hideBalance,
        biometricLock: !!s.biometricLock,
        customTheme: { useCustomAccent, accentColor, customAccentHex, borderRadius, fontScale, surfaceStyle },
    };

    // Apply theme classes to <html>
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark', 'dark');
        root.classList.toggle('high-contrast', highContrastMode);

        const applyDark = () => root.classList.add('theme-dark', 'dark');
        const applyLight = () => root.classList.add('theme-light');

        if (theme === 'light') {
            applyLight();
        } else if (theme === 'dark') {
            applyDark();
        } else {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            if (mq.matches) applyDark(); else applyLight();
            const handler = (e) => {
                root.classList.remove('theme-light', 'theme-dark', 'dark');
                if (e.matches) applyDark(); else applyLight();
            };
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, [theme, highContrastMode]);

    // Apply custom theme CSS vars & persist to localStorage
    useEffect(() => {
        const customThemeObj = { useCustomAccent, accentColor, customAccentHex, borderRadius, fontScale, surfaceStyle };
        applyCustomTheme(customThemeObj);
        // Only persist when user data is actually loaded (not on cold null state)
        if (user) persistCustomTheme(customThemeObj);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useCustomAccent, accentColor, customAccentHex, borderRadius, fontScale, surfaceStyle]);

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
