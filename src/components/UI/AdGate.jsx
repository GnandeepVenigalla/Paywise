import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { X, PlayCircle, Loader2, Sparkles, AlertTriangle, Check } from 'lucide-react';

export default function AdGate({ isOpen, onClose, onFinish, type = 'ai' }) {
    const [status, setStatus] = useState('ready'); // ready, loading, playing, finished
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        if (!isOpen) {
            setStatus('ready');
            setTimeLeft(5);
        }
    }, [isOpen]);

    useEffect(() => {
        if (status === 'playing') {
            // Attempt to push a Google Ad if the system is available
            try {
                if (window.adsbygoogle) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            } catch (adErr) {
                console.error('Google Ad Request failed:', adErr);
            }

            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        onFinish(); 
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [status, onFinish]);

    const { api } = useContext(AuthContext);

    if (!isOpen) return null;

    const trackAdEvent = async (type) => {
        try {
            await api.post('/analytics/track', { type });
        } catch (err) {
            console.error('Failed to track ad event:', err);
        }
    };

    const startAd = () => {
        setStatus('loading');
        trackAdEvent('adRequests');
        
        // Check for Google AdSense presence as a sign of successful load
        const isGoogleActive = window.adsbygoogle && window.adsbygoogle.loaded;

        // Priotise Google, with a quick fallback trigger
        setTimeout(() => {
            if (isGoogleActive) {
                // If Google is detected, we still show our playing state but 
                // Google might actually pop its own overlay on top of us.
                setStatus('playing');
                trackAdEvent('adImpressions_google');
            } else {
                // Fallback to our internal simulated ad state
                setStatus('playing');
                trackAdEvent('adImpressions_fallback');
            }
        }, 800);
    };

    const getContent = () => {
        switch (status) {
            case 'ready':
                return (
                    <div className="flex flex-col items-center text-center p-10 min-h-full justify-center">
                        <div className="w-20 h-20 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/5">
                            {type === 'ai' ? <Sparkles className="w-10 h-10 text-indigo-500" /> : type === 'camera' ? <AlertTriangle className="w-10 h-10 text-amber-500" /> : <PlayCircle className="w-10 h-10 text-emerald-500" />}
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Unlock Premium</h2>
                        <div className="mb-8 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-full border border-amber-100 dark:border-amber-900/30">
                             <AlertTriangle className="w-4 h-4 text-amber-500" />
                             <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Security & Safety Notice</span>
                        </div>
                        <p className="text-base text-gray-500 dark:text-gray-400 mb-10 font-medium max-w-[280px] leading-relaxed">
                            Support Paywise by viewing a brief <span className="text-indigo-500 font-bold underline">sponsored message</span>. Access our advanced {type === 'ai' ? 'AI Assistant' : type === 'camera' ? 'Camera Scanner' : 'features'} immediately after.
                        </p>
                        
                        <div className="mb-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center max-w-[250px] mx-auto opacity-70">
                            Paywise never promotes third-party downloads. Only proceed if you trust the content.
                        </div>
                        <button 
                            type="button"
                            onClick={startAd}
                            className="w-full bg-slate-900 dark:bg-indigo-600 text-white h-16 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20"
                        >
                            <PlayCircle className="w-6 h-6" /> Start Ad
                        </button>
                        <button onClick={onClose} className="mt-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-900 dark:hover:text-white transition-colors">Not Now</button>
                    </div>
                );
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                            </div>
                        </div>
                        <p className="mt-8 text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Initializing Ad Stream</p>
                    </div>
                );
            case 'playing':
                return (
                    <div className="flex flex-col items-center justify-center w-full h-full min-h-[450px] relative px-4">
                         {/* Priority 1: Real Google AdSense Unit */}
                         <div className="google-ad-container w-full h-[280px] bg-slate-50/30 dark:bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner relative">
                             <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-black text-white/80 uppercase tracking-widest border border-white/10">ADS</div>
                             <ins className="adsbygoogle"
                                  style={{ display: 'block', width: '100%', height: '280px' }}
                                  data-ad-client="ca-pub-7749956119820849"
                                  data-ad-slot="auto"
                                  data-full-width-responsive="true"></ins>
                         </div>

                         <div className="mt-6 flex flex-col items-center text-center">
                            <div className="mb-4 flex items-center gap-2 bg-gray-200/50 dark:bg-slate-700/50 px-3 py-1 rounded-full border border-gray-300 dark:border-slate-600">
                                 <AlertTriangle className="w-3 h-3 text-gray-500" />
                                 <span className="text-[9px] font-black tracking-widest text-gray-600 dark:text-gray-400 uppercase">Verification Hub</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs px-4 max-w-[280px] leading-relaxed">
                                Content from independent sponsors is being verified. <span className="font-bold text-red-500 underline">Ignore</span> any VPN, Antivirus or Download prompts to stay safe.
                            </p>
                         </div>

                         <div className="absolute top-6 right-6 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg px-5 py-2.5 rounded-full border border-emerald-500">
                            <span className="text-slate-900 dark:text-white font-black text-xs tabular-nums">Ready in {timeLeft}s</span>
                         </div>
                    </div>
                );
            case 'finished':
                // Auto-continues due to the useEffect above, but keep fallback just in case
                return (
                    <div className="flex flex-col items-center text-center p-10 py-16">
                        <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30 animate-in zoom-in-50 duration-500">
                            <Check className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Access Unlocked</h2>
                        <p className="text-base text-gray-500 dark:text-gray-400 mb-10 font-medium max-w-[260px] leading-relaxed">Your content is ready. Thank you for your support!</p>
                        <button 
                            onClick={onFinish}
                            className="w-full bg-slate-900 dark:bg-emerald-600 text-white h-16 rounded-[24px] font-black text-lg active:scale-95 transition-all shadow-2xl shadow-emerald-500/20"
                        >
                            Continue
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-3xl animate-in fade-in duration-500" />
            <div className="relative w-full h-full sm:h-auto sm:max-w-md sm:rounded-[56px] bg-white dark:bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-500">
                {status !== 'playing' && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-white/5">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                            style={{ width: `${((5 - timeLeft) / 5) * 100}%` }} 
                        />
                    </div>
                )}
                <div className="w-full h-full overflow-y-auto custom-scrollbar relative">
                    {/* Security Disclaimer Header */}
                    <div className="sticky top-0 left-0 right-0 h-14 bg-gray-50/95 dark:bg-slate-800/95 backdrop-blur-md flex items-center justify-between px-6 z-[60] border-b border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 bg-slate-900 dark:bg-black px-3 py-1.5 rounded-full shadow-lg border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                                <span className="text-[11px] font-black tracking-[0.15em] text-white uppercase">ADS</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase leading-none tracking-wider">Independent Provider</span>
                                <span className="text-[9px] font-bold text-amber-500 uppercase leading-none mt-1">External Sponsored Media</span>
                             </div>
                        </div>
                        {timeLeft < 4 && (
                            <button 
                                onClick={onFinish}
                                className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in slide-in-from-right-2"
                            >
                                Skip Ad
                            </button>
                        )}
                    </div>

                    {getContent()}
                </div>
            </div>
        </div>
    );
}
