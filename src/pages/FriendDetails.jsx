import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Edit2, Trash2, X, CreditCard, Receipt, Folder } from 'lucide-react';
import logoImg from '../assets/logo.png';
export default function FriendDetails() {
    const { id } = useParams();
    const { api, user } = useContext(AuthContext);
    const [friend, setFriend] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [balance, setBalance] = useState(0);

    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isEditingExpense, setIsEditingExpense] = useState(false);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const navigate = useNavigate();

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

    useEffect(() => {
        fetchFriendDetails();
    }, [id]);

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
            fetchFriendDetails();
        } catch (err) {
            alert('Failed to update expense');
        } finally {
            setIsSavingEdit(false);
        }
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

    if (!friend) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading friend data...</div>;

    const displayItems = [];
    const groupBalances = {};

    expenses.forEach(exp => {
        if (exp.group) {
            if (!groupBalances[exp.group._id]) {
                groupBalances[exp.group._id] = {
                    isGroupSummary: true,
                    _id: 'group-' + exp.group._id,
                    group: exp.group,
                    balance: 0,
                    count: 0,
                    date: exp.date
                };
            }

            // Calculate how much friend owes user (+) or user owes friend (-) from this expense
            const isPaidByMe = exp.paidBy._id === user.id || exp.paidBy._id === user._id;
            if (isPaidByMe) {
                const fSplit = exp.splits.find(s => s.user._id === friend._id || s.user === friend._id);
                if (fSplit) groupBalances[exp.group._id].balance += fSplit.amount;
            } else if (exp.paidBy._id === friend._id) {
                const mySplit = exp.splits.find(s => s.user._id === user.id || s.user === user.id || s.user._id === user._id || s.user === user._id);
                if (mySplit) groupBalances[exp.group._id].balance -= mySplit.amount;
            }

            groupBalances[exp.group._id].count += 1;
            // keep most recent date
            if (new Date(exp.date) > new Date(groupBalances[exp.group._id].date)) {
                groupBalances[exp.group._id].date = exp.date;
            }
        } else {
            displayItems.push({
                ...exp,
                isGroupSummary: false
            });
        }
    });

    displayItems.push(...Object.values(groupBalances));
    displayItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24">
            {/* Header */}
            <header className="bg-teal-600 text-white pt-6 pb-8 px-4 shadow-md sticky top-0 z-10 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-teal-700 transition">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <img src={logoImg} alt="Paywise" className="w-8 h-8 object-contain bg-white rounded-lg p-0.5" />
                        <span className="text-xl font-bold">Paywise</span>
                    </div>
                    <div className="flex gap-3 items-center">
                        <Link to="/account" className="w-9 h-9 rounded-full bg-teal-100 border-2 border-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg uppercase shadow-sm cursor-pointer hover:bg-teal-200 hover:text-teal-800 transition">
                            {user?.username?.charAt(0) || 'U'}
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-black uppercase border-2 border-white/40 shadow-sm">
                        {friend.username?.charAt(0)}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <h1 className="text-2xl font-black tracking-tight leading-none">{friend.username}</h1>
                        <p className="text-teal-100 font-medium text-xs mt-1">{friend.email}</p>
                    </div>
                </div>

                <div className="mt-5 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 shadow-inner">
                    <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider mb-1">Your Total Balance</p>
                    {balance > 0 ? (
                        <p className="text-2xl font-black">${balance.toFixed(2)} <span className="text-xs font-semibold text-teal-100 uppercase tracking-wide opacity-90">Owes You</span></p>
                    ) : balance < 0 ? (
                        <p className="text-2xl font-black text-rose-300">-${Math.abs(balance).toFixed(2)} <span className="text-xs font-semibold text-rose-200 uppercase tracking-wide opacity-90">You Owe</span></p>
                    ) : (
                        <p className="text-2xl font-black text-white/90">Settled Up <span className="text-xs font-semibold text-teal-100 uppercase tracking-wide opacity-90 inline-block align-middle ml-2 hover:animate-spin">🎉</span></p>
                    )}
                </div>
            </header>

            {/* Expenses List */}
            <main className="px-4 py-6 max-w-lg mx-auto relative -mt-6">
                <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 px-1 flex items-center justify-between">
                        Shared Finances
                        <span className="bg-gray-100 text-gray-500 text-xs py-1 px-3 rounded-full">{displayItems.length}</span>
                    </h3>

                    {displayItems.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-2xl">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                                <Receipt className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium text-lg leading-tight">No expenses yet</p>
                            <p className="text-gray-400 text-sm mt-2 max-w-[200px] mx-auto">Add an expense to start splitting with {friend.username}.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayItems.map(item => {
                                if (item.isGroupSummary) {
                                    return (
                                        <div
                                            key={item._id}
                                            onClick={() => navigate(`/group/${item.group._id}`)}
                                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 active:scale-[0.99] cursor-pointer transition"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                                                    <Folder className="w-6 h-6" />
                                                </div>
                                                <div className="flex-col">
                                                    <h4 className="font-bold text-gray-900 break-all">{item.group.name}</h4>
                                                    <p className="text-[10px] mt-0.5 text-indigo-500 font-bold uppercase tracking-wider">{item.count} Shared Expense{item.count !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1 flex-shrink-0 pl-3 border-l border-gray-50 ml-2">
                                                {item.balance > 0 ? (
                                                    <>
                                                        <p className="font-extrabold text-teal-600 text-lg">+${item.balance.toFixed(2)}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider text-teal-600">Owes You</p>
                                                    </>
                                                ) : item.balance < 0 ? (
                                                    <>
                                                        <p className="font-extrabold text-rose-500 text-lg">-${Math.abs(item.balance).toFixed(2)}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider text-rose-500">You Owe</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="font-extrabold text-gray-400 text-lg">$0.00</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Settled</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div
                                            key={item._id}
                                            onClick={() => {
                                                setSelectedExpense(item);
                                                setIsEditingExpense(false);
                                                setEditDescription(item.description);
                                                setEditAmount(item.amount.toString());
                                            }}
                                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 active:scale-[0.99] cursor-pointer transition"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                                                    <Receipt className="w-6 h-6" />
                                                </div>
                                                <div className="flex-col">
                                                    <h4 className="font-bold text-gray-900 line-clamp-1 break-all">{item.description}</h4>
                                                    <p className="text-xs text-gray-500 font-medium mt-1">Paid by <span className={item.paidBy._id === user.id ? "text-teal-600 font-semibold" : ""}>{item.paidBy._id === user.id ? 'You' : item.paidBy.username}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1 flex-shrink-0 pl-3 border-l border-gray-50 ml-2">
                                                <p className="font-extrabold text-gray-900 text-lg">${item.amount.toFixed(2)}</p>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{new Date(item.date).toLocaleDateString()}</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteExpense(item._id, item.description);
                                                    }}
                                                    className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded transition flex items-center gap-1 mt-1"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 w-full max-w-lg left-1/2 -translate-x-1/2 px-4 flex gap-4">
                <Link
                    to={`/friend/${id}/add`}
                    className="flex-1 bg-gray-900 text-white rounded-2xl shadow-xl py-4 flex items-center justify-center gap-2 font-bold hover:bg-gray-800 transition transform hover:-translate-y-1"
                >
                    <CreditCard className="w-5 h-5" />
                    Add Expense
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
                                    {!isEditingExpense && (
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
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">Changing the total amount will instantly update and mathematically recalculate the splits.</p>
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
                                            <div className={`w-16 h-16 ${selectedExpense.group ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'} rounded-2xl flex items-center justify-center font-bold mx-auto mb-3 shadow-inner`}>
                                                {selectedExpense.group ? <Folder className="w-8 h-8" /> : <Receipt className="w-8 h-8" />}
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 break-all leading-tight">{selectedExpense.description}</h3>
                                            <p className="text-3xl font-bold text-teal-600 mt-2">${selectedExpense.amount.toFixed(2)}</p>
                                            <p className="text-sm text-gray-500 font-medium mt-1">Paid by {selectedExpense.paidBy._id === user.id ? 'You' : selectedExpense.paidBy.username}</p>
                                            {selectedExpense.group && <p className="text-xs font-bold text-indigo-500 mt-1 uppercase tracking-wider">Group: {selectedExpense.group.name}</p>}
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
                )
            }
        </div>
    );
}
