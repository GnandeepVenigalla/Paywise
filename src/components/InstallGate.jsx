import { useState, useEffect } from 'react';
import { useInstallApp } from '../hooks/useInstallApp';
import Button from './UI/Button';
import { Download, Share, PlusSquare, MonitorSmartphone } from 'lucide-react';

export default function InstallGate({ children }) {
    const [isStandalone, setIsStandalone] = useState(true); // Default to true to prevent flash
    const { isInstallable, promptInstall, isIosPromptVisible, hideIosPrompt } = useInstallApp();
    const [isIos, setIsIos] = useState(false);

    useEffect(() => {
        // Detect if the app is in standalone mode
        const checkStandalone = () => {
            const isStandAloneNav = ('standalone' in window.navigator) && window.navigator.standalone;
            const isStandAloneMedia = window.matchMedia('(display-mode: standalone)').matches;
            return isStandAloneNav || isStandAloneMedia;
        };

        const detectIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };

        setIsStandalone(checkStandalone());
        setIsIos(detectIos());

        // Listen for changes (e.g., if user somehow triggers display mode change)
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleChange = (e) => setIsStandalone(e.matches);
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    if (isStandalone) {
        return children;
    }

    // Force app-only experience
    return (
        <div className="fixed inset-0 z-[200] bg-gray-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl max-w-sm w-full border border-gray-100 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-emerald-500 to-teal-700 opacity-10"></div>

                <div className="w-20 h-20 bg-white rounded-3xl shadow-md p-3 mb-6 relative z-10 border border-gray-100">
                    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Paywise" className="w-full h-full object-contain" />
                </div>

                <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">App Only</h1>
                <p className="text-gray-500 text-[15px] mb-8 leading-relaxed font-medium">
                    Paywise is designed for the best experience as a native app on your device. Please install it to continue.
                </p>

                {isIos ? (
                    <div className="w-full text-left bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-2 shadow-sm">
                        <p className="text-[13px] font-black uppercase text-gray-400 tracking-widest mb-3">How to Install</p>
                        <ol className="text-[14px] text-gray-700 font-medium space-y-4">
                            <li className="flex gap-3">
                                <Share className="w-5 h-5 text-blue-500 shrink-0" />
                                <span>Tap the <b className="text-gray-900">Share</b> icon below</span>
                            </li>
                            <li className="flex gap-3">
                                <PlusSquare className="w-5 h-5 text-gray-600 shrink-0" />
                                <span>Select <b className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-900 leading-tight">Add to Home Screen</b></span>
                            </li>
                        </ol>
                    </div>
                ) : (
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={promptInstall}
                        className="shadow-lg shadow-emerald-500/30 !py-4 text-[16px] mb-2"
                        icon={Download}
                    >
                        Install Paywise Now
                    </Button>
                )}

                {!isIos && !isInstallable && (
                    <p className="text-sm text-gray-400 mt-5 flex items-center gap-2 justify-center w-full">
                        <MonitorSmartphone className="w-4 h-4" />
                        Install via browser menu
                    </p>
                )}
            </div>

            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mt-8">
                Paywise Ecosystem
            </p>
        </div>
    );
}
