import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Fingerprint, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function BiometricGate({ children }) {
    const { user, sessionAuthenticated, setSessionAuthenticated, loading } = useContext(AuthContext);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);

    const biometricEnabled = user?.appSettings?.biometricLock;
    const credentialId = user?.appSettings?.biometricCredentialId;

    const handleVerify = async () => {
        if (!window.PublicKeyCredential) {
            setSessionAuthenticated(true); // Fallback if browser doesn't support it anymore
            return;
        }

        setVerifying(true);
        setError(null);

        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const options = {
                publicKey: {
                    challenge,
                    timeout: 60000,
                    userVerification: "required",
                    allowCredentials: credentialId ? [
                        {
                            id: new TextEncoder().encode(credentialId),
                            type: 'public-key',
                            transports: ['internal']
                        }
                    ] : []
                }
            };

            // If we have a stored ID, we use it to challenge. 
            // If not (e.g. legacy setting), we just check if they can verify at all.
            const credential = await navigator.credentials.get(options);

            if (credential) {
                setSessionAuthenticated(true);
            }
        } catch (err) {
            console.error("Biometric verification failed:", err);
            if (err.name === 'NotAllowedError') {
                setError("Verification cancelled. Please try again to unlock Paywise.");
            } else {
                setError("Biometric verification failed. Please ensure your device biometrics are working.");
            }
        } finally {
            setVerifying(false);
        }
    };

    // Auto-prompt on mount if locked
    useEffect(() => {
        if (user && biometricEnabled && !sessionAuthenticated && !loading) {
            handleVerify();
        }
    }, [user, biometricEnabled, sessionAuthenticated, loading]);

    if (loading) return children; // Wait for auth context to load user

    // If user is not logged in, or biometric is not enabled, or they are already authenticated this session
    if (!user || !biometricEnabled || sessionAuthenticated) {
        return children;
    }

    return (
        <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />

            <div className="relative text-center max-w-sm w-full">
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/10 rounded-3xl p-3 mb-6 backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center">
                        <img src={logoImg} alt="Paywise" className="w-[120%] h-auto object-contain" />
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 mb-4 backdrop-blur-sm">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[12px] font-bold tracking-widest uppercase text-emerald-400">Paywise Protected</span>
                    </div>
                    <h1 className="text-3xl font-black mb-2">App Locked</h1>
                    <p className="text-gray-400 text-sm leading-relaxed px-4">
                        Biometric verification is required to access your financial data.
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className="w-full bg-white text-slate-950 h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50 shadow-[0_8px_30px_rgb(255,255,255,0.2)]"
                    >
                        {verifying ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-950" />
                        ) : (
                            <>
                                <Fingerprint className="w-6 h-6" />
                                Unlock with Biometrics
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs font-medium flex gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="mt-12 text-gray-500 text-[11px] font-bold flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        End-to-end Secure
                    </div>
                </div>
            </div>
        </div>
    );
}
