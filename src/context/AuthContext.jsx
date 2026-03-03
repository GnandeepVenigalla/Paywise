import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

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
                setUser(res.data);
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
            setUser(res.data.user);
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
        try {
            // Intelligently ping their location safely from their browser to figure out native currency
            const locRes = await fetch('http://ip-api.com/json/?fields=currency');
            const data = await locRes.json();
            if (data && data.currency && data.currency.length === 3) {
                defaultCurrency = data.currency.toUpperCase();
                console.log(`[Paywise] Geolocation matched. Registering default currency as ${defaultCurrency}`);
            }
        } catch (err) {
            console.warn('[Paywise] Couldn\'t reach geolocation API. Defaulting base to USD.');
        }

        const res = await api.post('/auth/register', { username, email, phone, password, defaultCurrency });

        if (res.data.requireOtp) {
            return res.data;
        }
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const verifyOtp = async (email, otp) => {
        const res = await api.post('/auth/verify-otp', { email, otp });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, verifyOtp, logout, api, sessionAuthenticated, setSessionAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
