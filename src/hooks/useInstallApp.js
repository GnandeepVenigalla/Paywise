import { useState, useEffect } from 'react';

export function useInstallApp() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIosPromptVisible, setIsIosPromptVisible] = useState(false);

    useEffect(() => {
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };
        const isInStandaloneMode = () => ('standalone' in window.navigator) && window.navigator.standalone;

        // iOS detection for installation
        if (isIos() && !isInStandaloneMode()) {
            setIsInstallable(true);
        }

        // Check if event was captured early in main.jsx
        if (window.deferredPWAEvent) {
            setDeferredPrompt(window.deferredPWAEvent);
            setIsInstallable(true);
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            window.deferredPWAEvent = e;
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            window.deferredPWAEvent = null;
            setDeferredPrompt(null);
            setIsInstallable(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Standard detection for Android
        if (window.matchMedia('(display-mode: standalone)').matches || isInStandaloneMode()) {
            setIsInstallable(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            setDeferredPrompt(null);
            window.deferredPWAEvent = null;
            setIsInstallable(false);
        } else {
            const isIos = () => {
                const userAgent = window.navigator.userAgent.toLowerCase();
                return /iphone|ipad|ipod/.test(userAgent);
            };
            if (isIos()) {
                setIsIosPromptVisible(true);
            }
        }
    };

    const hideIosPrompt = () => {
        setIsIosPromptVisible(false);
    };

    return { isInstallable, promptInstall, isIosPromptVisible, hideIosPrompt };
}
