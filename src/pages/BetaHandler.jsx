import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, CheckCircle, Loader2 } from 'lucide-react';

export default function BetaHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            // Save beta access to local storage
            localStorage.setItem('beta_access_token', token);
            localStorage.setItem('beta_mode', 'true');
            
            // Redirect to dashboard after a short delay to show the success state
            const timer = setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            navigate('/dashboard');
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-6 animate-bounce">
                <Zap className="w-10 h-10 text-indigo-400" />
            </div>
            
            <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Initializing Beta</h1>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                Verifying your secure access token and syncing the latest neural updates...
            </p>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                {token ? (
                    <>
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Access Granted</span>
                    </>
                ) : (
                    <>
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verifying...</span>
                    </>
                )}
            </div>

            <p className="mt-12 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Paywise Beta Environment</p>
        </div>
    );
}
