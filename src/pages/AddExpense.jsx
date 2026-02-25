import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AddExpense() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user } = useContext(AuthContext);

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState(user.id);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description || !amount || members.length === 0) return;

        setIsLoading(true);

        try {
            const numMembers = members.length;
            const splitAmount = parseFloat(amount) / numMembers;

            const splitsArray = members.map(m => ({
                user: m._id,
                amount: splitAmount
            }));

            await api.post('/expenses', {
                description,
                amount: parseFloat(amount),
                group: id,
                paidBy: paidBy,
                splits: splitsArray
            });

            navigate(`/group/${id}`);
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
                            <span className="absolute left-0 text-3xl font-bold text-gray-400">$</span>
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
                        <p className="text-xs font-medium text-gray-500 mt-2">Cost will be split equally among all members</p>
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
