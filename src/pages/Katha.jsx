import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import {
    BookOpen, Store, TrendingUp, TrendingDown, ChevronRight,
    AlertCircle, CheckCircle, RefreshCw, MessageCircle
} from 'lucide-react';
import logoImg from '../assets/logo.png';

const fmt = (n, abs = true) => '₹' + (abs ? Math.abs(n) : n).toLocaleString('en-IN');
const ago = (d) => {
    const diff = Date.now() - new Date(d);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const CATEGORY_ICONS = {
    'Grocery': '🛒', 'Clothing': '👕', 'Restaurant & Food': '🍱', 'Restaurant': '🍱',
    'Pharmacy': '💊', 'Electronics': '📱', 'Hardware': '🔧', 'Services': '🛠', 'General': '🏢'
};

export default function Katha() {
    const { api, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStores = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/merchant/my-stores');
            setStores(res.data || []);
        } catch (err) {
            setError('Could not load your Katha. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        const host = window.location.hostname;
        const isLocalOrBeta = host === 'localhost' || host === '127.0.0.1' || host === 'beta.paywiseapp.com';
        if (!isLocalOrBeta) {
            navigate('/dashboard', { replace: true });
            return;
        }
        fetchStores(); 
    }, []);

    const totalOwed = stores.filter(s => s.balance > 0).reduce((sum, s) => sum + s.balance, 0);
    const totalAdvance = stores.filter(s => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm pt-8 pb-4 px-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={logoImg} alt="Paywise" className="w-8 h-8 object-contain" />
                    <h1 className="text-xl font-bold text-gray-900">Paywise <span className="text-amber-600">Katha</span></h1>
                </div>
                <button onClick={fetchStores} className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 transition text-slate-500">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </header>

            <main className="px-4 pt-5 max-w-md mx-auto">
                {/* Summary Cards */}
                {!loading && stores.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mb-1">You Owe</p>
                            <p className="text-[17px] font-black text-rose-600 leading-none">{fmt(totalOwed)}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Advance</p>
                            <p className="text-[17px] font-black text-emerald-600 leading-none">{fmt(totalAdvance)}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">Stores</p>
                            <p className="text-[17px] font-black text-blue-600 leading-none">{stores.length}</p>
                        </div>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full" />
                                    <div className="flex-1">
                                        <div className="h-3 bg-gray-100 rounded-full w-2/3 mb-2" />
                                        <div className="h-2 bg-gray-100 rounded-full w-1/3" />
                                    </div>
                                    <div className="h-5 w-16 bg-gray-100 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4">
                        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        <p className="text-sm text-rose-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && stores.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-20 px-4">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-5 text-4xl">
                            📕
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">No Katha Yet</h2>
                        <p className="text-gray-500 text-sm text-center leading-relaxed max-w-xs">
                            When a merchant adds you to their Katha book, it will appear here. Your balance with each store is tracked automatically.
                        </p>
                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 w-full max-w-xs">
                            <p className="text-xs text-amber-800 font-semibold text-center">
                                💡 Your phone number must match what the merchant enters.
                                Make sure your Paywise account uses the same number.
                            </p>
                        </div>
                    </div>
                )}

                {/* Store list */}
                {!loading && stores.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Your Stores</h2>
                        {stores.map(store => {
                            const owes = store.balance > 0;
                            const icon = CATEGORY_ICONS[store.category] || '🏪';
                            return (
                                <button
                                    key={store.merchantId}
                                    onClick={() => navigate(`/katha/${store.merchantId}`)}
                                    className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 text-left hover:border-amber-200 hover:shadow-md transition-all group"
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${owes ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                                        {icon}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-[15px] truncate leading-tight">{store.shopName}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] text-gray-400">{store.category}</span>
                                            <span className="text-gray-200">·</span>
                                            <span className="text-[11px] text-gray-400">{ago(store.lastTransaction)}</span>
                                            {store.trustScore < 90 && <span className="text-[10px] font-bold text-orange-500">⚠ {store.trustScore}%</span>}
                                        </div>
                                    </div>

                                    {/* Balance */}
                                    <div className="text-right flex-shrink-0">
                                        <div className={`text-[16px] font-black leading-none ${owes ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {fmt(store.balance)}
                                        </div>
                                        <div className={`text-[10px] font-black uppercase tracking-tight mt-0.5 ${owes ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {owes ? 'you owe' : 'advance'}
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-600 transition-colors" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
