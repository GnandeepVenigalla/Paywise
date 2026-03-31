import { useEffect, useState, useContext, useMemo } from 'react';
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
import NotificationBell from '../components/NotificationBell';
import { formatCurrency, convertAmount } from '../utils/formatters';

export default function Dashboard() {
    const { user, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const { hideBalance, monthlyBudget } = useAppSettings();

    const [groups, setGroups] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupType, setNewGroupType] = useState('default');
    const [activeTab, setActiveTab] = useState('standard'); // 'standard' or 'community'
    const [filter, setFilter] = useState('none');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSettled, setShowSettled] = useState(false);

    const groupsWithBalances = useMemo(() => {
        return (groups || []).map(g => {
            const myBal = (g.balances || {})[user.id || user._id] || 0;
            return {
                ...g,
                myBalance: myBal
            };
        });
    }, [groups, user.id, user._id]);

    const activeGroups = groupsWithBalances.filter(g => 
        (g.groupType === 'community') || 
        (Math.abs(g.myBalance) > 0.01)
    );
    
    const settledGroups = groupsWithBalances.filter(g => 
        (g.groupType !== 'community') && 
        (Math.abs(g.myBalance) <= 0.01)
    );

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
            await api.post('/groups', { 
                name: newGroupName, 
                members: [],
                groupType: newGroupType 
            });
            setNewGroupName('');
            setNewGroupType('default');
            setIsCreating(false);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const netBalance = totalOwedToMe - totalIOwe;
    const displayCurr = user?.defaultCurrency || 'USD';

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white dark:bg-slate-900 shadow-sm pt-8 pb-4 px-5 sticky top-0 z-30 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
                <div className="flex items-center gap-3">
                    <img src={logoImg} alt="Paywise" className="w-9 h-9 object-contain drop-shadow-sm" />
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Paywise</h1>
                </div>
                <div className="flex items-center gap-3">
                    <NotificationBell />
                    <Link to="/ai" className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 group">
                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    </Link>
                </div>
            </header>

            <main className="px-4 pt-6 max-w-md mx-auto">
                {/* ── Phone Missing Prompt (Especially for Google users) ── */}
                {!user.phone && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl animate-in slide-in-from-top duration-500 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Plus className="w-6 h-6 text-amber-600 rotate-45" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-amber-900 text-sm uppercase tracking-wider mb-1">Action Required</h3>
                                <p className="text-amber-800 text-[13px] leading-snug mb-3">
                                    Your account is missing a phone number. Add it now to improve security and help friends find you.
                                </p>
                                <Link 
                                    to="/account" 
                                    className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700 transition active:scale-95 shadow-sm"
                                >
                                    Update Phone Number
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

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
                
                {/* Title and Tabs Section */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[17px] font-black text-gray-900 tracking-tight">Your Groups</h2>
                    <button onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-1.5 text-emerald-600 font-bold text-[14px]">
                        <i className={`pi ${isCreating ? 'pi-times' : 'pi-plus'} text-xs`}></i>
                        {isCreating ? 'Cancel' : 'New Group'}
                    </button>
                </div>

                {/* Modern TAB Switcher */}
                <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-2xl w-fit">
                    <button 
                        onClick={() => setActiveTab('standard')}
                        className={`px-6 py-2 rounded-xl text-[14px] font-bold transition-all ${activeTab === 'standard' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Standard
                    </button>
                    <button 
                        onClick={() => setActiveTab('community')}
                        className={`px-6 py-2 rounded-xl text-[14px] font-bold transition-all ${activeTab === 'community' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Community
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={createGroup} className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-black uppercase tracking-wider text-gray-400 mb-3 ml-1">New Group Details</label>
                        <div className="space-y-4">
                            <div>
                                <InputText
                                    autoFocus
                                    className="w-full py-3 px-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Group Name (e.g. Miami Trip)"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewGroupType('default')}
                                    className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${newGroupType === 'default' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <i className="pi pi-users"></i>
                                        <span>Standard Split</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewGroupType('community')}
                                    className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${newGroupType === 'community' ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <i className="pi pi-sync"></i>
                                        <span>Community Cycle</span>
                                    </div>
                                </button>
                            </div>

                            {newGroupType === 'community' && (
                                <p className="text-[11px] text-orange-600 font-medium px-1 leading-tight">
                                    <i className="pi pi-info-circle mr-1"></i>
                                    In Community groups, you don't split bills. The app manages who pays next!
                                </p>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all"
                                >
                                    Create Group
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Main Groups List Rendering */}
                <div className="space-y-3 pb-20">
                    {(() => {
                        const baseList = activeGroups.filter(g => {
                            if (activeTab === 'community') return g.groupType === 'community';
                            return !g.groupType || g.groupType === 'default';
                        });

                        if (baseList.length === 0 && (activeTab === 'community' || settledGroups.length === 0)) {
                            return (
                                <div className="text-center py-12 px-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                    <div className={`w-16 h-16 ${activeTab === 'community' ? 'bg-orange-100 text-orange-500' : 'bg-emerald-100 text-emerald-500'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                        <i className={`pi ${activeTab === 'community' ? 'pi-sync' : 'pi-users'} text-2xl`}></i>
                                    </div>
                                    <h3 className="text-gray-900 font-black text-lg">No {activeTab} groups</h3>
                                    <p className="text-gray-500 text-sm mt-1 mb-6">Create your first {activeTab} group to start tracking.</p>
                                    <button 
                                        onClick={() => { setIsCreating(true); setNewGroupType(activeTab === 'community' ? 'community' : 'default'); }}
                                        className={`px-6 py-3 ${activeTab === 'community' ? 'bg-orange-600 shadow-orange-100' : 'bg-emerald-600 shadow-emerald-100'} text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95`}
                                    >
                                        Create Group
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <>
                                {baseList.map((group) => {
                                    const isCommunity = group.groupType === 'community';
                                    const paidCount = group.paymentCycle?.filter(c => c.hasPaid).length || 0;
                                    const totalMembers = group.members?.length || 0;

                                    return (
                                        <Link 
                                            key={group._id} 
                                            to={`/group/${group._id}`}
                                            className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm active:scale-[0.98] transition group"
                                        >
                                            <div className={`w-14 h-14 ${isCommunity ? 'bg-orange-50 text-orange-500' : 'bg-emerald-100/50 text-emerald-700'} rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-xl shadow-inner`}>
                                                {group.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-gray-900 group-hover:text-emerald-700 transition-colors truncate">{group.name}</h3>
                                                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">{group.members?.length} members</p>
                                            </div>

                                            {isCommunity ? (
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                                        <span className="text-[11px] font-black text-orange-600 uppercase tracking-tight">Cycle: {paidCount}/{totalMembers}</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest leading-none">Rotation Active</p>
                                                </div>
                                            ) : (
                                                <div className="text-right">
                                                    {group.myBalance > 0 ? (
                                                        <>
                                                            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest leading-none">You get back</p>
                                                            <p className="text-[17px] text-emerald-500 font-black tracking-tight">{formatCurrency(group.myBalance, group.currency || user?.defaultCurrency)}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest leading-none">You owe</p>
                                                            <p className="text-[17px] text-rose-500 font-black tracking-tight">{formatCurrency(Math.abs(group.myBalance), group.currency || user?.defaultCurrency)}</p>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}

                                {activeTab === 'standard' && settledGroups.length > 0 && (
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setShowSettled(!showSettled)}
                                            className="w-full py-4 text-gray-400 font-bold text-[14px] hover:text-gray-600 transition flex items-center justify-center gap-2"
                                        >
                                            {showSettled ? 'Hide settled up' : `Show settled up (${settledGroups.length})`}
                                            <i className={`pi ${showSettled ? 'pi-chevron-up' : 'pi-chevron-down'} text-xs`}></i>
                                        </button>
                                        {showSettled && settledGroups.map(group => (
                                            <Link 
                                                key={group._id} 
                                                to={`/group/${group._id}`} 
                                                className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-3xl border border-transparent hover:border-gray-100 transition opacity-70 group"
                                            >
                                                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 group-hover:bg-white shadow-sm transition-all">
                                                    {group.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-500 group-hover:text-gray-700 transition-colors">{group.name}</h3>
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Settled</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
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
