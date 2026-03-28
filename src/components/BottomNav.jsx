import { Link, useLocation } from 'react-router-dom';
import { Layers, Activity, User, HeartHandshake, BookOpen } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Avatar from './UI/Avatar';

export default function BottomNav() {
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const tabs = [
        { path: '/friends', label: 'Friends', icon: HeartHandshake },
        { path: '/dashboard', label: 'Groups', icon: Layers },
    ];

    const host = window.location.hostname;
    const isLocalOrBeta = host === 'localhost' || host === '127.0.0.1' || host === 'beta.paywiseapp.com';
    const isIndia = user?.defaultCurrency === 'INR' || String(user?.phone).startsWith('91') || String(user?.phone).startsWith('+91');

    // Always show in local/beta environments for testing. 
    // In production (www.paywiseapp.com), only show to users with Indian context.
    if (isLocalOrBeta || isIndia) {
        tabs.push({ path: '/katha', label: 'Katha', icon: BookOpen, accent: true });
    }

    tabs.push(
        { path: '/activity', label: 'Activity', icon: Activity },
        { path: '/account', label: 'Account', icon: User }
    );

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pt-3 px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
                const isAccount = tab.label === 'Account';
                const isKatha = tab.accent;
                const activeColor = isKatha ? 'text-amber-800' : 'text-slate-900';
                const activeBg = isKatha ? 'bg-amber-50 shadow-sm' : 'bg-slate-50 shadow-sm';
                const activeRing = isKatha ? 'ring-2 ring-amber-800 ring-offset-2' : 'ring-2 ring-slate-900 ring-offset-2';

                return (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`flex flex-col items-center gap-1 min-w-[52px] cursor-pointer ${isActive ? activeColor : 'text-slate-400 hover:text-slate-300'} transition-colors`}
                    >
                        <div className={`transition-all duration-300 transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                            {isAccount ? (
                                <div className={`p-0.5 rounded-2xl ${isActive ? activeRing : ''} transition-all`}>
                                    <Avatar src={user?.profilePic} name={user?.username} size="sm" className="!w-7 !h-7 !rounded-xl shadow-none" />
                                </div>
                            ) : (
                                <div className={`p-1.5 rounded-2xl ${isActive ? activeBg : 'bg-transparent'} transition-all`}>
                                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                </div>
                            )}
                        </div>
                        <span className={`text-[10px] font-bold ${isActive ? activeColor : 'text-slate-400'}`}>{tab.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
