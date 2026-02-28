import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppSettings, getCurrencySymbol } from '../hooks/useAppSettings';

export default function AddExpense() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user } = useContext(AuthContext);
    const { defaultSplitMethod } = useAppSettings();
    const currSym = getCurrencySymbol(user?.defaultCurrency || 'USD');

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState(user.id);
    const [splitMethod, setSplitMethod] = useState(defaultSplitMethod || 'equally');
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await api.get(`/groups/${id}`);
                setMembers(res.data.group.members);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMembers();
    }, [id, api]);

    // When defaultSplitMethod loads from settings, pre-fill
    useEffect(() => {
        setSplitMethod(defaultSplitMethod || 'equally');
    }, [defaultSplitMethod]);

    const buildSplits = () => {
        const total = parseFloat(amount);
        if (splitMethod === 'equally') {
            const each = total / members.length;
            return members.map(m => ({ user: m._id, amount: each }));
        } else if (splitMethod === 'full') {
            // payer is owed everything — everyone else owes their share
            return members
                .filter(m => m._id !== paidBy)
                .map(m => ({ user: m._id, amount: total / (members.length - 1 || 1) }));
        } else {
            // percentage — equal for now (full UI in SplitItems)
            const each = total / members.length;
            return members.map(m => ({ user: m._id, amount: each }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description || !amount || members.length === 0) return;
        setIsLoading(true);
        try {
            await api.post('/expenses', {
                description,
                amount: parseFloat(amount),
                group: id,
                paidBy,
                splits: buildSplits(),
            });
            navigate(`/group/${id}`);
        } catch (err) {
            console.error(err);
            alert('Error adding expense');
            setIsLoading(false);
        }
    };

    const SPLIT_LABELS = {
        equally: 'Split equally among all members',
        percentage: 'Split by percentage (equal share)',
        full: 'Paid by one person — others owe their share',
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                <header className="bg-teal-600 p-6 flex items-center text-white relative">
                    <button onClick={() => navigate(-1)} className="absolute left-4 p-2 rounded-full hover:bg-white/20 transition">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-xl font-bold text-center w-full">Add Expense</h2>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <input
                            type="text"
                            className="w-full text-lg border-b-2 border-gray-200 focus:border-teal-500 py-2 outline-none transition-colors bg-transparent"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g. Dinner at Mario's"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
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
                    </div>

                    {/* Split Method — pre-filled from app settings */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Split Method</label>
                        <div className="flex flex-col gap-2">
                            {[
                                { value: 'equally', label: 'Split Equally' },
                                { value: 'percentage', label: 'By Percentage' },
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
                        <p className="text-xs text-gray-400 mt-2">{SPLIT_LABELS[splitMethod]}</p>
                    </div>

                    {members.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Who Paid?</label>
                            <select
                                className="w-full text-lg border-2 border-gray-200 focus:border-teal-500 rounded-xl py-3 px-4 outline-none transition-colors bg-white appearance-none"
                                value={paidBy}
                                onChange={e => setPaidBy(e.target.value)}
                            >
                                {members.map(member => (
                                    <option key={member._id} value={member._id}>
                                        {member._id === user.id ? 'You' : member.username}
                                    </option>
                                ))}
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
