import { Link, useLocation } from 'react-router-dom';
import { Layers, Activity, User, HeartHandshake } from 'lucide-react';

export default function BottomNav() {
    const location = useLocation();

    const tabs = [
        { path: '/friends', label: 'Friends', icon: HeartHandshake },
        { path: '/dashboard', label: 'Groups', icon: Layers },
        { path: '/activity', label: 'Activity', icon: Activity },
        { path: '/account', label: 'Account', icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pt-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = location.pathname === tab.path;
                return (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`flex flex-col items-center gap-1 min-w-[60px] cursor-pointer ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-300'} transition-colors`}
                    >
                        <div className={`p-1.5 rounded-2xl ${isActive ? 'bg-slate-50 shadow-sm' : 'bg-transparent'} transition-all duration-300 transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                            <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                        </div>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{tab.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
