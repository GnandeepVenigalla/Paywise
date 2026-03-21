import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Fingerprint, Lock, ShieldCheck, AlertCircle, KeyRound } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function BiometricGate({ children }) {
    const { user, sessionAuthenticated, setSessionAuthenticated, loading } = useContext(AuthContext);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [pinEntry, setPinEntry] = useState('');

    const biometricEnabled = user?.appSettings?.biometricLock;
    const credentialId = user?.appSettings?.biometricCredentialId;

    // Determine auth type from localStorage
    const bioType = localStorage.getItem('paywise_bio_type') || 'webauthn';
    const isPinMode = bioType === 'pin' || credentialId === 'pin-auth';

    const base64urlToUint8Array = (base64url) => {
        const padding = '='.repeat((4 - base64url.length % 4) % 4);
        const base64 = (base64url + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    // ── WebAuthn verification ──────────────────────────────────
    const handleWebAuthnVerify = async () => {
        if (!window.PublicKeyCredential) {
            setSessionAuthenticated(true); // Fallback if browser doesn't support it
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
                    userVerification: 'required',
                    allowCredentials: credentialId && credentialId !== 'pin-auth' ? [
                        {
                            id: base64urlToUint8Array(credentialId),
                            type: 'public-key',
                            transports: ['internal']
                        }
                    ] : []
                }
            };

            const credential = await navigator.credentials.get(options);
            if (credential) {
                setSessionAuthenticated(true);
            }
        } catch (err) {
            console.error('Biometric verification failed:', err);
            if (err.name === 'NotAllowedError') {
                setError('Verification cancelled. Please try again.');
            } else {
                setError('Biometric verification failed. Try again or use your PIN.');
            }
        } finally {
            setVerifying(false);
        }
    };

    // ── PIN verification ──────────────────────────────────────
    const handlePinVerify = () => {
        const stored = localStorage.getItem('paywise_bio_pin');
        if (!stored) {
            // No stored PIN — just let them in (recovery path)
            setSessionAuthenticated(true);
            return;
        }
        if (btoa(pinEntry) === stored) {
            setError(null);
            setSessionAuthenticated(true);
        } else {
            setError('Incorrect PIN. Please try again.');
            setPinEntry('');
        }
    };

    // Auto-prompt WebAuthn on mount
    useEffect(() => {
        if (user && biometricEnabled && !sessionAuthenticated && !loading && !isPinMode) {
            handleWebAuthnVerify();
        }
    }, [user, biometricEnabled, sessionAuthenticated, loading, isPinMode]);

    if (loading) return children;

    // Pass-through: not logged in, biometrics off, or already authenticated
    if (!user || !biometricEnabled || sessionAuthenticated) {
        return children;
    }

    return (
        <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
            {/* Ambient blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />

            <div className="relative text-center max-w-sm w-full">
                {/* Logo */}
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
                        {isPinMode
                            ? 'Enter your PIN to access your financial data.'
                            : 'Biometric verification is required to access your financial data.'}
                    </p>
                </div>

                <div className="space-y-4">
                    {isPinMode ? (
                        /* ── PIN Entry ── */
                        <>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-emerald-500/50 transition">
                                <KeyRound className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={8}
                                    value={pinEntry}
                                    onChange={e => setPinEntry(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={e => e.key === 'Enter' && handlePinVerify()}
                                    placeholder="Enter your PIN"
                                    className="flex-1 bg-transparent outline-none text-[22px] font-bold text-white tracking-[0.5em] placeholder:tracking-normal placeholder:text-[15px] placeholder:font-normal placeholder:text-gray-500"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handlePinVerify}
                                disabled={pinEntry.length < 4}
                                className="w-full bg-white text-slate-950 h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-40 shadow-[0_8px_30px_rgb(255,255,255,0.15)]"
                            >
                                <KeyRound className="w-5 h-5" />
                                Unlock with PIN
                            </button>
                        </>
                    ) : (
                        /* ── WebAuthn Button ── */
                        <button
                            onClick={handleWebAuthnVerify}
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
                    )}

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs font-medium flex gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
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
