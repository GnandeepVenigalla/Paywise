import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Settings, Shield, Bell, Camera } from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function Account() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-800">
            <header className="bg-white pt-8 pb-4 px-5 sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <h1 className="text-[26px] font-normal text-gray-700">Account</h1>
            </header>

            <main className="p-4 mt-2">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full overflow-hidden flex flex-wrap shadow-sm">
                                <div className="w-1/2 h-1/2 bg-[#02182B]"></div>
                                <div className="w-1/2 h-1/2 bg-[#04345C]"></div>
                                <div className="w-1/2 h-1/2 bg-[#124B75]"></div>
                                <div className="w-1/2 h-1/2 bg-[#6B9AB7]"></div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-[#374151] rounded-sm p-1 border border-white shadow-sm">
                                <Camera className="w-[14px] h-[14px] text-white" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[22px] font-normal text-gray-800 leading-tight truncate">{user?.username || 'User'}</h2>
                            <p className="text-gray-500 text-[15px] mt-0.5 font-medium truncate">{user?.email || 'user@paywise.com'}</p>
                        </div>
                    </div>
                    <Link to="/account/settings" className="text-[#058b8c] font-bold text-[17px] hover:underline transition ml-4 shrink-0">
                        Edit
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="p-5 border-b border-gray-50 flex items-center gap-4 text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                        <Bell className="w-6 h-6 text-teal-600" />
                        <span className="font-bold text-base">Notifications</span>
                    </div>
                    <Link to="/account/privacy" className="p-5 border-b border-gray-50 flex items-center gap-4 text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                        <Shield className="w-6 h-6 text-teal-600" />
                        <span className="font-bold text-base">Privacy & Security</span>
                    </Link>
                    <div className="p-5 flex items-center gap-4 text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                        <Settings className="w-6 h-6 text-teal-600" />
                        <span className="font-bold text-base">App Settings</span>
                    </div>
                </div>

                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full bg-white text-rose-600 font-bold py-4 rounded-2xl border border-gray-200 hover:bg-gray-100 transition shadow-sm flex items-center justify-center gap-3"
                >
                    <LogOut className="w-6 h-6 stroke-[2.5px]" />
                    Log Out of Paywise
                </button>
            </main>

            <div className="text-center text-[15px] text-[#8e9092] mt-10 mb-8 pointer-events-none">
                <p className="mb-1">Made by :) GD Enterprises</p>
                <p className="mb-1">Copyright © 2026 Paywise, Inc.</p>
                <p className="mt-3 text-[10px]">v1.0.2</p>
            </div>

            <BottomNav />
        </div>
    );
}
