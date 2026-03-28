import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Layers, Plus, Upload, UserPlus, ChevronRight, Sparkles, TrendingDown, TrendingUp, ArrowRightLeft, SlidersHorizontal, Check } from 'lucide-react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import BottomNav from '../components/BottomNav';
import logoImg from '../assets/logo.png';
import { useAppSettings } from '../hooks/useAppSettings';
import SplitwiseMigrationBanner from '../components/SplitwiseMigrationBanner';
import { formatCurrency, convertAmount } from '../utils/formatters';

export default function Dashboard() {
    const { user, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const { hideBalance, monthlyBudget } = useAppSettings();

    const [groups, setGroups] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [filter, setFilter] = useState('none');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSettled, setShowSettled] = useState(false);

    // Balance breakdown: split into "I owe" and "Owed to me"
    const [totalIOwe, setTotalIOwe] = useState(0);      // negative sum (what I owe others)
    const [totalOwedToMe, setTotalOwedToMe] = useState(0);  // positive sum (what others owe me)

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
            fetchData();
        };
        checkPendingJoin();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch groups + friends balance in parallel
            const [groupsRes, friendsRes] = await Promise.all([
                api.get('/groups'),
                api.get('/auth/friends')
            ]);

            setGroups(groupsRes.data);

            const displayCurr = user?.defaultCurrency || 'USD';
            let owedToMe = 0;   // positive
            let iOwe = 0;       // absolute value of negative

            // Groups contribution
            groupsRes.data.forEach(g => {
                const myBal = (g.balances || {})[user.id] || 0;
                const converted = convertAmount(myBal, 'USD', displayCurr);
                if (converted > 0) owedToMe += converted;
                else if (converted < 0) iOwe += Math.abs(converted);
            });

            // Friends contribution
            friendsRes.data.forEach(f => {
                const converted = convertAmount(f.balance || 0, 'USD', displayCurr);
                if (converted > 0) owedToMe += converted;
                else if (converted < 0) iOwe += Math.abs(converted);
            });

            setTotalOwedToMe(owedToMe);
            setTotalIOwe(iOwe);
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
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const netBalance = totalOwedToMe - totalIOwe;
    const displayCurr = user?.defaultCurrency || 'USD';
    const budgetExceeded = monthlyBudget > 0 && totalIOwe > monthlyBudget;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white shadow-sm pt-8 pb-4 px-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={logoImg} alt="Paywise" className="w-8 h-8 object-contain" />
                    <h1 className="text-xl font-bold text-gray-900">Paywise</h1>
                </div>
                <Link to="/ai" className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 group">
                    <i className="pi pi-bolt group-hover:animate-pulse" style={{ fontSize: '1.2rem' }}></i>
                </Link>
            </header>

            <main className="px-4 pt-6 max-w-md mx-auto">
                {/* ── Balance Summary Card ──────────────────────────── */}
                <div className={`mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex justify-between items-center transition-all ${hideBalance ? 'privacy-blur' : ''}`}>
                    <div className="flex items-center gap-1.5 text-[17px] font-semibold tracking-tight">
                        <span className="text-slate-800">Overall,</span>
                        <span className="text-slate-800">
                            {netBalance > 0 ? "you are owed" : netBalance < 0 ? "you owe" : "you are settled up"}
                        </span>
                        {netBalance !== 0 && (
                            <span className={`font-bold ml-0.5 ${netBalance > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCurrency(Math.abs(netBalance), displayCurr)}
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowFilterModal(true)} 
                        className="p-1 rounded-full hover:bg-slate-100 transition-colors text-slate-800 cursor-pointer"
                    >
                        <i className="pi pi-sliders-h" style={{ fontSize: '1.4rem' }}></i>
                    </button>
                </div>

                {/* Invite Friends Banner */}
                <Link to="/invite" className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-4 rounded-3xl shadow-lg shadow-slate-800/20 mb-8 hover:from-emerald-700 hover:to-emerald-800 transition-all transform hover:-translate-y-1">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2.5 rounded-2xl">
                            <i className="pi pi-user-plus text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg tracking-tight">Invite Friends!</h3>
                            <p className="text-slate-50 text-xs font-medium opacity-90">Grow your squad to split bills</p>
                        </div>
                    </div>
                    <i className="pi pi-chevron-right text-white/50"></i>
                </Link>
                
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Your Groups</h2>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 text-sm font-semibold text-emerald-900 hover:text-slate-950 bg-slate-50 px-3 py-1.5 rounded-full transition-colors"
                    >
                        <i className="pi pi-plus" style={{ fontSize: '0.8rem' }}></i> New Group
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={createGroup} className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                        <div className="flex gap-2">
                            <InputText
                                autoFocus
                                className="flex-1 py-2 px-3 border border-gray-200 rounded-xl outline-none"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                placeholder="e.g. Miami Trip"
                            />
                            <Button type="submit" label="Create" className="p-button-sm p-button-rounded bg-emerald-600 border-none px-4" />
                        </div>
                    </form>
                )}

                {(() => {
                    const filteredGroups = groups.filter(group => {
                        if (filter === 'none') return true;
                        const myBal = Number((group.balances || {})[user.id] || 0);
                        if (filter === 'outstanding') return myBal !== 0;
                        if (filter === 'owe') return myBal < 0;
                        if (filter === 'owed') return myBal > 0;
                        return true;
                    });
                    
                    const activeGroups = filteredGroups.filter(g => Number((g.balances || {})[user.id] || 0) !== 0);
                    const settledGroups = filteredGroups.filter(g => Number((g.balances || {})[user.id] || 0) === 0);

                    const renderGroup = (group) => {
                        const myBal = Number((group.balances || {})[user.id] || 0);
                        return (
                            <Link
                                to={`/group/${group._id}`}
                                key={group._id}
                                className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-slate-100 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-900 group-hover:bg-slate-100 group-hover:scale-105 transition-all">
                                        <i className="pi pi-th-large text-xl"></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 text-lg truncate leading-tight">{group.name}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{group.members.length} member{group.members.length !== 1 && 's'}</p>
                                    </div>
                                    {myBal !== 0 ? (
                                        <div className={`text-right flex-shrink-0 ml-2 ${hideBalance ? 'privacy-blur' : ''}`}>
                                            <p className={`text-[10px] font-black uppercase tracking-tight mb-0.5 ${myBal > 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                                                {myBal > 0 ? 'you get back' : 'you owe'}
                                            </p>
                                            <p className={`text-[16px] font-black leading-none ${myBal > 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                                                {formatCurrency(Math.abs(myBal), user?.defaultCurrency)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mt-1">settled</p>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    };

                    return (
                        <div className="space-y-4">
                            {filteredGroups.length === 0 && !isCreating ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                                    <i className="pi pi-database text-gray-300 text-4xl mb-3 block"></i>
                                    <p className="text-gray-500 font-medium">{filter === 'none' ? 'No groups yet.' : 'No groups match this filter.'}</p>
                                    <p className="text-sm text-gray-400 mt-1">{filter === 'none' ? 'Create a group to start splitting bills!' : 'Try changing your filter settings.'}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {activeGroups.map(renderGroup)}
                                    
                                    {settledGroups.length > 0 && (
                                        <div className="mt-5 pt-6 border-t border-gray-100/60">
                                            <button
                                                onClick={() => setShowSettled(!showSettled)}
                                                className="w-full py-3.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-xl text-[14px] transition-colors flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                {showSettled ? 'Hide settled up' : `Show settled up (${settledGroups.length})`}
                                            </button>
                                            
                                            {showSettled && (
                                                <div className="mt-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                                                    {settledGroups.map(renderGroup)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {activeGroups.length === 0 && settledGroups.length > 0 && !showSettled && (
                                        <p className="text-gray-400 text-sm mt-6 text-center bg-gray-50 rounded-xl p-4 font-medium border border-gray-100">All your groups are currently settled up. You're all square!</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </main>

            <BottomNav />

            <Dialog 
                header="Set filter" 
                visible={showFilterModal} 
                onHide={() => setShowFilterModal(false)}
                position="bottom" 
                draggable={false} 
                resizable={false}
                className="w-full max-w-md prime-ios-dialog"
                contentClassName="p-0 overflow-hidden rounded-t-3xl"
            >
                <div className="flex flex-col">
                    {[
                        { id: 'none', label: 'None' },
                        { id: 'outstanding', label: 'Groups with outstanding balances' },
                        { id: 'owe', label: 'Group balances you owe' },
                        { id: 'owed', label: 'Group balances you are owed' }
                    ].map((option, index, arr) => (
                        <button
                            key={option.id}
                            onClick={() => { setFilter(option.id); setShowFilterModal(false); }}
                            className={`p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0`}
                        >
                            <span className={`text-[17px] ${filter === option.id ? 'font-bold text-emerald-900' : 'text-gray-600'}`}>{option.label}</span>
                            {filter === option.id && <i className="pi pi-check text-emerald-500 font-bold text-lg"></i>}
                        </button>
                    ))}
                </div>
            </Dialog>
        </div>
    );
}
