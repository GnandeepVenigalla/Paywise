import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function SplitwiseCallback() {
    const navigate = useNavigate();
    const { api, setUser } = useContext(AuthContext);
    const [status, setStatus] = useState('verifying');
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        // With HashRouter, the URL looks like:
        //   http://host/Paywise/#/splitwise-callback?code=XYZ
        // BUT Splitwise may redirect to a non-hash URL:
        //   http://host/Paywise/splitwise-callback?code=XYZ
        // We need to check BOTH window.location.search and window.location.hash

        let code = null;

        // 1. Try reading from the standard URL search params (non-hash redirect)
        const searchParams = new URLSearchParams(window.location.search);
        code = searchParams.get('code');

        // 2. If not found, try reading from the hash portion (hash redirect)
        if (!code) {
            const hashWithQuery = window.location.hash; // e.g. "#/splitwise-callback?code=XYZ"
            const hashQueryIndex = hashWithQuery.indexOf('?');
            if (hashQueryIndex !== -1) {
                const hashParams = new URLSearchParams(hashWithQuery.slice(hashQueryIndex));
                code = hashParams.get('code');
            }
        }

        console.log('[SplitwiseCallback] Detected code:', code ? '***found***' : 'NOT FOUND');
        console.log('[SplitwiseCallback] Full URL:', window.location.href);

        if (!code) {
            setStatus('error');
            setError('No authorization code was received from Splitwise. Please try the migration again.');
            return;
        }

        handleMigration(code);
    }, []);

    const handleMigration = async (code) => {
        setStatus('migrating');
        // Must EXACTLY match the redirect_uri used in the authorization request.
        // The backend always sends the production GitHub Pages URL.
        const redirectUri = 'https://www.paywiseapp.com/splitwise-callback.html';

        try {
            const res = await api.post('/splitwise/migrate', { code, redirectUri });
            setStats(res.data);
            setStatus('success');

            // Update local user state so migration status is updated everywhere
            const userRes = await api.get('/auth/me');
            setUser(userRes.data);

            // Auto-navigate after success
            setTimeout(() => {
                navigate('/dashboard');
            }, 5000);
        } catch (err) {
            console.error('[SplitwiseCallback] Migration error:', err);
            setStatus('error');
            setError(err.response?.data?.msg || 'Failed to migrate data. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl p-3 mb-8 shadow-xl">
                <img src={logoImg} alt="Paywise" className="w-full h-full object-contain" />
            </div>

            <div className="max-w-sm w-full bg-white rounded-[2.5rem] p-8 shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-gray-100">
                {status === 'migrating' || status === 'verifying' ? (
                    <div className="animate-in fade-in duration-500">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
                            <div className="absolute inset-0 border-4 border-slate-900/10 rounded-full" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Migrating Data</h2>
                        <p className="text-gray-500 font-medium">Please wait while we bring your Splitwise groups and expenses into Paywise...</p>
                    </div>
                ) : status === 'success' ? (
                    <div className="animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Done!</h2>
                        <p className="text-gray-500 font-medium mb-6">
                            Successfully migrated {stats?.groupsCount || 0} groups. Your Paywise dashboard is now up to date.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-slate-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-950 transition"
                        >
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Migration Failed</h2>
                        <p className="text-rose-500 text-sm font-semibold mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-slate-100 text-slate-900 h-14 rounded-2xl font-bold transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-8 text-gray-300 text-[11px] font-black uppercase tracking-[0.2em]">
                Secure Data Portability
            </p>
        </div>
    );
}
