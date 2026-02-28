import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppSettings, getCurrencySymbol } from '../hooks/useAppSettings';

export default function AddFriendExpense() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user } = useContext(AuthContext);
    const { defaultSplitMethod } = useAppSettings();
    const currSym = getCurrencySymbol(user?.defaultCurrency || 'USD');

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState(user.id);
    const [splitMethod, setSplitMethod] = useState('equally');
    const [friend, setFriend] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { setSplitMethod(defaultSplitMethod || 'equally'); }, [defaultSplitMethod]);

    useEffect(() => {
        const fetchFriend = async () => {
            try {
                const res = await api.get(`/auth/users`);
                // Let's just find the friend in the list or we can just fetch if there's an endpoint
                // Wait, it's easier to just fetch /expenses/friends/:id because it returns the friend object too
                const fRes = await api.get(`/expenses/friends/${id}`);
                setFriend(fRes.data.friend);
            } catch (err) {
                console.error(err);
            }
        };
        fetchFriend();
    }, [id, api]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description || !amount) return;

        setIsLoading(true);

        try {
            let splitsArray;
            const total = parseFloat(amount);
            if (splitMethod === 'full') {
                // Whoever paid is owed the full amount by the other person
                const other = paidBy === user.id ? friend?._id : user.id;
                splitsArray = [{ user: other, amount: total }];
            } else {
                // equally or percentage — split 50/50 for 1-on-1
                const half = total / 2;
                splitsArray = [
                    { user: user.id, amount: half },
                    { user: id, amount: half }
                ];
            }

            await api.post('/expenses', {
                description,
                amount: parseFloat(amount),
                group: null, // explicit individual expense
                paidBy: paidBy,
                splits: splitsArray
            });

            navigate(`/friend/${id}`);
        } catch (err) {
            console.error(err);
            alert('Error adding expense');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                <header className="bg-teal-600 p-6 flex items-center text-white relative">
                    <button onClick={() => navigate(-1)} className="absolute left-4 p-2 rounded-full hover:bg-white/20 transition">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-xl font-bold text-center w-full">Add 1-on-1 Expense</h2>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <input
                            type="text"
                            className="w-full text-lg border-b-2 border-gray-200 focus:border-teal-500 py-2 outline-none transition-colors bg-transparent"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g. Movie Tickets"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Total Amount</label>
                        <div className="relative flex items-center">
                            <span className="absolute left-0 text-3xl font-bold text-gray-400">{currSym}</span>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full text-4xl font-extrabold text-gray-900 border-none focus:ring-0 pl-10 py-2 outline-none bg-transparent"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <p className="text-xs font-medium text-gray-500 mt-2">
                            {splitMethod === 'full' ? 'You paid — the other person owes you the full amount.' : 'Cost will be split 50/50.'}
                        </p>
                    </div>

                    {/* Split Method */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Split Method</label>
                        <div className="flex flex-col gap-2">
                            {[
                                { value: 'equally', label: 'Split Equally (50/50)' },
                                { value: 'full', label: 'I Am Owed Full Amount' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setSplitMethod(opt.value)}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition ${splitMethod === opt.value ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${splitMethod === opt.value ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`} />
                                    <span className="font-medium text-[15px]">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {friend && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Who Paid?</label>
                            <select
                                className="w-full text-lg border-2 border-gray-200 focus:border-teal-500 rounded-xl py-3 px-4 outline-none transition-colors bg-white appearance-none"
                                value={paidBy}
                                onChange={e => setPaidBy(e.target.value)}
                            >
                                <option value={user.id}>You</option>
                                <option value={friend._id}>{friend.username}</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !description || !amount}
                        className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl mt-8 flex items-center justify-center gap-2 hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
                    >
                        {isLoading ? 'Saving...' : <><CheckCircle2 className="w-5 h-5" /> Save Expense</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
