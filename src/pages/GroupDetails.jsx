import { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import Toggle from '../components/UI/Toggle';
import { exportExpenses } from '../utils/exportUtils';
import logoImg from '../assets/logo.png';
import { useAppSettings } from '../hooks/useAppSettings';
import { useMonthlySpending } from '../hooks/useMonthlySpending';
import ExpenseItem from '../components/UI/ExpenseItem';
import { formatMonthYear, formatDay, formatShortMonth, formatCurrency, CURRENCY_SYMBOLS, convertAmount } from '../utils/formatters';
import { X, HelpCircle, TrendingUp, PieChart, ChevronLeft, ChevronRight, FileSpreadsheet, Building2, Banknote, CheckCircle2, DollarSign, FileText } from 'lucide-react';
import { calculateSplitsFromItems, normalizeItemsForSave, getUserExpenseSplit, toggleItemAssignment } from '../utils/expenseUtils';
export default function GroupDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { api, user } = useContext(AuthContext);
    const { hideBalance } = useAppSettings();
    const [group, setGroup] = useState(null);
    const displayCurrency = group?.currency || user?.defaultCurrency || 'USD';
    const currSym = CURRENCY_SYMBOLS[displayCurrency] || '$';
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState({});
    const [emailToInvite, setEmailToInvite] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [searchingMember, setSearchingMember] = useState(false);
    const [foundSearchUser, setFoundSearchUser] = useState(null);
    const [searchAttempted, setSearchAttempted] = useState(false);


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
    const [draftGroupCurrency, setDraftGroupCurrency] = useState('');
    const [showInviteLink, setShowInviteLink] = useState(false);
    const [showGroupBalances, setShowGroupBalances] = useState(false);
    const [expandedBalances, setExpandedBalances] = useState({});
    const [showGroupTotals, setShowGroupTotals] = useState(false);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
    const [loanInterestEnabled, setLoanInterestEnabled] = useState(false);
    const [loanInterestRate, setLoanInterestRate] = useState(0);
    const [isSavingLoanSettings, setIsSavingLoanSettings] = useState(false);

    const groupImageInputRef = useRef(null);
    const [isUploadingGroupImage, setIsUploadingGroupImage] = useState(false);

    const handleGroupImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !group) return;

        const formData = new FormData();
        formData.append('image', file);
        setIsUploadingGroupImage(true);

        try {
            const res = await api.post(`/upload/group/${group._id || group.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setGroup({ ...group, image: res.data.url });
        } catch (error) {
            console.error('Group image upload failed:', error);
            alert(error.response?.data?.msg || 'Failed to upload group image.');
        } finally {
            setIsUploadingGroupImage(false);
            e.target.value = null; // reset
        }
    };
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
    const [targetExportCurrency, setTargetExportCurrency] = useState(user?.defaultCurrency || 'USD');


    // Extract monthly spending aggregation logic to custom hook
    // Pass displayCurrency so all chart amounts are in the group's display currency
    const monthlySpending = useMonthlySpending(expenses, user, displayCurrency);

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
            if (exp.amount < 0.005) return;
            const creditorId = String(exp.paidBy?._id || exp.paidBy);
            const sourceCurr = exp.currency || 'USD';
            const targetCurr = 'USD';
            exp.splits.forEach(split => {
                const debtorId = String(split.user?._id || split.user);
                if (debtorId !== creditorId && pairwise[debtorId] && pairwise[debtorId][creditorId] !== undefined) {
                    const convertedAmount = Math.round(convertAmount(split.amount, sourceCurr, targetCurr) * 100) / 100;
                    pairwise[debtorId][creditorId] += convertedAmount;
                    pairwise[debtorId][creditorId] = Math.round(pairwise[debtorId][creditorId] * 100) / 100;
                }
            });
        });

        const memberIds = allAssociatedMembers.map(m => String(m._id || m));

        if (simplifyDebts) {
            let netBalances = {};
            memberIds.forEach(id => netBalances[id] = 0);

            // Calculate exact net balance for each person
            memberIds.forEach(a => {
                memberIds.forEach(b => {
                    if (a !== b) {
                        netBalances[a] -= pairwise[a][b];
                        netBalances[b] += pairwise[a][b];
                        netBalances[a] = Math.round(netBalances[a] * 100) / 100;
                        netBalances[b] = Math.round(netBalances[b] * 100) / 100;
                    }
                });
            });

            // Reset pairwise to 0
            memberIds.forEach(a => {
                memberIds.forEach(b => {
                    if (a !== b) pairwise[a][b] = 0;
                });
            });

            let debtors = [];
            let creditors = [];

            for (const [id, balance] of Object.entries(netBalances)) {
                if (balance < -0.005) debtors.push({ id, amount: -balance });
                else if (balance > 0.005) creditors.push({ id, amount: balance });
            }

            debtors.sort((a, b) => b.amount - a.amount);
            creditors.sort((a, b) => b.amount - a.amount);

            let i = 0, j = 0;
            while (i < debtors.length && j < creditors.length) {
                const debtor = debtors[i];
                const creditor = creditors[j];
                const amount = Math.min(debtor.amount, creditor.amount);

                if (amount > 0.005) {
                    pairwise[debtor.id][creditor.id] = amount;
                }

                debtor.amount -= amount;
                creditor.amount -= amount;

                if (debtor.amount < 0.005) i++;
                if (creditor.amount < 0.005) j++;
            }
        } else {
            for (let i = 0; i < memberIds.length; i++) {
                for (let j = i + 1; j < memberIds.length; j++) {
                    const a = memberIds[i];
                    const b = memberIds[j];
                    const aOwesB = pairwise[a][b] || 0;
                    const bOwesA = pairwise[b][a] || 0;
                    if (aOwesB > bOwesA) {
                        pairwise[a][b] = Math.round((aOwesB - bOwesA) * 100) / 100;
                        pairwise[b][a] = 0;
                    } else {
                        pairwise[b][a] = Math.round((bOwesA - aOwesB) * 100) / 100;
                        pairwise[a][b] = 0;
                    }
                }
            }
        }
        return pairwise;
    }, [group, expenses, user, simplifyDebts]);

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
            await api.put(`/groups/${id}`, { name: newGroupName, currency: draftGroupCurrency || null });
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

    const handleRemoveMember = async (userId) => {
        if (Math.abs(getMemberNetBalance(userId)) > 0.01) {
            alert("You cannot remove this person until all of their debts are settled up.");
            return;
        }
        if (window.confirm('Are you sure you want to remove this member from the group?')) {
            try {
                await api.post(`/groups/${id}/remove/${userId}`);
                setSelectedMemberModal(null);
                fetchGroup();
            } catch (err) {
                alert(err.response?.data?.msg || 'Failed to remove member');
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
            console.error(err);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleSettleIndividualExpense = async (expense) => {
        try {
            // Call the dedicated settle-and-delete route.
            // Backend: verifies split membership, deletes the expense, emails + notifies the payer.
            await api.post(`/expenses/${expense._id}/settle-my-share`);
            setSelectedExpense(null);
            fetchGroup();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to settle expense.');
        }
    };
    // handleUpdateExpense is above ^
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
            setDraftGroupCurrency(res.data.group.currency || '');
            if (res.data.group.settleUpDate) {
                setSettleUpDate(res.data.group.settleUpDate.slice(0, 10));
                setDraftSettleDate(res.data.group.settleUpDate.slice(0, 10));
            }

            // Check for direct expense link from notification
            // Use location.search (populated by HashRouter correctly)
            const searchParams = new URLSearchParams(location.search);
            const expParam = searchParams.get('expenseId');
            if (expParam && res.data.expenses?.length > 0) {
                const target = (res.data.expenses || []).find(e => e._id === expParam);
                if (target) setSelectedExpense(target);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGroup();
    }, [id]);

    useEffect(() => {
        setFoundSearchUser(null);
        setSearchAttempted(false);
    }, [emailToInvite]);

    const handleSearchMember = async (e) => {
        if (e) e.preventDefault();
        if (!emailToInvite.trim()) return;
        setInviteError('');
        setSearchingMember(true);
        try {
            const res = await api.get(`/auth/users?q=${encodeURIComponent(emailToInvite.trim())}`);
            const query = emailToInvite.trim().toLowerCase();
            // Try to find an EXACT match by email or phone
            const exactMatch = res.data.find(u => 
                u.email?.toLowerCase() === query || 
                u.phone?.replace(/\D/g, '') === query.replace(/\D/g, '')
            );
            
            if (exactMatch) {
                setFoundSearchUser(exactMatch);
            } else {
                setFoundSearchUser(null);
            }
            setSearchAttempted(true);
        } catch (err) {
            setInviteError('Error searching for user.');
        } finally {
            setSearchingMember(false);
        }
    };

    const confirmAddMember = async (targetUser = null) => {
        setInviteError('');
        try {
            const isEmail = emailToInvite.includes('@');
            // Backend takes email or phone. If we found a user, we use their email/phone to add them.
            const payload = targetUser 
                ? (targetUser.email ? { email: targetUser.email } : { phone: targetUser.phone }) 
                : (isEmail ? { email: emailToInvite } : { phone: emailToInvite });
            const res = await api.post(`/groups/${id}/members`, payload);

            if (res.data.user?.isGhostUser) {
                if (res.data.user.email?.includes('ghost_phone_')) {
                    alert(`Unregistered person added to "${group.name}"! Since they only have a phone number, we couldn't send an email invite. Please share the group invite link with them manually.`);
                } else {
                    alert(`New person invited to Paywise! They've been added to "${group.name}" via email invitation.`);
                }
            } else {
                alert('User added to the group!');
            }

            setEmailToInvite('');
            setShowInvite(false);
            setFoundSearchUser(null);
            setSearchAttempted(false);
            fetchGroup();
        } catch (err) {
            setInviteError(err.response?.data?.msg || 'Error adding member');
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
            <div className="fixed inset-0 bg-emerald-700 flex flex-col items-center justify-center z-[100]">
                <div className="w-[110px] h-[110px] animate-pulse">
                    <img src={logoImg} alt="Paywise Logo" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
            </div>
        );
    }

    if (!group) return null;

    const getMemberNetBalance = (memberId) => {
        let net = 0;
        const allMembers = [...(group?.members || []), ...(group?.pastMembers || [])];
        allMembers.forEach(other => {
            const otherId = String(other._id || other);
            const mId = String(memberId);
            if (otherId === mId) return;
            const otherOwesMe = pairwiseBalances[otherId]?.[mId] || 0;
            const iOweOther = pairwiseBalances[mId]?.[otherId] || 0;
            net += otherOwesMe - iOweOther;
            net = Math.round(net * 100) / 100;
        });
        return net;
    };

    const myBalance = getMemberNetBalance(user.id || user._id);

    // Filter out interest/loan entries from the group expenses tab.
    // - parentLoan set → auto-generated interest accrual expense (belongs in Friends view)
    // - description contains "interest" → manually entered or auto interest entry
    // - isLoan: true → personal loan added to group (belongs in Friends/loan view)
    const displayItems = [...expenses]
        .filter(item =>
            !item.parentLoan &&
            !item.isLoan &&
            !(item.description?.toLowerCase().includes('interest') || item.description?.toLowerCase().includes('intrest')) &&
            item.amount >= 0.005
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const inviteLinkUrl = `${window.location.href.split('#')[0]}#/join/${id}?v=s`;
    
    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24">
            {/* Header - Matches Custom Theme automatically now */}
            <header className="relative bg-emerald-600 text-white pt-6 pb-6 shadow-sm overflow-hidden z-0">
                <div className="absolute inset-0 z-[-2] bg-gradient-to-br from-emerald-600 to-emerald-800" />
                <div className="relative px-4 z-10 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full bg-white/20 hover:bg-white/30 transition shadow-sm">
                                <i className="pi pi-arrow-left text-[1.1rem] text-white"></i>
                            </button>
                        </div>
                        <div className="flex gap-3 items-center">
                            <Link to="/ai" className="w-9 h-9 rounded-full bg-white/20 border border-white/40 text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-white/30 transition group">
                                <i className="pi pi-sparkles text-[1.1rem] group-hover:animate-pulse"></i>
                            </Link>
                            <button onClick={() => setShowSettings(true)} className="w-9 h-9 rounded-full bg-white/20 border border-white/40 text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm cursor-pointer hover:bg-white/30 transition">
                                <i className="pi pi-cog text-[1.1rem]"></i>
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
                                    <i className="pi pi-check text-[1.1rem]"></i>
                                </button>
                                <button onClick={() => setIsEditingGroupName(false)} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition drop-shadow-sm flex-shrink-0">
                                    <i className="pi pi-times text-[1.1rem]"></i>
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
                                    setDraftGroupCurrency(group.currency || '');
                                    setShowCustomizeGroup(true);
                                }}
                                className="bg-transparent text-white text-[13px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/60 hover:bg-white/10 transition"
                            >
                                <i className="pi pi-calendar text-[1rem]"></i>
                                {settleUpDate
                                    ? new Date(settleUpDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'Add settle up date'}
                            </button>
                            <button onClick={() => setShowInvite(!showInvite)} className="bg-black/30 text-white text-[13px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 hover:bg-black/40 transition">
                                <i className="pi pi-users text-[1rem]"></i> {group.members?.length || 0} people
                            </button>
                            <button
                                onClick={() => { setDraftGroupNote(groupNote); setShowGroupNoteModal(true); }}
                                className="bg-transparent text-white text-[13px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/60 hover:bg-white/10 transition mt-1 sm:mt-0 max-w-[220px] truncate"
                            >
                                <i className="pi pi-pencil text-[1rem] flex-shrink-0"></i>
                                <span className="truncate">{groupNote ? groupNote : 'Add group notes...'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="bg-white max-w-lg mx-auto">
                {/* Pending Invitation Banner */}
                {group.pendingMembers?.some(m => String(m._id || m) === String(user.id || user._id)) && (
                    <div className="bg-amber-50 border-b border-amber-200 p-5 animate-in slide-in-from-top duration-500">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <HelpCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-amber-900 text-lg">Group Invitation</h3>
                                <p className="text-amber-800 text-sm leading-snug mb-4">
                                    You've been invited to join <strong>{group.name}</strong>. Accept to start sharing expenses and tracking balances.
                                </p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await api.post(`/groups/${id}/accept`);
                                                fetchGroup();
                                            } catch (err) {
                                                alert('Failed to accept invitation');
                                            }
                                        }}
                                        className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-700 transition shadow-md active:scale-95"
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={handleLeaveGroup}
                                        className="bg-white border border-amber-200 text-amber-600 px-4 py-2 rounded-xl font-bold hover:bg-amber-100 transition active:scale-95"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Invite Members form */}
                {showInvite && (
                    <div className="bg-gray-50 p-5 shadow-inner border-b border-gray-200 animate-in fade-in zoom-in-95">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Add person to group</label>
                        <form onSubmit={handleSearchMember} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm"
                                value={emailToInvite}
                                onChange={e => setEmailToInvite(e.target.value)}
                                placeholder="Email or phone number"
                                required
                            />
                            <button 
                                type="submit" 
                                disabled={searchingMember}
                                className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                            >
                                {searchingMember ? <i className="pi pi-spin pi-spinner"></i> : 'Check'}
                            </button>
                        </form>

                        {searchAttempted && (
                            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-in slide-in-from-top-2">
                                {foundSearchUser ? (
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                                                {foundSearchUser.username.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight">{foundSearchUser.username}</p>
                                                <p className="text-xs text-gray-500">{foundSearchUser.email || foundSearchUser.phone}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => confirmAddMember(foundSearchUser)}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:translate-y-[-1px] transition"
                                        >
                                            Add to Group
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                                            <i className="pi pi-user-plus text-xl"></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">User not found</p>
                                            <p className="text-xs text-gray-500 mt-0.5">They aren't on Paywise yet. Invite them to join?</p>
                                        </div>
                                        <button 
                                            onClick={() => confirmAddMember(null)}
                                            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm transition hover:bg-slate-800"
                                        >
                                            Invite to Paywise & Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {inviteError && <p className="text-rose-500 text-xs mt-3 font-medium flex items-center gap-1"><i className="pi pi-exclamation-circle text-[10px]"></i> {inviteError}</p>}
                    </div>
                )}


                <div className="px-5 py-4 border-b border-gray-100 mb-2">
                    {group.groupType === 'community' ? (
                        /* Community Cycle Status */
                        <div className="mb-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex flex-col">
                                    <h3 className="text-[13px] font-black uppercase tracking-[0.1em] text-orange-500 mb-0.5">Community Cycle</h3>
                                    <p className="text-[20px] font-black text-gray-900 leading-tight">
                                        {group.paymentCycle?.filter(c => c.hasPaid).length || 0} of {group.members?.length || 0} members paid
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                                    <i className="pi pi-sync text-orange-500 text-xl"></i>
                                </div>
                            </div>
                            
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-5 flex shadow-inner">
                                {group.members.map((member, idx) => {
                                    const cycleInfo = group.paymentCycle?.find(c => (c.user?._id || c.user) === (member._id || member));
                                    const hasPaid = cycleInfo?.hasPaid;
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`h-full flex-1 border-r border-white last:border-0 transition-all duration-700 ${hasPaid ? 'bg-orange-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' : 'bg-gray-200'}`}
                                            title={member.username}
                                        />
                                    );
                                })}
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                {(() => {
                                    const remaining = group.members.filter(m => {
                                        const c = group.paymentCycle?.find(cp => (cp.user?._id || cp.user) === (m._id || m));
                                        return !c?.hasPaid;
                                    });

                                    if (remaining.length === 0) {
                                        return (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <i className="pi pi-check text-emerald-600 text-sm"></i>
                                                </div>
                                                <p className="text-[14px] font-bold text-gray-800">Everyone has paid! Resetting for the next trip...</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div>
                                            <p className="text-[12px] font-black uppercase tracking-wider text-gray-400 mb-2">Who's paying next?</p>
                                            <div className="flex flex-wrap gap-2">
                                                {remaining.map(m => (
                                                    <div key={m._id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-gray-700 shadow-sm transition-transform hover:scale-105">
                                                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                                                        {m.username}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        /* Overall balance summary — clean like Splitwise */
                        <>
                            <div className="mb-3">
                                {myBalance === 0 ? (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <p className="text-[17px] font-bold text-gray-700">You are all settled up</p>
                                        {expenses?.length > 0 && (
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm('Clear all expense history for this group? This cannot be undone.')) return;
                                                    try {
                                                        await api.delete(`/expenses/group/${id}/all`);
                                                        fetchGroup();
                                                    } catch (e) {
                                                        alert('Failed to clear history.');
                                                    }
                                                }}
                                                className="text-[12px] font-bold text-rose-500 border border-rose-200 bg-rose-50 px-3 py-1 rounded-full hover:bg-rose-100 transition whitespace-nowrap"
                                            >
                                                🗑 Clear history
                                            </button>
                                        )}
                                    </div>
                                ) : myBalance > 0 ? (
                                    <p className="text-[17px] font-bold text-gray-800">
                                        You are owed{' '}
                                        <span className={`text-emerald-500 ${hideBalance ? 'privacy-blur' : ''}`}>
                                            {formatCurrency(myBalance, displayCurrency)}
                                        </span>
                                        {' '}overall
                                    </p>
                                ) : (
                                    <p className="text-[17px] font-bold text-gray-800">
                                        You owe{' '}
                                        <span className={`text-rose-500 ${hideBalance ? 'privacy-blur' : ''}`}>
                                            {formatCurrency(myBalance, displayCurrency)}
                                        </span>
                                        {' '}overall
                                    </p>
                                )}

                                {/* Per-member balances */}
                                <div className="mt-1.5 space-y-0.5">
                                    {(() => {
                                        let othersBalances = [];
                                        [...(group.members || []), ...(group.pastMembers || [])].filter(m => m._id !== user.id).forEach(member => {
                                            const b = (pairwiseBalances[member._id]?.[user.id] || 0) - (pairwiseBalances[user.id]?.[member._id] || 0);
                                            if (Math.abs(b) > 0.001) othersBalances.push({ member, b });
                                        });
                                        if (othersBalances.length === 0) return null;
                                        const [first, second, ...rest] = othersBalances;
                                        return (
                                            <>
                                                {first && (
                                                    <p className="text-[14px] text-gray-500">
                                                        {first.b > 0 ? (
                                                            <>{first.member.username} owes you <span className={`font-semibold text-emerald-500 ${hideBalance ? 'privacy-blur' : ''}`}>{formatCurrency(Math.abs(first.b), displayCurrency)}</span></>
                                                        ) : (
                                                            <>You owe {first.member.username} <span className={`font-semibold text-rose-500 ${hideBalance ? 'privacy-blur' : ''}`}>{formatCurrency(Math.abs(first.b), displayCurrency)}</span></>
                                                        )}
                                                    </p>
                                                )}
                                                {second && (
                                                    <p className="text-[14px] text-gray-500">
                                                        {second.b > 0 ? (
                                                            <>{second.member.username} owes you <span className={`font-semibold text-emerald-500 ${hideBalance ? 'privacy-blur' : ''}`}>{formatCurrency(Math.abs(second.b), displayCurrency)}</span></>
                                                        ) : (
                                                            <>You owe {second.member.username} <span className={`font-semibold text-rose-500 ${hideBalance ? 'privacy-blur' : ''}`}>{formatCurrency(Math.abs(second.b), displayCurrency)}</span></>
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
                        </>
                    )}
                </div>


                <div className="px-5 pb-12">
                    {displayItems.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <i className="pi pi-receipt text-[3rem] text-gray-200 mx-auto mb-4"></i>
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

                                    const isSettleUp =
                                        item.description?.toLowerCase() === 'settle up' ||
                                        item.description?.toLowerCase() === 'cash settle up' ||
                                        item.description?.toLowerCase().startsWith('partial cash payment') ||
                                        item.description?.toLowerCase().startsWith('settle my share') ||
                                        item.description?.includes('[sid:');
                                    const isPaidByMe = (item.paidBy?._id || item.paidBy) === (user?.id || user?._id);

                                    // Render settle-up as a clean banner row, not an expense card
                                    if (isSettleUp) {
                                        const payerName = isPaidByMe ? 'You' : (item.paidBy?.username || 'Someone');
                                        const receiverSplit = item.splits?.[0];
                                        const receiverId = receiverSplit?.user?._id || receiverSplit?.user;
                                        const myId = user?.id || user?._id;
                                        const receiverName = receiverId === myId ? 'you' : (receiverSplit?.user?.username || 'someone');
                                        return (
                                            <div key={item._id || Math.random()}>
                                                {showHeader && (
                                                    <div className="px-5 py-3 bg-gray-50/50 backdrop-blur-sm sticky top-[72px] z-10 border-b border-gray-100/50">
                                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{monthYear}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-emerald-50/60">
                                                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13.5px] font-semibold text-emerald-800 leading-snug">
                                                            <span className="font-black">{payerName}</span> paid <span className="font-black">{receiverName}</span>
                                                        </p>
                                                        <p className="text-[11px] text-emerald-600 mt-0.5">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Settlement</p>
                                                    </div>
                                                    {group.groupType !== 'community' && (
                                                        <span className="text-[14px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                                                            {formatCurrency(item.amount, displayCurrency, item.currency || 'USD')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Calculate user's involvement for regular expenses
                                    let userSplit = 0;
                                    const mySplit = item.splits?.find(s => (s.user?._id || s.user) === (user.id || user._id));

                                    if (isPaidByMe) {
                                        // If I paid, userSplit is the sum of what all OTHERS owe me
                                        const othersTotal = (item.splits || []).reduce((sum, s) => {
                                            const sId = s.user?._id || s.user;
                                            if (sId !== (user.id || user._id)) sum += s.amount;
                                            return sum;
                                        }, 0);
                                        userSplit = othersTotal;
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
                                            {/* "Individually Settled" badge */}
                                            {(() => {
                                                const isIndivSettled = expenses.some(e => e.description?.includes(`[sid:${item._id}]`));
                                                if (!isIndivSettled) return null;
                                                return (
                                                    <div className="flex items-center gap-1.5 mx-5 mt-2 mb-0 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                                        </svg>
                                                        <span className="text-[11.5px] font-bold text-emerald-700 uppercase tracking-wide">Individually Settled</span>
                                                    </div>
                                                );
                                            })()}
                                            <ExpenseItem
                                                description={item.description}
                                                amount={item.amount}
                                                date={item.date}
                                                payerName={isPaidByMe ? 'You' : (item.paidBy?.username || 'Someone')}
                                                userSplit={userSplit}
                                                targetCurrency={displayCurrency || 'USD'}
                                                sourceCurrency={item.currency || 'USD'}
                                                isLoan={item.isLoan}
                                                parentLoan={item.parentLoan}
                                                billImage={item.billImage}
                                                isCommunity={group.groupType === 'community'}
                                                onClick={() => {
                                                    setSelectedExpense(item);
                                                    setIsEditingExpense(false);
                                                    setEditDescription(item.description);
                                                    setEditAmount(item.amount.toString());
                                                    setEditItems(item.items || []);
                                                    setSelectedMemberIdsForEdit([user.id]);
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
                            className="bg-emerald-600 text-white rounded-full shadow-[0_4px_10px_rgb(0,0,0,0.15)] px-5 py-3.5 flex items-center justify-center gap-2 font-bold hover:bg-emerald-700 transition transform hover:scale-105"
                        >
                            <i className="pi pi-receipt text-[1.2rem]"></i>
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
                            <i className="pi pi-camera text-[1.5rem]"></i>
                        </Link>
                    </div>
                )
            }

            <Dialog 
                visible={!!selectedExpense} 
                onHide={() => { setSelectedExpense(null); setIsEditingExpense(false); }}
                position="bottom"
                draggable={false}
                resizable={false}
                className="w-full max-w-lg rounded-t-[32px] overflow-hidden"
                contentClassName="p-0 bg-white dark:bg-slate-900 border-0"
                headerClassName="p-0 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 border-0 rounded-t-[32px]"
                header={
                    <div className="flex justify-between items-center w-full px-5 py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 line-clamp-1">
                            {isEditingExpense ? (group.groupType === 'community' ? 'Edit Turn' : 'Edit Expense') : (group.groupType === 'community' ? 'Turn Details' : 'Expense Details')}
                        </h2>
                        <div className="flex items-center gap-2">
                            {!isEditingExpense && (selectedExpense?.addedBy ? (selectedExpense.addedBy._id === user.id) : (selectedExpense?.paidBy?._id === user.id)) && (
                                <button
                                    onClick={() => setIsEditingExpense(true)}
                                    className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition"
                                >
                                    <i className="pi pi-pencil text-[1rem]"></i>
                                </button>
                            )}
                            <button
                                onClick={() => { setSelectedExpense(null); setIsEditingExpense(false); }}
                                className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition"
                            >
                                <i className="pi pi-times text-[1.2rem]"></i>
                            </button>
                        </div>
                    </div>
                }
                closable={false}
            >
                {selectedExpense && (
                <div className="p-6">
                    {isEditingExpense ? (
                        <form onSubmit={handleUpdateExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                <InputText
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    className="w-full py-3 px-4 rounded-xl border border-gray-300 outline-none shadow-sm"
                                    required
                                />
                            </div>
                            {group.groupType !== 'community' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Total Amount</label>
                                        <InputNumber
                                            value={parseFloat(editAmount)}
                                            onValueChange={(e) => setEditAmount(e.value?.toString())}
                                            mode="currency"
                                            currency={selectedExpense?.currency || 'USD'}
                                            locale="en-US"
                                            className="w-full"
                                            inputClassName="w-full py-3 px-4 rounded-xl border border-gray-300 outline-none shadow-sm font-bold"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">Changing the total amount will instantly update and mathematically recalculate all member splits based on their assigned portions.</p>
                                </>
                            )}
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
                                                        ? 'border-emerald-600 bg-emerald-600 text-white'
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
                                                    className={`p-3 flex justify-between items-center rounded-xl border-2 transition-all cursor-pointer ${isAssigned ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100'}`}
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
                                                    <span className="font-bold text-gray-900">{formatCurrency(item.price, displayCurrency, selectedExpense.currency)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSavingEdit}
                                className="w-full font-bold bg-emerald-600 text-white rounded-xl py-3.5 shadow-md hover:bg-emerald-700 transition disabled:opacity-50 mt-4"
                            >
                                {isSavingEdit ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    ) : (
                        <div>
                            <div className="text-center mb-6">
                                <div className={`w-16 h-16 ${selectedExpense.isLoan ? 'bg-amber-50 text-amber-600' : (selectedExpense.parentLoan || selectedExpense.description?.toLowerCase().includes('interest')) ? 'bg-teal-50 text-teal-500' : 'bg-emerald-50 text-emerald-600'} rounded-2xl flex items-center justify-center font-bold mx-auto mb-3 shadow-inner overflow-hidden border-2 border-white`}>
                                    {selectedExpense.billImage ? (
                                        <a href={selectedExpense.billImage} target="_blank" rel="noopener noreferrer" className="w-full h-full"> 
                                            <img src={selectedExpense.billImage} alt="Bill" className="w-full h-full object-cover" />
                                        </a>
                                    ) : (
                                        selectedExpense.isLoan ? <i className="pi pi-money-bill text-[1.5rem]"></i> : (selectedExpense.parentLoan || selectedExpense.description?.toLowerCase().includes('interest')) ? <i className="pi pi-percentage text-[1.5rem]"></i> : <i className="pi pi-receipt text-[1.5rem]"></i>
                                    )}
                                </div>
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <h3 className="text-2xl font-black text-gray-900 break-all leading-tight">{selectedExpense.description}</h3>
                                </div>
                                {selectedExpense.isLoan && (
                                    <div className="flex justify-center mb-2">
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm">Active Loan</span>
                                    </div>
                                )}
                                {selectedExpense.parentLoan && (
                                    <div className="flex justify-center mb-2">
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm">Interest Accrual</span>
                                    </div>
                                )}
                                {group.groupType !== 'community' && (
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(selectedExpense.amount, displayCurrency, selectedExpense.currency)}</p>
                                )}
                                <p className="text-sm text-gray-500 font-medium mt-1">Paid by {selectedExpense.paidBy?._id === user.id ? 'You' : (selectedExpense.paidBy?.username || 'Someone')}</p>
                                {selectedExpense.addedBy && selectedExpense.addedBy._id !== selectedExpense.paidBy?._id && (
                                    <p className="text-[11px] text-gray-400 font-medium italic mt-0.5">Added by {selectedExpense.addedBy._id === user.id ? 'you' : selectedExpense.addedBy.username}</p>
                                )}
                                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{new Date(selectedExpense.date).toLocaleDateString()}</p>

                                {selectedExpense.billImage && (
                                    <div className="mt-4 flex justify-center">
                                        <a href={selectedExpense.billImage} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-2xl overflow-hidden shadow-md border-2 border-white hover:opacity-80 transition cursor-pointer bg-gray-100">
                                            <img src={selectedExpense.billImage} alt="Receipt" className="w-full h-full object-cover" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {group.groupType !== 'community' && (
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-h-48 overflow-y-auto">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Split Details</h4>
                                    <div className="space-y-2">
                                        {selectedExpense.splits?.map(split => (
                                            <div key={split.user?._id || split.user} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                                                <span className="font-semibold text-gray-700 text-sm">
                                                    {split.user?._id === user.id ? 'You' : (split.user?.username || 'Someone')}
                                                </span>
                                                <span className="font-bold text-gray-900 border-l border-gray-100 pl-3">{formatCurrency(split.amount, displayCurrency, selectedExpense.currency)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(() => {
                                if (selectedExpense.description?.toLowerCase().includes('settle')) return null;
                                const isPaidByMe = (selectedExpense.paidBy?._id || selectedExpense.paidBy) === (user?.id || user?._id);
                                const mySplit = selectedExpense.splits?.find(s => (s.user?._id || s.user) === (user?.id || user?._id));
                                if (!mySplit || mySplit.amount <= 0 || isPaidByMe) return null;

                                // Hide if pairwise balance is already zero
                                const myId = user?.id || user?._id;
                                const otherMemberId = selectedExpense.paidBy?._id || selectedExpense.paidBy;
                                const iOwe = pairwiseBalances[myId]?.[otherMemberId] || 0;
                                const theyOwe = pairwiseBalances[otherMemberId]?.[myId] || 0;
                                const netUSD = Math.abs(theyOwe - iOwe);
                                if (netUSD < 0.01) return null;

                                return (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Settle and delete "${selectedExpense.description}"? This will remove it and notify ${selectedExpense.paidBy?.username || 'the payer'}.`)) {
                                                handleSettleIndividualExpense(selectedExpense);
                                            }
                                        }}
                                        className="w-full mt-4 font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl py-3.5 shadow-sm hover:bg-emerald-100 transition flex items-center justify-center gap-2"
                                    >
                                        <i className="pi pi-check text-[1rem]"></i>
                                        Settle &amp; delete ({formatCurrency(mySplit.amount, displayCurrency, selectedExpense.currency)})
                                    </button>
                                );
                            })()}

                            {(selectedExpense.addedBy ? (selectedExpense.addedBy._id === user.id) : (selectedExpense.paidBy?._id === user.id)) && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteExpense(selectedExpense._id, selectedExpense.description);
                                        setSelectedExpense(null);
                                    }}
                                    className="w-full mt-4 font-bold bg-rose-50 text-rose-600 rounded-xl py-3.5 border border-rose-100 hover:bg-rose-100 transition flex items-center justify-center gap-2"
                                >
                                    <i className="pi pi-trash text-[1rem]"></i>
                                    Delete Entire Expense
                                </button>
                            )}
                        </div>
                    )}
                </div>
                )}
            </Dialog>

            {/* Group Settings Full-Screen Modal */}
            <Dialog 
                visible={showSettings} 
                onHide={() => setShowSettings(false)}
                fullScreen
                header={
                    <div className="flex items-center w-full relative">
                        <button onClick={() => setShowSettings(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute left-0">
                            <i className="pi pi-arrow-left text-[1.2rem]"></i>
                        </button>
                        <h2 className="text-[17px] font-medium text-gray-900 w-full text-center">Group settings</h2>
                    </div>
                }
                closable={false}
                contentClassName="p-0 bg-white"
            >
                <div className="flex-1 overflow-y-auto pb-20">
                    {/* Top Info */}
                    <div className="p-5 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-4 max-w-[80%]">
                            <div className="w-[60px] h-[60px] bg-emerald-600 text-white rounded-[14px] flex items-center justify-center text-3xl font-black shadow-sm object-cover overflow-hidden relative flex-shrink-0">
                                {group.image ? <img src={group.image} className="w-full h-full object-cover" alt="Group" /> : group.name?.charAt(0)}
                            </div>
                            <h3 className="text-[20px] font-medium text-gray-900 truncate">{group.name}</h3>
                        </div>
                        <button
                            onClick={() => { setNewGroupName(group.name); setDraftGroupCurrency(group.currency || ''); setShowCustomizeGroup(true); }}
                            className="text-gray-900 font-bold text-[15px] px-2 flex-shrink-0">
                            Edit
                        </button>
                    </div>

                    {/* Group members section */}
                    <div className="mt-4">
                        <h4 className="px-5 py-2 text-[14px] font-bold text-gray-800">Group members</h4>
                        <div className="flex flex-col mt-1">
                            <button onClick={() => { setShowSettings(false); setShowInvite(true); }} className="px-5 py-4 flex items-center gap-5 hover:bg-gray-50 transition border-b border-gray-50 w-full text-left">
                                <i className="pi pi-user-plus text-[1.5rem] text-gray-600 ml-1"></i>
                                <span className="text-[17px] text-gray-800 font-medium">Add people to group</span>
                            </button>
                            <button onClick={() => { setShowSettings(false); setShowInviteLink(true); }} className="px-5 py-[18px] flex items-center gap-5 hover:bg-gray-50 transition border-b border-gray-50 w-full text-left">
                                <i className="pi pi-link text-[1.5rem] text-gray-600 ml-1"></i>
                                <span className="text-[17px] text-gray-800 font-medium">Invite via link</span>
                            </button>

                            {/* Members List */}
                            {[...(group.members || [])].map(member => {
                                const b = balances[member._id] || 0;
                                return (
                                    <div key={member._id} onClick={() => setSelectedMemberModal(member)} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer border-b border-gray-50">
                                        <div className="flex items-center gap-4 max-w-[65%]">
                                            <div className="w-[52px] h-[52px] bg-emerald-600 text-white rounded-full flex items-center justify-center text-[22px] font-medium uppercase shadow-sm flex-shrink-0">
                                                {member.username?.charAt(0)}
                                            </div>
                                            <div className="truncate flex-1">
                                                <h4 className="text-[16px] text-gray-800 font-medium truncate leading-tight flex items-center gap-2">
                                                    {member.username}
                                                    {group.pendingMembers?.some(pm => String(pm._id || pm) === String(member._id)) && (
                                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Pending</span>
                                                    )}
                                                    {member.isGhostUser && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Invited</span>
                                                    )}
                                                </h4>
                                                <p className="text-[13px] text-gray-500 truncate mt-0.5">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {b < 0 ? (
                                                <>
                                                    <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wide">owes</p>
                                                    <p className="text-[19px] font-medium text-rose-600 leading-tight">{formatCurrency(b, displayCurrency)}</p>
                                                </>
                                            ) : b > 0 ? (
                                                <>
                                                    <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide">gets back</p>
                                                    <p className="text-[19px] font-medium text-emerald-800 leading-tight">{formatCurrency(b, displayCurrency)}</p>
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
                                    <i className="pi pi-bolt text-[1.5rem] text-gray-500"></i>
                                </div>
                                <div className="flex-1 pr-4">
                                    <h5 className="text-[17px] text-gray-800 font-medium">Simplify group debts</h5>
                                    <p className="text-[14px] text-gray-500 leading-snug mt-1">Automatically combines debts to reduce the total number of repayments between group members. <br /><span className="text-slate-900 font-medium">Learn more</span></p>
                                </div>
                                <div className="flex-shrink-0 mt-1">
                                    <Toggle checked={simplifyDebts} onChange={setSimplifyDebts} />
                                </div>
                            </div>

                            <button className="px-5 py-[18px] flex items-start gap-4 hover:bg-gray-50 transition border-b border-gray-50 text-left" onClick={() => {
                                setShowSettings(false);
                                handleLeaveGroup();
                            }}>
                                <div className="mt-0.5 flex-shrink-0">
                                    <i className="pi pi-sign-out text-[1.5rem] text-gray-500 pl-1"></i>
                                </div>
                                <div>
                                    <h5 className="text-[17px] text-gray-800 font-medium tracking-tight">Leave group</h5>
                                    <p className="text-[14px] text-gray-500 leading-snug mt-1 pr-2">You can't leave this group because you have outstanding debts with other group members.</p>
                                </div>
                            </button>

                            <button className="px-5 py-5 flex items-center gap-4 hover:bg-rose-50 transition border-b border-gray-50 text-left" onClick={handleDeleteGroup}>
                                <div className="flex-shrink-0">
                                    <i className="pi pi-trash text-[1.5rem] text-[#9a1e38] pl-1"></i>
                                </div>
                                <h5 className="text-[17px] text-[#9a1e38] font-bold tracking-tight">Delete group</h5>
                            </button>
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog 
                visible={showCustomizeGroup} 
                onHide={() => setShowCustomizeGroup(false)}
                fullScreen
                header={
                    <div className="flex items-center justify-between w-full relative">
                        <button onClick={() => setShowCustomizeGroup(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute left-0">
                            <i className="pi pi-arrow-left text-[1.2rem]"></i>
                        </button>
                        <h2 className="text-[17px] font-medium text-gray-900 w-full text-center">Customize group</h2>
                        <button onClick={async () => {
                            handleUpdateGroupName();
                            // Save settle-up date to backend
                            try {
                                const res = await api.put(`/groups/${id}/settle-date`, { settleUpDate: draftSettleDate || null });
                                const saved = res.data.settleUpDate ? res.data.settleUpDate.slice(0, 10) : '';
                                setSettleUpDate(saved);
                            } catch { /* silently ignore */ }
                            setShowCustomizeGroup(false);
                        }} className="text-slate-900 font-bold text-[16px] px-2 hover:opacity-70 transition absolute right-0">
                            Done
                        </button>
                    </div>
                }
                closable={false}
                contentClassName="p-0 bg-white"
            >
                <div className="flex-1 overflow-y-auto p-5 pb-20 mt-2">
                    {/* Group Name Editing */}
                    <div className="flex items-start gap-4">
                        <div className="relative w-[72px] h-[72px] flex-shrink-0">
                            <div className="w-full h-full bg-[#343e42] text-white rounded-[16px] flex items-center justify-center text-4xl font-black shadow-sm object-cover overflow-hidden">
                                {group.image ? <img src={group.image} className="w-full h-full object-cover" alt="Group" /> : (newGroupName?.charAt(0) || group.name?.charAt(0))}
                            </div>
                            <label 
                                htmlFor="group-image-upload"
                                className={`absolute -bottom-2 -right-2 bg-emerald-600 rounded-full p-1.5 border-2 border-white shadow-sm cursor-pointer hover:bg-slate-800 transition flex items-center justify-center z-10 ${isUploadingGroupImage ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <i className="pi pi-camera text-[0.8rem] text-white pointer-events-none"></i>
                                <input id="group-image-upload" type="file" onChange={handleGroupImageUpload} accept="image/*" className="hidden" disabled={isUploadingGroupImage} />
                            </label>
                        </div>
                        <div className="flex-1 mt-1">
                            <label className="text-[13px] font-bold text-gray-500 mb-0.5 block">Group name</label>
                            <InputText
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                className="w-full text-[22px] font-black text-gray-900 border-b-2 border-slate-100 dark:border-slate-800 transition-all focus:border-emerald-600 bg-transparent py-2 outline-none"
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
                        <div className="flex items-center gap-3 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-5 py-4 focus-within:border-emerald-600 transition-all bg-white shadow-sm">
                            <i className="pi pi-calendar text-[1.2rem] text-gray-400 flex-shrink-0"></i>
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

                    {/* Group Currency Selection */}
                    <div className="mt-8">
                        <label className="text-[13px] font-bold text-gray-500 mb-3 block">Group currency</label>
                        <div className="flex items-center gap-3 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-5 py-4 focus-within:border-emerald-600 transition-all bg-white shadow-sm">
                            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-black text-[12px] text-slate-800 flex-shrink-0">
                                {draftGroupCurrency ? CURRENCY_SYMBOLS[draftGroupCurrency] : CURRENCY_SYMBOLS[user?.defaultCurrency || 'USD']}
                            </div>
                            <select
                                value={draftGroupCurrency}
                                onChange={e => setDraftGroupCurrency(e.target.value)}
                                className="flex-1 outline-none text-[16px] text-gray-900 font-bold bg-transparent cursor-pointer appearance-none"
                            >
                                <option value="">Default (Viewer's Choice)</option>
                                {Object.keys(CURRENCY_SYMBOLS).map(code => (
                                    <option key={code} value={code}>{code} - {CURRENCY_SYMBOLS[code]}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-[12px] text-gray-400 mt-2">Lock in a specific currency for trips. Balances will show in this currency for everyone.</p>
                    </div>

                    {/* Group Type Selector */}
                    <div className="mt-8">
                        <label className="text-[13px] font-bold text-gray-500 mb-3 block">Type</label>
                        <div className="grid grid-cols-4 gap-2 w-full">
                            {[
                                { id: 'Trip', label: 'Trip', icon: 'pi-plane' },
                                { id: 'Home', label: 'Home', icon: 'pi-home' },
                                { id: 'Couple', label: 'Couple', icon: 'pi-heart' },
                                { id: 'Other', label: 'Other', icon: 'pi-list' },
                            ].map((type) => {
                                const isSelected = groupType === type.id;
                                return (
                                    <div key={type.id} className="relative flex-1">
                                        <button
                                            onClick={() => setGroupType(type.id)}
                                            className={`w-full py-4 flex flex-col items-center gap-2 border-2 rounded-2xl transition-all relative z-10 shadow-sm ${isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-50 dark:border-slate-800 hover:bg-gray-50 bg-white'}`}
                                        >
                                            <i className={`pi ${type.icon} text-[1.5rem] ${isSelected ? 'text-white' : 'text-gray-700'}`}></i>
                                            <span className={`text-[12px] uppercase tracking-wider ${isSelected ? 'font-black' : 'font-bold text-gray-500'}`}>{type.label}</span>
                                        </button>
                                        {isSelected && (
                                            <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-[12px] h-[12px] bg-emerald-600 transform rotate-45 z-0"></div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog 
                visible={!!selectedMemberModal} 
                onHide={() => setSelectedMemberModal(null)}
                position="bottom"
                draggable={false}
                resizable={false}
                className="w-full max-w-lg"
                contentClassName="p-0 overflow-hidden rounded-t-[32px] bg-white shadow-[0_-10px_40px_rgb(0,0,0,0.1)]"
                closable={false}
                header={
                   selectedMemberModal && (
                    <div className="p-5 flex items-center justify-between border-b border-gray-100 pb-6 w-full">
                        <div className="flex items-center gap-4 max-w-[70%]">
                            <div className="w-14 h-14 bg-emerald-700 text-white rounded-full flex items-center justify-center text-2xl font-medium uppercase shadow-sm flex-shrink-0">
                                {selectedMemberModal.username?.charAt(0)}
                            </div>
                            <div className="truncate">
                                <h4 className="text-[19px] text-gray-800 font-medium truncate">{selectedMemberModal.username}</h4>
                                <p className="text-[14px] text-gray-500 truncate mt-0.5">{selectedMemberModal.email}</p>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            {getMemberNetBalance(selectedMemberModal._id) < 0 ? (
                                <>
                                    <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wide">owes</p>
                                    <p className="text-[20px] font-medium text-rose-600 leading-none mt-0.5">{formatCurrency(Math.abs(getMemberNetBalance(selectedMemberModal._id)), user?.defaultCurrency)}</p>
                                </>
                            ) : getMemberNetBalance(selectedMemberModal._id) > 0 ? (
                                <>
                                    <p className="text-[11px] font-medium text-slate-900 uppercase tracking-wide">gets back</p>
                                    <p className="text-[20px] font-medium text-slate-900 leading-none mt-0.5">{formatCurrency(getMemberNetBalance(selectedMemberModal._id), user?.defaultCurrency)}</p>
                                </>
                            ) : (
                                <p className="text-[16px] font-medium text-gray-400">settled up</p>
                            )}
                        </div>
                    </div>
                   )
                }
            >
                {selectedMemberModal && (
                    <div className="flex flex-col py-2 mb-2">
                        {selectedMemberModal._id !== user.id && (
                            <button onClick={() => {
                                navigate(`/friend/${selectedMemberModal._id}`, { state: { openSettings: true } });
                            }} className="px-6 py-4 flex items-center gap-5 hover:bg-gray-50 transition w-full text-left">
                                <i className="pi pi-user text-[1.5rem] text-gray-600"></i>
                                <span className="text-[18px] text-gray-800 font-medium">View settings</span>
                            </button>
                        )}

                        {selectedMemberModal._id === user.id ? (
                            <button onClick={() => {
                                setSelectedMemberModal(null);
                                setShowSettings(false);
                                handleLeaveGroup();
                            }} className="px-6 py-4 flex items-start gap-5 hover:bg-rose-50/50 transition w-full text-left">
                                <i className="pi pi-sign-out text-[1.5rem] text-gray-500 mt-1"></i>
                                <div className="flex-1">
                                    <span className="text-[18px] text-gray-800 font-medium block">Leave group</span>
                                </div>
                            </button>
                        ) : (
                            <button onClick={() => handleRemoveMember(selectedMemberModal._id)} className={`px-6 py-4 flex items-start gap-5 transition w-full text-left pb-6 ${Math.abs(getMemberNetBalance(selectedMemberModal._id)) > 0.01 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-50/50 cursor-pointer'}`}>
                                <i className="pi pi-trash text-[1.5rem] text-gray-500 mt-1"></i>
                                <div className="flex-1">
                                    <span className="text-[18px] text-gray-800 font-medium block">Remove from group</span>
                                    {Math.abs(getMemberNetBalance(selectedMemberModal._id)) > 0.01 ? (
                                        <p className="text-[14px] text-rose-500 mt-1 leading-[1.3] pr-2 font-medium">You can't remove this person until their debts are settled up.</p>
                                    ) : (
                                        <p className="text-[14px] text-gray-500 mt-1 leading-[1.3] pr-2">Remove this person from the group.</p>
                                    )}
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </Dialog>

            <Dialog 
                visible={showInviteLink} 
                onHide={() => setShowInviteLink(false)}
                fullScreen
                header={
                    <div className="flex items-center w-full relative">
                        <button onClick={() => setShowInviteLink(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute left-0">
                            <i className="pi pi-arrow-left text-[1.2rem]"></i>
                        </button>
                        <h2 className="text-[17px] font-medium text-gray-900 w-full text-center">Invite link</h2>
                    </div>
                }
                closable={false}
                contentClassName="p-0 bg-white"
            >
                <div className="flex-1 overflow-y-auto pb-20">
                    {/* Link Area */}
                    <div className="p-5 mt-2 flex items-center gap-6">
                        <div className="w-[64px] h-[64px] bg-[#53c8a3] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm relative">
                            <i className="pi pi-link text-[1.5rem] text-white absolute transform -rotate-45"></i>
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
                                <i className="pi pi-share-alt text-[1.5rem] text-gray-600"></i>
                            </div>
                            <span className="text-[17px] text-gray-800 font-medium">Share link</span>
                        </button>

                        <button onClick={() => {
                            navigator.clipboard.writeText(inviteLinkUrl);
                            alert('Link copied to clipboard!');
                        }} className="px-5 py-[18px] flex items-center gap-6 hover:bg-gray-50 transition border-b border-gray-50 w-full text-left">
                            <div className="flex items-center justify-center w-[30px] flex-shrink-0">
                                <i className="pi pi-copy text-[1.5rem] text-gray-500"></i>
                            </div>
                            <span className="text-[17px] text-gray-800 font-medium">Copy link</span>
                        </button>

                        <button onClick={() => {
                            alert('Change link functionality coming soon!');
                        }} className="px-5 py-[18px] flex items-center gap-6 hover:bg-gray-50 transition border-b border-gray-50 w-full text-left">
                            <div className="flex items-center justify-center w-[30px] flex-shrink-0 relative">
                                <i className="pi pi-times-circle text-[1.5rem] text-[#b63038]"></i>
                            </div>
                            <span className="text-[17px] text-gray-800 font-medium">Change link</span>
                        </button>
                    </div>
                </div>
            </Dialog>

            <Dialog 
                visible={showGroupBalances} 
                onHide={() => setShowGroupBalances(false)}
                fullScreen
                header={
                    <div className="flex items-center w-full relative">
                        <button onClick={() => setShowGroupBalances(false)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition absolute left-0">
                            <i className="pi pi-times text-[1.2rem]"></i>
                        </button>
                        <h2 className="text-[17px] font-medium text-gray-900 w-full text-center">Group balances</h2>
                    </div>
                }
                closable={false}
                contentClassName="p-0 bg-white"
            >
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
                            const b = getMemberNetBalance(member._id);
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
                                            <div className="w-[46px] h-[46px] bg-emerald-700 text-white rounded-full flex items-center justify-center text-[20px] font-medium uppercase shadow-sm flex-shrink-0 relative z-20">
                                                {member.username?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-[16px] text-gray-900 font-bold truncate leading-tight">
                                                    {displayName}
                                                </p>
                                                <p className="text-[14px] font-medium leading-snug mt-0.5">
                                                    {b < 0 ? (
                                                        <span className="text-rose-600">owes {formatCurrency(Math.abs(b), displayCurrency)}</span>
                                                    ) : b > 0 ? (
                                                        <span className="text-emerald-500">gets back {formatCurrency(b, displayCurrency)}</span>
                                                    ) : (
                                                        <span className="text-gray-400">is settled up</span>
                                                    )}
                                                    <span className="text-gray-400 text-[12px] font-medium lowercase ml-1">in total</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button className="flex-shrink-0 text-gray-400 p-2 hover:bg-gray-100 rounded-full transition">
                                            <i className="pi pi-expand text-[1.2rem]"></i>
                                        </button>
                                    </div>

                                    {/* Expanded Details List */}
                                    {isExpanded && memberDetails.length > 0 && (
                                        <div className="w-full bg-white relative pb-1">
                                            {/* Sub-tree vertical line */}
                                            <div className="absolute left-[42px] top-0 bottom-8 w-px bg-gray-200 z-0" />

                                            {memberDetails.map((detail, i) => {
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
                                                                <div className="w-[30px] h-[30px] bg-emerald-700 opacity-90 text-white rounded-full flex items-center justify-center text-[13px] font-medium uppercase shadow-sm flex-shrink-0">
                                                                    {otherPerson.username?.charAt(0)}
                                                                </div>

                                                                <p className="text-[15px] text-gray-700 font-medium leading-normal pr-2">
                                                                    <span className="text-gray-800">{formatName(detail.debtor.username)}</span> owes <span className={amountColorCls}>{formatCurrency(detail.amount, user?.defaultCurrency)}</span> to <span className="text-gray-800">{formatName(detail.creditor.username)}</span>
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
                                                                                setReminderEmailBody(`Hi ${personToRemind.username}! 👋\n\nThis is a friendly reminder from ${user.username} — you have an outstanding balance of ${formatCurrency(detail.amount, user?.defaultCurrency)} in our group "${group.name}" on Paywise.\n\nPlease settle up when you get a chance. 🙏\n\nThank you!`);
                                                                                setShowReminderModal(true);
                                                                            }}
                                                                            className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-[6px] text-[14.5px] shadow-sm flex-1 min-w-0 truncate hover:bg-slate-800 transition leading-none">Request</button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const personToRemind = detail.debtor;
                                                                                setSelectedReminderMember({
                                                                                    username: personToRemind.username,
                                                                                    amount: detail.amount,
                                                                                    email: personToRemind.email
                                                                                });
                                                                                setReminderEmailBody(`Hi ${personToRemind.username}! 👋\n\nThis is a friendly reminder from ${user.username} — you have an outstanding balance of ${formatCurrency(detail.amount, user?.defaultCurrency)} in our group "${group.name}" on Paywise.\n\nPlease settle up when you get a chance. 🙏\n\nThank you!`);
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
                                                                                setReminderEmailBody(`Hi ${personToRemind.username}! 👋\n\nThis is a friendly reminder from ${user.username} — you have an outstanding balance of ${formatCurrency(detail.amount, user?.defaultCurrency)} in our group "${group.name}" on Paywise.\n\nPlease settle up when you get a chance. 🙏\n\nThank you!`);
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
            </Dialog>

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
                                                    <div key={m.key} className="flex flex-col items-center justify-end h-full relative">
                                                        <div
                                                            className={`w-[32px] rounded-t-lg transition-all relative overflow-hidden ${isSelected ? 'bg-[#3b93c8]' : 'bg-gray-100'}`}
                                                            style={{ height: `${heightPercent}%` }}
                                                        >
                                                            {/* user share inner bar (splitwise usually just uses total spent, we'll keep it simple) */}
                                                            {isSelected && (
                                                                <div className="w-full bg-[#1b71a2] absolute bottom-0" style={{ height: Math.max((m.userShare / (m.totalSpent || 1)) * 100, 5) + '%' }} />
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
                                            <span className="text-[36px] font-light text-[#3b93c8] leading-none">
                                                {formatCurrency(monthlySpending[selectedMonthIndex].totalSpent, displayCurrency, displayCurrency)}
                                            </span>
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
                                                <span className="text-[36px] font-light text-[#1b71a2] leading-none">
                                                    {formatCurrency(monthlySpending[selectedMonthIndex].userShare, displayCurrency, displayCurrency)}
                                                </span>
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
                                
                                // 1. Calculate Largest Expense by comparing CONVERTED amounts
                                const maxExp = curMonthExpenses.reduce((max, e) => {
                                    const currentConverted = Math.round(convertAmount(e.amount, e.currency || 'USD', displayCurrency) * 100) / 100;
                                    const maxConverted = Math.round(convertAmount(max.amount, max.currency || 'USD', displayCurrency) * 100) / 100;
                                    return currentConverted > maxConverted ? e : max;
                                }, curMonthExpenses[0]);

                                // 2. Calculate Top Spender accurately
                                const spenderMap = {};
                                const targetCurr = displayCurrency || 'USD';
                                curMonthExpenses.forEach(e => {
                                    const pid = (e.paidBy?._id || e.paidBy || 'unknown').toString();
                                    const convertedAmt = Math.round(convertAmount(e.amount, e.currency || 'USD', targetCurr) * 100) / 100;
                                    spenderMap[pid] = (spenderMap[pid] || 0) + convertedAmt;
                                });

                                let topId = null;
                                let topAmt = 0;
                                Object.entries(spenderMap).forEach(([id, amt]) => {
                                    if (amt > topAmt) {
                                        topAmt = amt;
                                        topId = id;
                                    }
                                });

                                const myId = (user?.id || user?._id || '').toString();
                                const allMembers = [...(group?.members || []), ...(group?.pastMembers || [])];
                                const topUserObj = topId ? allMembers.find(m => (m._id || m).toString() === topId) : null;
                                const topUserName = topId === myId ? 'You' : (topUserObj?.username || 'Someone');

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
                                                <p className="text-[16px] text-gray-900 font-medium leading-tight truncate">{topUserName}</p>
                                                <p className="text-[14px] text-gray-500 mt-0.5">{formatCurrency(topAmt, displayCurrency, displayCurrency)}</p>
                                            </div>

                                            {/* Insight Card 2 */}
                                            <div className="min-w-[160px] flex-1 bg-white border border-gray-200 rounded-[14px] p-4 shadow-sm">
                                                <div className="w-8 h-8 rounded-full bg-[#fde9f1] flex items-center justify-center mb-3">
                                                    <PieChart className="w-4 h-4 text-[#b63038]" />
                                                </div>
                                                <p className="text-[13px] text-gray-500 font-medium tracking-wide uppercase mb-1">Largest Expense</p>
                                                <p className="text-[16px] text-gray-900 font-medium leading-tight truncate">{maxExp.description}</p>
                                                <p className="text-[14px] text-gray-500 mt-0.5">{formatCurrency(maxExp.amount, displayCurrency, maxExp.currency)}</p>
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

                            <div className="px-2 mb-6">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Select Export Currency</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {Object.keys(CURRENCY_SYMBOLS).map(code => (
                                        <button
                                            key={code}
                                            onClick={() => setTargetExportCurrency(code)}
                                            className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all font-bold text-sm ${targetExportCurrency === code 
                                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-md' 
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                                        >
                                            {code}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 px-2">
                                <button
                                    onClick={() => {
                                        exportExpenses(expenses, 'pdf', group?.name || 'Group', user, targetExportCurrency);
                                        setShowExportOptions(false);
                                    }}
                                    className="flex items-center gap-4 py-3.5 px-4 bg-gray-50 hover:bg-gray-100 transition rounded-[14px] border border-gray-200 border-b-[2px]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[16px] text-gray-800 font-bold">PDF Document</span>
                                        <span className="text-[13px] text-gray-500 font-medium">Download as {targetExportCurrency}</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        exportExpenses(expenses, 'csv', group?.name || 'Group', user, targetExportCurrency);
                                        setShowExportOptions(false);
                                    }}
                                    className="flex items-center gap-4 py-3.5 px-4 bg-gray-50 hover:bg-gray-100 transition rounded-[14px] border border-gray-200 border-b-[2px]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                        <FileSpreadsheet className="w-5 h-5 text-slate-900" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[16px] text-gray-800 font-bold">CSV Spreadsheet</span>
                                        <span className="text-[13px] text-gray-500 font-medium">Download as {targetExportCurrency}</span>
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
                            const iOwe = (pairwiseBalances[myId]?.[m._id] || 0);   // USD
                            const theyOwe = (pairwiseBalances[m._id]?.[myId] || 0); // USD
                            const netUSD = theyOwe - iOwe;
                            // Convert the USD net to the display currency so full settle
                            // posts the correct amount in the correct currency
                            const netInDisplay = Math.round(
                                convertAmount(Math.abs(netUSD), 'USD', displayCurrency) * 100
                            ) / 100;
                            return { member: m, amount: netInDisplay, iOwe: netUSD < 0 };
                        })
                        .filter(r => r.amount > 0.005);

                    const handleGroupCashSettle = async (isPartial) => {
                        if (!settleUpTarget) return;
                        // settleUpTarget.amount is already in displayCurrency
                        const rawAmt = isPartial ? parseFloat(groupPartialAmount) : settleUpTarget.amount;
                        const amt = Math.round(rawAmt * 100) / 100;
                        if (isNaN(amt) || amt <= 0) { alert('Please enter a valid amount.'); return; }
                        if (amt > settleUpTarget.amount + 0.005) {
                            const maxFmt = formatCurrency(settleUpTarget.amount, displayCurrency, displayCurrency);
                            alert(`Amount cannot exceed ${maxFmt}.`);
                            return;
                        }
                        setIsGroupSettling(true);
                        try {
                            const payerId = settleUpTarget.iOwe ? myId : settleUpTarget.member._id;
                            const receiverId = settleUpTarget.iOwe ? settleUpTarget.member._id : myId;
                            await api.post('/expenses', {
                                description: isPartial
                                    ? `Partial cash payment of ${formatCurrency(amt, displayCurrency, displayCurrency)}`
                                    : 'Cash settle up',
                                // Post in displayCurrency so backend stores the correct amount
                                amount: amt,
                                currency: displayCurrency,
                                group: id,
                                paidBy: payerId,
                                splits: [{ user: receiverId, amount: amt }]
                            });

                            if (!isPartial) {
                                // Full settlement — wipe entire group history for a clean $0 state
                                await api.delete(`/expenses/group/${id}/all`);
                            }

                            setShowGroupSettleUp(false);
                            setSettleUpTarget(null);
                            setGroupPartialAmount('');
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
                                                    {formatCurrency(row.amount, displayCurrency, displayCurrency)}
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
                                            <p className="text-[22px] font-bold text-gray-900">{formatCurrency(settleUpTarget.amount, displayCurrency, displayCurrency)}</p>
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
                                            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-600 bg-slate-50 hover:bg-slate-200 transition text-left"
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
                                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
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
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-emerald-600 bg-slate-50 hover:bg-slate-200 transition mb-4 disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-6 h-6 text-slate-900" />
                                            <div className="text-left">
                                                <p className="text-[15px] font-bold text-gray-800">Full settlement</p>
                                                <p className="text-[13px] text-gray-500">Pay the entire balance</p>
                                            </div>
                                        </div>
                                        <span className="text-[17px] font-bold text-slate-900">{formatCurrency(settleUpTarget.amount, displayCurrency, displayCurrency)}</span>
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3 my-2">
                                        <div className="flex-1 h-[1px] bg-gray-200" />
                                        <span className="text-[13px] text-gray-400 font-medium">or enter a partial amount</span>
                                        <div className="flex-1 h-[1px] bg-gray-200" />
                                    </div>

                                    {/* Partial input */}
                                    <div className="mt-4">
                                        <label className="text-[14px] font-bold text-gray-600 mb-2 block">Amount to pay ({displayCurrency})</label>
                                        <div className="flex items-center gap-2 border-2 border-gray-200 focus-within:border-emerald-600 rounded-xl px-4 py-3 transition bg-white">
                                            <span className="text-gray-500 font-bold text-[16px] flex-shrink-0">{currSym}</span>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                max={settleUpTarget.amount}
                                                placeholder={`Max ${formatCurrency(settleUpTarget.amount, displayCurrency, displayCurrency)}`}
                                                value={groupPartialAmount}
                                                onChange={e => setGroupPartialAmount(e.target.value)}
                                                className="flex-1 outline-none text-[18px] font-bold text-gray-900 bg-transparent placeholder-gray-300"
                                            />
                                        </div>
                                        <p className="text-[12px] text-gray-400 mt-1.5 ml-1">Balance remaining: {formatCurrency(Math.max(0, settleUpTarget.amount - (parseFloat(groupPartialAmount) || 0)), displayCurrency, displayCurrency)}</p>
                                    </div>

                                    <button
                                        onClick={() => handleGroupCashSettle(true)}
                                        disabled={isGroupSettling || !groupPartialAmount || parseFloat(groupPartialAmount) <= 0}
                                        className="mt-6 w-full bg-emerald-600 text-white py-4 rounded-2xl text-[16px] font-bold shadow-md hover:bg-emerald-700 transition disabled:opacity-40"
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
                    const formattedAmt = formatCurrency(m.amount, displayCurrency);

                    const shareText = `Hi ${m.username}! 👋\n\nThis is a friendly reminder from ${user.username} — you have an outstanding balance of ${formattedAmt} in our group "${group.name}" on Paywise.\n\nPlease settle up when you get a chance. You can pay directly in the Paywise app. 🙏\n\nThank you!`;

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
                                            {m.username} owes you {formattedAmt} in {group.name}
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
                                        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
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
