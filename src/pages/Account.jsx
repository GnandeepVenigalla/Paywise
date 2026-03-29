import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    LogOut, Camera, ChevronRight,
    Bell, Shield, DollarSign, Settings, HelpCircle, UserX, Download, X, UserPlus, ShoppingCart, Banknote
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/UI/Avatar';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useInstallApp } from '../hooks/useInstallApp';
import { useRef, useEffect } from 'react';

let memeCache = [];
export default function Account() {
    const { user, logout, setUser, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const [kitties, setKitties] = useState([]);
    const { isInstallable, promptInstall, isIosPromptVisible, hideIosPrompt } = useInstallApp();
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingLoanCount, setPendingLoanCount] = useState(0);

    useEffect(() => {
        api.get('/loans/pending').then(res => setPendingLoanCount(res.data?.length || 0)).catch(() => {});
    }, []);

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setIsUploading(true);

        try {
            const res = await api.post('/upload/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update the user context with the new profile picture URL
            setUser({ ...user, profilePic: res.data.url });
        } catch (error) {
            console.error('Upload failed:', error);
            alert(error.response?.data?.msg || 'Failed to upload image.');
        } finally {
            setIsUploading(false);
            e.target.value = null; // reset input
        }
    };

    const cuteCatJokes = [
        "I demand tuna!", "Sleep loading...", "Did someone say treats?", "I am the boss",
        "It's 3AM, time to run", "If I fits, I sits", "Error 404: Cat not found", "Hooman, serve me",
        "This box is mine", "Pet me. Now stop.", "I saw a ghost", "You're late for lunch",
        "Target acquired", "Nap time = all the time", "I'm not fat, I'm fluffy", "Monday mood",
        "Why is the bowl half empty?", "I regret nothing", "What personal space?", "Boop the snoot",
        "Invisible bugs exist", "Catch the red dot!", "Too cute to care", "I knock things over",
        "Sunbeam detected", "Waiting for pets", "Zero regrets", "Pawsitive vibes only",
        "You may admire me", "Just 5 more minutes"
    ];

    const spawnKitty = async () => {
        let memeUrl = '';
        
        if (memeCache.length === 0) {
            try {
                // Use TheCatAPI for 100% clean, instantly generated adorable cats (100,000+ images)
                const res = await fetch('https://api.thecatapi.com/v1/images/search?limit=15', { cache: 'no-store' });
                const data = await res.json();
                memeCache = data.map(m => m.url); 
            } catch {
                memeCache = [
                    'https://cdn2.thecatapi.com/images/1.jpg',
                    'https://cdn2.thecatapi.com/images/2.jpg'
                ];
            }
        }
        
        memeUrl = memeCache.pop() || 'https://cdn2.thecatapi.com/images/3.jpg';
        const randomJoke = cuteCatJokes[Math.floor(Math.random() * cuteCatJokes.length)];

        const id = Date.now() + Math.random();
        const src = memeUrl;

        const edges = ['bottom', 'top', 'left', 'right'];
        const edge = edges[Math.floor(Math.random() * edges.length)];

        let style = { height: 'auto', zIndex: 60 };
        let animationClass = '';

        const offset = Math.floor(Math.random() * 60) + 10;
        
        // Always keep memes relatively upright so text is readable
        style.transform = `rotate(${Math.floor(Math.random() * 20) - 10}deg)`;

        switch (edge) {
            case 'bottom':
                style.bottom = '20px';
                style.left = `${offset}%`;
                animationClass = 'animate-in slide-in-from-bottom-[100%] duration-1000';
                break;
            case 'top':
                style.top = '20px';
                style.left = `${offset}%`;
                animationClass = 'animate-in slide-in-from-top-[100%] duration-1000';
                break;
            case 'left':
                style.left = '20px';
                style.top = `${offset}%`;
                animationClass = 'animate-in slide-in-from-left-[100%] duration-1000';
                break;
            case 'right':
                style.right = '20px';
                style.top = `${offset}%`;
                animationClass = 'animate-in slide-in-from-right-[100%] duration-1000';
                break;
            default:
                break;
        }

        const newKitty = { id, src, joke: randomJoke, style, animationClass };
        setKitties((prev) => [...prev, newKitty]);

        setTimeout(() => {
            setKitties((prev) => prev.filter(k => k.id !== id));
        }, 5000);
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
                    icon: <Bell className="w-5 h-5 text-slate-900 dark:text-emerald-400" />,
                    bg: 'bg-[#e6f7f3] dark:bg-emerald-950/30',
                    label: 'Notifications',
                    sub: 'Manage your email alerts',
                    to: '/account/notifications',
                },
                {
                    icon: <DollarSign className="w-5 h-5 text-slate-900 dark:text-emerald-400" />,
                    bg: 'bg-[#e6f7f3] dark:bg-emerald-950/30',
                    label: 'Default Currency',
                    sub: currencyDisplay,
                    to: '/account/currency',
                },
                {
                    icon: <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
                    bg: 'bg-amber-50 dark:bg-amber-950/30',
                    label: 'Loan Requests',
                    sub: pendingLoanCount > 0 ? `${pendingLoanCount} pending acceptance` : 'Review incoming loan requests',
                    to: '/loans',
                    badge: pendingLoanCount > 0 ? pendingLoanCount : null,
                },
            ],
        },
        {
            label: 'Account',
            items: [
                {
                    icon: <Settings className="w-5 h-5 text-slate-900 dark:text-slate-100" />,
                    bg: 'bg-slate-50 dark:bg-slate-800',
                    label: 'App Settings',
                    sub: 'Split method, budget, theme, privacy',
                    to: '/account/app-settings',
                },
                {
                    icon: <Shield className="w-5 h-5 text-slate-900 dark:text-slate-100" />,
                    bg: 'bg-slate-50 dark:bg-slate-800',
                    label: 'Privacy & Security',
                    sub: 'How we protect your data',
                    to: '/account/privacy',
                },
                {
                    icon: <UserX className="w-5 h-5 text-slate-900 dark:text-rose-400" />,
                    bg: 'bg-rose-50 dark:bg-rose-950/30',
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
                    icon: <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
                    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                    label: 'Invite Friends',
                    sub: 'Share Paywise & grow your squad',
                    to: '/invite',
                },
                {
                    icon: <HelpCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />,
                    bg: 'bg-gray-50 dark:bg-slate-800',
                    label: 'Help & Support',
                    sub: 'FAQ, contact us',
                    to: '/account/help',
                },
            ],
        },
        {
            label: 'Partner',
            items: [
                {
                    icon: <ShoppingCart className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
                    bg: 'bg-amber-50 dark:bg-amber-950/30',
                    label: 'Merchant Portal',
                    sub: 'Manage your store and payments',
                    onClick: () => window.location.href = 'https://merchant.paywiseapp.com',
                },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24 font-sans text-gray-800 dark:text-gray-200 transition-colors">
            <header className="bg-white dark:bg-slate-900 pt-10 pb-5 px-6 sticky top-0 z-10 border-b border-gray-100 dark:border-slate-800">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Account</h1>
            </header>

            <main className="px-5 mt-6 max-w-lg mx-auto">
                {/* Profile Card */}
                <Card className="mb-8 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <Avatar src={user?.profilePic} name={user?.username} size="lg" />
                                <label 
                                    htmlFor="profile-upload"
                                    className={`absolute -bottom-1 -right-1 bg-slate-900 dark:bg-emerald-600 rounded-full p-1.5 border-2 border-white dark:border-slate-900 shadow-lg cursor-pointer hover:bg-slate-800 transition flex items-center justify-center z-10 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <Camera className="w-3.5 h-3.5 text-white pointer-events-none" />
                                    <input 
                                        id="profile-upload"
                                        type="file" 
                                        onChange={handleProfilePicUpload} 
                                        accept="image/*" 
                                        className="hidden" 
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white truncate leading-tight">
                                    {user?.username || 'User'}
                                </h2>
                                <p className="text-gray-400 dark:text-gray-500 text-sm truncate mt-0.5">
                                    {user?.email || 'user@paywise.com'}
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/account/settings"
                            className="text-slate-950 dark:text-emerald-400 font-black text-sm uppercase tracking-widest hover:opacity-70 transition flex-shrink-0"
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
                                        className={`flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${!isLast ? 'border-b border-gray-50 dark:border-slate-800/50' : ''}`}
                                    >
                                        <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center flex-shrink-0 animate-in fade-in zoom-in-75 duration-300`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[16px] font-bold text-gray-900 dark:text-slate-100 leading-tight">{item.label}</p>
                                            <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1 truncate">{item.sub}</p>
                                        </div>
                                        {item.badge ? (
                                            <span className="bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mr-1">
                                                {item.badge}
                                            </span>
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-300 dark:text-slate-700 flex-shrink-0" />
                                        )}
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

            <div className="text-center mt-8 mb-6">
                <div className="text-[11px] text-gray-400 uppercase tracking-widest pointer-events-none">
                    <p>Crafted with love by <a href="https://gdenterprises.gnandeep.com" target="_blank" rel="noopener noreferrer" className="text-slate-900 dark:text-slate-300 font-bold hover:underline pointer-events-auto">GD Enterprises</a></p>
                    <p className="mt-1.5 opacity-60">Paywise V1.4.3 /144 · © 2026</p>
                </div>
                <div
                    onClick={spawnKitty}
                    className="mt-3 text-emerald-600 font-medium text-[14px] cursor-pointer hover:underline inline-block select-none"
                >
                    GD Kitty Memes!
                </div>
            </div>

            {/* Render Kitties */}
            <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
                {kitties.map((kitty) => (
                    <div
                        key={kitty.id}
                        className={`absolute ${kitty.animationClass} w-48 sm:w-64 bg-white dark:bg-slate-900 shadow-2xl rounded-xl border-[6px] border-white dark:border-slate-800 transition-all flex flex-col`}
                        style={kitty.style}
                    >
                        <img src={kitty.src} alt="kitten" className="w-full h-40 sm:h-56 object-cover rounded-t-lg bg-gray-100 dark:bg-slate-950" />
                        <div className="py-4 px-3 text-center bg-white dark:bg-slate-900 flex-1 flex items-center justify-center">
                            <p className="font-extrabold text-[13px] sm:text-[16px] text-gray-800 dark:text-slate-100 tracking-tight leading-snug">
                                {kitty.joke} <span className="text-[12px] sm:text-[14px]">😺</span>
                            </p>
                        </div>
                    </div>
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
