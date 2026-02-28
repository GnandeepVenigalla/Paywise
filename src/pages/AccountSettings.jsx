import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Edit2, ChevronLeft } from 'lucide-react';

export default function AccountSettings() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white pb-24 font-sans text-gray-800">
            <header className="pt-6 pb-4 px-5 bg-white sticky top-0 z-10 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-[17px] font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2">Account settings</h1>
                <div className="w-6"></div> {/* Spacer to center title */}
            </header>

            <main className="px-5 pt-6 max-w-md mx-auto">
                <div className="mb-6">
                    <label className="text-gray-500 text-[14px] block mb-0.5">Full name</label>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-[17px]">{user?.username || 'User'}</span>
                        <button className="text-[#058b8c] font-medium flex items-center gap-1 text-[15px]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-gray-500 text-[14px] block mb-0.5">Email address</label>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-[17px]">{user?.email || 'user@paywise.com'}</span>
                        <button className="text-[#058b8c] font-medium flex items-center gap-1 text-[15px]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-gray-500 text-[14px] block mb-0.5">Phone number</label>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-[17px]">+16092103151</span>
                        <button className="text-[#058b8c] font-medium flex items-center gap-1 text-[15px]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    </div>
                    <button className="text-[#09a0b0] text-[15px]">Confirm your phone number</button>
                </div>

                <div className="mb-8">
                    <label className="text-gray-500 text-[14px] block mb-0.5">Password</label>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-[17px] tracking-widest mt-1">••••••••</span>
                        <button className="text-[#058b8c] font-medium flex items-center gap-1 text-[15px]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-gray-700 text-[15px] block mb-1">Time zone</label>
                    <select className="w-full bg-[#f6f6f6] border border-gray-300 rounded-[5px] px-3 py-2 text-gray-800 outline-none text-[15px] appearance-none" style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%23333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>')`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat' }}>
                        <option>(GMT-06:00) Central Time (US & Canada)</option>
                    </select>
                </div>

                <div className="mb-6">
                    <label className="text-gray-700 text-[15px] block mb-1">Language (for emails and notifications)</label>
                    <select className="w-full bg-[#f6f6f6] border border-gray-300 rounded-[5px] px-3 py-2 text-gray-800 outline-none text-[15px] appearance-none" style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%23333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>')`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat' }}>
                        <option>English</option>
                    </select>
                </div>

                <div className="mb-5 mt-6">
                    <label className="text-gray-700 text-[15px] block mb-1.5">Privacy settings</label>
                    <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-1 flex-shrink-0 w-3.5 h-3.5 accent-[#0089E4]" />
                        <p className="text-[15px] text-[#2c3e50] leading-snug">
                            Allow Paywise to suggest me as a friend to other users<br />
                            <span className="text-gray-500 italic text-[14px] block mt-0.5">Paywise will only recommend you to users who already have your email address or phone number in their phone's contact book</span>
                        </p>
                    </div>
                </div>

                <button className="bg-[#FF652f] hover:bg-[#e85b29] transition text-white px-4 py-2 rounded-[4px] text-[16px] font-normal shadow-sm mb-12">
                    Save changes
                </button>

                <h3 className="text-[25px] font-semibold text-[#2c3e50] mb-5">Advanced features</h3>

                <div className="mb-5">
                    <p className="text-[15px] text-[#2c3e50] mb-2">Block other users</p>
                    <button className="px-3.5 py-1.5 bg-[#f6f6f6] border border-gray-300 rounded-[4px] text-gray-700 text-[15px] hover:bg-gray-200 transition">
                        Manage your blocklist
                    </button>
                </div>

                <div className="mb-5">
                    <p className="text-[15px] text-[#2c3e50] mb-2">Log out on all devices</p>
                    <button className="px-3.5 py-1.5 bg-[#f6f6f6] border border-gray-300 rounded-[4px] text-gray-700 text-[15px] hover:bg-gray-200 transition">
                        Log out on all devices
                    </button>
                </div>

                <div className="mb-8">
                    <p className="text-[15px] text-[#2c3e50] mb-2">Your account</p>
                    <button className="px-3.5 py-1.5 bg-[#f6f6f6] border border-gray-300 rounded-[4px] text-gray-700 text-[15px] hover:bg-gray-200 transition">
                        Close your account
                    </button>
                </div>
            </main>
        </div>
    );
}
