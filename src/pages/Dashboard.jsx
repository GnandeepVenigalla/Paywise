import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Layers, Plus, Upload, UserPlus, ChevronRight, Eye } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import logoImg from '../assets/logo.png';
import { useAppSettings } from '../hooks/useAppSettings';
import SplitwiseMigrationBanner from '../components/SplitwiseMigrationBanner';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
    const { user, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const { hideBalance, monthlyBudget } = useAppSettings();

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
        : totalOwed > 0 ? 'text-emerald-500' : totalOwed < 0 ? 'text-rose-500' : 'text-gray-500';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm pt-8 pb-4 px-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={logoImg} alt="Paywise" className="w-8 h-8 object-contain" />
                    <h1 className="text-xl font-bold text-gray-900">Paywise</h1>
                </div>
                <Link to="/account" className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-50 text-slate-950 flex items-center justify-center font-bold text-lg uppercase shadow-sm cursor-pointer hover:bg-slate-200 transition">
                    {user?.username?.charAt(0) || 'U'}
                </Link>
            </header>

            <main className="px-4 pt-6 max-w-md mx-auto">
                <SplitwiseMigrationBanner />



                {/* Invite Friends Banner */}
                <Link to="/invite" className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-800 text-white px-5 py-4 rounded-3xl shadow-lg shadow-slate-800/20 mb-8 hover:from-slate-900 hover:to-slate-900 transition-all transform hover:-translate-y-1">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2.5 rounded-2xl">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg tracking-tight">Invite Friends!</h3>
                            <p className="text-slate-50 text-xs font-medium opacity-90">Grow your squad to split bills</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50" />
                </Link>

                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Your Groups</h2>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-slate-950 bg-slate-50 px-3 py-1.5 rounded-full transition-colors"
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
                                className="flex-1 py-2 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                placeholder="e.g. Miami Trip"
                            />
                            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-slate-950 transition-colors shadow-sm">
                                Create
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {groups.length === 0 && !isCreating ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
                                    className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-slate-100 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-slate-100 group-hover:scale-105 transition-all">
                                            <Layers className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-lg">{group.name}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">{group.members.length} member{group.members.length !== 1 && 's'}</p>
                                        </div>
                                        {myBal !== 0 && (
                                            <div className={`text-[15px] font-bold flex-shrink-0 ${hideBalance ? 'privacy-blur' : ''} ${myBal > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {myBal > 0 ? '+' : '-'}{formatCurrency(myBal, user?.defaultCurrency)}
                                            </div>
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
