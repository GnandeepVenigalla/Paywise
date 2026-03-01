import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Edit2, Trash2, X, Receipt, Camera, Settings, ChevronLeft, ChevronRight, HelpCircle, TrendingUp, PieChart, Download, FileText, FileSpreadsheet, Banknote, Building2, DollarSign, CheckCircle2, Folder } from 'lucide-react';
import { exportExpenses } from '../utils/exportUtils';
import logoImg from '../assets/logo.png';
import { useAppSettings } from '../hooks/useAppSettings';
import ExpenseItem from '../components/UI/ExpenseItem';
import { useMonthlySpending } from '../hooks/useMonthlySpending';
import { formatMonthYear, formatDay, formatShortMonth, formatCurrency, CURRENCY_SYMBOLS } from '../utils/formatters';
import { calculateSplitsFromItems, normalizeItemsForSave, getUserExpenseSplit, toggleItemAssignment } from '../utils/expenseUtils';

export default function FriendDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user } = useContext(AuthContext);
    const currSym = CURRENCY_SYMBOLS[user?.defaultCurrency || 'USD'] || '$';
    const { hideBalance } = useAppSettings();
    const [friend, setFriend] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [balance, setBalance] = useState(0);

    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isEditingExpense, setIsEditingExpense] = useState(false);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editItems, setEditItems] = useState([]);
    const [selectedMemberIdsForEdit, setSelectedMemberIdsForEdit] = useState([]);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const location = useLocation();
    const [showSettings, setShowSettings] = useState(location.state?.openSettings || false);
    const [showFriendTotals, setShowFriendTotals] = useState(false);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
    const [showExportOptions, setShowExportOptions] = useState(false);
    const [showSettleUp, setShowSettleUp] = useState(false);
    const [settleMode, setSettleMode] = useState(null); // null | 'cash' | 'bank'
    const [cashStep, setCashStep] = useState(1); // 1=method picker, 2=cash amount
    const [partialAmount, setPartialAmount] = useState('');
    const [isSettling, setIsSettling] = useState(false);
    const [friendNote, setFriendNote] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [draftNote, setDraftNote] = useState('');
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderEmailBody, setReminderEmailBody] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('Spam');
    const [reportDetails, setReportDetails] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);

    // Extract monthly spending aggregation logic to custom hook
    const monthlySpending = useMonthlySpending(expenses, user);

    useEffect(() => {
        if (monthlySpending.length > 0) {
            setSelectedMonthIndex(monthlySpending.length - 1);
        }
    }, [monthlySpending]);

    const fetchFriendDetails = async () => {
        try {
            const res = await api.get(`/expenses/friends/${id}`);
            setFriend(res.data.friend);
            setExpenses(res.data.expenses);
            setBalance(res.data.balance);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBlockUser = async () => {
        if (!window.confirm(`Are you sure you want to block ${friend?.username}? This will remove them from your friends list and prevent further interaction.`)) return;
        setIsBlocking(true);
        try {
            await api.post(`/auth/friends/block/${id}`);
            navigate('/friends');
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to block user.');
        } finally {
            setIsBlocking(false);
        }
    };

    const handleReportUser = async () => {
        setIsReporting(true);
        try {
            await api.post(`/auth/friends/report/${id}`, { reason: reportReason, details: reportDetails });
            alert('Thank you for reporting. We have received your submission and will review it shortly.');
            setShowReportModal(false);
            setReportDetails('');
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to submit report.');
        } finally {
            setIsReporting(false);
        }
    };

    useEffect(() => {
        fetchFriendDetails();
        // Load the shared friend note from backend
        api.get(`/auth/friend-note/${id}`).then(res => setFriendNote(res.data.note || '')).catch(() => { });
    }, [id]);

    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        setIsSavingEdit(true);

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
            fetchFriendDetails();
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

        const members = [
            { _id: user.id || user._id, username: 'You' },
            { _id: friend._id, username: friend.username }
        ];

        setEditItems(prev => toggleItemAssignment(prev, itemId, selectedMemberIdsForEdit, members));
    };

    const toggleEditMemberSelection = (memberId) => {
        setSelectedMemberIdsForEdit(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const deleteExpense = async (expenseId, description) => {
        if (window.confirm(`Are you sure you want to delete "${description}"? This will recalculate your balance with ${friend?.username}.`)) {
            try {
                await api.delete(`/expenses/${expenseId}`);
                fetchFriendDetails();
            } catch (err) {
                alert('Failed to delete expense: ' + (err.response?.data?.msg || err.message));
            }
        }
    };

    const openSettleUp = () => {
        if (balance === 0) {
            alert("You and " + friend.username + " are already settled up!");
            return;
        }
        setSettleMode(null);
        setCashStep(1);
        setPartialAmount('');
        setShowSettleUp(true);
    };

    const handleCashSettle = async (isPartial) => {
        const amt = isPartial ? parseFloat(partialAmount) : Math.abs(balance);
        if (isNaN(amt) || amt <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        if (amt > Math.abs(balance)) {
            alert(`Amount cannot exceed ${formatCurrency(Math.abs(balance), user?.defaultCurrency)}.`);
            return;
        }
        setIsSettling(true);
        try {
            await api.post('/expenses', {
                description: isPartial ? `Partial cash payment of ${formatCurrency(amt, user?.defaultCurrency)}` : 'Cash settle up',
                amount: amt,
                group: null,
                paidBy: balance > 0 ? friend._id : (user.id || user._id),
                splits: [{
                    user: balance > 0 ? (user.id || user._id) : friend._id,
                    amount: amt
                }]
            });
            setShowSettleUp(false);
            fetchFriendDetails();
        } catch (err) {
            alert('Failed to record settlement.');
        } finally {
            setIsSettling(false);
        }
    };

    if (!friend) {
        return (
            <div className="fixed inset-0 bg-[#1e293b] flex flex-col items-center justify-center z-[100]">
                <div className="w-[110px] h-[110px] animate-pulse">
                    <img src={logoImg} alt="Paywise Logo" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
            </div>
        );
    }

    const displayItems = [...expenses].map(exp => ({
        ...exp,
        isGroupSummary: false
    }));
    displayItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate group balances safely for the settings page
    const groupBalances = {};
    if (Array.isArray(expenses)) {
        expenses.forEach(exp => {
            if (exp && exp.group) {
                const gid = (exp.group._id || exp.group.id || exp.group || 'none').toString();
                if (!groupBalances[gid]) {
                    groupBalances[gid] = {
                        _id: 'group-' + gid,
                        group: exp.group,
                        balance: 0
                    };
                }
                const isPaidByMe = exp.paidBy?._id === user.id || exp.paidBy?._id === user._id || exp.paidBy === user.id;
                if (isPaidByMe) {
                    const fSplit = (exp.splits || []).find(s => s?.user?._id === friend?._id || s?.user?._id === friend?.id || s?.user === friend?._id || s?.user === friend?.id);
                    if (fSplit) groupBalances[gid].balance += fSplit.amount;
                } else if (exp.paidBy?._id === friend?._id || exp.paidBy?._id === friend?.id || exp.paidBy === friend?._id || exp.paidBy === friend?.id) {
                    const mySplit = (exp.splits || []).find(s => s?.user?._id === user.id || s?.user?._id === user._id || s?.user === user.id || s?.user === user._id);
                    if (mySplit) groupBalances[gid].balance -= mySplit.amount;
                }
            }
        });
    }

    return (
        <div className="min-h-screen bg-white font-sans pb-24">
            {/* Header - Splitwise Style Top Dark Header */}
            <header className="bg-slate-950 text-white pt-6 pb-6 px-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full bg-white/20 hover:bg-white/30 transition shadow-sm">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button onClick={() => setShowSettings(true)} className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/40 text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm cursor-pointer hover:bg-white/30 transition">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="mt-4 mb-2">
                    <h1 className="text-3xl font-black tracking-tight leading-none text-white">{friend.username}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-black/30 text-white text-xs font-bold px-2.5 py-1 rounded-full">{friend.email}</span>
                        <button
                            onClick={() => { setDraftNote(friendNote); setShowNoteModal(true); }}
                            className="bg-black/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-white/20 shadow-sm hover:bg-black/30 max-w-[200px] truncate"
                        >
                            <Edit2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{friendNote ? friendNote : 'Add friend notes...'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="bg-white max-w-lg mx-auto">
                <div className="px-4 py-5 shadow-[0_4px_10px_rgb(0,0,0,0.03)] border-b border-gray-100 mb-2">
                    <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Current Standing</span>
                            {balance !== 0 ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-500">
                                        {balance > 0 ? 'owes you' : 'you owe'}
                                    </span>
                                    <span className={`text-2xl font-black tracking-tight ${balance > 0 ? 'text-emerald-500' : 'text-rose-500'} ${hideBalance ? 'privacy-blur' : ''}`}>
                                        {balance > 0 ? '+' : '-'}{formatCurrency(balance, user?.defaultCurrency)}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-lg font-bold text-gray-700">Settled Up</span>
                            )}
                        </div>

                        {/* Breakdown */}
                        {balance !== 0 && (
                            <div className="space-y-1.5 pt-1">
                                {(() => {
                                    const breakdowns = {}; // { groupId/null: { name, balance } }
                                    (expenses || []).forEach(exp => {
                                        if (!exp) return;
                                        const isPaidByMe = exp.paidBy?._id === user.id || exp.paidBy?._id === user._id || exp.paidBy === user.id;
                                        let b = 0;
                                        if (isPaidByMe) {
                                            const fSplit = (exp.splits || []).find(s => s?.user?._id === friend?._id || s?.user?._id === friend?.id || s?.user === friend?._id || s?.user === friend?.id);
                                            if (fSplit) b = fSplit.amount;
                                        } else if (exp.paidBy?._id === friend?._id || exp.paidBy?._id === friend?.id || exp.paidBy === friend?._id || exp.paidBy === friend?.id) {
                                            const mySplit = (exp.splits || []).find(s => s?.user?._id === user.id || s?.user?._id === user._id || s?.user === user.id || s?.user === user._id);
                                            if (mySplit) b = -mySplit.amount;
                                        }

                                        if (b !== 0) {
                                            const gid = (exp.group?._id || exp.group || 'none').toString();
                                            if (!breakdowns[gid]) breakdowns[gid] = { name: exp.group?.name || (typeof exp.group === 'string' ? "Shared Group" : "non-group expenses"), balance: 0 };
                                            breakdowns[gid].balance += b;
                                        }
                                    });

                                    return Object.values(breakdowns).filter(item => Math.abs(item.balance) > 0.01).map((item, idx) => (
                                        <p key={idx} className="text-[13.5px] text-gray-600 flex justify-between items-center">
                                            <span>{(friend?.username || 'Friend').split(' ')[0]} {item.balance > 0 ? 'owes you' : 'you owe'} in {item.name === 'non-group expenses' ? item.name : `"${item.name}"`}</span>
                                            <span className={`font-bold ${item.balance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatCurrency(item.balance, user?.defaultCurrency)}
                                            </span>
                                        </p>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide items-center">
                        <button onClick={openSettleUp} className="bg-[#e11d48] text-white px-5 py-2 rounded-lg hover:bg-[#be123c] font-bold shadow-sm whitespace-nowrap transition">
                            Settle up
                        </button>
                        <button
                            onClick={() => {
                                if (!friend) return;
                                // Build a professional pre-filled email draft
                                const absAmt = Math.abs(balance).toFixed(2);
                                const draft = balance > 0
                                    ? `Hi ${friend.username},\n\nI hope you're doing well! I just wanted to send a quick, friendly reminder that you have an outstanding balance of ${currSym}${absAmt} on Paywise.\n\nWhenever you get a chance, please settle up — you can do it directly in the app.\n\nThanks so much! 😊\n\n${user.username}`
                                    : `Hi ${friend.username},\n\nJust a heads-up — I have a balance of ${currSym}${absAmt} that I owe you on Paywise. I'll take care of it soon!\n\nThanks,\n${user.username}`;
                                setReminderEmailBody(draft);
                                setShowReminderModal(true);
                            }}
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold shadow-sm whitespace-nowrap hover:bg-gray-50 transition"
                        >
                            Reminders
                        </button>
                        <button onClick={() => setShowFriendTotals(true)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold shadow-sm whitespace-nowrap hover:bg-gray-50 transition">
                            Totals
                        </button>
                        <button onClick={() => setShowExportOptions(true)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold shadow-sm whitespace-nowrap hover:bg-gray-50 transition flex items-center gap-1.5">
                            Export
                        </button>
                    </div>
                </div>

                <div className="px-5 pb-8">
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

                                    const isPaidByMe = item.paidBy?._id === user.id || item.paidBy?._id === user._id || item.paidBy === user.id;
                                    const userSplit = getUserExpenseSplit(item, user, friend?._id || friend);

                                    return (
                                        <div key={item._id || Math.random()}>
                                            {showHeader && (
                                                <div className="px-5 py-3 bg-gray-50/50 backdrop-blur-sm sticky top-[72px] z-10 border-b border-gray-100/50">
                                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{monthYear}</span>
                                                </div>
                                            )}
                                            <ExpenseItem
                                                description={item.isGroupSummary ? `Group Action: ${item.group.name}` : item.description}
                                                amount={item.amount || Math.abs(item.balance)}
                                                date={item.date}
                                                payerName={item.isGroupSummary ? 'Multiple' : (isPaidByMe ? 'You' : (item.paidBy?.username || friend.username))}
                                                userSplit={userSplit}
                                                targetCurrency={user?.defaultCurrency || 'USD'}
                                                sourceCurrency={item.currency || 'USD'}
                                                isGroup={!!item.group}
                                                groupName={item.group?.name}
                                                onClick={() => {
                                                    if (item.isGroupSummary) {
                                                        const groupUrl = `#/group/${item.group.id}`;
                                                        window.location.href = groupUrl;
                                                    } else {
                                                        setSelectedExpense(item);
                                                        setIsEditingExpense(false);
                                                        setEditDescription(item.description);
                                                        setEditAmount(item.amount.toString());
                                                        setEditItems(item.items || []);
                                                        setSelectedMemberIdsForEdit([user.id]);
                                                        setShowExpenseModal(true);
                                                    }
                                                }}
                                            />
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>
            </main>

            {/* Custom Green Floating Action Button */}
            <div className="fixed bottom-6 right-5">
                <Link
                    to={`/friend/${id}/add`}
                    className="bg-slate-900 text-white rounded-md shadow-lg px-4 py-2.5 flex items-center justify-center gap-2 font-bold hover:bg-slate-950 transition transform hover:scale-105"
                >
                    <Receipt className="w-5 h-5" />
                    Add expense
                </Link>
            </div>

            {/* Camera Scan Optional Button Bottom Left */}
            <div className="fixed bottom-6 left-5">
                <Link
                    to={`/friend/${id}/scan`}
                    className="bg-white text-gray-600 rounded-full shadow-lg p-3 flex items-center justify-center font-bold hover:bg-gray-50 border border-gray-100 transition transform hover:scale-105"
                >
                    <Camera className="w-5 h-5" />
                </Link>
            </div>

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
                                        <button onClick={() => setIsEditingExpense(true)} className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition">
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={() => { setSelectedExpense(null); setIsEditingExpense(false); }} className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition">
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
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">Changing the total amount will instantly update and mathematically recalculate the splits.</p>

                                        {editItems.length > 0 && (
                                            <div className="space-y-4 pt-2 border-t border-gray-100 mt-4">
                                                <h4 className="text-sm font-bold text-gray-700">Edit Item Assignments</h4>

                                                {/* Member selection pills for editing */}
                                                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                                                    {[
                                                        { _id: user.id || user._id, username: 'Me' },
                                                        { _id: friend._id, username: friend.username }
                                                    ].map(member => {
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
                                                                {member.username}
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
                                                                                    {(u._id === (user.id || user._id) || u === (user.id || user._id)) ? 'Me' : friend.username}
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
                                            <div className={`w-16 h-16 ${selectedExpense.group ? 'bg-slate-50 text-slate-900' : 'bg-slate-50 text-slate-900'} rounded-2xl flex items-center justify-center font-bold mx-auto mb-3 shadow-inner`}>
                                                {selectedExpense.group ? <Folder className="w-8 h-8" /> : <Receipt className="w-8 h-8" />}
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 break-all leading-tight">{selectedExpense.description}</h3>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">{formatCurrency(selectedExpense.amount, user?.defaultCurrency, selectedExpense.currency)}</p>
                                            <p className="text-sm text-gray-500 font-medium mt-1">Paid by {selectedExpense.paidBy._id === user.id ? 'You' : selectedExpense.paidBy.username}</p>
                                            {selectedExpense.addedBy && selectedExpense.addedBy._id !== selectedExpense.paidBy._id && (
                                                <p className="text-[11px] text-gray-400 font-medium italic mt-0.5">Added by {selectedExpense.addedBy._id === user.id ? 'you' : selectedExpense.addedBy.username}</p>
                                            )}
                                            {selectedExpense.group && <p className="text-xs font-bold text-slate-800 mt-1 uppercase tracking-wider">Group: {selectedExpense.group.name}</p>}
                                            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-h-48 overflow-y-auto">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Split Details</h4>
                                            <div className="space-y-2">
                                                {selectedExpense.splits.map(split => (
                                                    <div key={split.user._id || split.user} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                                                        <span className="font-semibold text-gray-700 text-sm">
                                                            {split.user._id === user.id ? 'You' : (split.user.username || friend.username)}
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

            {/* Friend Settings Full-Screen Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center p-4 border-b border-gray-100">
                        <button onClick={() => setShowSettings(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition">
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-medium text-gray-900 ml-4">Friend settings</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-10">
                        {/* Profile Info */}
                        <div className="p-6 flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center text-3xl font-black uppercase shadow-sm">
                                {friend.username?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-gray-900 leading-tight">{friend.username}</h3>
                                <p className="text-[15px] text-gray-500 mt-0.5">{friend.email}</p>
                            </div>
                        </div>

                        {/* Manage Relationship section */}
                        <div className="mt-4">
                            <h4 className="px-6 py-2 text-[15px] font-bold text-gray-800">Manage relationship</h4>
                            <div className="flex flex-col mt-2">
                                <button
                                    onClick={async () => {
                                        if (!window.confirm(`Remove ${friend?.username} from your friends list?`)) return;
                                        try {
                                            await api.delete(`/auth/friends/${id}`);
                                            navigate('/friends');
                                        } catch (err) {
                                            alert(err.response?.data?.msg || 'Failed to remove friend.');
                                        }
                                    }}
                                    className="px-6 py-4 text-left text-[16px] text-rose-600 font-medium hover:bg-rose-50 border-t border-b border-gray-100 transition w-full"
                                >
                                    Remove from friends list
                                </button>
                                <button
                                    onClick={handleBlockUser}
                                    className="px-6 py-4 text-left hover:bg-gray-50 border-b border-gray-100 transition disabled:opacity-50"
                                    disabled={isBlocking}
                                >
                                    <h5 className="text-[16px] text-gray-800">{isBlocking ? 'Blocking...' : 'Block user'}</h5>
                                    <p className="text-[14px] text-gray-500 leading-snug mt-1 max-w-[95%]">Remove this user from your friends list, hide any groups you share, and suppress future expenses/notifications from them.</p>
                                </button>
                                <button onClick={() => setShowReportModal(true)} className="px-6 py-4 text-left hover:bg-gray-50 border-b border-gray-100 transition">
                                    <h5 className="text-[16px] text-gray-800">Report user</h5>
                                    <p className="text-[14px] text-gray-500 leading-snug mt-1">Flag an abusive, suspicious, or spam account.</p>
                                </button>
                            </div>
                        </div>

                        {/* Shared groups section */}
                        <div className="mt-8">
                            <h4 className="px-6 py-2 text-[15px] font-bold text-gray-800">Shared groups</h4>
                            <div className="flex flex-col mt-2">
                                {Object.values(groupBalances).length > 0 ? (
                                    Object.values(groupBalances).map(g => (
                                        <div key={g._id} onClick={() => navigate(`/group/${(g.group?._id || g.group || 'none')}`)} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer border-t border-b border-gray-100 -mt-[1px]">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-800 text-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center flex-shrink-0">
                                                    <Folder className="w-6 h-6 opacity-90" />
                                                </div>
                                                <span className="text-[16px] text-gray-800">{(g.group?.name || (typeof g.group === 'string' ? "Shared Group" : "Unnamed Group"))}</span>
                                            </div>
                                            <span className="text-gray-400 font-bold text-lg">›</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="px-6 py-4 text-sm text-gray-500 bg-gray-50 border-t border-b border-gray-100 w-full mb-8">You and {friend?.username || 'this friend'} share no groups.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Friend Totals Full-Screen Modal */}
            {showFriendTotals && (
                <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center p-4 relative border-b border-gray-100">
                        <button onClick={() => setShowFriendTotals(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute left-4 z-10">
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-[17px] font-medium text-gray-900 w-full text-center">Charts</h2>
                        <button className="p-2 -mr-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute right-4">
                            <HelpCircle className="w-[22px] h-[22px]" strokeWidth={1.5} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24">
                        <div className="mb-8">
                            <h1 className="text-[24px] text-gray-900 font-medium">You & {friend?.username}</h1>
                            {monthlySpending.length > 0 ? (
                                <p className="text-[16px] text-gray-600 mt-1">{monthlySpending[selectedMonthIndex].label} spending</p>
                            ) : (
                                <p className="text-[16px] text-gray-600 mt-1">No spending</p>
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
                                        const visibleMonths = monthlySpending.slice(Math.max(0, Object.values(monthlySpending).length - 3));
                                        const maxGroupSpent = Math.max(...visibleMonths.map(m => m.totalSpent || 1));

                                        return visibleMonths.map((m, idx) => {
                                            const isSelected = m.label === monthlySpending[selectedMonthIndex].label;
                                            const heightPercent = Math.max((m.totalSpent / maxGroupSpent) * 100, 5);

                                            return (
                                                <div key={m.key} className="flex flex-col items-center justify-end h-full">
                                                    <div
                                                        className={`w-[32px] rounded-t-lg transition-all ${isSelected ? 'bg-[#3b93c8]' : 'bg-gray-100'}`}
                                                        style={{ height: `${heightPercent}%` }}
                                                    >
                                                        {isSelected && (
                                                            <div className="w-full bg-[#1b71a2] rounded-t-lg absolute bottom-0" style={{ height: Math.max((m.userShare / (m.totalSpent || 1)) * 100, 5) + '%' }} />
                                                        )}
                                                    </div>
                                                    <span className={`text-[12px] font-bold mt-2 absolute -bottom-6 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>{m.shortMonth}</span>
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
                                        <span className="text-[36px] font-light text-[#3b93c8] leading-none">{formatCurrency(monthlySpending[selectedMonthIndex].totalSpent, user?.defaultCurrency)}</span>
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
                                            <span className="text-[36px] font-light text-[#1b71a2] leading-none">{formatCurrency(monthlySpending[selectedMonthIndex].userShare, user?.defaultCurrency)}</span>
                                        </div>
                                        <p className="text-[14px] text-gray-500 mt-2 ml-4 relative">
                                            {monthlySpending[selectedMonthIndex].totalSpent > 0 ? Math.round((monthlySpending[selectedMonthIndex].userShare / monthlySpending[selectedMonthIndex].totalSpent) * 100) : 0}% of all shared expenses
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-10">No 1-on-1 spending data to display.</p>
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

                            let topAmt = 0;
                            Object.entries(spenderMap).forEach(([id, amt]) => {
                                if (amt > topAmt) {
                                    topAmt = amt;
                                }
                            });

                            const myAmt = spenderMap[user.id] || spenderMap[user._id] || 0;
                            const friendAmt = (spenderMap[friend._id] || 0) + (spenderMap[friend.id] || 0);

                            const topPayerString = myAmt >= friendAmt ? 'You' : friend.username;

                            return (
                                <div className="mt-10 mb-8 border-t border-gray-100 pt-8">
                                    <h3 className="text-[17px] text-gray-900 font-bold mb-4 px-1">Monthly insights</h3>

                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {/* Insight Card 1 */}
                                        <div className="min-w-[160px] flex-1 bg-white border border-gray-200 rounded-[14px] p-4 shadow-sm">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                                <TrendingUp className="w-4 h-4 text-slate-900" />
                                            </div>
                                            <p className="text-[13px] text-gray-500 font-medium tracking-wide uppercase mb-1">Top Payer</p>
                                            <p className="text-[16px] text-gray-900 font-medium leading-tight">{topPayerString}</p>
                                            <p className="text-[14px] text-gray-500 mt-0.5">{formatCurrency(topAmt, user?.defaultCurrency)}</p>
                                        </div>

                                        {/* Insight Card 2 */}
                                        <div className="min-w-[160px] flex-1 bg-white border border-gray-200 rounded-[14px] p-4 shadow-sm">
                                            <div className="w-8 h-8 rounded-full bg-[#fde9f1] flex items-center justify-center mb-3">
                                                <PieChart className="w-4 h-4 text-[#b63038]" />
                                            </div>
                                            <p className="text-[13px] text-gray-500 font-medium tracking-wide uppercase mb-1">Largest Expense</p>
                                            <p className="text-[16px] text-gray-900 font-medium leading-tight truncate">{maxExp.description}</p>
                                            <p className="text-[14px] text-gray-500 mt-0.5">{formatCurrency(maxExp.amount, user?.defaultCurrency, maxExp.currency)}</p>
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
            )}

            {/* Export Action Sheet Modal */}
            {showExportOptions && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowExportOptions(false)}>
                    <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl pb-8 sm:pb-4 pt-4 px-4 flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                        <h3 className="text-center text-[18px] text-gray-900 font-bold tracking-tight mb-2">Export Shared Expenses</h3>
                        <p className="text-center text-gray-500 text-[14px] mb-6 px-4">Download a copy of all the expenses with {friend?.username}.</p>

                        <div className="flex flex-col gap-3 px-2">
                            <button
                                onClick={() => {
                                    exportExpenses(expenses, 'pdf', `You and ${friend?.username}`, user);
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
                                    exportExpenses(expenses, 'csv', `You and ${friend?.username}`, user);
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
            )}

            {/* ======================================= */}
            {/* FRIEND NOTE MODAL                        */}
            {/* ======================================= */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-white z-[95] flex flex-col animate-in slide-in-from-bottom-3 duration-200">
                    <div className="flex items-center px-4 pt-6 pb-4 border-b border-gray-100 relative">
                        <button onClick={() => setShowNoteModal(false)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition">
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-gray-900">
                            {friendNote ? 'Edit note' : 'Add note'}
                        </h2>
                        <button
                            onClick={async () => {
                                const trimmed = draftNote.trim();
                                try {
                                    await api.put(`/auth/friend-note/${id}`, { note: trimmed });
                                    setFriendNote(trimmed);
                                    setShowNoteModal(false);
                                } catch { alert('Failed to save note.'); }
                            }}
                            className="ml-auto text-slate-900 font-bold text-[16px] hover:opacity-80 transition"
                        >
                            Save
                        </button>
                    </div>
                    <div className="px-5 pt-5 pb-2">
                        <p className="text-[13px] text-gray-400 font-medium">
                            Shared note with <span className="text-gray-700 font-bold">{friend?.username}</span> — visible to both of you
                        </p>
                    </div>
                    <div className="flex-1 px-5 pt-3">
                        <textarea
                            autoFocus
                            value={draftNote}
                            onChange={e => setDraftNote(e.target.value)}
                            placeholder={`Write a note visible to both you and ${friend?.username}...`}
                            className="w-full h-full min-h-[200px] resize-none outline-none text-[17px] text-gray-800 placeholder-gray-300 leading-relaxed bg-transparent"
                        />
                    </div>
                    {friendNote && (
                        <div className="px-5 pb-10">
                            <button
                                onClick={async () => {
                                    try {
                                        await api.put(`/auth/friend-note/${id}`, { note: '' });
                                        setFriendNote('');
                                        setDraftNote('');
                                        setShowNoteModal(false);
                                    } catch { alert('Failed to remove note.'); }
                                }}
                                className="text-rose-500 text-[14px] font-medium hover:opacity-80 transition"
                            >
                                Remove note
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ---------------------------------------- */}
            {/* REMINDERS MODAL                            */}
            {/* ---------------------------------------- */}
            {showReminderModal && (() => {
                const absAmt = Math.abs(balance).toFixed(2);
                const currSymR = user?.defaultCurrency === 'INR' ? '₹'
                    : user?.defaultCurrency === 'EUR' ? '€'
                        : user?.defaultCurrency === 'GBP' ? '£'
                            : '$';
                const shareText = balance > 0
                    ? `Hi ${friend?.username}! 👋\n\nThis is a friendly reminder from ${user.username} — you have an outstanding balance of ${currSymR}${absAmt} on Paywise.\n\nPlease settle up when you get a chance. You can pay directly in the Paywise app. 🙏\n\nThank you!`
                    : `Hi ${friend?.username}! 👋\n\nJust letting you know — I owe you ${currSymR}${absAmt} on Paywise and will take care of it soon!\n\nThanks for your patience,\n${user.username}`;

                const handleEmailSend = () => {
                    const subject = encodeURIComponent(`Payment Reminder — Paywise`);
                    const body = encodeURIComponent(reminderEmailBody);
                    const to = encodeURIComponent(friend?.email || '');
                    // Opens the user's native email app — email goes FROM them, not from Paywise
                    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
                    setShowReminderModal(false);
                };

                const handleShare = async () => {
                    if (navigator.share) {
                        try {
                            await navigator.share({
                                title: 'Payment Reminder from Paywise',
                                text: shareText,
                            });
                        } catch { /* user cancelled share */ }
                    } else {
                        // Fallback: copy to clipboard
                        await navigator.clipboard.writeText(shareText);
                        alert('Message copied to clipboard! Paste it wherever you want to share.');
                    }
                    setShowReminderModal(false);
                };

                return (
                    <div className="fixed inset-0 bg-black/50 z-[95] flex flex-col justify-end" onClick={() => setShowReminderModal(false)}>
                        <div
                            className="bg-white rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgb(0,0,0,0.12)]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center px-5 pt-5 pb-4 border-b border-gray-100">
                                <div>
                                    <h3 className="text-[18px] font-bold text-gray-900">Send a Reminder</h3>
                                    <p className="text-[13px] text-gray-400 mt-0.5">
                                        {balance > 0
                                            ? `${friend?.username} owes you ${currSymR}${absAmt}`
                                            : `You owe ${friend?.username} ${currSymR}${absAmt}`}
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
                                            <p className="text-[12px] text-gray-400 truncate">Sent from your email to {friend?.email}</p>
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
            })()}

            {/* ---------------------------------------- */}
            {/* SETTLE UP FULL-SCREEN MODAL               */}
            {/* ---------------------------------------- */}
            {showSettleUp && (
                <div className="fixed inset-0 bg-white z-[90] flex flex-col animate-in slide-in-from-bottom-3 duration-300">
                    {/* Header */}
                    <div className="flex items-center px-4 pt-6 pb-4 border-b border-gray-100 relative">
                        <button
                            onClick={() => {
                                if (cashStep === 2) { setCashStep(1); setSettleMode(null); }
                                else setShowSettleUp(false);
                            }}
                            className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-gray-900">Settle Up</h2>
                    </div>

                    {/* Step 1: Choose method */}
                    {cashStep === 1 && (
                        <div className="flex flex-col flex-1 px-5 pt-8">
                            {/* Summary */}
                            <div className="bg-gray-50 rounded-2xl p-5 mb-8 flex items-center gap-4 border border-gray-100">
                                <div className="w-12 h-12 rounded-full bg-[#e11d48] flex items-center justify-center text-white text-xl font-bold uppercase flex-shrink-0">
                                    {friend.username.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[13px] text-gray-500 font-medium">Amount to settle</p>
                                    <p className="text-[22px] font-bold text-gray-900">{formatCurrency(balance, user?.defaultCurrency)}</p>
                                    <p className="text-[13px] text-gray-500 mt-0.5">
                                        {balance < 0
                                            ? `You owe ${friend.username}`
                                            : `${friend.username} owes you`}
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-[16px] font-bold text-gray-700 mb-4">How do you want to settle?</h3>

                            <div className="flex flex-col gap-3">
                                {/* Bank option (coming soon) */}
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

                                {/* Cash option */}
                                <button
                                    onClick={() => { setSettleMode('cash'); setCashStep(2); }}
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

                    {/* Step 2: Cash — full or partial */}
                    {cashStep === 2 && settleMode === 'cash' && (
                        <div className="flex flex-col flex-1 px-5 pt-8">
                            {/* Summary */}
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                                    <Banknote className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-gray-900">Cash Payment</p>
                                    <p className="text-[13px] text-gray-500">with {friend.username}</p>
                                </div>
                            </div>

                            {/* Full settle */}
                            <button
                                onClick={() => handleCashSettle(false)}
                                disabled={isSettling}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-900 bg-slate-50 hover:bg-slate-200 transition mb-4 disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-slate-900" />
                                    <div className="text-left">
                                        <p className="text-[15px] font-bold text-gray-800">Full settlement</p>
                                        <p className="text-[13px] text-gray-500">Pay the entire balance</p>
                                    </div>
                                </div>
                                <span className="text-[17px] font-bold text-slate-900">{formatCurrency(balance, user?.defaultCurrency)}</span>
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
                                        max={Math.abs(balance)}
                                        placeholder={`Max ${formatCurrency(Math.abs(balance), user?.defaultCurrency)}`}
                                        value={partialAmount}
                                        onChange={e => setPartialAmount(e.target.value)}
                                        className="flex-1 outline-none text-[18px] font-bold text-gray-900 bg-transparent placeholder-gray-300"
                                    />
                                </div>
                                <p className="text-[12px] text-gray-400 mt-1.5 ml-1">Balance remaining: {formatCurrency(Math.abs(balance - (parseFloat(partialAmount) || 0)), user?.defaultCurrency)}</p>
                            </div>

                            <button
                                onClick={() => handleCashSettle(true)}
                                disabled={isSettling || !partialAmount || parseFloat(partialAmount) <= 0}
                                className="mt-6 w-full bg-slate-900 text-white py-4 rounded-2xl text-[16px] font-bold shadow-md hover:bg-slate-950 transition disabled:opacity-40"
                            >
                                {isSettling ? 'Recording...' : 'Pay with Cash'}
                            </button>
                        </div>
                    )}
                </div>
            )}
            {/* Report User Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] px-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Report {friend?.username}</h3>
                            <p className="text-sm text-gray-500 mb-6">Your report is confidential. We'll review this user's activity based on your feedback.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason</label>
                                    <select
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none"
                                    >
                                        <option value="Spam">Spam</option>
                                        <option value="Abusive content">Abusive content</option>
                                        <option value="Suspicious activity">Suspicious activity</option>
                                        <option value="Impersonation">Impersonation</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Additional details</label>
                                    <textarea
                                        value={reportDetails}
                                        onChange={(e) => setReportDetails(e.target.value)}
                                        placeholder="Tell us more about the issue..."
                                        rows={3}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReportUser}
                                    disabled={isReporting}
                                    className="flex-1 py-3.5 rounded-xl font-bold bg-slate-950 text-white hover:bg-slate-900 transition disabled:opacity-50"
                                >
                                    {isReporting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
