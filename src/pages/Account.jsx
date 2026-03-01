import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    LogOut, Camera, ChevronRight,
    Bell, Shield, DollarSign, Settings, HelpCircle
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/UI/Avatar';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

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
                    icon: <HelpCircle className="w-5 h-5 text-gray-400" />,
                    bg: 'bg-gray-50',
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
            <header className="bg-white pt-10 pb-5 px-6 sticky top-0 z-10 border-b border-gray-100">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account</h1>
            </header>

            <main className="px-5 mt-6 max-w-lg mx-auto">
                {/* Profile Card */}
                <Card className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <Avatar name={user?.username} size="lg" />
                                <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1.5 border-2 border-white shadow-lg">
                                    <Camera className="w-3.5 h-3.5 text-white" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-black text-gray-900 truncate leading-tight">
                                    {user?.username || 'User'}
                                </h2>
                                <p className="text-gray-400 text-sm truncate mt-0.5">
                                    {user?.email || 'user@paywise.com'}
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/account/settings"
                            className="text-slate-950 font-black text-sm uppercase tracking-widest hover:opacity-70 transition flex-shrink-0"
                        >
                            Edit
                        </Link>
                    </div>
                </Card>

                {/* Menu Groups */}
                {menuGroups.map(group => (
                    <div key={group.label} className="mb-8">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 mb-3">
                            {group.label}
                        </p>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            {group.items.map((item, idx) => {
                                const isLast = idx === group.items.length - 1;
                                const content = (
                                    <div
                                        onClick={item.onClick}
                                        className={`flex items-center gap-4 px-6 py-5 hover:bg-gray-50 transition cursor-pointer ${!isLast ? 'border-b border-gray-50' : ''}`}
                                    >
                                        <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center flex-shrink-0 animate-in fade-in zoom-in-75 duration-300`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[16px] font-bold text-gray-900 leading-tight">{item.label}</p>
                                            <p className="text-[13px] text-gray-400 mt-1 truncate">{item.sub}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                    </div>
                                );

                                return item.to ? (
                                    <Link key={item.label} to={item.to}>{content}</Link>
                                ) : (
                                    <div key={item.label}>{content}</div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Log Out */}
                <Button
                    variant="secondary"
                    fullWidth
                    className="mt-4 !text-rose-500 hover:!bg-rose-50 border-gray-100"
                    onClick={() => { logout(); navigate('/login'); }}
                    icon={LogOut}
                >
                    Log Out
                </Button>
            </main>

            <div className="text-center text-[11px] text-gray-300 mt-12 mb-6 pointer-events-none uppercase tracking-widest">
                <p>Crafted with love by GD Enterprises</p>
                <p className="mt-1.5 opacity-60">Paywise V1.2.7 · © 2026</p>
            </div>

            <BottomNav />
        </div>
    );
}
