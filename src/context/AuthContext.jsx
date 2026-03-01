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
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const register = async (username, email, password) => {
        const res = await api.post('/auth/register', { username, email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, api, sessionAuthenticated, setSessionAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
