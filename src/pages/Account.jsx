import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    LogOut, Camera, ChevronRight,
    Bell, Shield, DollarSign, Settings, User, HelpCircle
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function Account() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const CURRENCY_SYMBOLS = {
        USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
        CAD: 'CA$', AUD: 'A$', CHF: 'Fr', CNY: '¥', MXN: 'MX$',
    };

    const currencyDisplay = user?.defaultCurrency
        ? `${user.defaultCurrency} (${CURRENCY_SYMBOLS[user.defaultCurrency] || user.defaultCurrency})`
        : 'USD ($)';

    const menuGroups = [
        {
            label: 'Preferences',
            items: [
                {
                    icon: <Bell className="w-5 h-5 text-slate-900" />,
                    bg: 'bg-[#e6f7f3]',
                    label: 'Notifications',
                    sub: 'Manage your email alerts',
                    to: '/account/notifications',
                },
                {
                    icon: <DollarSign className="w-5 h-5 text-slate-900" />,
                    bg: 'bg-[#e6f7f3]',
                    label: 'Default Currency',
                    sub: currencyDisplay,
                    to: '/account/currency',
                },
            ],
        },
        {
            label: 'Account',
            items: [
                {
                    icon: <Settings className="w-5 h-5 text-slate-900" />,
                    bg: 'bg-slate-50',
                    label: 'App Settings',
                    sub: 'Split method, budget, theme, privacy',
                    to: '/account/app-settings',
                },
                {
                    icon: <Shield className="w-5 h-5 text-slate-900" />,
                    bg: 'bg-slate-50',
                    label: 'Privacy & Security',
                    sub: 'How we protect your data',
                    to: '/account/privacy',
                },
            ],
        },
        {
            label: 'More',
            items: [
                {
                    icon: <HelpCircle className="w-5 h-5 text-gray-500" />,
                    bg: 'bg-gray-100',
                    label: 'Help & Support',
                    sub: 'FAQ, contact us',
                    to: null,
                    onClick: () => alert('Help & Support coming soon!'),
                },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-28 font-sans text-gray-800">
            <header className="bg-white pt-10 pb-5 px-5 sticky top-0 z-10 shadow-[0_1px_0_0_#f0f0f0]">
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Account</h1>
            </header>

            <main className="px-4 mt-5 max-w-lg mx-auto">

                {/* Profile Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="relative shrink-0">
                            <div className="w-[62px] h-[62px] rounded-full overflow-hidden flex flex-wrap shadow">
                                <div className="w-1/2 h-1/2 bg-[#02182B]" />
                                <div className="w-1/2 h-1/2 bg-[#04345C]" />
                                <div className="w-1/2 h-1/2 bg-[#124B75]" />
                                <div className="w-1/2 h-1/2 bg-[#6B9AB7]" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-gray-700 rounded-full p-1 border-2 border-white shadow-sm">
                                <Camera className="w-3 h-3 text-white" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[19px] font-bold text-gray-900 truncate leading-tight">{user?.username || 'User'}</h2>
                            <p className="text-gray-500 text-[14px] truncate mt-0.5">{user?.email || 'user@paywise.com'}</p>
                        </div>
                    </div>
                    <Link
                        to="/account/settings"
                        className="ml-4 shrink-0 text-slate-900 font-bold text-[15px] hover:opacity-80 transition"
                    >
                        Edit
                    </Link>
                </div>

                {/* Menu Groups */}
                {menuGroups.map(group => (
                    <div key={group.label} className="mb-5">
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">{group.label}</p>
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            {group.items.map((item, idx) => {
                                const Inner = (
                                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition cursor-pointer">
                                        <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[16px] font-semibold text-gray-800">{item.label}</p>
                                            <p className="text-[13px] text-gray-400 mt-0.5 truncate">{item.sub}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                    </div>
                                );

                                const wrapClass = idx < group.items.length - 1 ? 'border-b border-gray-50' : '';

                                if (item.to) {
                                    return (
                                        <Link key={item.label} to={item.to} className={`block ${wrapClass}`}>
                                            {Inner}
                                        </Link>
                                    );
                                }
                                return (
                                    <button key={item.label} onClick={item.onClick} className={`w-full text-left ${wrapClass}`}>
                                        {Inner}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Log Out */}
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full mt-2 bg-white text-rose-500 font-bold py-4 rounded-2xl border border-gray-200 hover:bg-rose-50 transition shadow-sm flex items-center justify-center gap-3 text-[16px]"
                >
                    <LogOut className="w-5 h-5 stroke-[2.5px]" />
                    Log Out
                </button>
            </main>

            <div className="text-center text-[13px] text-gray-300 mt-10 mb-4 pointer-events-none">
                <p>Made with ♥ by GD Enterprises</p>
                <p className="text-[11px] mt-1">Paywise V1.2.2 · © 2026</p>
            </div>

            <BottomNav />
        </div>
    );
}
