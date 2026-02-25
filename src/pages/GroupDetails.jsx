import { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, UserPlus, Receipt, CreditCard, Camera, Trash2, X, Edit2, LogOut, Check } from 'lucide-react';
import logoImg from '../assets/logo.png';
export default function GroupDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user } = useContext(AuthContext);
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
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [isEditingGroupName, setIsEditingGroupName] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

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
        try {
            await api.put(`/expenses/${selectedExpense._id}`, {
                description: editDescription,
                amount: Number(editAmount)
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

    const fetchGroup = async () => {
        try {
            const res = await api.get(`/groups/${id}`);
            setGroup(res.data.group);
            setExpenses(res.data.expenses);
            setBalances(res.data.balances);
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
                fetchGroup(); // Refresh the group details and balances after deletion
            } catch (err) {
                alert('Failed to delete expense: ' + (err.response?.data?.msg || err.message));
            }
        }
    };

    if (!group) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading group data...</div>;

    const myBalance = balances[user.id] || 0;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24">
            {/* Header */}
            <header className="bg-teal-600 text-white pt-8 pb-12 px-4 shadow-md sticky top-0 z-10 transition-all">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Link to="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-teal-700 transition">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <img src={logoImg} alt="Paywise" className="w-8 h-8 object-contain bg-white rounded-lg p-0.5" />
                        <span className="text-xl font-bold">Paywise</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {(group.members || []).some(m => m._id === user.id) && (
                            <>
                                <button onClick={handleLeaveGroup} className="p-2 -mr-1 rounded-full hover:bg-teal-700 transition bg-teal-700/50 shadow-sm" aria-label="Leave group" title="Leave Group">
                                    <LogOut className="w-5 h-5 text-rose-100" />
                                </button>
                                <button onClick={() => setShowInvite(!showInvite)} className="p-2 -mr-1 rounded-full hover:bg-teal-700 transition bg-teal-700/50 shadow-sm" aria-label="Invite member">
                                    <UserPlus className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <Link to="/account" className="w-9 h-9 ml-1 rounded-full bg-teal-100 border-2 border-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg uppercase shadow-sm cursor-pointer hover:bg-teal-200 transition">
                            {user?.username?.charAt(0) || 'U'}
                        </Link>
                    </div>
                </div>

                {isEditingGroupName ? (
                    <div className="flex items-center gap-2 mb-1">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="text-3xl font-bold tracking-tight bg-teal-700/50 text-white rounded px-2 py-1 outline-none border border-teal-400 w-full focus:ring-2 focus:ring-white"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateGroupName()}
                        />
                        <button onClick={handleUpdateGroupName} className="p-2 bg-white text-teal-600 rounded-full hover:bg-teal-50 transition drop-shadow-sm flex-shrink-0">
                            <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsEditingGroupName(false)} className="p-2 bg-teal-700/50 text-white rounded-full hover:bg-teal-700 transition drop-shadow-sm flex-shrink-0">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className={`flex items-center gap-2 mb-1 ${(group.members || []).some(m => m._id === user.id) ? 'group cursor-pointer' : ''}`} onClick={() => {
                        if ((group.members || []).some(m => m._id === user.id)) {
                            setNewGroupName(group.name); setIsEditingGroupName(true);
                        }
                    }}>
                        <h1 className="text-3xl font-bold tracking-tight break-all">{group.name}</h1>
                        {(group.members || []).some(m => m._id === user.id) && (
                            <Edit2 className="w-5 h-5 opacity-50 group-hover:opacity-100 transition flex-shrink-0" />
                        )}
                    </div>
                )}

                <p className="text-teal-100 font-medium opacity-90">
                    {group.members?.length || 0} active members
                    {(group.pastMembers && group.pastMembers.length > 0) ? ` · ${group.pastMembers.length} past members` : ''}
                </p>
            </header>

            <main className="px-4 max-w-lg mx-auto -mt-6">
                {/* Balances Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Your Total Balance</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className={`text-4xl font-extrabold tracking-tight ${myBalance > 0 ? 'text-emerald-500' : myBalance < 0 ? 'text-rose-500' : 'text-gray-900'}`}>
                            {myBalance > 0 ? '+' : ''}${Math.abs(myBalance).toFixed(2)}
                        </h2>
                        <span className="text-sm font-medium text-gray-500">{myBalance > 0 ? 'owed to you' : myBalance < 0 ? 'you owe' : 'settled up'}</span>
                    </div>

                    <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col gap-3">
                        {[...(group.members || []), ...(group.pastMembers || [])].filter(m => m._id !== user.id).map(member => {
                            const b = balances[member._id] || 0;
                            const isPastMember = group.pastMembers && group.pastMembers.some(pm => pm._id === member._id);

                            return (
                                <div key={member._id} className={`flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-all hover:bg-gray-100 hover:shadow-sm ${isPastMember ? 'opacity-80' : ''}`}>
                                    <div className="flex flex-col overflow-hidden mr-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-bold text-gray-800 truncate">{member.username}</span>
                                            {isPastMember && <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Exited</span>}
                                        </div>
                                        <span className={`text-sm font-semibold mt-0.5 whitespace-nowrap ${b < 0 ? 'text-rose-500' : b > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                            {b > 0 ? 'owes you $' + b.toFixed(2) : b < 0 ? 'you owe $' + Math.abs(b).toFixed(2) : 'settled up'}
                                        </span>
                                    </div>
                                    {b !== 0 && (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm(`Are you sure you want to completely settle up $${Math.abs(b).toFixed(2)} with ${member.username}?`)) {
                                                    try {
                                                        await api.post('/expenses', {
                                                            description: 'Settle Up',
                                                            amount: Math.abs(b),
                                                            group: id,
                                                            paidBy: b > 0 ? member._id : (user.id || user._id),
                                                            splits: [{
                                                                user: b > 0 ? (user.id || user._id) : member._id,
                                                                amount: Math.abs(b)
                                                            }]
                                                        });
                                                        fetchGroup();
                                                    } catch (err) {
                                                        alert('Failed to settle up');
                                                    }
                                                }
                                            }}
                                            className={`px-4 py-2 shadow-sm text-sm font-bold rounded-xl transition flex-shrink-0 ${b > 0
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                                : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                                                }`}
                                        >
                                            Settle Up
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Invite Member Section inside main */}
                {showInvite && (
                    <form onSubmit={inviteMember} className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Invite friend by email</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                className="flex-1 py-2.5 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all shadow-sm"
                                value={emailToInvite}
                                onChange={e => setEmailToInvite(e.target.value)}
                                placeholder="friend@example.com"
                                required
                            />
                            <button type="submit" className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-teal-700 transition shadow-sm">
                                Add
                            </button>
                        </div>
                        {inviteError && <p className="text-red-500 text-xs mt-2 font-medium">{inviteError}</p>}
                    </form>
                )}

                {/* Expenses List */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 px-1">Expenses</h3>
                    {expenses.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
                            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No expenses yet.</p>
                            <p className="text-sm text-gray-400 mt-1">Add your first expense to start splitting!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {expenses.map(exp => (
                                <div
                                    key={exp._id}
                                    onClick={() => {
                                        setSelectedExpense(exp);
                                        setIsEditingExpense(false);
                                        setEditDescription(exp.description);
                                        setEditAmount(exp.amount.toString());
                                    }}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 active:scale-[0.99] cursor-pointer transition"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                                            <Receipt className="w-6 h-6" />
                                        </div>
                                        <div className="flex-col">
                                            <h4 className="font-bold text-gray-900 line-clamp-1 break-all">{exp.description}</h4>
                                            <p className="text-xs text-gray-500 font-medium">Paid by <span className={exp.paidBy._id === user.id ? "text-teal-600 font-semibold" : ""}>{exp.paidBy._id === user.id ? 'You' : exp.paidBy.username}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1 flex-shrink-0 pl-3 border-l border-gray-50 ml-2">
                                        <p className="font-extrabold text-gray-900 text-lg">${exp.amount.toFixed(2)}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{new Date(exp.date).toLocaleDateString()}</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteExpense(exp._id, exp.description);
                                            }}
                                            className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded transition flex items-center gap-1 mt-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Buttons */}
            {(group.members || []).some(m => m._id === user.id) && (
                <div className="fixed bottom-6 w-full max-w-lg left-1/2 -translate-x-1/2 px-4 flex gap-4">
                    <Link
                        to={`/group/${id}/add`}
                        className="flex-1 bg-gray-900 text-white rounded-2xl shadow-xl py-4 flex items-center justify-center gap-2 font-bold hover:bg-gray-800 transition transform hover:-translate-y-1"
                    >
                        <CreditCard className="w-5 h-5" />
                        Add Expense
                    </Link>
                    <Link
                        to={`/group/${id}/scan`}
                        className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl shadow-xl py-4 flex items-center justify-center gap-2 font-bold hover:from-teal-600 hover:to-teal-700 transition transform hover:-translate-y-1"
                    >
                        <Camera className="w-5 h-5" />
                        Scan Bill
                    </Link>
                </div>
            )}

            {/* Expense Detail Modal */}
            {selectedExpense && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-in fade-in p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-8 shadow-2xl">
                        {/* Modal Header */}
                        <div className="bg-gray-50 px-5 py-4 flex justify-between items-center border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{isEditingExpense ? 'Edit Expense' : 'Expense Details'}</h2>
                            <div className="flex items-center gap-2">
                                {!isEditingExpense && (
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
                                            className="w-full py-3 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm"
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
                                                className="w-full py-3 pl-8 pr-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm font-bold"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">Changing the total amount will instantly update and mathematically recalculate all member splits based on their assigned portions.</p>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="w-full font-bold bg-teal-600 text-white rounded-xl py-3.5 shadow-md hover:bg-teal-700 transition disabled:opacity-50 mt-4"
                                    >
                                        {isSavingEdit ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            ) : (
                                <div>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center font-bold mx-auto mb-3 shadow-inner">
                                            <Receipt className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 break-all leading-tight">{selectedExpense.description}</h3>
                                        <p className="text-3xl font-bold text-teal-600 mt-2">${selectedExpense.amount.toFixed(2)}</p>
                                        <p className="text-sm text-gray-500 font-medium mt-1">Paid by {selectedExpense.paidBy._id === user.id ? 'You' : selectedExpense.paidBy.username}</p>
                                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-h-48 overflow-y-auto">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Split Details</h4>
                                        <div className="space-y-2">
                                            {selectedExpense.splits.map(split => (
                                                <div key={split.user._id || split.user} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                                                    <span className="font-semibold text-gray-700 text-sm">
                                                        {split.user._id === user.id ? 'You' : (split.user.username || 'Someone')}
                                                    </span>
                                                    <span className="font-bold text-gray-900 border-l border-gray-100 pl-3">${split.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

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
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
