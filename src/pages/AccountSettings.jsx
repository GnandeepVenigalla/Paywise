import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Edit2, ChevronLeft, Loader2, Check, X, Eye, EyeOff } from 'lucide-react';

// ── In-app modal (replaces browser prompt/alert) ──────────────────
function EditModal({ title, fields, onSave, onClose, saving, error }) {
    const firstRef = useRef(null);
    useEffect(() => { firstRef.current?.focus(); }, []);
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[17px] font-semibold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {error && (
                    <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2 mb-3">{error}</p>
                )}

                <div className="space-y-3">
                    {fields.map((f, i) => (
                        <ModalField key={f.key} field={f} ref={i === 0 ? firstRef : null} />
                    ))}
                </div>

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-[15px] hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-semibold text-[15px] hover:bg-slate-950 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Separate component so we can use useState for show/hide password
function ModalField({ field }, ref) {
    const [show, setShow] = useState(false);
    const isPassword = field.type === 'password';
    return (
        <div>
            {field.label && <label className="text-[13px] text-gray-500 font-medium block mb-1">{field.label}</label>}
            <div className="relative">
                <input
                    ref={ref}
                    type={isPassword && !show ? 'password' : 'text'}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] text-gray-900 outline-none focus:border-slate-900 transition pr-10"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
}

// forwardRef wrapper
const ModalFieldWrapped = ({ field, inputRef }) => {
    const [show, setShow] = useState(false);
    const isPassword = field.type === 'password';
    return (
        <div>
            {field.label && <label className="text-[13px] text-gray-500 font-medium block mb-1">{field.label}</label>}
            <div className="relative">
                <input
                    ref={inputRef}
                    type={isPassword && !show ? 'password' : 'text'}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] text-gray-900 outline-none focus:border-slate-900 transition pr-10"
                />
                {isPassword && (
                    <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────
export default function AccountSettings() {
    const { user, setUser, api } = useContext(AuthContext);
    const navigate = useNavigate();

    const [timezone, setTimezone] = useState('(GMT-06:00) Central Time (US & Canada)');
    const [language, setLanguage] = useState('English');
    const [profileVisibility, setProfileVisibility] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);

    // Modal state
    const [modal, setModal] = useState(null); // { type: 'field'|'password', ... }
    const [modalVal, setModalVal] = useState('');
    const [modalVal2, setModalVal2] = useState('');
    const [modalVal3, setModalVal3] = useState('');
    const [modalSaving, setModalSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        if (user) {
            setTimezone(user.timezone || '(GMT-06:00) Central Time (US & Canada)');
            setLanguage(user.appSettings?.language || 'English');
            setProfileVisibility(user.appSettings?.profileVisibility !== false);
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put('/auth/preferences', { timezone });
            await api.put('/auth/app-settings', { language, profileVisibility });
            setUser({ ...user, timezone, appSettings: { ...user.appSettings, language, profileVisibility } });
            setSavedMsg(true);
            setTimeout(() => setSavedMsg(false), 2500);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const openEditField = (field, label, currentVal) => {
        setModalVal(currentVal || '');
        setModalError('');
        setModal({ type: 'field', field, label });
    };

    const openChangePassword = () => {
        setModalVal('');
        setModalVal2('');
        setModalVal3('');
        setModalError('');
        setModal({ type: 'password' });
    };

    const closeModal = () => setModal(null);

    const saveField = async () => {
        if (!modalVal.trim()) { setModalError('This field cannot be empty.'); return; }
        setModalSaving(true);
        setModalError('');
        try {
            const res = await api.put('/auth/profile', { [modal.field]: modalVal.trim() });
            setUser(res.data);
            closeModal();
        } catch (error) {
            setModalError(error.response?.data?.msg || 'Failed to update. Please try again.');
        } finally {
            setModalSaving(false);
        }
    };

    const savePassword = async () => {
        if (!modalVal) { setModalError('Please enter your current password.'); return; }
        if (!modalVal2) { setModalError('Please enter a new password.'); return; }
        if (modalVal2 !== modalVal3) { setModalError('New passwords do not match.'); return; }
        if (modalVal2.length < 6) { setModalError('New password must be at least 6 characters.'); return; }
        setModalSaving(true);
        setModalError('');
        try {
            await api.put('/auth/password', { currentPassword: modalVal, newPassword: modalVal2 });
            closeModal();
        } catch (error) {
            setModalError(error.response?.data?.msg || 'Failed to change password.');
        } finally {
            setModalSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24 font-sans text-gray-800">
            <header className="pt-6 pb-4 px-5 bg-white sticky top-0 z-10 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-[17px] font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2">Account settings</h1>
                <div className="w-6"></div>
            </header>

            <main className="px-5 pt-6 max-w-md mx-auto">
                <div className="mb-6">
                    <label className="text-gray-500 text-[14px] block mb-0.5">Full name</label>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-[17px]">{user?.username || 'User'}</span>
                        <button onClick={() => openEditField('username', 'Full name', user?.username)} className="text-[#058b8c] font-medium flex items-center gap-1 text-[15px]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-gray-500 text-[14px] block mb-0.5">Email address</label>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-[17px]">{user?.email || 'user@paywise.com'}</span>
                        <button onClick={() => openEditField('email', 'Email address', user?.email)} className="text-[#058b8c] font-medium flex items-center gap-1 text-[15px]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-gray-500 text-[14px] block mb-0.5">Phone number</label>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-[17px]">{user?.phone || 'Not set'}</span>
                        <button onClick={() => openEditField('phone', 'Phone number', user?.phone)} className="text-[#058b8c] font-medium flex items-center gap-1 text-[15px]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    </div>
                    {!user?.phone && (
                        <button onClick={() => openEditField('phone', 'Phone number', '')} className="text-[#09a0b0] text-[15px]">Confirm your phone number</button>
                    )}
                </div>

                <div className="mb-8">
                    <label className="text-gray-500 text-[14px] block mb-0.5">Password</label>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-[17px] tracking-widest mt-1">••••••••</span>
                        <button onClick={openChangePassword} className="text-[#058b8c] font-medium flex items-center gap-1 text-[15px]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-gray-700 text-[15px] block mb-1">Time zone</label>
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-300 rounded-[5px] px-3 py-2 text-gray-800 outline-none text-[15px] appearance-none"
                        style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%23333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>')`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat' }}
                    >
                        <option>(GMT-06:00) Central Time (US &amp; Canada)</option>
                        <option>(GMT+05:30) Indian Standard Time (India)</option>
                    </select>
                </div>

                <div className="mb-6">
                    <label className="text-gray-700 text-[15px] block mb-1">Language (for emails and notifications)</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-300 rounded-[5px] px-3 py-2 text-gray-800 outline-none text-[15px] appearance-none"
                        style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%23333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>')`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat' }}
                    >
                        <option>English</option>
                    </select>
                </div>

                <div className="mb-5 mt-6">
                    <label className="text-gray-700 text-[15px] block mb-1.5">Privacy settings</label>
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            checked={profileVisibility}
                            onChange={(e) => setProfileVisibility(e.target.checked)}
                            className="mt-1 flex-shrink-0 w-3.5 h-3.5 accent-[#0089E4]"
                        />
                        <p className="text-[15px] text-slate-900 leading-snug">
                            Allow Paywise to suggest me as a friend to other users<br />
                            <span className="text-gray-500 italic text-[14px] block mt-0.5">Paywise will only recommend you to users who already have your email address or phone number in their phone's contact book</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition text-white px-4 py-2 rounded-[4px] text-[16px] font-normal shadow-sm mb-12 flex items-center justify-center gap-2 min-w-[130px]"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : savedMsg ? <><Check className="w-5 h-5" /> Saved!</> : 'Save changes'}
                </button>

                <h3 className="text-[25px] font-semibold text-slate-900 mb-5">Advanced features</h3>

                <div className="mb-5">
                    <p className="text-[15px] text-slate-900 mb-2">Block other users</p>
                    <button className="px-3.5 py-1.5 bg-slate-50 border border-gray-300 rounded-[4px] text-gray-700 text-[15px] hover:bg-gray-200 transition">
                        Manage your blocklist
                    </button>
                </div>

                <div className="mb-5">
                    <p className="text-[15px] text-slate-900 mb-2">Log out on all devices</p>
                    <button className="px-3.5 py-1.5 bg-slate-50 border border-gray-300 rounded-[4px] text-gray-700 text-[15px] hover:bg-gray-200 transition">
                        Log out on all devices
                    </button>
                </div>

                <div className="mb-8">
                    <p className="text-[15px] text-slate-900 mb-2">Your account</p>
                    <button className="px-3.5 py-1.5 bg-slate-50 border border-gray-300 rounded-[4px] text-gray-700 text-[15px] hover:bg-gray-200 transition">
                        Close your account
                    </button>
                </div>
            </main>

            {/* ── Edit Field Modal ── */}
            {modal?.type === 'field' && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={closeModal}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[17px] font-semibold text-gray-900">Edit {modal.label}</h2>
                            <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        {modalError && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2 mb-3">{modalError}</p>}
                        <input
                            autoFocus
                            type="text"
                            value={modalVal}
                            onChange={e => setModalVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveField()}
                            placeholder={`Enter ${modal.label.toLowerCase()}`}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] text-gray-900 outline-none focus:border-slate-900 transition mb-5"
                        />
                        <div className="flex gap-3">
                            <button onClick={closeModal} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-[15px] hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={saveField} disabled={modalSaving} className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-semibold text-[15px] hover:bg-slate-950 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {modalSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Change Password Modal ── */}
            {modal?.type === 'password' && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={closeModal}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[17px] font-semibold text-gray-900">Change Password</h2>
                            <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        {modalError && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2 mb-3">{modalError}</p>}
                        <div className="space-y-3 mb-5">
                            <PasswordField label="Current password" value={modalVal} onChange={setModalVal} autoFocus />
                            <PasswordField label="New password" value={modalVal2} onChange={setModalVal2} />
                            <PasswordField label="Confirm new password" value={modalVal3} onChange={setModalVal3} />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={closeModal} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-[15px] hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={savePassword} disabled={modalSaving} className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-semibold text-[15px] hover:bg-slate-950 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {modalSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Password input with show/hide toggle ──
function PasswordField({ label, value, onChange, autoFocus }) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="text-[13px] text-gray-500 font-medium block mb-1">{label}</label>
            <div className="relative">
                <input
                    autoFocus={autoFocus}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] text-gray-900 outline-none focus:border-slate-900 transition pr-11"
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}
