import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    LogOut, Camera, ChevronRight,
    Bell, Shield, DollarSign, Settings, HelpCircle, UserX, Download, X
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/UI/Avatar';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useInstallApp } from '../hooks/useInstallApp';

export default function Account() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [kitties, setKitties] = useState([]);
    const { isInstallable, promptInstall, isIosPromptVisible, hideIosPrompt } = useInstallApp();

    const kittyImages = [
        `${import.meta.env.BASE_URL}assets/kitties/cat_PNG50534.png`,
        `${import.meta.env.BASE_URL}assets/kitties/cat_PNG50541.png`,
        `${import.meta.env.BASE_URL}assets/kitties/cat_PNG50525.png`,
        `${import.meta.env.BASE_URL}assets/kitties/cat_PNG50480.png`,
        `${import.meta.env.BASE_URL}assets/kitties/cat_PNG50433.png`
    ];

    const spawnKitty = () => {
        const id = Date.now();
        const src = kittyImages[Math.floor(Math.random() * kittyImages.length)];

        const edges = ['bottom', 'top', 'left', 'right'];
        const edge = edges[Math.floor(Math.random() * edges.length)];

        let style = { width: '180px', height: 'auto', zIndex: 60 };
        let animationClass = '';

        const offset = Math.floor(Math.random() * 60) + 10;

        switch (edge) {
            case 'bottom':
                style.bottom = '-20px';
                style.left = `${offset}%`;
                style.transform = `rotate(${Math.floor(Math.random() * 40) - 20}deg)`;
                animationClass = 'animate-in slide-in-from-bottom-[100%] duration-700';
                break;
            case 'top':
                style.top = '-20px';
                style.left = `${offset}%`;
                style.transform = `rotate(${180 + Math.floor(Math.random() * 40) - 20}deg)`;
                animationClass = 'animate-in slide-in-from-top-[100%] duration-700';
                break;
            case 'left':
                style.left = '-20px';
                style.top = `${offset}%`;
                style.transform = `rotate(${90 + Math.floor(Math.random() * 40) - 20}deg)`;
                animationClass = 'animate-in slide-in-from-left-[100%] duration-700';
                break;
            case 'right':
                style.right = '-20px';
                style.top = `${offset}%`;
                style.transform = `rotate(${-90 + Math.floor(Math.random() * 40) - 20}deg)`;
                animationClass = 'animate-in slide-in-from-right-[100%] duration-700';
                break;
            default:
                break;
        }

        const newKitty = { id, src, style, animationClass };
        setKitties((prev) => [...prev, newKitty]);

        setTimeout(() => {
            setKitties((prev) => prev.filter(k => k.id !== id));
        }, 3500);
    };

    const CURRENCY_SYMBOLS = {
        USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
        CAD: 'CA$', AUD: 'A$', CHF: 'Fr', CNY: '¥', MXN: 'MX$',
    };

    const currencyDisplay = user?.defaultCurrency
        ? `${user.defaultCurrency} (${CURRENCY_SYMBOLS[user.defaultCurrency] || user.defaultCurrency})`
        : 'USD ($)';

    const appSettingsGroup = isInstallable ? [{
        label: 'App',
        items: [
            {
                icon: <Download className="w-5 h-5 text-emerald-600" />,
                bg: 'bg-emerald-50',
                label: 'Install App',
                sub: 'Add Paywise to your Home Screen',
                to: null,
                onClick: promptInstall,
            }
        ]
    }] : [];

    const menuGroups = [
        ...appSettingsGroup,
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
                {
                    icon: <UserX className="w-5 h-5 text-slate-900" />,
                    bg: 'bg-rose-50',
                    label: 'Blocked Users',
                    sub: 'Manage people you have blocked',
                    to: '/account/blocked',
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

            <div className="text-center mt-12 mb-6">
                <div className="text-[11px] text-gray-400 uppercase tracking-widest pointer-events-none">
                    <p>Crafted with love by <span className="text-slate-900 font-bold">GD Enterprises</span></p>
                    <p className="mt-1.5 opacity-60">Paywise V1.3.1 · © 2026</p>
                </div>
                <div
                    onClick={spawnKitty}
                    className="mt-3 text-emerald-600 font-medium text-[14px] cursor-pointer hover:underline inline-block select-none"
                >
                    GD Kitties!
                </div>
            </div>

            {/* Render Kitties */}
            <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
                {kitties.map((kitty) => (
                    <img
                        key={kitty.id}
                        src={kitty.src}
                        alt="kitten"
                        className={`absolute ${kitty.animationClass} object-contain transition-all`}
                        style={kitty.style}
                    />
                ))}
            </div>

            {/* iOS Install Prompt */}
            {isIosPromptVisible && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex flex-col justify-end animate-in fade-in duration-300">
                    <div className="bg-white w-full rounded-t-3xl p-6 pb-8 relative animate-in slide-in-from-bottom-[100%] duration-300 shadow-xl max-w-lg mx-auto">
                        <button
                            onClick={hideIosPrompt}
                            className="absolute top-4 right-4 p-2 bg-gray-100/80 rounded-full text-gray-500 hover:bg-gray-200 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 bg-[#1e293b] rounded-2xl flex items-center justify-center p-2.5 shadow-md">
                                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h3 className="text-[19px] font-black text-gray-900 leading-tight">Install Paywise</h3>
                                <p className="text-gray-500 font-medium text-sm mt-0.5">Add to Home Screen</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-5 text-[15px] leading-relaxed font-medium">
                            Install Paywise on your iPhone or iPad for a full app experience.
                        </p>
                        <ol className="list-decimal pl-6 pr-2 text-gray-800 text-[15px] space-y-3.5 font-bold mb-8">
                            <li>Tap the <span className="text-blue-500 mx-1">Share</span> icon at the bottom of Safari.</li>
                            <li>Scroll down and select <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900 mx-1 border border-gray-200 whitespace-nowrap">Add to Home Screen</span>.</li>
                            <li>Tap <span className="text-blue-500 mx-1">Add</span> in the top right.</li>
                        </ol>
                        <Button
                            variant="primary"
                            fullWidth
                            className="!rounded-2xl !py-3.5 text-lg shadow-md max-w-sm mx-auto flex"
                            onClick={hideIosPrompt}
                        >
                            Got it
                        </Button>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
