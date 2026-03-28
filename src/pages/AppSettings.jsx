import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ColorPicker } from 'primereact/colorpicker';
import { Toast } from 'primereact/toast';
import { applyCustomTheme, persistCustomTheme } from '../hooks/useAppSettings';


const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Telugu', 'Chinese', 'Japanese', 'Portuguese', 'Arabic'];

const SPLIT_OPTIONS = [
    { value: 'equally', label: 'Split Equally', desc: 'Divide the bill evenly among everyone' },
    { value: 'percentage', label: 'By Percentage', desc: 'Each person pays a custom percentage' },
    { value: 'full', label: 'You Are Owed Full Amount', desc: 'You paid, others owe you everything' },
];

const THEMES = [
    { value: 'system', label: 'System', icon: 'pi pi-desktop' },
    { value: 'light', label: 'Light', icon: 'pi pi-sun' },
    { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
];

// Preset accent color palette
const ACCENT_PRESETS = [
    { label: 'Emerald', value: '#059669', textOnDark: '#6ee7b7' },
    { label: 'Indigo', value: '#4f46e5', textOnDark: '#a5b4fc' },
    { label: 'Violet', value: '#7c3aed', textOnDark: '#c4b5fd' },
    { label: 'Rose', value: '#e11d48', textOnDark: '#fda4af' },
    { label: 'Amber', value: '#d97706', textOnDark: '#fbbf24' },
    { label: 'Sky', value: '#0284c7', textOnDark: '#7dd3fc' },
    { label: 'Teal', value: '#0d9488', textOnDark: '#5eead4' },
    { label: 'Pink', value: '#db2777', textOnDark: '#f9a8d4' },
];

// Surface/panel styles
const SURFACE_STYLES = [
    { value: 'default', label: 'Default', desc: 'Clean white cards', icon: 'pi pi-stop' },
    { value: 'glass', label: 'Glassmorphism', desc: 'Frosted glass effect', icon: 'pi pi-th-large' },
    { value: 'flat', label: 'Flat', desc: 'Minimal, no shadows', icon: 'pi pi-minus' },
    { value: 'bordered', label: 'Bordered', desc: 'Strong card borders', icon: 'pi pi-table' },
];

// Border radius styles
const RADIUS_OPTIONS = [
    { value: 'sharp', label: 'Sharp', radius: '4px', icon: 'pi pi-stop' },
    { value: 'soft', label: 'Soft', radius: '12px', icon: 'pi pi-box' },
    { value: 'round', label: 'Round', radius: '20px', icon: 'pi pi-circle' },
    { value: 'pill', label: 'Pill', radius: '48px', icon: 'pi pi-circle-fill' },
];

const FONT_SCALE_OPTIONS = [
    { value: 0.9, label: 'Compact' },
    { value: 1.0, label: 'Normal' },
    { value: 1.1, label: 'Large' },
    { value: 1.2, label: 'XL' },
];

const DEFAULT_CUSTOM_THEME = {
    accentColor: '#059669',
    useCustomAccent: false,
    surfaceStyle: 'default',
    borderRadius: 'round',
    fontScale: 1.0,
    customAccentHex: null, // hex from color picker (no #)
};

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
    customTheme: DEFAULT_CUSTOM_THEME,
};

