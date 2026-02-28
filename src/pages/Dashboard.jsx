import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Users, Plus, Upload, UserPlus, ChevronRight, Eye } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import logoImg from '../assets/logo.png';
import { useAppSettings, getCurrencySymbol } from '../hooks/useAppSettings';

export default function Dashboard() {
    const { user, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const { hideBalance, monthlyBudget, defaultCurrency } = {
        ...useAppSettings(),
        defaultCurrency: user?.defaultCurrency || 'USD',
    };
    const currSym = getCurrencySymbol(user?.defaultCurrency || 'USD');

    const [groups, setGroups] = useState([]);
    const [totalOwed, setTotalOwed] = useState(0);   // positive = owed to me
    const [monthSpend, setMonthSpend] = useState(0);  // total I owe this month across groups
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        const checkPendingJoin = async () => {
            const pendingGroupId = localStorage.getItem('joinGroupId');
            if (pendingGroupId) {
                localStorage.removeItem('joinGroupId');
                try {
                    await api.post(`/groups/${pendingGroupId}/join`);
                    navigate(`/group/${pendingGroupId}`);
                    return;
                } catch (err) {
                    console.error('Failed to join group from invite code:', err);
                }
            }
            fetchGroups();
        };
        checkPendingJoin();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);

            // Compute total net balance across all groups
            let net = 0;
            res.data.forEach(g => {
                const myBal = (g.balances || {})[user.id] || 0;
                net += myBal;
            });
            setTotalOwed(net);
        } catch (err) {
            console.error(err);
        }
    };

    const createGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            await api.post('/groups', { name: newGroupName, members: [] });
            setNewGroupName('');
            setIsCreating(false);
            fetchGroups();
        } catch (err) {
            console.error(err);
        }
    };

    // Budget warning: totalOwed negative means I owe. Use abs for "spending"
    const budgetExceeded = monthlyBudget > 0 && Math.abs(Math.min(totalOwed, 0)) > monthlyBudget;
    const balanceColor = budgetExceeded
        ? 'text-orange-500'
        : totalOwed > 0 ? 'text-[#108c73]' : totalOwed < 0 ? 'text-[#e25b22]' : 'text-gray-500';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm pt-8 pb-4 px-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={logoImg} alt="Paywise" className="w-8 h-8 object-contain" />
                    <h1 className="text-xl font-bold text-gray-900">Paywise</h1>
                </div>
                <Link to="/account" className="w-9 h-9 rounded-full bg-teal-100 border-2 border-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg uppercase shadow-sm cursor-pointer hover:bg-teal-200 transition">
                    {user?.username?.charAt(0) || 'U'}
                </Link>
            </header>

            <main className="px-4 pt-6 max-w-md mx-auto">

                {/* ── Balance Summary Card ───────────── */}
                {totalOwed !== 0 && (
                    <div className={`rounded-3xl p-5 mb-6 flex items-center justify-between shadow-sm border ${budgetExceeded ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                        <div>
                            <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                {totalOwed > 0 ? 'Total you are owed' : 'Total you owe'}
                            </p>
                            <p className={`text-[26px] font-black ${balanceColor} ${hideBalance ? 'privacy-blur' : ''}`}>
                                {currSym}{Math.abs(totalOwed).toFixed(2)}
                            </p>
                            {budgetExceeded && (
                                <p className="text-[12px] text-orange-500 font-semibold mt-1">
                                    ⚠️ Monthly budget of {currSym}{monthlyBudget} exceeded
                                </p>
                            )}
                        </div>
                        {hideBalance && (
                            <div className="flex items-center gap-1 text-gray-400 text-[13px]">
                                <Eye className="w-4 h-4" />
                                <span>hover to reveal</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Invite Friends Banner */}
                <Link to="/invite" className="flex items-center justify-between bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-5 py-4 rounded-3xl shadow-lg shadow-teal-500/20 mb-8 hover:from-teal-600 hover:to-emerald-600 transition-all transform hover:-translate-y-1">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2.5 rounded-2xl">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg tracking-tight">Invite Friends!</h3>
                            <p className="text-teal-50 text-xs font-medium opacity-90">Grow your squad to split bills</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50" />
                </Link>

                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Your Groups</h2>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Group
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={createGroup} className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                autoFocus
                                className="flex-1 py-2 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                placeholder="e.g. Miami Trip"
                            />
                            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-teal-700 transition-colors shadow-sm">
                                Create
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {groups.length === 0 && !isCreating ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No groups yet.</p>
                            <p className="text-sm text-gray-400 mt-1">Create a group to start splitting bills!</p>
                        </div>
                    ) : (
                        groups.map(group => {
                            const myBal = (group.balances || {})[user.id] || 0;
                            return (
                                <Link
                                    to={`/group/${group._id}`}
                                    key={group._id}
                                    className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-100 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 group-hover:scale-105 transition-all">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-lg">{group.name}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">{group.members.length} member{group.members.length !== 1 && 's'}</p>
                                        </div>
                                        {myBal !== 0 && (
                                            <p className={`text-[15px] font-bold flex-shrink-0 ${hideBalance ? 'privacy-blur' : ''} ${myBal > 0 ? 'text-[#108c73]' : 'text-[#e25b22]'}`}>
                                                {myBal > 0 ? '+' : ''}{currSym}{Math.abs(myBal).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
