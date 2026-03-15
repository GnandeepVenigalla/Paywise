import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function FloatingAiButton() {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    // Don't show if not logged in
    if (!user) return null;

    // Don't show on certain pages (login, register, or the AI page itself)
    const hiddenRoutes = ['/login', '/register', '/ai', '/forgot-password', '/reset-password'];
    if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
        return null;
    }

    return (
        <Link 
            to="/ai" 
            className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/40 z-50 group hover:scale-110 active:scale-95 transition-all outline-none border border-slate-700/50"
        >
            <Sparkles className="w-6 h-6 animate-pulse text-indigo-400 group-hover:text-indigo-300" />
        </Link>
    );
}
