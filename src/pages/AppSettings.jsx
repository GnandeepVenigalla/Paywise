import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    ChevronLeft, ChevronRight, DollarSign, SplitSquareHorizontal,
    Sun, Moon, Monitor, Eye, EyeOff, Clock, Globe, Lock,
    Trash2, HardDrive, UserCheck, UserX, Fingerprint, Check,
    Share2, Loader2
} from 'lucide-react';
import logoImg from '../assets/logo.png';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Telugu', 'Chinese', 'Japanese', 'Portuguese', 'Arabic'];

const SPLIT_OPTIONS = [
    { value: 'equally', label: 'Split Equally', desc: 'Divide the bill evenly among everyone' },
    { value: 'percentage', label: 'By Percentage', desc: 'Each person pays a custom percentage' },
    { value: 'full', label: 'You Are Owed Full Amount', desc: 'You paid, others owe you everything' },
];

const THEMES = [
    { value: 'system', label: 'System', Icon: Monitor },
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
];

const DEFAULT_SETTINGS = {
    defaultSplitMethod: 'equally',
    monthlyBudget: '',
    theme: 'system',
    highContrastMode: false,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'English',
    profileVisibility: true,
    autoAcceptFriends: false,
    hideBalance: false,
    biometricLock: false,
};

export default function AppSettings() {
    const { user, api, setUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [migrationLoading, setMigrationLoading] = useState(false);
    const [cameraPermission, setCameraPermission] = useState(localStorage.getItem('camera_granted') === 'true');

    const handleOAuthMigrate = async () => {
        setMigrationLoading(true);
        try {
            const res = await api.get('/splitwise/auth-url');
            if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            alert('Could not connect to Splitwise. Please try again.');
            setMigrationLoading(false);
        }
    };

    const handleCameraToggle = async (enabled) => {
        if (!enabled) {
            localStorage.removeItem('camera_granted');
            setCameraPermission(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            localStorage.setItem('camera_granted', 'true');
            setCameraPermission(true);
            alert("Camera access enabled!");
        } catch (err) {
            alert("Could not access camera. Please check your browser settings.");
        }
    };

    useEffect(() => {
        if (user?.appSettings) {
            setSettings({
                ...DEFAULT_SETTINGS,
                ...user.appSettings,
                monthlyBudget: user.appSettings.monthlyBudget || '',
            });
        }
    }, [user]);

    const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...settings,
                monthlyBudget: parseFloat(settings.monthlyBudget) || 0,
            };
            const res = await api.put('/auth/app-settings', payload);
            if (setUser) setUser(prev => ({ ...prev, appSettings: res.data }));
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch {
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleBiometricToggle = async (enabled) => {
        if (!enabled) {
            update('biometricLock', false);
            return;
        }

        // Feature detection
        if (!window.PublicKeyCredential) {
            alert("Biometrics are not supported on this browser/device.");
            return;
        }

        try {
            // Check if we are on an IP address (WebAuthn requires a domain or localhost)
            const hostname = window.location.hostname;
            const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
            if (isIP && hostname !== '127.0.0.1' && hostname !== 'localhost') {
                alert("Security Restriction: Biometrics (WebAuthn) do not work on IP addresses. Please use 'localhost' or a real domain name (via deployment).");
                return;
            }

            // Check if biometrics are even available
            const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (!available) {
                alert("No biometric hardware (like Face ID or Fingerprint) was found or enabled for this browser.");
                return;
            }

            // Simple WebAuthn registration
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const userID = new TextEncoder().encode(user.id || user._id);

            const options = {
                publicKey: {
                    challenge,
                    rp: { name: "Paywise" },
                    user: {
                        id: userID,
                        name: user.email,
                        displayName: user.username
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    },
                    timeout: 60000,
                    attestation: "none"
                }
            };

            const credential = await navigator.credentials.create(options);

            if (credential) {
                // If we get here, the user successfully scanned their biometric
                setSettings(prev => ({
                    ...prev,
                    biometricLock: true,
                    biometricCredentialId: credential.id
                }));
                alert("Biometric lock enabled! Your Face ID/Fingerprint is now linked.");
            }
        } catch (err) {
            console.error(err);
            if (err.name === 'NotAllowedError') {
                // User cancelled or timed out
            } else {
                alert("Failed to setup biometrics. Make sure your device supports it.");
            }
        }
    };

    const handleClearCache = () => {
        localStorage.removeItem('paywise_cache');
        alert('Cache cleared successfully!');
    };

    const handleDeleteAccount = async () => {
        if (deleteInput !== 'DELETE') return;
        setSaving(true);
        try {
            await api.delete('/auth/account');
            alert('Your account has been permanently deleted.');
            logout();
            navigate('/register');
        } catch (err) {
            alert('Failed to delete account. Please contact support.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // ─── Toggle component ─────────────────────────────────────
    const Toggle = ({ value, onChange }) => (
        <button
            onClick={() => onChange(!value)}
            className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 flex-shrink-0 ${value ? 'bg-slate-900' : 'bg-gray-300'}`}
        >
            <div className={`absolute top-[3px] w-[25px] h-[25px] bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
        </button>
    );

    // ─── Section header ─────────────────────────────────────
    const SectionHeader = ({ icon, title, color }) => (
        <div className={`flex items-center gap-3 px-5 pt-8 pb-3`}>
            <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                {icon}
            </div>
            <h2 className="text-[15px] font-bold text-gray-800">{title}</h2>
        </div>
    );

    // ─── Row with toggle ─────────────────────────────────────
    const ToggleRow = ({ label, sub, value, onChange, last }) => (
        <div className={`flex items-center justify-between px-5 py-4 ${!last ? 'border-b border-gray-50' : ''}`}>
            <div className="flex-1 pr-4">
                <p className="text-[16px] font-medium text-gray-800">{label}</p>
                {sub && <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">{sub}</p>}
            </div>
            <Toggle value={value} onChange={onChange} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans">
            {/* Header */}
            <div className="flex items-center px-4 pt-6 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-gray-900">App Settings</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`ml-auto text-[16px] font-bold transition ${saved ? 'text-slate-900' : 'text-slate-900 hover:opacity-70'} disabled:opacity-50`}
                >
                    {saved ? <span className="flex items-center gap-1"><Check className="w-5 h-5" />Saved</span> : saving ? 'Saving…' : 'Save'}
                </button>
            </div>

            {/* ── 1. Financial Customization ─────────────────── */}
            <SectionHeader
                icon={<DollarSign className="w-4 h-4 text-slate-900" />}
                title="Financial Customization"
                color="bg-[#e6f7f3]"
            />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Default Split Method */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-50">
                    <p className="text-[16px] font-medium text-gray-800 mb-3">Default Split Method</p>
                    <div className="flex flex-col gap-2">
                        {SPLIT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => update('defaultSplitMethod', opt.value)}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${settings.defaultSplitMethod === opt.value ? 'border-slate-900 bg-slate-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${settings.defaultSplitMethod === opt.value ? 'border-slate-900 bg-slate-900' : 'border-gray-300'}`}>
                                    {settings.defaultSplitMethod === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <p className={`text-[15px] font-semibold ${settings.defaultSplitMethod === opt.value ? 'text-slate-900' : 'text-gray-700'}`}>{opt.label}</p>
                                    <p className="text-[12px] text-gray-400">{opt.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Monthly Budget */}
                <div className="px-5 py-4">
                    <p className="text-[16px] font-medium text-gray-800 mb-1">Monthly Budget</p>
                    <p className="text-[13px] text-gray-400 mb-3">If you spend more than this, your dashboard balance will turn orange as a warning.</p>
                    <div className="flex items-center gap-2 border-2 border-gray-200 focus-within:border-slate-900 rounded-xl px-4 py-3 transition bg-white">
                        <span className="text-gray-400 text-[18px] font-bold">$</span>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={settings.monthlyBudget}
                            onChange={e => update('monthlyBudget', e.target.value)}
                            placeholder="0 = no limit"
                            className="flex-1 outline-none text-[18px] font-bold text-gray-900 bg-transparent placeholder-gray-300"
                        />
                    </div>
                </div>
            </div>

            {/* ── 2. Display & Accessibility ─────────────────── */}
            <SectionHeader
                icon={<Sun className="w-4 h-4 text-amber-500" />}
                title="Display & Accessibility"
                color="bg-amber-50"
            />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Theme */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-50">
                    <p className="text-[16px] font-medium text-gray-800 mb-3">Theme</p>
                    <div className="grid grid-cols-3 gap-2">
                        {THEMES.map(({ value, label, Icon }) => (
                            <button
                                key={value}
                                onClick={() => update('theme', value)}
                                className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition ${settings.theme === value ? 'border-slate-900 bg-slate-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <Icon className={`w-5 h-5 ${settings.theme === value ? 'text-slate-900' : 'text-gray-500'}`} />
                                <span className={`text-[13px] font-semibold ${settings.theme === value ? 'text-slate-900' : 'text-gray-600'}`}>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <ToggleRow
                    label="High Contrast Mode"
                    sub="Stronger borders and higher text contrast for better readability"
                    value={settings.highContrastMode}
                    onChange={v => update('highContrastMode', v)}
                />

                {/* Date Format */}
                <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                        <p className="text-[16px] font-medium text-gray-800">Date Format</p>
                        <p className="text-[13px] text-gray-400 mt-0.5">How dates appear across the app</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                        {['MM/DD/YYYY', 'DD/MM/YYYY'].map(fmt => (
                            <button
                                key={fmt}
                                onClick={() => update('dateFormat', fmt)}
                                className={`text-[12px] font-bold px-3 py-1.5 rounded-lg border-2 transition ${settings.dateFormat === fmt ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time Format */}
                <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                        <p className="text-[16px] font-medium text-gray-800">Time Format</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                        {[{ v: '12h', l: '12h' }, { v: '24h', l: '24h' }].map(({ v, l }) => (
                            <button
                                key={v}
                                onClick={() => update('timeFormat', v)}
                                className={`text-[13px] font-bold px-4 py-1.5 rounded-lg border-2 transition ${settings.timeFormat === v ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Language */}
                <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                        <p className="text-[16px] font-medium text-gray-800">Language</p>
                        <p className="text-[13px] text-gray-400 mt-0.5">For emails and notifications</p>
                    </div>
                    <select
                        value={settings.language}
                        onChange={e => update('language', e.target.value)}
                        className="ml-4 bg-gray-100 border-0 rounded-lg px-3 py-2 text-[14px] font-semibold text-gray-700 outline-none appearance-none cursor-pointer"
                    >
                        {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                </div>
            </div>

            {/* ── 3. Privacy & Social ──────────────────────────── */}
            <SectionHeader
                icon={<Eye className="w-4 h-4 text-slate-900" />}
                title="Privacy & Social"
                color="bg-slate-50"
            />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ToggleRow
                    label="Profile Visibility"
                    sub={`Allow others to find you by your email (${user?.email || '—'})`}
                    value={settings.profileVisibility}
                    onChange={v => update('profileVisibility', v)}
                />
                <ToggleRow
                    label="Auto-Accept Friend Requests"
                    sub="Automatically accept requests from people who have your contact info"
                    value={settings.autoAcceptFriends}
                    onChange={v => update('autoAcceptFriends', v)}
                />
                <ToggleRow
                    label="Privacy Mode (Hide Balance)"
                    sub="Blurs 'You owe' and 'You are owed' totals on the dashboard — useful in public"
                    value={settings.hideBalance}
                    onChange={v => update('hideBalance', v)}
                    last
                />
            </div>

            {/* ── 4. Security & Permissions ─────────────────────────── */}
            <SectionHeader
                icon={<Lock className="w-4 h-4 text-rose-500" />}
                title="Security & Permissions"
                color="bg-rose-50"
            />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ToggleRow
                    label="Biometric Lock"
                    sub="Require Face ID, fingerprint, or PIN every time the app is opened"
                    value={settings.biometricLock}
                    onChange={v => handleBiometricToggle(v)}
                />
                <ToggleRow
                    label="Camera Access"
                    sub="Allow access to your camera for receipt scanning"
                    value={cameraPermission}
                    onChange={v => handleCameraToggle(v)}
                    last
                />
            </div>

            {/* ── 5. Integrations ──────────────────────────── */}
            <SectionHeader
                icon={<Share2 className="w-4 h-4 text-emerald-500" />}
                title="Integrations"
                color="bg-emerald-50"
            />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <button
                    onClick={handleOAuthMigrate}
                    disabled={migrationLoading}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition"
                >
                    <div className="text-left flex-1 pr-4">
                        <div className="flex items-center gap-2">
                            <p className="text-[16px] font-medium text-gray-800">Splitwise</p>
                            {user?.splitwiseMigrationStatus === 'completed' && (
                                <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">Synced</span>
                            )}
                        </div>
                        <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">
                            {user?.splitwiseMigrationStatus === 'completed'
                                ? 'Tap to sync new expenses from Splitwise'
                                : 'Import your groups, expenses and friends from Splitwise'}
                        </p>
                    </div>
                    {migrationLoading
                        ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        : <ChevronRight className="w-5 h-5 text-gray-300" />}
                </button>
            </div>

            {/* ── 6. Data & Account Management ─────────────────── */}
            <SectionHeader
                icon={<HardDrive className="w-4 h-4 text-gray-500" />}
                title="Data & Account Management"
                color="bg-gray-100"
            />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                    onClick={handleClearCache}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition"
                >
                    <div className="text-left">
                        <p className="text-[16px] font-medium text-gray-800">Clear Cache</p>
                        <p className="text-[13px] text-gray-400 mt-0.5">Fixes sluggish performance or images not loading</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-rose-50 transition"
                >
                    <div className="text-left">
                        <p className="text-[16px] font-semibold text-rose-500">Delete Account</p>
                        <p className="text-[13px] text-rose-300 mt-0.5">Permanently remove your account and all data</p>
                    </div>
                    <Trash2 className="w-5 h-5 text-rose-300" />
                </button>
            </div>

            {/* Save button (also up in header, but floating bottom for convenience) */}
            <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-gray-100 z-20">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-4 rounded-2xl text-[16px] font-bold shadow-sm transition ${saved ? 'bg-slate-900 text-white' : 'bg-slate-900 text-white hover:bg-slate-950'} disabled:opacity-50`}
                >
                    {saved ? '✓ Settings Saved!' : saving ? 'Saving…' : 'Save Settings'}
                </button>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                    <div className="w-full bg-white rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-200">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-rose-500" />
                        </div>
                        <h3 className="text-[20px] font-bold text-gray-900 text-center mb-2">Delete Account?</h3>
                        <p className="text-[14px] text-gray-500 text-center mb-5 leading-snug">
                            This will permanently delete your account, all your expenses, groups, and personal data. This action cannot be undone.
                        </p>
                        <p className="text-[14px] font-semibold text-gray-700 mb-2">Type <span className="text-rose-500 font-bold">DELETE</span> to confirm:</p>
                        <input
                            type="text"
                            value={deleteInput}
                            onChange={e => setDeleteInput(e.target.value)}
                            placeholder="Type DELETE here"
                            className="w-full border-2 border-gray-200 focus:border-rose-400 rounded-xl px-4 py-3 text-[16px] outline-none transition mb-4"
                        />
                        <button
                            disabled={deleteInput !== 'DELETE' || saving}
                            className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold text-[16px] mb-3 disabled:opacity-30 transition"
                            onClick={handleDeleteAccount}
                        >
                            {saving ? 'Deleting...' : 'Permanently Delete Account'}
                        </button>
                        <button
                            onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                            className="w-full py-3 text-[16px] font-medium text-gray-500 hover:bg-gray-50 rounded-2xl transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
