import { useEffect, useState, useContext, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, UserPlus, Receipt, CreditCard, Camera, Trash2, X, Edit2, LogOut, Check, Settings, Calendar, Users, Scale, Link2, User, Plane, Home, Heart, ClipboardList, Share, Copy, Link as LinkIcon, Link2Off, Expand, ChevronLeft, ChevronRight, HelpCircle, TrendingUp, PieChart, Download, FileText, FileSpreadsheet, Banknote, Building2, DollarSign, CheckCircle2 } from 'lucide-react';
import { exportExpenses } from '../utils/exportUtils';
import logoImg from '../assets/logo.png';
import { useAppSettings } from '../hooks/useAppSettings';
import { useMonthlySpending } from '../hooks/useMonthlySpending';
import ExpenseItem from '../components/UI/ExpenseItem';
import { formatMonthYear, formatDay, formatShortMonth, formatCurrency, CURRENCY_SYMBOLS, convertAmount } from '../utils/formatters';
import { calculateSplitsFromItems, normalizeItemsForSave, getUserExpenseSplit, toggleItemAssignment } from '../utils/expenseUtils';
export default function GroupDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user } = useContext(AuthContext);
    const currSym = CURRENCY_SYMBOLS[user?.defaultCurrency || 'USD'] || '$';
    const { hideBalance } = useAppSettings();
    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState({});
    const [emailToInvite, setEmailToInvite] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [inviteError, setInviteError] = useState('');

    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isEditingExpense, setIsEditingExpense] = useState(false);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editItems, setEditItems] = useState([]);
    const [selectedMemberIdsForEdit, setSelectedMemberIdsForEdit] = useState([]);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [isEditingGroupName, setIsEditingGroupName] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Settings Modals State
    const [showSettings, setShowSettings] = useState(false);
    const [selectedMemberModal, setSelectedMemberModal] = useState(null);
    const [simplifyDebts, setSimplifyDebts] = useState(false);
    const [showCustomizeGroup, setShowCustomizeGroup] = useState(false);
    const [groupType, setGroupType] = useState('Home');
    const [settleUpDate, setSettleUpDate] = useState('');
    const [draftSettleDate, setDraftSettleDate] = useState('');
    const [showInviteLink, setShowInviteLink] = useState(false);
    const [showGroupBalances, setShowGroupBalances] = useState(false);
    const [expandedBalances, setExpandedBalances] = useState({});
    const [showGroupTotals, setShowGroupTotals] = useState(false);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
    const [showExportOptions, setShowExportOptions] = useState(false);
    const [showGroupSettleUp, setShowGroupSettleUp] = useState(false);
    const [settleUpTarget, setSettleUpTarget] = useState(null); // { member, amount, iOwe }
    const [groupSettleStep, setGroupSettleStep] = useState(1); // 1=pick person, 2=method, 3=amount
    const [groupSettleMode, setGroupSettleMode] = useState(null); // 'cash'|'bank'
    const [groupPartialAmount, setGroupPartialAmount] = useState('');
    const [isGroupSettling, setIsGroupSettling] = useState(false);
    const [groupNote, setGroupNote] = useState('');
    const [showGroupNoteModal, setShowGroupNoteModal] = useState(false);
    const [draftGroupNote, setDraftGroupNote] = useState('');

    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedReminderMember, setSelectedReminderMember] = useState(null);
    const [reminderEmailBody, setReminderEmailBody] = useState('');


    // Extract monthly spending aggregation logic to custom hook
    const monthlySpending = useMonthlySpending(expenses, user);

    useEffect(() => {
        if (monthlySpending.length > 0) {
            setSelectedMonthIndex(monthlySpending.length - 1);
        }
    }, [monthlySpending]);

    const pairwiseBalances = useMemo(() => {
        if (!group?.members || !expenses || !user) return {};
        let pairwise = {};
        const allAssociatedMembers = [...(group.members || []), ...(group.pastMembers || [])];

        allAssociatedMembers.forEach(m => {
            const mId = String(m._id || m);
            pairwise[mId] = {};
            allAssociatedMembers.forEach(other => {
                const otherId = String(other._id || other);
                if (mId !== otherId) pairwise[mId][otherId] = 0;
            });
        });

        expenses.forEach(exp => {
            const creditorId = String(exp.paidBy?._id || exp.paidBy);
            const sourceCurr = exp.currency || 'USD';
            const targetCurr = user?.defaultCurrency || 'USD';
            exp.splits.forEach(split => {
                const debtorId = String(split.user?._id || split.user);
                if (debtorId !== creditorId && pairwise[debtorId] && pairwise[debtorId][creditorId] !== undefined) {
                    const convertedAmount = convertAmount(split.amount, sourceCurr, targetCurr);
                    pairwise[debtorId][creditorId] += convertedAmount;
                }
            });
        });

        const memberIds = allAssociatedMembers.map(m => String(m._id || m));
        for (let i = 0; i < memberIds.length; i++) {
            for (let j = i + 1; j < memberIds.length; j++) {
                const a = memberIds[i];
                const b = memberIds[j];
                const aOwesB = pairwise[a][b] || 0;
                const bOwesA = pairwise[b][a] || 0;
                if (aOwesB > bOwesA) {
                    pairwise[a][b] = aOwesB - bOwesA;
                    pairwise[b][a] = 0;
                } else {
                    pairwise[b][a] = bOwesA - aOwesB;
                    pairwise[a][b] = 0;
                }
            }
        }
        return pairwise;
    }, [group, expenses, user]);

    const formatName = (username) => {
        if (!username) return 'Unknown';
        let parts = username.trim().split(' ');
        if (parts.length > 1) {
            return `${parts[0]} ${parts[parts.length - 1][0]}.`;
        }
        return username;
    };

    const handleUpdateGroupName = async () => {
        if (!newGroupName.trim()) return;
        try {
            await api.put(`/groups/${id}`, { name: newGroupName });
            setIsEditingGroupName(false);
            fetchGroup();
        } catch (err) {
            alert('Failed to update group name');
        }
    };

    const handleLeaveGroup = async () => {
        if (window.confirm('Are you sure you want to leave this group? Your history will remain if you have any outstanding balances.')) {
            try {
                await api.post(`/groups/${id}/leave`);
                navigate('/dashboard');
            } catch (err) {
                alert(err.response?.data?.msg || 'Failed to leave group');
            }
        }
    };

    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        setIsSavingEdit(true);

        // Recalculate splits if items exist
        const calculatedSplits = calculateSplitsFromItems(editItems);

        try {
            await api.put(`/expenses/${selectedExpense._id}`, {
                description: editDescription,
                amount: Number(editAmount),
                items: normalizeItemsForSave(editItems),
                splits: calculatedSplits || undefined
            });
            setIsEditingExpense(false);
            setSelectedExpense(null);
            fetchGroup();
        } catch (err) {
            alert('Failed to update expense');
        } finally {
            setIsSavingEdit(false);
        }
    };
    const toggleEditAssign = (itemId) => {
        if (selectedMemberIdsForEdit.length === 0) {
            alert("Please select members at the top first.");
            return;
        }

        setEditItems(prev => toggleItemAssignment(prev, itemId, selectedMemberIdsForEdit, group.members || []));
    };

    const toggleEditMemberSelection = (memberId) => {
        setSelectedMemberIdsForEdit(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const fetchGroup = async () => {
        try {
            const res = await api.get(`/groups/${id}`);
            setGroup(res.data.group);
            setExpenses(res.data.expenses);
            setBalances(res.data.balances);
            setGroupNote(res.data.group.note || '');
            if (res.data.group.settleUpDate) {
                setSettleUpDate(res.data.group.settleUpDate.slice(0, 10));
                setDraftSettleDate(res.data.group.settleUpDate.slice(0, 10));
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGroup();
    }, [id]);

    const inviteMember = async (e) => {
        e.preventDefault();
        setInviteError('');
        try {
            const res = await api.post(`/groups/${id}/members`, { email: emailToInvite });

            if (res.data.msg === 'Invitation email sent!') {
                alert('User not registered yet, but we sent them a Paywise email invitation!');
            } else {
                alert('User successfully added to your group!');
            }

            setEmailToInvite('');
            setShowInvite(false);
            fetchGroup();
        } catch (err) {
            setInviteError(err.response?.data?.msg || 'Error inviting member');
        }
    };

    const deleteExpense = async (expenseId, description) => {
        if (window.confirm(`Are you sure you want to delete "${description}"? This will recalculate everyone's balances.`)) {
            try {
                await api.delete(`/expenses/${expenseId}`);
                fetchGroup();
            } catch (err) {
                alert('Failed to delete expense: ' + (err.response?.data?.msg || err.message));
            }
        }
    };

    const handleDeleteGroup = async () => {
        if (!window.confirm(`Are you sure you want to delete "${group?.name}"? This will permanently delete the group and ALL its expenses. This cannot be undone.`)) return;
        try {
            await api.delete(`/groups/${id}`);
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to delete group. You may not have permission.');
        }
    };

    if (!group) {
        return (
            <div className="fixed inset-0 bg-[#1e293b] flex flex-col items-center justify-center z-[100]">
                <div className="w-[110px] h-[110px] animate-pulse">
                    <img src={logoImg} alt="Paywise Logo" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
            </div>
        );
    }

    const myBalance = balances[user.id] || 0;

    const displayItems = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    const inviteLinkUrl = `${window.location.href.split('#')[0]}#/join/${id}?v=s`;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24">
            {/* Header - Splitwise Style Top Dark Header */}
            <header className="relative bg-[#343e42] text-white pt-6 pb-6 shadow-sm overflow-hidden z-0">
                <div className="absolute inset-0 z-[-2] bg-gradient-to-br from-[#2a383d] to-[#121c21]" />
                <div className="relative px-4 z-10 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full bg-white/20 hover:bg-white/30 transition shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="flex gap-3 items-center">
                            <button onClick={() => setShowSettings(true)} className="w-9 h-9 rounded-full bg-white/20 border border-white/40 text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm cursor-pointer hover:bg-white/30 transition">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-14 mb-2">
                        {isEditingGroupName ? (
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="text-3xl font-bold tracking-tight bg-black/40 text-white rounded px-2 py-1 outline-none border border-white/60 w-full focus:ring-2 focus:ring-white"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateGroupName()}
                                />
                                <button onClick={handleUpdateGroupName} className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-200 transition drop-shadow-sm flex-shrink-0">
                                    <Check className="w-5 h-5" />
                                </button>
                                <button onClick={() => setIsEditingGroupName(false)} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition drop-shadow-sm flex-shrink-0">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className={`flex items-center gap-2 mb-1 w-full ${(group.members || []).some(m => m._id === user.id) ? 'group cursor-pointer' : ''}`} onClick={() => {
                                if ((group.members || []).some(m => m._id === user.id)) {
                                    setNewGroupName(group.name); setIsEditingGroupName(true);
                                }
                            }}>
                                <h1 className="text-[34px] font-black tracking-tight leading-none text-white drop-shadow-md break-all">{group.name}</h1>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                            <button
                                onClick={() => {
                                    setNewGroupName(group.name);
                                    setDraftSettleDate(settleUpDate);
                                    setShowCustomizeGroup(true);
                                }}
                                className="bg-transparent text-white text-[13px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/60 hover:bg-white/10 transition"
                            >
                                <Calendar className="w-4 h-4" />
                                {settleUpDate
                                    ? new Date(settleUpDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'Add settle up date'}
                            </button>
                            <button onClick={() => setShowInvite(!showInvite)} className="bg-black/30 text-white text-[13px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 hover:bg-black/40 transition">
                                <Users className="w-4 h-4" /> {group.members?.length || 0} people
                            </button>
                            <button
                                onClick={() => { setDraftGroupNote(groupNote); setShowGroupNoteModal(true); }}
                                className="bg-transparent text-white text-[13px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/60 hover:bg-white/10 transition mt-1 sm:mt-0 max-w-[220px] truncate"
                            >
                                <Edit2 className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{groupNote ? groupNote : 'Add group notes...'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="bg-white max-w-lg mx-auto">
                {/* Invite Members form */}
                {showInvite && (
                    <form onSubmit={inviteMember} className="bg-gray-50 p-5 shadow-inner border-b border-gray-200 animate-in fade-in zoom-in-95">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Invite friend by email</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                className="flex-1 py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition-all shadow-sm"
                                value={emailToInvite}
                                onChange={e => setEmailToInvite(e.target.value)}
                                placeholder="friend@example.com"
                                required
                            />
                            <button type="submit" className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-950 transition shadow-sm">
                                Add
                            </button>
                        </div>
                        {inviteError && <p className="text-red-500 text-xs mt-2 font-medium">{inviteError}</p>}
                    </form>
                )}

                <div className="px-5 py-4 border-b border-gray-100 mb-2">
                    {/* Overall balance summary — clean like Splitwise */}
                    <div className="mb-3">
                        {myBalance === 0 ? (
                            <p className="text-[17px] font-bold text-gray-700">You are all settled up</p>
                        ) : myBalance > 0 ? (
                            <p className="text-[17px] font-bold text-gray-800">
                                You are owed{' '}
                                <span className={`text-emerald-500 ${hideBalance ? 'privacy-blur' : ''}`}>
                                    {formatCurrency(myBalance, user?.defaultCurrency)}
                                </span>
                                {' '}overall
                            </p>
                        ) : (
                            <p className="text-[17px] font-bold text-gray-800">
                                You owe{' '}
                                <span className={`text-rose-500 ${hideBalance ? 'privacy-blur' : ''}`}>
                                    {formatCurrency(myBalance, user?.defaultCurrency)}
                                </span>
                                {' '}overall
                            </p>
                        )}

                        {/* Per-member balances */}
                        <div className="mt-1.5 space-y-0.5">
                            {(() => {
                                let othersBalances = [];
                                [...(group.members || []), ...(group.pastMembers || [])].filter(m => m._id !== user.id).forEach(member => {
                                    const b = balances[member._id] || 0;
                                    if (b !== 0) othersBalances.push({ member, b });
                                });
                                if (othersBalances.length === 0) return null;
                                const [first, second, ...rest] = othersBalances;
                                return (
                                    <>
                                        {first && (
                                            <p className="text-[14px] text-gray-500">
                                                {first.b > 0 ? (
                                                    <>{first.member.username} owes you <span className={`font-semibold text-emerald-500 ${hideBalance ? 'privacy-blur' : ''}`}>{formatCurrency(first.b, user?.defaultCurrency)}</span></>
                                                ) : (
                                                    <>You owe {first.member.username} <span className={`font-semibold text-rose-500 ${hideBalance ? 'privacy-blur' : ''}`}>{formatCurrency(first.b, user?.defaultCurrency)}</span></>
                                                )}
                                            </p>
                                        )}
                                        {second && (
                                            <p className="text-[14px] text-gray-500">
                                                {second.b > 0 ? (
                                                    <>{second.member.username} owes you <span className={`font-semibold text-emerald-500 ${hideBalance ? 'privacy-blur' : ''}`}>{formatCurrency(second.b, user?.defaultCurrency)}</span></>
                                                ) : (
                                                    <>You owe {second.member.username} <span className={`font-semibold text-rose-500 ${hideBalance ? 'privacy-blur' : ''}`}>{formatCurrency(second.b, user?.defaultCurrency)}</span></>
                                                )}
                                            </p>
                                        )}
                                        {rest.length > 0 && (
                                            <p className="text-[13px] text-gray-400">Plus {rest.length} more balances</p>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide items-center">
                        <button onClick={() => setShowGroupSettleUp(true)} className="bg-[#e11d48] text-white px-5 py-2.5 rounded-lg hover:bg-[#be123c] font-bold shadow-sm whitespace-nowrap transition cursor-pointer">
                            Settle up
                        </button>
                        <button onClick={() => setShowGroupBalances(true)} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-bold shadow-sm whitespace-nowrap hover:bg-gray-50 transition cursor-pointer">
                            Balances
                        </button>
                        <button onClick={() => setShowGroupTotals(true)} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-bold shadow-sm whitespace-nowrap hover:bg-gray-50 transition cursor-pointer">
                            Totals
                        </button>
                        <button onClick={() => setShowExportOptions(true)} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-bold shadow-sm whitespace-nowrap hover:bg-gray-50 transition cursor-pointer flex items-center gap-1.5">
                            Export
                        </button>
                    </div>
                </div>


                <div className="px-5 pb-12">
                    {displayItems.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium text-lg">No expenses yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {(() => {
                                let lastMonth = '';
                                return displayItems.map(item => {
                                    const monthYear = formatMonthYear(item.date);
                                    const showHeader = monthYear !== lastMonth;
                                    lastMonth = monthYear;

                                    const isSettleUp = item.description.toLowerCase() === 'settle up';
                                    const isPaidByMe = (item.paidBy?._id || item.paidBy) === (user?.id || user?._id);

                                    // Calculate user's involvement for the component
                                    let userSplit = 0;
                                    const mySplit = item.splits?.find(s => (s.user._id || s.user) === (user.id || user._id));

                                    if (isPaidByMe) {
                                        // If I paid, userSplit is what OTHERS owe me (total - my share)
                                        userSplit = item.amount - (mySplit ? mySplit.amount : 0);
                                    } else {
                                        // If someone else paid, userSplit is what I owe (my share, as negative)
                                        userSplit = mySplit ? -mySplit.amount : 0;
                                    }

                                    return (
                                        <div key={item._id || Math.random()}>
                                            {showHeader && (
                                                <div className="px-5 py-3 bg-gray-50/50 backdrop-blur-sm sticky top-[72px] z-10 border-b border-gray-100/50">
                                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{monthYear}</span>
                                                </div>
                                            )}
                                            <ExpenseItem
                                                description={isSettleUp ? `${isPaidByMe ? 'You' : item.paidBy.username} settled up` : item.description}
                                                amount={item.amount}
                                                date={item.date}
                                                payerName={isPaidByMe ? 'You' : (item.paidBy?.username || 'Someone')}
                                                userSplit={userSplit}
                                                targetCurrency={user?.defaultCurrency || 'USD'}
                                                sourceCurrency={item.currency || 'USD'}
                                                onClick={() => {
                                                    setSelectedExpense(item);
                                                    setIsEditingExpense(false);
                                                    setEditDescription(item.description);
                                                    setEditAmount(item.amount.toString());
                                                    setEditItems(item.items || []);
                                                    setSelectedMemberIdsForEdit([user.id]);
                                                    // Note: GroupDetails might have a different modal name or state
                                                    // In this file it seems to be handled by a generic setSelectedExpense(item) 
                                                    // which triggers a modal.
                                                }}
                                            />
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>
            </main >

            {/* Custom Green Floating Action Button */}
            {
                (group.members || []).some(m => m._id === user.id) && (
                    <div className="fixed bottom-6 right-5 z-20">
                        <Link
                            to={`/group/${id}/add`}
                            className="bg-slate-900 text-white rounded-full shadow-[0_4px_10px_rgb(0,0,0,0.15)] px-5 py-3.5 flex items-center justify-center gap-2 font-bold hover:bg-slate-950 transition transform hover:scale-105"
                        >
                            <Receipt className="w-5 h-5" />
                            Add expense
                        </Link>
                    </div>
                )
            }

            {/* Camera Scan Optional Button Bottom Left */}
            {
                (group.members || []).some(m => m._id === user.id) && (
                    <div className="fixed bottom-6 left-5 z-20">
                        <Link
                            to={`/group/${id}/scan`}
                            className="bg-white text-gray-700 rounded-full shadow-[0_4px_10px_rgb(0,0,0,0.1)] p-4 flex items-center justify-center font-bold hover:bg-gray-50 border border-gray-100 transition transform hover:scale-105"
                        >
                            <Camera className="w-6 h-6" />
                        </Link>
                    </div>
                )
            }

            {/* Expense Detail Modal */}
            {
                selectedExpense && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-in fade-in p-0 sm:p-4">
                        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-8 shadow-2xl">
                            {/* Modal Header */}
                            <div className="bg-gray-50 px-5 py-4 flex justify-between items-center border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{isEditingExpense ? 'Edit Expense' : 'Expense Details'}</h2>
                                <div className="flex items-center gap-2">
                                    {!isEditingExpense && (selectedExpense.addedBy ? (selectedExpense.addedBy._id === user.id) : (selectedExpense.paidBy._id === user.id)) && (
                                        <button
                                            onClick={() => setIsEditingExpense(true)}
                                            className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setSelectedExpense(null); setIsEditingExpense(false); }}
                                        className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {isEditingExpense ? (
                                    <form onSubmit={handleUpdateExpense} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                            <input
                                                type="text"
                                                value={editDescription}
                                                onChange={e => setEditDescription(e.target.value)}
                                                className="w-full py-3 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none shadow-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Total Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editAmount}
                                                    onChange={e => setEditAmount(e.target.value)}
                                                    className="w-full py-3 pl-8 pr-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none shadow-sm font-bold"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">Changing the total amount will instantly update and mathematically recalculate all member splits based on their assigned portions.</p>
                                        {editItems.length > 0 && (
                                            <div className="space-y-4 pt-2 border-t border-gray-100 mt-4">
                                                <h4 className="text-sm font-bold text-gray-700">Edit Item Assignments</h4>

                                                {/* Member selection pills for editing */}
                                                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                                                    {group.members.map(member => {
                                                        const isSelected = selectedMemberIdsForEdit.includes(member._id);
                                                        return (
                                                            <button
                                                                key={member._id}
                                                                type="button"
                                                                onClick={() => toggleEditMemberSelection(member._id)}
                                                                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all font-semibold text-xs ${isSelected
                                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                                    : 'border-gray-200 bg-white text-gray-600'
                                                                    }`}
                                                            >
                                                                {member._id === user.id ? 'Me' : member.username}
                                                            </button>
                                                        )
                                                    })}
                                                </div>

                                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                    {editItems.map(item => {
                                                        const assignedIds = (item.assignedTo || []).map(u => u._id || u);
                                                        const isAssigned = assignedIds.length > 0;

                                                        return (
                                                            <div
                                                                key={item._id || item.id}
                                                                onClick={() => toggleEditAssign(item._id || item.id)}
                                                                className={`p-3 flex justify-between items-center rounded-xl border-2 transition-all cursor-pointer ${isAssigned ? 'border-slate-300 bg-slate-50' : 'border-gray-100'}`}
                                                            >
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                                                    {isAssigned && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {item.assignedTo.map(u => (
                                                                                <span key={u._id || u} className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-full font-bold">
                                                                                    {(group.members.find(m => m._id === (u._id || u))?.username) || '...'}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="font-bold text-gray-900">{formatCurrency(item.price, user?.defaultCurrency, selectedExpense.currency)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isSavingEdit}
                                            className="w-full font-bold bg-slate-900 text-white rounded-xl py-3.5 shadow-md hover:bg-slate-950 transition disabled:opacity-50 mt-4"
                                        >
                                            {isSavingEdit ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </form>
                                ) : (
                                    <div>
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center font-bold mx-auto mb-3 shadow-inner">
                                                <Receipt className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 break-all leading-tight">{selectedExpense.description}</h3>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">{formatCurrency(selectedExpense.amount, user?.defaultCurrency, selectedExpense.currency)}</p>
                                            <p className="text-sm text-gray-500 font-medium mt-1">Paid by {selectedExpense.paidBy._id === user.id ? 'You' : selectedExpense.paidBy.username}</p>
                                            {selectedExpense.addedBy && selectedExpense.addedBy._id !== selectedExpense.paidBy._id && (
                                                <p className="text-[11px] text-gray-400 font-medium italic mt-0.5">Added by {selectedExpense.addedBy._id === user.id ? 'you' : selectedExpense.addedBy.username}</p>
                                            )}
                                            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-h-48 overflow-y-auto">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Split Details</h4>
                                            <div className="space-y-2">
                                                {selectedExpense.splits.map(split => (
                                                    <div key={split.user._id || split.user} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                                                        <span className="font-semibold text-gray-700 text-sm">
                                                            {split.user?._id === user.id ? 'You' : (split.user?.username || 'Someone')}
                                                        </span>
                                                        <span className="font-bold text-gray-900 border-l border-gray-100 pl-3">{formatCurrency(split.amount, user?.defaultCurrency, selectedExpense.currency)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {(selectedExpense.addedBy ? (selectedExpense.addedBy._id === user.id) : (selectedExpense.paidBy._id === user.id)) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteExpense(selectedExpense._id, selectedExpense.description);
                                                    setSelectedExpense(null);
                                                }}
                                                className="w-full mt-4 font-bold bg-rose-50 text-rose-600 rounded-xl py-3.5 border border-rose-100 hover:bg-rose-100 transition flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                                Delete Entire Expense
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Group Settings Full-Screen Modal */}
            {
                showSettings && (
                    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-right-2 duration-200">
                        {/* Header */}
                        <div className="flex items-center p-4 border-b border-gray-100 relative">
                            <button onClick={() => setShowSettings(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute left-4">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-[17px] font-medium text-gray-900 w-full text-center">Group settings</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-20">
                            {/* Top Info */}
                            <div className="p-5 flex items-center justify-between border-b border-gray-50">
                                <div className="flex items-center gap-4 max-w-[80%]">
                                    <div className="w-[60px] h-[60px] bg-[#343e42] text-white rounded-[14px] flex items-center justify-center text-3xl font-black shadow-sm object-cover overflow-hidden relative flex-shrink-0">
                                        {group.name?.charAt(0)}
                                    </div>
                                    <h3 className="text-[20px] font-medium text-gray-900 truncate">{group.name}</h3>
                                </div>
                                <button
                                    onClick={() => { setNewGroupName(group.name); setShowCustomizeGroup(true); }}
                                    className="text-slate-900 font-bold text-[15px] px-2 flex-shrink-0">
                                    Edit
                                </button>
                            </div>

                            {/* Group members section */}
                            <div className="mt-4">
                                <h4 className="px-5 py-2 text-[14px] font-bold text-gray-800">Group members</h4>
                                <div className="flex flex-col mt-1">
                                    <button onClick={() => { setShowSettings(false); setShowInvite(true); }} className="px-5 py-4 flex items-center gap-5 hover:bg-gray-50 transition border-b border-gray-50 w-full text-left">
                                        <UserPlus className="w-[26px] h-[26px] text-gray-600 ml-1" strokeWidth={1.5} />
                                        <span className="text-[17px] text-gray-800 font-medium">Add people to group</span>
                                    </button>
                                    <button onClick={() => { setShowSettings(false); setShowInviteLink(true); }} className="px-5 py-[18px] flex items-center gap-5 hover:bg-gray-50 transition border-b border-gray-50 w-full text-left">
                                        <Link2 className="w-[26px] h-[26px] text-gray-600 ml-1" strokeWidth={1.5} />
                                        <span className="text-[17px] text-gray-800 font-medium">Invite via link</span>
                                    </button>

                                    {/* Members List */}
                                    {[...(group.members || [])].map(member => {
                                        const b = balances[member._id] || 0;
                                        return (
                                            <div key={member._id} onClick={() => setSelectedMemberModal(member)} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer border-b border-gray-50">
                                                <div className="flex items-center gap-4 max-w-[65%]">
                                                    <div className="w-[52px] h-[52px] bg-slate-950 text-white rounded-full flex items-center justify-center text-[22px] font-medium uppercase shadow-sm flex-shrink-0">
                                                        {member.username?.charAt(0)}
                                                    </div>
                                                    <div className="truncate flex-1">
                                                        <h4 className="text-[16px] text-gray-800 font-medium truncate leading-tight">{member.username}</h4>
                                                        <p className="text-[13px] text-gray-500 truncate mt-0.5">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {b < 0 ? (
                                                        <>
                                                            <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wide">owes</p>
                                                            <p className="text-[19px] font-medium text-rose-600 leading-tight">{formatCurrency(b, user?.defaultCurrency)}</p>
                                                        </>
                                                    ) : b > 0 ? (
                                                        <>
                                                            <p className="text-[11px] font-medium text-slate-900 uppercase tracking-wide">gets back</p>
                                                            <p className="text-[19px] font-medium text-slate-900 leading-tight">{formatCurrency(b, user?.defaultCurrency)}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-[15px] font-medium text-gray-400 mt-2">settled up</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Advanced settings section */}
                            <div className="mt-8">
                                <h4 className="px-5 py-2 text-[14px] font-bold text-gray-800">Advanced settings</h4>
                                <div className="flex flex-col mt-1">
                                    <div className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition border-t border-b border-gray-50 cursor-pointer" onClick={() => setSimplifyDebts(!simplifyDebts)}>
                                        <div className="mt-1 flex-shrink-0">
                                            <Scale className="w-6 h-6 text-gray-500" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1 pr-4">
                                            <h5 className="text-[17px] text-gray-800 font-medium">Simplify group debts</h5>
                                            <p className="text-[14px] text-gray-500 leading-snug mt-1">Automatically combines debts to reduce the total number of repayments between group members. <br /><span className="text-slate-900 font-medium">Learn more</span></p>
                                        </div>
                                        <div className="flex-shrink-0 mt-1">
                                            {simplifyDebts ? <div className="w-12 h-7 bg-slate-900 rounded-full relative transition-colors"><div className="w-6 h-6 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div></div> : <div className="w-12 h-7 bg-gray-200 rounded-full relative transition-colors"><div className="w-6 h-6 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div></div>}
                                        </div>
                                    </div>

                                    <button className="px-5 py-[18px] flex items-start gap-4 hover:bg-gray-50 transition border-b border-gray-50 text-left" onClick={() => {
                                        setShowSettings(false);
                                        handleLeaveGroup();
                                    }}>
                                        <div className="mt-0.5 flex-shrink-0">
                                            <LogOut className="w-6 h-6 text-gray-500 pl-1" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h5 className="text-[17px] text-gray-800 font-medium tracking-tight">Leave group</h5>
                                            <p className="text-[14px] text-gray-500 leading-snug mt-1 pr-2">You can't leave this group because you have outstanding debts with other group members.</p>
                                        </div>
                                    </button>

                                    <button className="px-5 py-5 flex items-center gap-4 hover:bg-rose-50 transition border-b border-gray-50 text-left" onClick={handleDeleteGroup}>
                                        <div className="flex-shrink-0">
                                            <Trash2 className="w-6 h-6 text-[#9a1e38] pl-1" strokeWidth={1.5} />
                                        </div>
                                        <h5 className="text-[17px] text-[#9a1e38] font-bold tracking-tight">Delete group</h5>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Customize Group Full-Screen Modal */}
            {
                showCustomizeGroup && (
                    <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-right-2 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 relative">
                            <button onClick={() => setShowCustomizeGroup(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-[17px] font-medium text-gray-900 absolute left-1/2 -translate-x-1/2">Customize group</h2>
                            <button onClick={async () => {
                                handleUpdateGroupName();
                                // Save settle-up date to backend
                                try {
                                    const res = await api.put(`/groups/${id}/settle-date`, { settleUpDate: draftSettleDate || null });
                                    const saved = res.data.settleUpDate ? res.data.settleUpDate.slice(0, 10) : '';
                                    setSettleUpDate(saved);
                                } catch { /* silently ignore */ }
                                setShowCustomizeGroup(false);
                            }} className="text-slate-900 font-bold text-[16px] px-2 hover:opacity-70 transition">
                                Done
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 pb-20 mt-2">
                            {/* Group Name Editing */}
                            <div className="flex items-start gap-4">
                                <div className="w-[72px] h-[72px] bg-[#343e42] text-white rounded-[16px] flex items-center justify-center text-4xl font-black shadow-sm object-cover overflow-hidden relative flex-shrink-0">
                                    {newGroupName?.charAt(0) || group.name?.charAt(0)}
                                </div>
                                <div className="flex-1 mt-1">
                                    <label className="text-[13px] font-bold text-gray-500 mb-0.5 block">Group name</label>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-full text-[22px] font-black text-gray-900 border-b-2 border-slate-100 dark:border-slate-800 transition-all focus:border-slate-900 bg-transparent py-2 outline-none"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleUpdateGroupName();
                                                setShowCustomizeGroup(false);
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Settle-up Date */}
                            <div className="mt-8">
                                <label className="text-[13px] font-bold text-gray-500 mb-3 block">Settle-up date</label>
                                <div className="flex items-center gap-3 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-5 py-4 focus-within:border-slate-900 transition-all bg-white shadow-sm">
                                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="date"
                                        value={draftSettleDate}
                                        onChange={e => setDraftSettleDate(e.target.value)}
                                        className="flex-1 outline-none text-[16px] text-gray-900 font-bold bg-transparent"
                                    />
                                </div>
                                {draftSettleDate && (
                                    <button
                                        onClick={() => setDraftSettleDate('')}
                                        className="mt-2 text-[13px] text-rose-500 font-medium hover:opacity-80 transition"
                                    >
                                        Remove date
                                    </button>
                                )}
                                <p className="text-[12px] text-gray-400 mt-2">Set a target date by when everyone should settle up. Visible to all group members.</p>
                            </div>

                            {/* Group Type Selector */}
                            <div className="mt-8">
                                <label className="text-[13px] font-bold text-gray-500 mb-3 block">Type</label>
                                <div className="grid grid-cols-4 gap-2 w-full">
                                    {[
                                        { id: 'Trip', label: 'Trip', Icon: Plane },
                                        { id: 'Home', label: 'Home', Icon: Home },
                                        { id: 'Couple', label: 'Couple', Icon: Heart },
                                        { id: 'Other', label: 'Other', Icon: ClipboardList },
                                    ].map((type) => {
                                        const isSelected = groupType === type.id;
                                        return (
                                            <div key={type.id} className="relative flex-1">
                                                <button
                                                    onClick={() => setGroupType(type.id)}
                                                    className={`w-full py-4 flex flex-col items-center gap-2 border-2 rounded-2xl transition-all relative z-10 shadow-sm ${isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-gray-50 dark:border-slate-800 hover:bg-gray-50 bg-white'}`}
                                                >
                                                    <type.Icon className={`w-[28px] h-[28px] ${isSelected ? 'text-white' : 'text-gray-700'}`} strokeWidth={1.5} />
                                                    <span className={`text-[12px] uppercase tracking-wider ${isSelected ? 'font-black' : 'font-bold text-gray-500'}`}>{type.label}</span>
                                                </button>
                                                {isSelected && (
                                                    <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-[12px] h-[12px] bg-slate-900 transform rotate-45 z-0"></div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Member Action Modal Overlay */}
            {
                selectedMemberModal && (
                    <div className="fixed inset-0 bg-black/40 z-[70] flex flex-col justify-end animate-in fade-in duration-200" onClick={() => setSelectedMemberModal(null)}>
                        <div className="bg-white rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgb(0,0,0,0.1)]" onClick={e => e.stopPropagation()}>
                            <div className="p-5 flex items-center justify-between border-b border-gray-100 pb-6">
                                <div className="flex items-center gap-4 max-w-[70%]">
                                    <div className="w-14 h-14 bg-slate-950 text-white rounded-full flex items-center justify-center text-2xl font-medium uppercase shadow-sm flex-shrink-0">
                                        {selectedMemberModal.username?.charAt(0)}
                                    </div>
                                    <div className="truncate">
                                        <h4 className="text-[19px] text-gray-800 font-medium truncate">{selectedMemberModal.username}</h4>
                                        <p className="text-[14px] text-gray-500 truncate mt-0.5">{selectedMemberModal.email}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    {balances[selectedMemberModal._id] < 0 ? (
                                        <>
                                            <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wide">owes</p>
                                            <p className="text-[20px] font-medium text-rose-600 leading-none mt-0.5">${Math.abs(balances[selectedMemberModal._id]).toFixed(2)}</p>
                                        </>
                                    ) : balances[selectedMemberModal._id] > 0 ? (
                                        <>
                                            <p className="text-[11px] font-medium text-slate-900 uppercase tracking-wide">gets back</p>
                                            <p className="text-[20px] font-medium text-slate-900 leading-none mt-0.5">${balances[selectedMemberModal._id].toFixed(2)}</p>
                                        </>
                                    ) : (
                                        <p className="text-[16px] font-medium text-gray-400">settled up</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col py-2 mb-2">
                                {selectedMemberModal._id !== user.id && (
                                    <button onClick={() => {
                                        navigate(`/friend/${selectedMemberModal._id}`, { state: { openSettings: true } });
                                    }} className="px-6 py-4 flex items-center gap-5 hover:bg-gray-50 transition w-full text-left">
                                        <User className="w-[26px] h-[26px] text-gray-600" strokeWidth={1.5} />
                                        <span className="text-[18px] text-gray-800 font-medium">View settings</span>
                                    </button>
                                )}

                                {selectedMemberModal._id === user.id ? (
                                    <button onClick={() => {
                                        setSelectedMemberModal(null);
                                        setShowSettings(false);
                                        handleLeaveGroup();
                                    }} className="px-6 py-4 flex items-start gap-5 hover:bg-rose-50/50 transition w-full text-left">
                                        <LogOut className="w-[26px] h-[26px] text-gray-500 mt-1" strokeWidth={1.5} />
                                        <div className="flex-1">
                                            <span className="text-[18px] text-gray-800 font-medium block">Leave group</span>
                                        </div>
                                    </button>
                                ) : (
                                    <button onClick={() => alert('Remove functionality coming soon.')} className="px-6 py-4 flex items-start gap-5 hover:bg-rose-50/50 transition w-full text-left pb-6">
                                        <Trash2 className="w-[26px] h-[26px] text-gray-500 mt-1" strokeWidth={1.5} />
                                        <div className="flex-1">
                                            <span className="text-[18px] text-gray-800 font-medium block">Remove from group</span>
                                            <p className="text-[14px] text-gray-500 mt-1 leading-[1.3] pr-2">You can't remove this person until their debts are settled up.</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Invite via Link Full-Screen Modal */}
            {
                showInviteLink && (
                    <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-right-2 duration-200">
                        {/* Header */}
                        <div className="flex items-center p-4 relative border-b border-gray-50">
                            <button onClick={() => setShowInviteLink(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute left-4">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-[17px] font-medium text-gray-900 w-full text-center">Invite link</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-20">
                            {/* Link Area */}
                            <div className="p-5 mt-2 flex items-center gap-6">
                                <div className="w-[64px] h-[64px] bg-[#53c8a3] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm relative">
                                    <LinkIcon className="w-[28px] h-[28px] text-white absolute transform -rotate-45" strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <a href={inviteLinkUrl} target="_blank" rel="noreferrer" className="text-slate-900 font-medium text-[16px] underline leading-snug break-all block decoration-1 text-left decoration-slate-900/40 underline-offset-2">
                                        {inviteLinkUrl}
                                    </a>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="px-5 pb-5 pt-2 border-b border-gray-100">
                                <p className="text-[15px] text-gray-700 leading-relaxed">
                                    Anyone can follow this link to join "{group.name}". Only share it with people you trust.
                                </p>
                            </div>

                            {/* Actions List */}
                            <div className="flex flex-col">
                                <button onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: `Join ${group.name} on Paywise`,
                                            url: inviteLinkUrl
                                        }).catch(console.error);
                                    } else {
                                        alert('Web Share API not supported in your browser.');
                                    }
                                }} className="px-5 py-[18px] flex items-center gap-6 hover:bg-gray-50 transition border-b border-gray-50 w-full text-left">
                                    <div className="flex items-center justify-center w-[30px] flex-shrink-0">
                                        <Share className="w-[28px] h-[28px] text-gray-600" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[17px] text-gray-800 font-medium">Share link</span>
                                </button>

                                <button onClick={() => {
                                    navigator.clipboard.writeText(inviteLinkUrl);
                                    alert('Link copied to clipboard!');
                                }} className="px-5 py-[18px] flex items-center gap-6 hover:bg-gray-50 transition border-b border-gray-50 w-full text-left">
                                    <div className="flex items-center justify-center w-[30px] flex-shrink-0">
                                        <Copy className="w-[28px] h-[28px] text-gray-500" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[17px] text-gray-800 font-medium">Copy link</span>
                                </button>

                                <button onClick={() => {
                                    alert('Change link functionality coming soon!');
                                }} className="px-5 py-[18px] flex items-center gap-6 hover:bg-gray-50 transition border-b border-gray-50 w-full text-left">
                                    <div className="flex items-center justify-center w-[30px] flex-shrink-0 relative">
                                        <Link2Off className="w-[28px] h-[28px] text-[#b63038]" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[17px] text-gray-800 font-medium">Change link</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Group Balances Full-Screen Modal */}
            {
                showGroupBalances && (
                    <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-center p-4 border-b border-gray-100 relative">
                            <button onClick={() => setShowGroupBalances(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute left-4">
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-[17px] font-medium text-gray-900 w-full text-center">Group balances</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto pb-6">
                            {[...(group.members || []), ...(group.pastMembers || [])]
                                .sort((a, b) => {
                                    const isAUser = a._id === user.id || a._id === user._id;
                                    const isBUser = b._id === user.id || b._id === user._id;
                                    if (isAUser) return -1;
                                    if (isBUser) return 1;
                                    return 0;
                                })
                                .map((member, index) => {
                                    const b = balances[member._id] || 0;
                                    const displayName = member._id === user.id || member._id === user._id ? `${member.username}` : member.username;
                                    const isExpanded = expandedBalances[member._id];

                                    const allMembers = [...(group.members || []), ...(group.pastMembers || [])];
                                    const memberDetails = [];
                                    if (isExpanded) {
                                        allMembers.forEach(other => {
                                            if (other._id === member._id) return;
                                            const amountOtherOwesMember = pairwiseBalances[other._id]?.[member._id] || 0;
                                            const amountMemberOwesOther = pairwiseBalances[member._id]?.[other._id] || 0;

                                            if (amountOtherOwesMember > 0) {
                                                memberDetails.push({ debtor: other, creditor: member, amount: amountOtherOwesMember });
                                            }
                                            if (amountMemberOwesOther > 0) {
                                                memberDetails.push({ debtor: member, creditor: other, amount: amountMemberOwesOther });
                                            }
                                        });
                                    }

                                    return (
                                        <div key={member._id} className="w-full flex flex-col border-b border-gray-50 bg-white">
                                            <div onClick={() => setExpandedBalances(prev => ({ ...prev, [member._id]: !prev[member._id] }))} className="flex items-center justify-between px-5 py-5 w-full hover:bg-gray-50 transition cursor-pointer relative z-10">
                                                <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                                                    <div className="w-[46px] h-[46px] bg-slate-950 text-white rounded-full flex items-center justify-center text-[20px] font-medium uppercase shadow-sm flex-shrink-0 relative z-20">
                                                        {member.username?.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[16px] text-gray-800 font-medium leading-snug truncate">
                                                            {displayName} {b < 0 ? (
                                                                <>owes <span className="text-rose-600">${Math.abs(b).toFixed(2)}</span></>
                                                            ) : b > 0 ? (
                                                                <>gets back <span className="text-slate-900">${b.toFixed(2)}</span></>
                                                            ) : (
                                                                <span className="text-gray-500 font-normal">is settled up</span>
                                                            )}
                                                            <br />
                                                            <span className="text-gray-500 text-[15px] font-normal">in total</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <button className="flex-shrink-0 text-gray-400 p-2 hover:bg-gray-100 rounded-full transition">
                                                    <Expand className="w-5 h-5" strokeWidth={1.5} />
                                                </button>
                                            </div>

                                            {/* Expanded Details List */}
                                            {isExpanded && memberDetails.length > 0 && (
                                                <div className="w-full bg-white relative pb-1">
                                                    {/* Sub-tree vertical line */}
                                                    <div className="absolute left-[42px] top-0 bottom-8 w-px bg-gray-200 z-0" />

                                                    {memberDetails.map((detail, i) => {
                                                        // Check if the expanded row belongs to the currently logged in user
                                                        const isCurrentUserExpanded = member._id === user.id || member._id === user._id;

                                                        // Colors are relative to the expanded member. If the expanded member owes, it's orange. If they get back, it's green.
                                                        const amountColorCls = detail.debtor._id === member._id ? 'text-rose-600' : 'text-emerald-500';
                                                        const otherPerson = detail.debtor._id === member._id ? detail.creditor : detail.debtor;

                                                        // Render buttons: if the logged in user is the one receiving money in this pair, [Request]. Everything else is [Remind...] [Settle up].
                                                        const isCreditOfCurrentUser = detail.creditor._id === user.id || detail.creditor._id === user._id;

                                                        return (
                                                            <div key={i} className="flex bg-white py-1.5 w-full relative z-10">
                                                                <div className="absolute left-[42px] top-6 w-[24px] h-px bg-gray-200" />

                                                                <div className="flex-1 pb-4 pt-1.5 pr-5 ml-[76px]">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-[30px] h-[30px] bg-slate-950 opacity-90 text-white rounded-full flex items-center justify-center text-[13px] font-medium uppercase shadow-sm flex-shrink-0">
                                                                            {otherPerson.username?.charAt(0)}
                                                                        </div>

                                                                        <p className="text-[15px] text-gray-700 font-medium leading-normal pr-2">
                                                                            <span className="text-gray-800">{formatName(detail.debtor.username)}</span> owes <span className={amountColorCls}>${detail.amount.toFixed(2)}</span> to <span className="text-gray-800">{formatName(detail.creditor.username)}</span>
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 mt-2.5 ml-[42px]">
                                                                        {isCreditOfCurrentUser ? (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const personToRemind = detail.debtor;
                                                                                        setSelectedReminderMember({
                                                                                            username: personToRemind.username,
                                                                                            amount: detail.amount,
                                                                                            email: personToRemind.email
                                                                                        });
                                                                                        setReminderEmailBody(`Hi ${personToRemind.username}! 👋\n\nThis is a friendly reminder from ${user.username} — you have an outstanding balance of ${currSym}${detail.amount.toFixed(2)} in our group "${group.name}" on Paywise.\n\nPlease settle up when you get a chance. 🙏\n\nThank you!`);
                                                                                        setShowReminderModal(true);
                                                                                    }}
                                                                                    className="bg-slate-900 text-white font-bold px-4 py-2 rounded-[6px] text-[14.5px] shadow-sm flex-1 min-w-0 truncate hover:bg-[#0e7c65] transition leading-none">Request</button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const personToRemind = detail.debtor;
                                                                                        setSelectedReminderMember({
                                                                                            username: personToRemind.username,
                                                                                            amount: detail.amount,
                                                                                            email: personToRemind.email
                                                                                        });
                                                                                        setReminderEmailBody(`Hi ${personToRemind.username}! 👋\n\nThis is a friendly reminder from ${user.username} — you have an outstanding balance of ${currSym}${detail.amount.toFixed(2)} in our group "${group.name}" on Paywise.\n\nPlease settle up when you get a chance. 🙏\n\nThank you!`);
                                                                                        setShowReminderModal(true);
                                                                                    }}
                                                                                    className="bg-white border border-gray-200 text-gray-700 font-extrabold px-3 py-2 rounded-[6px] text-[14.5px] shadow-sm flex-shrink-0 hover:bg-gray-50 transition leading-none">...</button>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const personToRemind = detail.debtor;
                                                                                        setSelectedReminderMember({
                                                                                            username: personToRemind.username,
                                                                                            amount: detail.amount,
                                                                                            email: personToRemind.email
                                                                                        });
                                                                                        setReminderEmailBody(`Hi ${personToRemind.username}! 👋\n\nThis is a friendly reminder from ${user.username} — you have an outstanding balance of ${currSym}${detail.amount.toFixed(2)} in our group "${group.name}" on Paywise.\n\nPlease settle up when you get a chance. 🙏\n\nThank you!`);
                                                                                        setShowReminderModal(true);
                                                                                    }}
                                                                                    className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-[6px] text-[14.5px] shadow-sm flex-1 min-w-0 truncate hover:bg-gray-50 transition leading-none">Remind...</button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const myId = user.id || user._id;
                                                                                        const targetMember = detail.debtor._id === myId ? detail.creditor : detail.debtor;
                                                                                        const iOwe = detail.debtor._id === myId;
                                                                                        setSettleUpTarget({ member: targetMember, amount: detail.amount, iOwe });
                                                                                        setGroupSettleStep(2);
                                                                                        setGroupSettleMode(null);
                                                                                        setGroupPartialAmount('');
                                                                                        setShowGroupSettleUp(true);
                                                                                    }}
                                                                                    className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-[6px] text-[14.5px] shadow-sm flex-1 min-w-0 truncate hover:bg-gray-50 transition leading-none">Settle up</button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )
            }

            {/* Group Totals Full-Screen Modal */}
            {
                showGroupTotals && (
                    <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-center p-4 relative">
                            <button onClick={() => setShowGroupTotals(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute left-4">
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-[17px] font-medium text-gray-900 w-full text-center"></h2>
                            <button className="p-2 -mr-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute right-4">
                                <HelpCircle className="w-[22px] h-[22px]" strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-24">
                            <div className="mb-8">
                                <h1 className="text-[24px] text-gray-900 font-medium">{group?.name}</h1>
                                {monthlySpending.length > 0 ? (
                                    <p className="text-[16px] text-gray-600 mt-1">{monthlySpending[selectedMonthIndex].label} group spending</p>
                                ) : (
                                    <p className="text-[16px] text-gray-600 mt-1">No group spending</p>
                                )}
                            </div>

                            {/* Chart Area */}
                            {monthlySpending.length > 0 && (
                                <div className="w-full flex justify-center mb-10 h-[140px] relative">
                                    {/* Chart grid lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-8 pointer-events-none">
                                        <div className="w-full border-t border-dashed border-gray-200" />
                                        <div className="w-full border-t border-dashed border-gray-200" />
                                        <div className="w-full border-t border-dashed border-gray-200" />
                                    </div>

                                    <div className="flex items-end justify-center h-full gap-5 z-10 pb-8 relative pt-4">
                                        {/* Get the max spent out of all months to normalize the heights */}
                                        {(() => {
                                            const visibleMonths = monthlySpending.slice(Math.max(0, Object.values(monthlySpending).length - 3)); // show up to 3 for visual spacing just like splitwise
                                            const maxGroupSpent = Math.max(...visibleMonths.map(m => m.totalSpent || 1));

                                            return visibleMonths.map((m, idx) => {
                                                const isSelected = m.label === monthlySpending[selectedMonthIndex].label;
                                                const heightPercent = Math.max((m.totalSpent / maxGroupSpent) * 100, 5); // 5% minimum bar height

                                                return (
                                                    <div key={m.key} className="flex flex-col items-center justify-end h-full">
                                                        <div
                                                            className={`w-[32px] rounded-t-lg transition-all ${isSelected ? 'bg-[#3b93c8]' : 'bg-gray-100'}`}
                                                            style={{ height: `${heightPercent}%` }}
                                                        >
                                                            {/* user share inner bar (splitwise usually just uses total spent, we'll keep it simple) */}
                                                            {isSelected && (
                                                                <div className="w-full bg-[#1b71a2] rounded-t-lg absolute bottom-0" style={{ height: Math.max((m.userShare / (m.totalSpent || 1)) * 100, 5) + '%' }} />
                                                            )}
                                                        </div>
                                                        <span className={`text-[12px] font-bold mt-2 absolute -bottom-6 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>{m.shortMonth}</span>
                                                        {/* little accent bar */}
                                                        <div className={`w-[26px] h-2 rounded-full absolute bottom-[-10px] ${isSelected ? 'bg-[#297dae]' : 'bg-[#aab7c0]'}`} />
                                                    </div>
                                                )
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Metrics Content */}
                            {monthlySpending.length > 0 ? (
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <p className="text-[14px] text-gray-800 font-bold">Total spent</p>
                                            <HelpCircle className="w-[14px] h-[14px] text-gray-500" />
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 relative">
                                            <div className="w-[6px] h-[20px] bg-[#5ab3ed] rounded-full" />
                                            <span className="text-[36px] font-light text-[#3b93c8] leading-none">${monthlySpending[selectedMonthIndex].totalSpent.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1">
                                            <p className="text-[14px] text-gray-800 font-bold">Your share</p>
                                            <HelpCircle className="w-[14px] h-[14px] text-gray-500" />
                                        </div>
                                        <div className="flex flex-col mt-1 relative">
                                            <div className="flex items-center gap-3">
                                                <div className="w-[6px] h-[20px] bg-[#145a85] rounded-full" />
                                                <span className="text-[36px] font-light text-[#1b71a2] leading-none">${monthlySpending[selectedMonthIndex].userShare.toFixed(2)}</span>
                                            </div>
                                            <p className="text-[14px] text-gray-500 mt-2 ml-4 relative">
                                                {monthlySpending[selectedMonthIndex].totalSpent > 0 ? Math.round((monthlySpending[selectedMonthIndex].userShare / monthlySpending[selectedMonthIndex].totalSpent) * 100) : 0}% of total group spending
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-10">No spending data to display.</p>
                            )}

                            {/* Insights & Charts Section */}
                            {monthlySpending.length > 0 && monthlySpending[selectedMonthIndex].expensesList.length > 0 && (() => {
                                const curMonthExpenses = monthlySpending[selectedMonthIndex].expensesList;
                                const maxExp = curMonthExpenses.reduce((max, e) => e.amount > max.amount ? e : max, curMonthExpenses[0]);

                                const spenderMap = {};
                                curMonthExpenses.forEach(e => {
                                    const pid = e.paidBy._id || e.paidBy;
                                    spenderMap[pid] = (spenderMap[pid] || 0) + e.amount;
                                });

                                let topId = null;
                                let topAmt = 0;
                                Object.entries(spenderMap).forEach(([id, amt]) => {
                                    if (amt > topAmt) {
                                        topAmt = amt;
                                        topId = id;
                                    }
                                });

                                const topUserObj = topId ? [...(group?.members || []), ...(group?.pastMembers || [])].find(m => m._id === topId) : null;
                                const topUserName = topUserObj ? (topUserObj._id === user.id || topUserObj._id === user._id ? 'You' : formatName(topUserObj.username)) : 'Someone';

                                return (
                                    <div className="mt-10 mb-8 border-t border-gray-100 pt-8">
                                        <h3 className="text-[17px] text-gray-900 font-bold mb-4 px-1">Monthly insights</h3>

                                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                            {/* Insight Card 1 */}
                                            <div className="min-w-[160px] flex-1 bg-white border border-gray-200 rounded-[14px] p-4 shadow-sm">
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                                    <TrendingUp className="w-4 h-4 text-slate-900" />
                                                </div>
                                                <p className="text-[13px] text-gray-500 font-medium tracking-wide uppercase mb-1">Top Spender</p>
                                                <p className="text-[16px] text-gray-900 font-medium leading-tight">{topUserName}</p>
                                                <p className="text-[14px] text-gray-500 mt-0.5">${topAmt.toFixed(2)}</p>
                                            </div>

                                            {/* Insight Card 2 */}
                                            <div className="min-w-[160px] flex-1 bg-white border border-gray-200 rounded-[14px] p-4 shadow-sm">
                                                <div className="w-8 h-8 rounded-full bg-[#fde9f1] flex items-center justify-center mb-3">
                                                    <PieChart className="w-4 h-4 text-[#b63038]" />
                                                </div>
                                                <p className="text-[13px] text-gray-500 font-medium tracking-wide uppercase mb-1">Largest Expense</p>
                                                <p className="text-[16px] text-gray-900 font-medium leading-tight truncate">{maxExp.description}</p>
                                                <p className="text-[14px] text-gray-500 mt-0.5">${maxExp.amount.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Bottom Nav Footer */}
                        {monthlySpending.length > 0 && (
                            <div className="absolute bottom-6 left-0 right-0 px-5 flex items-center justify-between pointer-events-none">
                                <span className="text-[15px] font-medium text-gray-800 relative left-2 drop-shadow-sm pointer-events-auto cursor-pointer">All time</span>
                                <div className="flex items-center justify-between bg-[#f8f9fa] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-gray-100 rounded-full px-4 py-3.5 w-[240px] pointer-events-auto text-gray-800">
                                    <button
                                        onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))}
                                        className={`p-1 ${selectedMonthIndex > 0 ? 'text-gray-800 hover:bg-gray-200 rounded-full' : 'text-gray-300 pointer-events-none'}`}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-[14.5px] font-medium">{monthlySpending[selectedMonthIndex].label}</span>
                                    <button
                                        onClick={() => setSelectedMonthIndex(Math.min(monthlySpending.length - 1, selectedMonthIndex + 1))}
                                        className={`p-1 ${selectedMonthIndex < monthlySpending.length - 1 ? 'text-gray-800 hover:bg-gray-200 rounded-full' : 'text-gray-300 pointer-events-none'}`}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Export Action Sheet Modal */}
            {
                showExportOptions && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowExportOptions(false)}>
                        <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl pb-8 sm:pb-4 pt-4 px-4 flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                            <h3 className="text-center text-[18px] text-gray-900 font-bold tracking-tight mb-2">Export Group Expenses</h3>
                            <p className="text-center text-gray-500 text-[14px] mb-6 px-4">Download a copy of all the expenses for "{group?.name}".</p>

                            <div className="flex flex-col gap-3 px-2">
                                <button
                                    onClick={() => {
                                        exportExpenses(expenses, 'pdf', group?.name || 'Group', user);
                                        setShowExportOptions(false);
                                    }}
                                    className="flex items-center gap-4 py-3.5 px-4 bg-gray-50 hover:bg-gray-100 transition rounded-[14px] border border-gray-200 border-b-[2px]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[16px] text-gray-800 font-bold">PDF Document</span>
                                        <span className="text-[13px] text-gray-500 font-medium">Best for printing & sharing</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        exportExpenses(expenses, 'csv', group?.name || 'Group', user);
                                        setShowExportOptions(false);
                                    }}
                                    className="flex items-center gap-4 py-3.5 px-4 bg-gray-50 hover:bg-gray-100 transition rounded-[14px] border border-gray-200 border-b-[2px]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                        <FileSpreadsheet className="w-5 h-5 text-slate-900" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[16px] text-gray-800 font-bold">CSV Spreadsheet</span>
                                        <span className="text-[13px] text-gray-500 font-medium">Best for Excel & Numbers</span>
                                    </div>
                                </button>

                                <button onClick={() => setShowExportOptions(false)} className="mt-4 py-3 rounded-[12px] bg-white border border-gray-200 text-gray-800 font-bold hover:bg-gray-50 transition w-full text-center">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ======================================= */}
            {/* GROUP NOTE MODAL                         */}
            {/* ======================================= */}
            {
                showGroupNoteModal && (
                    <div className="fixed inset-0 bg-white z-[95] flex flex-col animate-in slide-in-from-bottom-3 duration-200">
                        <div className="flex items-center px-4 pt-6 pb-4 border-b border-gray-100 relative">
                            <button onClick={() => setShowGroupNoteModal(false)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition">
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-gray-900">
                                {groupNote ? 'Edit note' : 'Add note'}
                            </h2>
                            <button
                                onClick={async () => {
                                    const trimmed = draftGroupNote.trim();
                                    try {
                                        await api.put(`/groups/${id}/note`, { note: trimmed });
                                        setGroupNote(trimmed);
                                        setShowGroupNoteModal(false);
                                    } catch { alert('Failed to save note.'); }
                                }}
                                className="ml-auto text-slate-900 font-bold text-[16px] hover:opacity-80 transition"
                            >
                                Save
                            </button>
                        </div>
                        <div className="px-5 pt-5 pb-2">
                            <p className="text-[13px] text-gray-400 font-medium">
                                Shared note for <span className="text-gray-700 font-bold">{group?.name}</span> — visible to all group members
                            </p>
                        </div>
                        <div className="flex-1 px-5 pt-3">
                            <textarea
                                autoFocus
                                value={draftGroupNote}
                                onChange={e => setDraftGroupNote(e.target.value)}
                                placeholder={`Write a shared note for the ${group?.name} group...`}
                                className="w-full h-full min-h-[200px] resize-none outline-none text-[17px] text-gray-800 placeholder-gray-300 leading-relaxed bg-transparent"
                            />
                        </div>
                        {groupNote && (
                            <div className="px-5 pb-10">
                                <button
                                    onClick={async () => {
                                        try {
                                            await api.put(`/groups/${id}/note`, { note: '' });
                                            setGroupNote('');
                                            setDraftGroupNote('');
                                            setShowGroupNoteModal(false);
                                        } catch { alert('Failed to remove note.'); }
                                    }}
                                    className="text-rose-500 text-[14px] font-medium hover:opacity-80 transition"
                                >
                                    Remove note
                                </button>
                            </div>
                        )}
                    </div>
                )
            }

            {/* ============================================== */}
            {/* GROUP SETTLE UP MODAL                          */}
            {/* ============================================== */}
            {
                showGroupSettleUp && (() => {
                    // Build who-owes-whom list relative to the current user from pairwiseBalances
                    const myId = user.id || user._id;
                    const allMembers = [...(group?.members || []), ...(group?.pastMembers || [])];

                    const settleList = allMembers
                        .filter(m => m._id !== myId)
                        .map(m => {
                            const iOwe = (pairwiseBalances[myId]?.[m._id] || 0);
                            const theyOwe = (pairwiseBalances[m._id]?.[myId] || 0);
                            const net = theyOwe - iOwe;
                            return { member: m, amount: Math.abs(net), iOwe: net < 0 };
                        })
                        .filter(r => r.amount > 0.005);

                    const handleGroupCashSettle = async (isPartial) => {
                        if (!settleUpTarget) return;
                        const amt = isPartial ? parseFloat(groupPartialAmount) : settleUpTarget.amount;
                        if (isNaN(amt) || amt <= 0) { alert('Please enter a valid amount.'); return; }
                        if (amt > settleUpTarget.amount) { alert(`Amount cannot exceed $${settleUpTarget.amount.toFixed(2)}.`); return; }
                        setIsGroupSettling(true);
                        try {
                            const payerId = settleUpTarget.iOwe ? myId : settleUpTarget.member._id;
                            const receiverId = settleUpTarget.iOwe ? settleUpTarget.member._id : myId;
                            await api.post('/expenses', {
                                description: isPartial ? `Partial cash payment of $${amt.toFixed(2)}` : 'Cash settle up',
                                amount: amt,
                                group: id,
                                paidBy: payerId,
                                splits: [{ user: receiverId, amount: amt }]
                            });
                            setShowGroupSettleUp(false);
                            setSettleUpTarget(null);
                            fetchGroup();
                        } catch (err) {
                            alert('Failed to record settlement.');
                        } finally {
                            setIsGroupSettling(false);
                        }
                    };

                    return (
                        <div className="fixed inset-0 bg-white z-[90] flex flex-col animate-in slide-in-from-bottom-3 duration-300">
                            {/* Header */}
                            <div className="flex items-center px-4 pt-6 pb-4 border-b border-gray-100 relative">
                                <button
                                    onClick={() => {
                                        if (groupSettleStep === 3) { setGroupSettleStep(2); setGroupSettleMode(null); }
                                        else if (groupSettleStep === 2) { setGroupSettleStep(1); setSettleUpTarget(null); }
                                        else { setShowGroupSettleUp(false); }
                                    }}
                                    className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition"
                                >
                                    {groupSettleStep === 1
                                        ? <X className="w-6 h-6" />
                                        : <ChevronLeft className="w-6 h-6" />}
                                </button>
                                <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-gray-900">Settle up</h2>
                            </div>

                            {/* STEP 1 — Pick who to settle with */}
                            {groupSettleStep === 1 && (
                                <div className="flex flex-col flex-1 overflow-y-auto px-5 pt-6">
                                    <h1 className="text-[24px] font-bold text-gray-900 mb-6 leading-tight">Which balance do you<br />want to settle?</h1>

                                    {settleList.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center flex-1 text-center py-16">
                                            <CheckCircle2 className="w-14 h-14 text-slate-900 mb-4" />
                                            <p className="text-[18px] font-bold text-gray-800">All settled up!</p>
                                            <p className="text-gray-500 mt-1">You have no outstanding balances in this group.</p>
                                        </div>
                                    ) : settleList.map(row => (
                                        <button
                                            key={row.member._id}
                                            onClick={() => {
                                                setSettleUpTarget(row);
                                                setGroupSettleStep(2);
                                                setGroupSettleMode(null);
                                                setGroupPartialAmount('');
                                            }}
                                            className="flex items-center gap-4 py-4 border-b border-gray-100 w-full text-left hover:bg-gray-50 transition rounded-lg px-2 -mx-2"
                                        >
                                            <div className="w-11 h-11 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold text-lg uppercase flex-shrink-0">
                                                {row.member.username.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[16px] font-semibold text-gray-900 leading-tight">{row.member.username}</p>
                                                <p className="text-[13px] text-gray-500 truncate">{row.member.email}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-[12px] font-semibold uppercase tracking-wide ${row.iOwe ? 'text-rose-600' : 'text-emerald-500'}`}>
                                                    {row.iOwe ? 'you owe' : 'owes you'}
                                                </p>
                                                <p className={`text-[20px] font-bold leading-tight ${row.iOwe ? 'text-rose-600' : 'text-emerald-500'}`}>
                                                    ${row.amount.toFixed(2)}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* STEP 2 — Choose payment method */}
                            {groupSettleStep === 2 && settleUpTarget && (
                                <div className="flex flex-col flex-1 px-5 pt-8">
                                    <div className="bg-gray-50 rounded-2xl p-5 mb-8 flex items-center gap-4 border border-gray-100">
                                        <div className="w-12 h-12 rounded-full bg-[#e11d48] flex items-center justify-center text-white text-xl font-bold uppercase flex-shrink-0">
                                            {settleUpTarget.member.username.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[13px] text-gray-500 font-medium">Amount to settle</p>
                                            <p className="text-[22px] font-bold text-gray-900">${settleUpTarget.amount.toFixed(2)}</p>
                                            <p className="text-[13px] text-gray-500 mt-0.5">
                                                {settleUpTarget.iOwe
                                                    ? `You owe ${settleUpTarget.member.username}`
                                                    : `${settleUpTarget.member.username} owes you`}
                                            </p>
                                        </div>
                                    </div>

                                    <h3 className="text-[16px] font-bold text-gray-700 mb-4">How do you want to settle?</h3>
                                    <div className="flex flex-col gap-3">
                                        <div className="relative flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[16px] font-bold text-gray-800">Pay with Bank</p>
                                                <p className="text-[13px] text-gray-500">Direct bank transfer</p>
                                            </div>
                                            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Coming Soon</span>
                                        </div>
                                        <button
                                            onClick={() => { setGroupSettleMode('cash'); setGroupSettleStep(3); }}
                                            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-900 bg-slate-50 hover:bg-slate-200 transition text-left"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-[#d1f0e7] flex items-center justify-center">
                                                <Banknote className="w-6 h-6 text-slate-900" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[16px] font-bold text-gray-800">Pay with Cash</p>
                                                <p className="text-[13px] text-gray-500">Record a cash payment</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-900" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3 — Cash amount (full or partial) */}
                            {groupSettleStep === 3 && settleUpTarget && groupSettleMode === 'cash' && (
                                <div className="flex flex-col flex-1 px-5 pt-8">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                                            <Banknote className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-gray-900">Cash Payment</p>
                                            <p className="text-[13px] text-gray-500">with {settleUpTarget.member.username}</p>
                                        </div>
                                    </div>

                                    {/* Full settle */}
                                    <button
                                        onClick={() => handleGroupCashSettle(false)}
                                        disabled={isGroupSettling}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-900 bg-slate-50 hover:bg-slate-200 transition mb-4 disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-6 h-6 text-slate-900" />
                                            <div className="text-left">
                                                <p className="text-[15px] font-bold text-gray-800">Full settlement</p>
                                                <p className="text-[13px] text-gray-500">Pay the entire balance</p>
                                            </div>
                                        </div>
                                        <span className="text-[17px] font-bold text-slate-900">{formatCurrency(settleUpTarget.amount, user?.defaultCurrency)}</span>
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3 my-2">
                                        <div className="flex-1 h-[1px] bg-gray-200" />
                                        <span className="text-[13px] text-gray-400 font-medium">or enter a partial amount</span>
                                        <div className="flex-1 h-[1px] bg-gray-200" />
                                    </div>

                                    {/* Partial input */}
                                    <div className="mt-4">
                                        <label className="text-[14px] font-bold text-gray-600 mb-2 block">Amount to pay</label>
                                        <div className="flex items-center gap-2 border-2 border-gray-200 focus-within:border-slate-900 rounded-xl px-4 py-3 transition bg-white">
                                            <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                max={settleUpTarget.amount}
                                                placeholder={`Max ${formatCurrency(settleUpTarget.amount, user?.defaultCurrency)}`}
                                                value={groupPartialAmount}
                                                onChange={e => setGroupPartialAmount(e.target.value)}
                                                className="flex-1 outline-none text-[18px] font-bold text-gray-900 bg-transparent placeholder-gray-300"
                                            />
                                        </div>
                                        <p className="text-[12px] text-gray-400 mt-1.5 ml-1">Balance remaining: {formatCurrency(Math.abs(settleUpTarget.amount - (parseFloat(groupPartialAmount) || 0)), user?.defaultCurrency)}</p>
                                    </div>

                                    <button
                                        onClick={() => handleGroupCashSettle(true)}
                                        disabled={isGroupSettling || !groupPartialAmount || parseFloat(groupPartialAmount) <= 0}
                                        className="mt-6 w-full bg-slate-900 text-white py-4 rounded-2xl text-[16px] font-bold shadow-md hover:bg-slate-950 transition disabled:opacity-40"
                                    >
                                        {isGroupSettling ? 'Recording...' : 'Pay with Cash'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()
            }

            {/* ---------------------------------------- */}
            {/* GROUP REMINDER DRAFT MODAL                  */}
            {/* ---------------------------------------- */}
            {
                showReminderModal && selectedReminderMember && (() => {
                    const m = selectedReminderMember;
                    const absAmt = m.amount.toFixed(2);

                    const shareText = `Hi ${m.username}! 👋\n\nThis is a friendly reminder from ${user.username} — you have an outstanding balance of ${currSym}${absAmt} in our group "${group.name}" on Paywise.\n\nPlease settle up when you get a chance. You can pay directly in the Paywise app. 🙏\n\nThank you!`;

                    const handleEmailSend = () => {
                        const subject = encodeURIComponent(`Payment Reminder — ${group.name}`);
                        const body = encodeURIComponent(reminderEmailBody);
                        const to = encodeURIComponent(m.email || '');
                        window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
                        setShowReminderModal(false);
                    };

                    const handleShare = async () => {
                        if (navigator.share) {
                            try {
                                await navigator.share({
                                    title: `Payment Reminder for ${group.name}`,
                                    text: shareText,
                                });
                            } catch { /* user cancelled share */ }
                        } else {
                            await navigator.clipboard.writeText(shareText);
                            alert('Message copied to clipboard! Paste it wherever you want to share.');
                        }
                        setShowReminderModal(false);
                    };

                    return (
                        <div className="fixed inset-0 bg-black/50 z-[96] flex flex-col justify-end" onClick={() => setShowReminderModal(false)}>
                            <div
                                className="bg-white rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgb(0,0,0,0.12)]"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center px-5 pt-5 pb-4 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-[18px] font-bold text-gray-900">Send a Reminder</h3>
                                        <p className="text-[13px] text-gray-400 mt-0.5">
                                            {m.username} owes you {currSym}{absAmt} in {group.name}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowReminderModal(false)} className="ml-auto p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="px-5 py-4 pb-6 space-y-4">

                                    {/* ── Option 1: Email ─────────────────── */}
                                    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-bold text-gray-800">Email Reminder</p>
                                                <p className="text-[12px] text-gray-400 truncate">Sent from your email to {m.email}</p>
                                            </div>
                                        </div>
                                        {/* Editable email body */}
                                        <div className="px-4 pt-3 pb-2">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Edit message before sending</p>
                                            <textarea
                                                value={reminderEmailBody}
                                                onChange={e => setReminderEmailBody(e.target.value)}
                                                rows={7}
                                                className="w-full text-[14px] text-gray-700 leading-relaxed resize-none outline-none bg-transparent"
                                            />
                                        </div>
                                        <div className="px-4 pb-3">
                                            <button
                                                onClick={handleEmailSend}
                                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition text-[15px] flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Open Email App &amp; Send
                                            </button>
                                            <p className="text-[11px] text-gray-400 text-center mt-2">This will open your email app — the email goes from your address, not Paywise</p>
                                        </div>
                                    </div>

                                    {/* ── Option 2: Share ─────────────────── */}
                                    <button
                                        onClick={handleShare}
                                        className="w-full flex items-center gap-4 bg-slate-50 border-2 border-[#d1f0e7] hover:bg-[#e6f7f3] rounded-2xl px-4 py-4 transition text-left"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[15px] font-bold text-gray-800">Share via WhatsApp, SMS &amp; more</p>
                                            <p className="text-[12px] text-gray-500 mt-0.5">Send a professional payment request through any app</p>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                </div>
                            </div>
                        </div>
                    );
                })()
            }
        </div >
    );
}
