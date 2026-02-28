import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, Mail } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import logoImg from '../assets/logo.png';

export default function Notifications() {
    const { user, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        addedToGroup: true,
        addedAsFriend: true,
        expenseAdded: false,
        expenseEdited: false,
        expenseCommented: false,
        expenseDue: true,
        expensePaid: true,
        monthlySummary: true,
        majorUpdates: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data && res.data.notificationSettings) {
                    setSettings({
                        ...settings,
                        ...res.data.notificationSettings
                    });
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
        // eslint-disable-next-line
    }, []);

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/auth/notifications', settings);
            // Optionally could navigate backward: navigate(-1)
            // Or show a toast, but usually Splitwise just saves. Let's redirect back.
            navigate('/account');
        } catch (err) {
            console.error(err);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const renderToggle = (label, key) => {
        const isActive = settings[key];
        return (
            <div
                className="flex items-center justify-between py-4 cursor-pointer"
                onClick={() => toggleSetting(key)}
            >
                <span className="text-[17px] text-[#333333] flex-1">{label}</span>
                <div className="flex-shrink-0 w-8 flex justify-end">
                    {isActive ? (
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="4" width="20" height="16" rx="2" fill="black" />
                            <path d="M22 7L13.03 12.7C12.41 13.09 11.59 13.09 10.97 12.7L2 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <Mail className="w-8 h-8 text-[#a9a9a9]" strokeWidth={1.5} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white pb-24 font-sans flex flex-col">
            <header className="pt-6 pb-4 px-4 bg-white sticky top-0 z-10 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#333333] hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-7 h-7" strokeWidth={1.5} />
                </button>
                <h1 className="text-[19px] font-normal text-[#333333] absolute left-1/2 -translate-x-1/2">Notification settings</h1>
                <div className="w-8"></div> {/* Spacer */}
            </header>

            <main className="flex-1 overflow-y-auto px-5 w-full max-w-lg mx-auto">
                {loading ? (
                    <div className="fixed inset-0 bg-[#42b79e] flex flex-col items-center justify-center z-[100]">
                        <div className="w-[110px] h-[110px] animate-pulse">
                            <img src={logoImg} alt="Paywise Logo" className="w-full h-full object-contain drop-shadow-lg" />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mt-6 mb-8">
                            <h2 className="text-[13px] font-bold text-[#888888] tracking-wider mb-2">GROUPS AND FRIENDS</h2>
                            <div className="flex flex-col">
                                {renderToggle("When someone adds me to a group", "addedToGroup")}
                                {renderToggle("When someone adds me as a friend", "addedAsFriend")}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-[13px] font-bold text-[#888888] tracking-wider mb-2">EXPENSES</h2>
                            <div className="flex flex-col">
                                {renderToggle("When an expense is added", "expenseAdded")}
                                {renderToggle("When an expense is edited/deleted", "expenseEdited")}
                                {renderToggle("When someone comments on an expense", "expenseCommented")}
                                {renderToggle("When an expense is due", "expenseDue")}
                                {renderToggle("When someone pays me", "expensePaid")}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-[13px] font-bold text-[#888888] tracking-wider mb-2">NEWS AND UPDATES</h2>
                            <div className="flex flex-col">
                                {renderToggle("Monthly summary of my activity", "monthlySummary")}
                                {renderToggle("Major Splitwise news and updates", "majorUpdates")}
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#ff5b22] text-white px-5 py-2.5 rounded text-[17px] font-normal mb-10 opacity-90 hover:opacity-100 transition disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
