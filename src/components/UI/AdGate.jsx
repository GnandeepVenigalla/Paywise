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
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setStatus('finished');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [status]);

    if (!isOpen) return null;

    const { api } = useContext(AuthContext);

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
        // Simulate ad loading from AdSense
        setTimeout(() => {
            setStatus('playing');
            trackAdEvent('adImpressions');
            // Try to push AdSense ad
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {}
        }, 1500);
    };

    const getContent = () => {
        switch (status) {
            case 'ready':
                return (
                    <div className="flex flex-col items-center text-center p-10 min-h-full justify-center">
                        <div className="w-20 h-20 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/5">
                            {type === 'ai' ? <Sparkles className="w-10 h-10 text-indigo-500" /> : type === 'camera' ? <AlertTriangle className="w-10 h-10 text-amber-500" /> : <PlayCircle className="w-10 h-10 text-emerald-500" />}
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Unlock Premium</h2>
                        <p className="text-base text-gray-500 dark:text-gray-400 mb-10 font-medium max-w-[280px] leading-relaxed">
                            Support Paywise by watching a short ad and gain instant access to our advanced {type === 'ai' ? 'AI Assistant' : type === 'camera' ? 'Camera Scanner' : 'features'}.
                        </p>
                        <button 
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
                    <div className="flex flex-col items-center justify-center w-full h-full min-h-[450px] relative">
                         {/* Seamless Ad Integration - No visible box unless ad fills */}
                         <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-black/20">
                            <ins className="adsbygoogle"
                                style={{ display: 'block', width: '100%', height: '100%', minHeight: '350px' }}
                                data-ad-client="ca-pub-7749956119820849"
                                data-ad-slot="8452361092"
                                data-ad-format="auto"
                                data-full-width-responsive="true"></ins>
                         </div>

                         <div className="absolute top-8 right-8 z-30 bg-white dark:bg-slate-900 shadow-2xl px-6 py-2.5 rounded-full border border-indigo-500/30">
                            <span className="text-slate-900 dark:text-white font-black text-sm tabular-nums">Unlocking in {timeLeft}s</span>
                         </div>
                    </div>
                );
            case 'finished':
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
                <div className="w-full h-full overflow-y-auto custom-scrollbar">
                    {getContent()}
                </div>
            </div>
        </div>
    );
}
