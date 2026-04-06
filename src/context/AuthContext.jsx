import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { applyCustomTheme } from '../hooks/useAppSettings';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionAuthenticated, setSessionAuthenticated] = useState(false);

    // Access the API dynamically using Vite's proxy resolving Mixed Content errors
    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://paywise-backend-lemon.vercel.app/api' : '/api');

    const api = axios.create({
        baseURL: API_URL,
    });

    api.interceptors.request.use(config => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    const loadUser = async () => {
        try {
            if (localStorage.getItem('token')) {
                const res = await api.get('/auth/me');
                const loggedInUser = res.data;
                setUser(loggedInUser);
                // Apply saved custom theme immediately when user data arrives
                if (loggedInUser?.appSettings?.customTheme) {
                    applyCustomTheme(loggedInUser.appSettings.customTheme);
                }

                // Sync timezone automatically if it's not set or has changed
                const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (loggedInUser && loggedInUser.timezone !== currentTimezone) {
                    api.put('/auth/preferences', { timezone: currentTimezone })
                        .then(() => setUser(prev => ({ ...prev, timezone: currentTimezone })))
                        .catch(e => console.warn('[Paywise] Failed to auto-sync timezone.'));
                }

                // If user is at the fallback 'USD', try to sync their native currency automatically
                if (loggedInUser && loggedInUser.defaultCurrency === 'USD') {
                    fetch('https://ipapi.co/json/')
                        .then(res => res.json())
                        .then(data => {
                            if (data && data.currency && data.currency !== 'USD') {
                                api.put('/auth/preferences', { defaultCurrency: data.currency.toUpperCase() })
                                    .then(() => setUser(prev => ({ ...prev, defaultCurrency: data.currency.toUpperCase() })))
                                    .catch(e => console.warn('[Paywise] Failed to auto-sync currency.'));
                            }
                        })
                        .catch(e => console.warn('[Paywise] Geolocation sync failed.'));
                }
            }
        } catch (err) {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            await loadUser(); // Load full user profile
            return res.data;
        } catch (err) {
            if (err.response?.data?.requireOtp) {
                return err.response.data;
            }
            throw err;
        }
    };

    const register = async (username, email, phone, password) => {
        let defaultCurrency = 'USD';
        let timezone = 'UTC';

        // 1. Detect Timezone directly from the browser (zero latency, zero failure)
        try {
            timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
            console.log(`[Paywise] Timezone detected: ${timezone}`);
        } catch (e) {
            console.warn('[Paywise] Failed to detect timezone from Intl API.');
        }

        // 2. Fetch Native Currency from IP-based geolocation (using HTTPS)
        try {
            // We use ipapi.co (HTTPS supported) for reliable native currency detection
            const locRes = await fetch('https://ipapi.co/json/');
            const data = await locRes.json();
            if (data && data.currency) {
                defaultCurrency = data.currency.toUpperCase();
                console.log(`[Paywise] Geolocation matched. Native currency: ${defaultCurrency}`);
            }
        } catch (err) {
            console.warn('[Paywise] Couldn\'t reach secure geolocation API. Defaulting base to USD.');
        }

        const res = await api.post('/auth/register', { 
            username, email, phone, password, 
            defaultCurrency, 
            timezone 
        });

        if (res.data.requireOtp) {
            return res.data;
        }
        localStorage.setItem('token', res.data.token);
        await loadUser(); // Load full user profile
        return res.data;
    };

    const verifyOtp = async (email, otp) => {
        const res = await api.post('/auth/verify-otp', { email, otp });
        localStorage.setItem('token', res.data.token);
        await loadUser(); // Load full user profile
        return res.data;
    };

    const googleLogin = async (credential) => {
        let timezone = 'UTC';
        try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch(e) {}
        
        const res = await api.post('/auth/google', { credential, timezone });
        localStorage.setItem('token', res.data.token);
        await loadUser(); // Load full user profile
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const getDailyExpenseCount = () => {
        const storedDate = localStorage.getItem('expense_count_date');
        const today = new Date().toDateString();
        
        if (storedDate !== today) {
            localStorage.setItem('expense_count_date', today);
            localStorage.setItem('expense_count', '0');
            return 0;
        }
        return parseInt(localStorage.getItem('expense_count') || '0');
    };

    const [expenseCount, setExpenseCount] = useState(getDailyExpenseCount());

    const incrementExpenseCount = () => {
        const today = new Date().toDateString();
        const newCount = expenseCount + 1;
        setExpenseCount(newCount);
        localStorage.setItem('expense_count', newCount.toString());
        localStorage.setItem('expense_count_date', today);
    };

    return (
        <AuthContext.Provider value={{ 
            user, setUser, loading, login, register, verifyOtp, googleLogin, logout, api, 
            sessionAuthenticated, setSessionAuthenticated,
            expenseCount, incrementExpenseCount 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
