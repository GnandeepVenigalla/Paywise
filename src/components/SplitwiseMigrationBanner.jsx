import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight, Share2, Loader2, Sparkles, X } from 'lucide-react';

export default function SplitwiseMigrationBanner() {
    const { user, api, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // If already moved or dismissed, don't show
    if (!user || user.splitwiseMigrationStatus === 'completed' || user.splitwiseMigrationStatus === 'pending' || dismissed) {
        return null;
    }

    const handleMigrationInit = async () => {
        setLoading(true);
        try {
            // Fetch the OAuth URL from backend
            const res = await api.get('/splitwise/auth-url');
            if (res.data.url) {
                // Redirect user to Splitwise for authorization
                window.location.href = res.data.url;
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to Splitwise. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative overflow-hidden bg-white border border-slate-100 rounded-[2rem] p-6 mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Background Accents */}
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-slate-900/5 rounded-full blur-2xl pointer-events-none" />

            <button
                onClick={() => setDismissed(true)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-900/10">
                        <Share2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <Sparkles className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Smart Migration</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">Migrate from Splitwise?</h3>
                    </div>
                </div>

                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    Moving from Splitwise? We can automatically import all your groups and expenses so you don't lose any data.
                </p>

                <button
                    onClick={handleMigrationInit}
                    disabled={loading}
                    className="group w-full bg-slate-900 text-white h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-slate-900/20"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Start Secure Migration
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest">
                    Safe & Secure • 1-Click Sync
                </p>
            </div>
        </div>
    );
}
