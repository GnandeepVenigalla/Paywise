import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    ArrowRight, Share2, Loader2, Sparkles, X, Key,
    CheckCircle2, ExternalLink, AlertCircle, ChevronRight, Shield
} from 'lucide-react';

export default function SplitwiseMigrationBanner() {
    const { user, api, setUser } = useContext(AuthContext);
    const [step, setStep] = useState('prompt'); // prompt | choose | oauth-loading | token-input | migrating | success | error
    const [apiToken, setApiToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [dismissed, setDismissed] = useState(false);

    if (!user || user.splitwiseMigrationStatus === 'completed' || dismissed) return null;

    // ── OAuth flow ──────────────────────────────────────────────────────────
    const handleOAuth = async () => {
        setStep('oauth-loading');
        try {
            const res = await api.get('/splitwise/auth-url');
            if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch {
            setErrorMsg('Failed to connect to Splitwise. Please try again.');
            setStep('error');
        }
    };

    // ── Token flow ───────────────────────────────────────────────────────────
    const handleTokenMigrate = async () => {
        if (!apiToken.trim()) return;
        setLoading(true);
        setStep('migrating');
        try {
            const res = await api.post('/splitwise/migrate-with-token', { apiToken: apiToken.trim() });
            setResult(res.data);
            setStep('success');
            const userRes = await api.get('/auth/me');
            setUser(userRes.data);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Migration failed. Check your token and try again.');
            setStep('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative overflow-hidden bg-white border border-slate-100 rounded-[2rem] p-6 mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-slate-900/5 rounded-full blur-2xl pointer-events-none" />

            {step !== 'migrating' && step !== 'success' && (
                <button onClick={() => setDismissed(true)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition">
                    <X className="w-4 h-4" />
                </button>
            )}

            {/* ── Step 1: Initial prompt ────────────────────── */}
            {step === 'prompt' && (
                <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center flex-shrink-0 shadow-lg">
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
                        Import all your Splitwise groups and expenses into Paywise — no data loss, in one click.
                    </p>
                    <button
                        onClick={() => setStep('choose')}
                        className="group w-full bg-slate-900 text-white h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20"
                    >
                        Start Secure Migration
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest">Safe & Secure • Powered by Splitwise API</p>
                </div>
            )}

            {/* ── Step 2: Choose method ─────────────────────── */}
            {step === 'choose' && (
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">How would you like to connect?</h3>
                        <p className="text-sm text-gray-400">Choose the best option for you:</p>
                    </div>

                    {/* Option A: OAuth (recommended) */}
                    <button
                        onClick={handleOAuth}
                        className="w-full text-left border-2 border-emerald-100 bg-emerald-50/50 hover:border-emerald-200 rounded-2xl p-4 transition group"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-4 h-4 text-emerald-600" />
                                    <span className="text-sm font-bold text-emerald-700">Log in with Splitwise</span>
                                    <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Recommended</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Securely log in to your Splitwise account. You'll be redirected back to Paywise automatically.
                                    <br />
                                    <span className="text-amber-500 font-semibold">⚠ Requires the production app to be deployed on GitHub Pages.</span>
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-emerald-400 flex-shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
                        </div>
                    </button>

                    {/* Option B: API Token */}
                    <button
                        onClick={() => setStep('token-input')}
                        className="w-full text-left border-2 border-gray-100 bg-gray-50/50 hover:border-gray-200 rounded-2xl p-4 transition group"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Key className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-bold text-gray-800">Use Splitwise API Token</span>
                                    <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Advanced</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Copy your personal token from your Splitwise account. Works on any network, including localhost.
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
                        </div>
                    </button>

                    <button onClick={() => setStep('prompt')} className="text-sm text-gray-400 font-medium hover:text-gray-600 transition text-center">
                        ← Back
                    </button>
                </div>
            )}

            {/* ── Step: OAuth loading ───────────────────────── */}
            {step === 'oauth-loading' && (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Connecting to Splitwise...</h3>
                        <p className="text-sm text-gray-500 mt-1">You'll be redirected to Splitwise to log in.</p>
                    </div>
                </div>
            )}

            {/* ── Step: Token input ────────────────────────── */}
            {step === 'token-input' && (
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Paste your Splitwise API Token</h3>
                        <div className="mt-3 text-sm text-gray-600 space-y-2">
                            <p className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-slate-900 text-white rounded-full text-[11px] flex items-center justify-center font-black flex-shrink-0 mt-0.5">1</span>
                                <span>Go to <a href="https://secure.splitwise.com/apps" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold underline inline-flex items-center gap-0.5">splitwise.com/apps <ExternalLink className="w-3 h-3" /></a></span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-slate-900 text-white rounded-full text-[11px] flex items-center justify-center font-black flex-shrink-0 mt-0.5">2</span>
                                <span>Click your Paywise app → copy <strong>"Your token"</strong></span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-slate-900 text-white rounded-full text-[11px] flex items-center justify-center font-black flex-shrink-0 mt-0.5">3</span>
                                <span>Paste it below and tap Import</span>
                            </p>
                        </div>
                    </div>
                    <input
                        type="password"
                        value={apiToken}
                        onChange={e => setApiToken(e.target.value)}
                        placeholder="Paste token here..."
                        className="w-full border-2 border-gray-200 focus:border-slate-900 rounded-2xl px-4 py-3.5 text-sm font-medium outline-none transition"
                        onKeyDown={e => e.key === 'Enter' && handleTokenMigrate()}
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setStep('choose')} className="flex-1 h-12 rounded-2xl font-bold text-sm bg-gray-100 text-gray-600">Back</button>
                        <button
                            onClick={handleTokenMigrate}
                            disabled={!apiToken.trim()}
                            className="flex-[2] h-12 rounded-2xl font-bold text-sm bg-slate-900 text-white flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            Import My Data <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step: Migrating ──────────────────────────── */}
            {step === 'migrating' && (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center relative">
                        <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Importing your data...</h3>
                        <p className="text-sm text-gray-500 mt-1">This may take a moment for large accounts.</p>
                    </div>
                </div>
            )}

            {/* ── Step: Success ────────────────────────────── */}
            {step === 'success' && (
                <div className="flex flex-col items-center text-center gap-4 py-2">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Migration Complete! 🎉</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Imported <strong>{result?.groupsCount ?? 0} groups</strong> and <strong>{result?.expensesCount ?? 0} expenses</strong> from Splitwise.
                        </p>
                    </div>
                    <button onClick={() => setDismissed(true)} className="w-full h-12 rounded-2xl font-bold text-sm bg-slate-900 text-white">
                        View My Dashboard
                    </button>
                </div>
            )}

            {/* ── Step: Error ──────────────────────────────── */}
            {step === 'error' && (
                <div className="flex flex-col gap-4">
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-rose-700">Something went wrong</p>
                            <p className="text-xs text-rose-500 mt-0.5">{errorMsg}</p>
                        </div>
                    </div>
                    <button onClick={() => setStep('choose')} className="w-full h-12 rounded-2xl font-bold text-sm bg-slate-900 text-white">
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