export default function AppSettings() {
    const { user, api, setUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const toast = useRef(null);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [migrationLoading, setMigrationLoading] = useState(false);
    const [cameraPermission, setCameraPermission] = useState(localStorage.getItem('camera_granted') === 'true');
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [pinStep, setPinStep] = useState(1);
    const [pinError, setPinError] = useState('');
    const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

    const ct = settings.customTheme || DEFAULT_CUSTOM_THEME;

    const handleOAuthMigrate = async () => {
        setMigrationLoading(true);
        try {
            const res = await api.get('/splitwise/auth-url');
            if (res.data.url) window.location.href = res.data.url;
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not connect to Splitwise.', life: 3000 });
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
            toast.current.show({ severity: 'success', summary: 'Camera Access Enabled', life: 2500 });
        } catch (err) {
            toast.current.show({ severity: 'warn', summary: 'Permission Denied', detail: 'Check browser settings.', life: 3000 });
        }
    };

    useEffect(() => {
        if (user?.appSettings) {
            const loaded = {
                ...DEFAULT_SETTINGS,
                ...user.appSettings,
                monthlyBudget: user.appSettings.monthlyBudget || '',
                customTheme: { ...DEFAULT_CUSTOM_THEME, ...(user.appSettings.customTheme || {}) },
            };
            setSettings(loaded);
            applyCustomTheme(loaded.customTheme);
        }
    }, [user]);

    const update = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        if (key === 'theme') {
            const root = document.documentElement;
            root.classList.remove('theme-light', 'theme-dark', 'dark');
            if (value === 'dark') root.classList.add('theme-dark', 'dark');
            else if (value === 'light') root.classList.add('theme-light');
            else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) root.classList.add('theme-dark', 'dark');
                else root.classList.add('theme-light');
            }
        }
    };

    const updateCustomTheme = (key, value) => {
        setSettings(prev => {
            const next = { ...prev, customTheme: { ...(prev.customTheme || DEFAULT_CUSTOM_THEME), [key]: value } };
            applyCustomTheme(next.customTheme);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...settings,
                monthlyBudget: parseFloat(settings.monthlyBudget) || 0,
            };
            const res = await api.put('/auth/app-settings', payload);
            if (setUser) setUser(prev => ({ ...prev, appSettings: res.data }));
            // Persist custom theme to localStorage so it survives hard reloads
            if (res.data?.customTheme) {
                persistCustomTheme(res.data.customTheme);
                applyCustomTheme(res.data.customTheme);
            }
            setSaved(true);
            toast.current.show({ severity: 'success', summary: 'Settings Saved!', life: 2500 });
            setTimeout(() => setSaved(false), 2500);
        } catch {
            toast.current.show({ severity: 'error', summary: 'Failed to save. Please try again.', life: 3000 });
        } finally {
            setSaving(false);
        }
    };

    const handleBiometricToggle = async (enabled) => {
        if (!enabled) {
            update('biometricLock', false);
            localStorage.removeItem('paywise_bio_pin');
            localStorage.removeItem('paywise_bio_type');
            return;
        }
        const hostname = window.location.hostname;
        const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
        const isSecureOrigin = window.location.protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
        const hasWebAuthn = !!window.PublicKeyCredential && isSecureOrigin && !isIP;

        if (hasWebAuthn) {
            try {
                const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                if (available) {
                    const challenge = new Uint8Array(32);
                    window.crypto.getRandomValues(challenge);
                    const userID = new TextEncoder().encode(user.id || user._id);
                    const credential = await navigator.credentials.create({
                        publicKey: {
                            challenge,
                            rp: { name: 'Paywise' },
                            user: { id: userID, name: user.email, displayName: user.username },
                            pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
                            authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
                            timeout: 60000,
                            attestation: 'none'
                        }
                    });
                    if (credential) {
                        localStorage.setItem('paywise_bio_type', 'webauthn');
                        setSettings(prev => ({ ...prev, biometricLock: true, biometricCredentialId: credential.id }));
                        toast.current.show({ severity: 'success', summary: 'Biometric Lock Enabled', detail: 'Face ID / Fingerprint linked.', life: 3000 });
                        return;
                    }
                }
            } catch (err) {
                if (err.name === 'NotAllowedError') return;
            }
        }
        setPinInput(''); setPinConfirm(''); setPinStep(1); setPinError('');
        setShowPinSetup(true);
    };

    const handlePinSave = () => {
        if (pinStep === 1) {
            if (pinInput.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
            setPinStep(2); setPinError('');
        } else {
            if (pinInput !== pinConfirm) { setPinError('PINs do not match. Try again.'); setPinStep(1); setPinInput(''); setPinConfirm(''); return; }
            localStorage.setItem('paywise_bio_pin', btoa(pinInput));
            localStorage.setItem('paywise_bio_type', 'pin');
            setSettings(prev => ({ ...prev, biometricLock: true, biometricCredentialId: 'pin-auth' }));
            setShowPinSetup(false);
            toast.current.show({ severity: 'success', summary: 'PIN Lock Enabled', life: 2500 });
        }
    };

    const handleClearCache = () => {
        localStorage.removeItem('paywise_cache');
        toast.current.show({ severity: 'info', summary: 'Cache Cleared', detail: 'App cache has been reset.', life: 2500 });
    };

    const handleDeleteAccount = async () => {
        if (deleteInput !== 'DELETE') return;
        setSaving(true);
        try {
            await api.delete('/auth/account');
            logout();
            navigate('/register');
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Failed to delete account.', life: 3000 });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const resetCustomTheme = () => {
        setSettings(prev => ({ ...prev, customTheme: DEFAULT_CUSTOM_THEME }));
        applyCustomTheme(DEFAULT_CUSTOM_THEME);
        toast.current.show({ severity: 'info', summary: 'Theme Reset', life: 2000 });
    };

    const ToggleRow = ({ label, sub, value, onChange, last }) => (
        <div className={`flex items-center justify-between px-5 py-4 ${!last ? 'border-b border-gray-50' : ''}`}>
            <div className="flex-1 pr-4 min-w-0">
                <p className="text-[16px] font-medium text-gray-800">{label}</p>
                {sub && <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">{sub}</p>}
            </div>
            <div className="flex-shrink-0">
                <InputSwitch checked={value} onChange={e => onChange(e.value)} />
            </div>
        </div>
    );

    const SectionHeader = ({ iconClass, title, color }) => (
        <div className="flex items-center gap-3 px-5 pt-8 pb-3">
            <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                <i className={`${iconClass} text-[14px]`}></i>
            </div>
            <h2 className="text-[15px] font-bold text-gray-800 dark:text-gray-200">{title}</h2>
        </div>
    );

    // Computed accent for preview
    const previewAccent = ct.useCustomAccent
        ? (ct.customAccentHex ? `#${ct.customAccentHex}` : ct.accentColor)
        : '#059669';

    return (
        <div className="min-h-screen bg-gray-50 pb-36 font-sans">
            <Toast ref={toast} position="top-center" />

            {/* Header */}
            <div className="flex items-center px-4 pt-6 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10 transition-colors dark:bg-slate-900 dark:border-slate-800">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition">
                    <i className="pi pi-chevron-left text-[20px]"></i>
                </button>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-gray-900 dark:text-white">App Settings</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`ml-auto text-[16px] font-bold transition ${saved ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-100 hover:opacity-70'} disabled:opacity-50`}
                >
                    {saved
                        ? <span className="flex items-center gap-1"><i className="pi pi-check" />Saved</span>
                        : saving ? 'Saving…' : 'Save'}
                </button>
            </div>

            {/* ── 1. Financial Customization ─────────────────── */}
            <SectionHeader iconClass="pi pi-dollar text-slate-900" title="Financial Customization" color="bg-[#e6f7f3]" />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                <div className="px-5 py-4">
                    <p className="text-[16px] font-medium text-gray-800 mb-1">Monthly Budget</p>
                    <p className="text-[13px] text-gray-400 mb-3 leading-snug">Dashboard balance will turn orange as a warning if exceeded.</p>
                    <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-1.5 transition bg-white dark:bg-slate-900">
                        <span className="text-gray-400 text-[18px] font-bold">$</span>
                        <InputNumber
                            value={settings.monthlyBudget}
                            onValueChange={(e) => update('monthlyBudget', e.value || 0)}
                            min={0}
                            placeholder="0 = no limit"
                            className="w-full"
                            inputClassName="w-full border-none outline-none text-[18px] font-bold text-gray-900 dark:text-white bg-transparent p-0"
                        />
                    </div>
                </div>
            </div>

            {/* ── 2. Display & Accessibility ─────────────────── */}
            <SectionHeader iconClass="pi pi-sun text-amber-500" title="Display & Accessibility" color="bg-amber-50" />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b border-gray-50">
                    <p className="text-[16px] font-medium text-gray-800 mb-3">Theme</p>
                    <div className="grid grid-cols-3 gap-2">
                        {THEMES.map(({ value, label, icon }) => (
                            <button
                                key={value}
                                onClick={() => update('theme', value)}
                                className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition ${settings.theme === value ? 'border-slate-900 bg-slate-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <i className={`${icon} text-[1.2rem] ${settings.theme === value ? 'text-slate-900' : 'text-gray-500'}`}></i>
                                <span className={`text-[13px] font-semibold ${settings.theme === value ? 'text-slate-900' : 'text-gray-600'}`}>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <ToggleRow label="High Contrast Mode" sub="Stronger borders and higher text contrast for better readability" value={settings.highContrastMode} onChange={v => update('highContrastMode', v)} />
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
                            >{fmt}</button>
                        ))}
                    </div>
                </div>
                <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-[16px] font-medium text-gray-800">Time Format</p>
                    <div className="flex gap-2 ml-4">
                        {[{ v: '12h', l: '12h' }, { v: '24h', l: '24h' }].map(({ v, l }) => (
                            <button
                                key={v}
                                onClick={() => update('timeFormat', v)}
                                className={`text-[13px] font-bold px-4 py-1.5 rounded-lg border-2 transition ${settings.timeFormat === v ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >{l}</button>
                        ))}
                    </div>
                </div>
                <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                        <p className="text-[16px] font-medium text-gray-800">Language</p>
                        <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">For emails and notifications</p>
                    </div>
                    <Dropdown value={settings.language} options={LANGUAGES} onChange={(e) => update('language', e.value)} className="w-40 prime-custom-dropdown" />
                </div>
            </div>

            {/* ── 3. Custom Theme Creator ──────────────────────── */}
            <SectionHeader iconClass="pi pi-palette text-violet-600" title="Custom Theme" color="bg-violet-50" />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Live Preview Banner */}
                <div
                    className="relative overflow-hidden px-5 pt-5 pb-4 border-b border-gray-50"
                    style={{ background: `linear-gradient(135deg, ${previewAccent}18 0%, ${previewAccent}08 100%)` }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-[15px] font-bold text-gray-800">Live Preview</p>
                            <p className="text-[12px] text-gray-400 mt-0.5">Changes apply in real-time</p>
                        </div>
                        <button
                            onClick={resetCustomTheme}
                            className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                        >
                            <i className="pi pi-refresh text-[11px]"></i>
                            Reset
                        </button>
                    </div>
                    {/* Mini app card preview */}
                    <div
                        className="rounded-2xl p-4 flex items-center gap-3 shadow-sm border"
                        style={{
                            background: '#fff',
                            borderColor: ct.surfaceStyle === 'bordered' ? previewAccent + '55' : '#f1f5f9',
                            borderRadius: { sharp: '4px', soft: '14px', round: '20px', pill: '48px' }[ct.borderRadius] || '20px',
                            boxShadow: ct.surfaceStyle === 'flat' ? 'none'
                                : ct.surfaceStyle === 'glass' ? `0 4px 16px ${previewAccent}22, inset 0 0 0 1px ${previewAccent}22`
                                : '0 2px 8px rgba(0,0,0,0.06)',
                            backdropFilter: ct.surfaceStyle === 'glass' ? 'blur(12px)' : undefined,
                        }}
                    >
                        <div
                            className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                            style={{
                                background: previewAccent + '22',
                                borderRadius: { sharp: '2px', soft: '10px', round: '16px', pill: '32px' }[ct.borderRadius] || '16px',
                            }}
                        >
                            <i className="pi pi-wallet" style={{ color: previewAccent, fontSize: '18px' }}></i>
                        </div>
                        <div className="flex-1">
                            <p className="text-[14px] font-bold text-gray-800" style={{ fontSize: `${14 * (ct.fontScale || 1)}px` }}>Dinner Split</p>
                            <p className="text-[12px] text-gray-400" style={{ fontSize: `${12 * (ct.fontScale || 1)}px` }}>You are owed</p>
                        </div>
                        <div>
                            <p className="text-[16px] font-black" style={{ color: previewAccent, fontSize: `${16 * (ct.fontScale || 1)}px` }}>+$24.50</p>
                        </div>
                    </div>
                </div>

                {/* Enable Custom Accent Toggle */}
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex-1 pr-4 min-w-0">
                        <p className="text-[16px] font-medium text-gray-800">Custom Accent Color</p>
                        <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">Override the default green with your own color</p>
                    </div>
                    <div className="flex-shrink-0">
                        <InputSwitch checked={ct.useCustomAccent} onChange={e => updateCustomTheme('useCustomAccent', e.value)} />
                    </div>
                </div>

                {/* Accent Color Presets */}
                {ct.useCustomAccent && (
                    <div className="px-5 py-4 border-b border-gray-50">
                        <p className="text-[13px] font-semibold text-gray-500 mb-3 uppercase tracking-wider">Preset Colors</p>
                        <div className="flex flex-wrap gap-3">
                            {ACCENT_PRESETS.map(preset => {
                                const selected = ct.accentColor === preset.value && !ct.customAccentHex;
                                return (
                                    <button
                                        key={preset.value}
                                        onClick={() => {
                                            updateCustomTheme('accentColor', preset.value);
                                            updateCustomTheme('customAccentHex', null);
                                        }}
                                        title={preset.label}
                                        className="relative flex flex-col items-center gap-1.5 group"
                                    >
                                        <div
                                            className="w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center"
                                            style={{
                                                background: preset.value,
                                                boxShadow: selected ? `0 0 0 3px white, 0 0 0 5px ${preset.value}` : 'none',
                                                transform: selected ? 'scale(1.15)' : 'scale(1)',
                                            }}
                                        >
                                            {selected && <i className="pi pi-check text-white text-[12px]"></i>}
                                        </div>
                                        <span className="text-[10px] text-gray-400 group-hover:text-gray-600 transition">{preset.label}</span>
                                    </button>
                                );
                            })}
                            {/* Custom Color Picker Button */}
                            <button
                                onClick={() => setShowCustomColorPicker(v => !v)}
                                className="relative flex flex-col items-center gap-1.5"
                            >
                                <div
                                    className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition"
                                    style={ct.customAccentHex ? {
                                        background: `#${ct.customAccentHex}`,
                                        border: `3px solid white`,
                                        boxShadow: `0 0 0 2px #${ct.customAccentHex}`,
                                    } : {}}
                                >
                                    {ct.customAccentHex
                                        ? <i className="pi pi-check text-white text-[12px]"></i>
                                        : <i className="pi pi-plus text-gray-400 text-[12px]"></i>
                                    }
                                </div>
                                <span className="text-[10px] text-gray-400">Custom</span>
                            </button>
                        </div>

                        {/* Inline Color Picker */}
                        {showCustomColorPicker && (
                            <div className="mt-4 flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <ColorPicker
                                    value={ct.customAccentHex || ct.accentColor?.replace('#', '') || '059669'}
                                    onChange={(e) => {
                                        updateCustomTheme('customAccentHex', e.value);
                                        updateCustomTheme('accentColor', `#${e.value}`);
                                    }}
                                    inline
                                />
                                <div className="flex flex-col gap-2">
                                    <p className="text-[13px] font-semibold text-gray-700">Selected Color</p>
                                    <div
                                        className="w-16 h-16 rounded-2xl shadow-md border border-gray-100"
                                        style={{ background: ct.customAccentHex ? `#${ct.customAccentHex}` : ct.accentColor }}
                                    />
                                    <p className="text-[11px] text-gray-400 font-mono uppercase">
                                        {ct.customAccentHex ? `#${ct.customAccentHex}` : ct.accentColor}
                                    </p>
                                    <button
                                        onClick={() => setShowCustomColorPicker(false)}
                                        className="text-[12px] font-bold text-slate-900 bg-slate-100 rounded-xl px-3 py-1.5 hover:bg-slate-200 transition"
                                    >
                                        <i className="pi pi-check mr-1.5"></i>Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Surface Style */}
                <div className="px-5 py-4 border-b border-gray-50">
                    <p className="text-[16px] font-medium text-gray-800 mb-3">Card Style</p>
                    <div className="grid grid-cols-2 gap-2">
                        {SURFACE_STYLES.map(s => (
                            <button
                                key={s.value}
                                onClick={() => updateCustomTheme('surfaceStyle', s.value)}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition text-left ${ct.surfaceStyle === s.value ? 'border-violet-500 bg-violet-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <i className={`${s.icon} text-[16px] ${ct.surfaceStyle === s.value ? 'text-violet-600' : 'text-gray-400'}`}></i>
                                <div>
                                    <p className={`text-[13px] font-semibold leading-tight ${ct.surfaceStyle === s.value ? 'text-violet-700' : 'text-gray-700'}`}>{s.label}</p>
                                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{s.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Border Radius */}
                <div className="px-5 py-4 border-b border-gray-50">
                    <p className="text-[16px] font-medium text-gray-800 mb-3">Corner Style</p>
                    <div className="grid grid-cols-4 gap-2">
                        {RADIUS_OPTIONS.map(r => (
                            <button
                                key={r.value}
                                onClick={() => updateCustomTheme('borderRadius', r.value)}
                                className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition ${ct.borderRadius === r.value ? 'border-violet-500 bg-violet-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <div
                                    className="w-7 h-7 bg-gray-300 border-2 border-gray-400"
                                    style={{
                                        borderRadius: r.radius,
                                        background: ct.borderRadius === r.value ? previewAccent + '44' : undefined,
                                        borderColor: ct.borderRadius === r.value ? previewAccent : undefined,
                                    }}
                                />
                                <span className={`text-[11px] font-semibold ${ct.borderRadius === r.value ? 'text-violet-700' : 'text-gray-500'}`}>{r.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Font Scale */}
                <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[16px] font-medium text-gray-800">Text Size</p>
                        <span className="text-[13px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">
                            {FONT_SCALE_OPTIONS.find(f => Math.round(f.value * 10) === Math.round((ct.fontScale || 1.0) * 10))?.label || 'Normal'}
                        </span>
                    </div>
                    <p className="text-[13px] text-gray-400 mb-4">Scales all text across the app</p>

                    {/* Custom step track — avoids all float precision bugs */}
                    {(() => {
                        const currentIdx = FONT_SCALE_OPTIONS.findIndex(
                            f => Math.round(f.value * 10) === Math.round((ct.fontScale || 1.0) * 10)
                        );
                        const activeIdx = currentIdx === -1 ? 1 : currentIdx; // default Normal (index 1)

                        return (
                            <div className="flex flex-col gap-3">
                                {/* Track with dots */}
                                <div className="flex items-center gap-2">
                                    {/* Minus button */}
                                    <button
                                        onClick={() => {
                                            if (activeIdx > 0) updateCustomTheme('fontScale', FONT_SCALE_OPTIONS[activeIdx - 1].value);
                                        }}
                                        disabled={activeIdx === 0}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition flex-shrink-0"
                                    >
                                        <i className="pi pi-minus text-[12px] text-gray-600"></i>
                                    </button>

                                    {/* Step track */}
                                    <div className="flex-1 relative flex items-center h-8">
                                        {/* Background line */}
                                        <div className="absolute left-0 right-0 h-[3px] bg-gray-200 rounded-full" />
                                        {/* Filled line */}
                                        <div
                                            className="absolute left-0 h-[3px] rounded-full transition-all duration-200"
                                            style={{
                                                width: `${(activeIdx / (FONT_SCALE_OPTIONS.length - 1)) * 100}%`,
                                                background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                                            }}
                                        />
                                        {/* Dots */}
                                        <div className="relative w-full flex justify-between items-center">
                                            {FONT_SCALE_OPTIONS.map((opt, idx) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => updateCustomTheme('fontScale', opt.value)}
                                                    className="relative flex flex-col items-center z-10"
                                                    style={{ transform: 'translateX(0)' }}
                                                >
                                                    <div
                                                        className="transition-all duration-200"
                                                        style={{
                                                            width: idx === activeIdx ? '22px' : '14px',
                                                            height: idx === activeIdx ? '22px' : '14px',
                                                            borderRadius: '50%',
                                                            background: idx <= activeIdx
                                                                ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                                                                : '#e5e7eb',
                                                            border: idx === activeIdx ? '3px solid white' : '2px solid white',
                                                            boxShadow: idx === activeIdx
                                                                ? '0 0 0 2px #7c3aed, 0 2px 8px rgba(124,58,237,0.3)'
                                                                : '0 1px 3px rgba(0,0,0,0.1)',
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Plus button */}
                                    <button
                                        onClick={() => {
                                            if (activeIdx < FONT_SCALE_OPTIONS.length - 1) updateCustomTheme('fontScale', FONT_SCALE_OPTIONS[activeIdx + 1].value);
                                        }}
                                        disabled={activeIdx === FONT_SCALE_OPTIONS.length - 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition flex-shrink-0"
                                    >
                                        <i className="pi pi-plus text-[12px] text-gray-600"></i>
                                    </button>
                                </div>

                                {/* Labels */}
                                <div className="flex justify-between px-5">
                                    {FONT_SCALE_OPTIONS.map((f, idx) => (
                                        <button
                                            key={f.value}
                                            onClick={() => updateCustomTheme('fontScale', f.value)}
                                            className={`text-[11px] font-semibold transition ${idx === activeIdx ? 'text-violet-700' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>

            </div>

            {/* ── 4. Privacy & Social ──────────────────────────── */}
            <SectionHeader iconClass="pi pi-eye text-slate-900" title="Privacy & Social" color="bg-slate-50" />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ToggleRow label="Profile Visibility" sub={`Allow others to find you by your email (${user?.email || '—'})`} value={settings.profileVisibility} onChange={v => update('profileVisibility', v)} />
                <ToggleRow label="Auto-Accept Friend Requests" sub="Automatically accept requests from people who have your contact info" value={settings.autoAcceptFriends} onChange={v => update('autoAcceptFriends', v)} />
                <ToggleRow label="Privacy Mode (Hide Balance)" sub="Blurs 'You owe' and 'You are owed' totals on the dashboard — useful in public" value={settings.hideBalance} onChange={v => update('hideBalance', v)} last />
            </div>

            {/* ── 5. Security & Permissions ─────────────────────────── */}
            <SectionHeader iconClass="pi pi-lock text-rose-500" title="Security & Permissions" color="bg-rose-50" />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ToggleRow label="Biometric Lock" sub="Require Face ID, fingerprint, or PIN every time the app is opened" value={settings.biometricLock} onChange={v => handleBiometricToggle(v)} />
                <ToggleRow label="Camera Access" sub="Allow access to your camera for receipt scanning" value={cameraPermission} onChange={v => handleCameraToggle(v)} last />
            </div>

            {/* ── 6. Integrations ──────────────────────────── */}
            <SectionHeader iconClass="pi pi-share-alt text-emerald-500" title="Integrations" color="bg-emerald-50" />
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
                        ? <i className="pi pi-spinner pi-spin text-gray-400"></i>
                        : <i className="pi pi-chevron-right text-gray-300"></i>}
                </button>
            </div>

            {/* ── 7. Data & Account Management ─────────────────── */}
            <SectionHeader iconClass="pi pi-database text-gray-500" title="Data & Account Management" color="bg-gray-100" />
            <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                    onClick={handleClearCache}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition"
                >
                    <div className="text-left">
                        <p className="text-[16px] font-medium text-gray-800">Clear Cache</p>
                        <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">Fixes sluggish performance or images not loading</p>
                    </div>
                    <i className="pi pi-chevron-right text-gray-300"></i>
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-rose-50 transition"
                >
                    <div className="text-left">
                        <p className="text-[16px] font-semibold text-rose-500">Delete Account</p>
                        <p className="text-[13px] text-rose-300 mt-0.5 leading-snug">Permanently remove your account and all data</p>
                    </div>
                    <i className="pi pi-trash text-rose-300"></i>
                </button>
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-gray-100 z-20">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-4 rounded-2xl text-[16px] font-bold shadow-sm transition ${saved ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-950'} disabled:opacity-50`}
                >
                    {saved ? (
                        <span className="flex items-center justify-center gap-2">
                            <i className="pi pi-check"></i> Settings Saved!
                        </span>
                    ) : saving ? 'Saving…' : (
                        <span className="flex items-center justify-center gap-2">
                            <i className="pi pi-save"></i> Save Settings
                        </span>
                    )}
                </button>
            </div>

            {/* Delete Account Dialog */}
            <Dialog
                header="Delete Account?"
                visible={showDeleteConfirm}
                onHide={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                className="w-full max-w-sm"
                contentClassName="p-6"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="pi pi-trash text-3xl text-rose-500"></i>
                    </div>
                    <p className="text-[14px] text-gray-500 mb-6 leading-snug">
                        Permanently delete your account and all data. This action cannot be undone.
                    </p>
                    <div className="text-left mb-6">
                        <p className="text-[14px] font-semibold text-gray-700 mb-2">Type <span className="text-rose-500 font-bold">DELETE</span> to confirm:</p>
                        <InputText
                            className="w-full border-2 border-gray-200 focus:border-rose-400 rounded-xl px-4 py-3 outline-none"
                            value={deleteInput}
                            onChange={(e) => setDeleteInput(e.target.value)}
                            placeholder="Type DELETE"
                        />
                    </div>
                    <Button
                        label={saving ? 'Deleting...' : 'Permanently Delete'}
                        className="w-full p-button-danger rounded-2xl p-4 font-bold"
                        onClick={handleDeleteAccount}
                        disabled={deleteInput !== 'DELETE' || saving}
                    />
                </div>
            </Dialog>

            {/* PIN Setup Dialog */}
            <Dialog
                header={pinStep === 1 ? 'Set App PIN' : 'Confirm Your PIN'}
                visible={showPinSetup}
                onHide={() => setShowPinSetup(false)}
                className="w-full max-w-sm"
                contentClassName="p-6"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="pi pi-lock text-3xl text-slate-700"></i>
                    </div>
                    <p className="text-[13px] text-gray-400 mb-6 leading-snug">
                        {pinStep === 1
                            ? "Choose a 4-digit PIN to lock the app. You'll be asked for it every time you open Paywise."
                            : 'Enter the same PIN again to confirm.'}
                    </p>
                    <div className="mb-6">
                        <InputText
                            type="password"
                            autoFocus
                            className="w-full text-center text-[24px] tracking-[0.4em] font-bold border-2 border-gray-200 focus:border-slate-900 rounded-xl"
                            value={pinStep === 1 ? pinInput : pinConfirm}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                pinStep === 1 ? setPinInput(val) : setPinConfirm(val);
                            }}
                            maxLength={8}
                            placeholder="••••"
                        />
                        {pinError && <p className="text-rose-500 text-xs mt-2">{pinError}</p>}
                    </div>
                    <Button
                        label={pinStep === 1 ? 'Continue' : 'Set PIN & Lock'}
                        className="w-full bg-slate-900 border-none p-4 rounded-2xl font-bold"
                        onClick={handlePinSave}
                        disabled={pinStep === 1 ? pinInput.length < 4 : pinConfirm.length < 4}
                    />
                </div>
            </Dialog>
        </div>
    );
}
