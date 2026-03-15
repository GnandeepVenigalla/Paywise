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
                    <div className="flex flex-col items-center text-center p-8">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
                            {type === 'ai' ? <Sparkles className="w-8 h-8 text-indigo-600" /> : type === 'camera' ? <AlertTriangle className="w-8 h-8 text-amber-500" /> : <PlayCircle className="w-8 h-8 text-emerald-500" />}
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Support Paywise</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                            To keep our {type === 'ai' ? 'AI Assistant' : type === 'camera' ? 'Camera Scanner' : 'premium features'} free, please watch a quick 5-second ad.
                        </p>
                        <button 
                            onClick={startAd}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-gray-900 h-14 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                        >
                            <PlayCircle className="w-5 h-5" /> Watch Ad to Continue
                        </button>
                        <button onClick={onClose} className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Maybe later</button>
                    </div>
                );
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center p-12 py-20">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initializing Secure Ad Stream...</p>
                    </div>
                );
            case 'playing':
                return (
                    <div className="flex flex-col items-center justify-center p-6">
                        <div className="w-full aspect-[9/16] bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-indigo-500/20 flex flex-col items-center justify-center relative overflow-hidden">
                             {/* Placeholder for actual AdSense Ad */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 animate-pulse" />
                             
                             <div className="relative z-10 w-full h-full flex items-center justify-center">
                                <ins className="adsbygoogle"
                                    style={{ display: 'block', width: '100%', height: '100%' }}
                                    data-ad-client="ca-pub-7749956119820849"
                                    data-ad-slot="8452361092"
                                    data-ad-format="auto"
                                    data-full-width-responsive="true"></ins>
                             </div>

                             <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                <span className="text-white font-bold text-xs">Unlock in {timeLeft}s</span>
                             </div>
                             
                             <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center">
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-tighter">Advertisement • ca-pub-7749956119820849</p>
                             </div>
                        </div>
                    </div>
                );
            case 'finished':
                return (
                    <div className="flex flex-col items-center text-center p-8">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Access Granted!</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Thanks for supporting us. You can now use the premium feature.</p>
                        <button 
                            onClick={onFinish}
                            className="w-full bg-emerald-600 text-white h-14 rounded-2xl font-black active:scale-95 transition-all shadow-xl shadow-emerald-600/20"
                        >
                            Continue
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
                {getContent()}
            </div>
        </div>
    );
}
