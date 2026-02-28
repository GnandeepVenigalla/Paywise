import { useState, useEffect, useContext } from 'react';
import { Activity as ActivityIcon, Receipt, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import logoImg from '../assets/logo.png';

export default function Activity() {
    const { api, user } = useContext(AuthContext);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await api.get('/expenses/activity');
                setActivities(res.data);
            } catch (err) {
                console.error('Failed to fetch activity', err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, [api]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white shadow-sm pt-8 pb-4 px-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={logoImg} alt="Paywise" className="w-8 h-8 object-contain" />
                    <h1 className="text-xl font-bold text-gray-900">Paywise</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/account" className="w-9 h-9 rounded-full bg-teal-100 border-2 border-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg uppercase shadow-sm cursor-pointer hover:bg-teal-200 transition">
                        {user?.username?.charAt(0) || 'U'}
                    </Link>
                </div>
            </header>

            <main className="p-4 mt-2 max-w-lg mx-auto">
                {loading ? (
                    <div className="fixed inset-0 bg-[#42b79e] flex flex-col items-center justify-center z-[100]">
                        <div className="w-[110px] h-[110px] animate-pulse">
                            <img src={logoImg} alt="Paywise Logo" className="w-full h-full object-contain drop-shadow-lg" />
                        </div>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-24">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400 shadow-inner">
                            <ActivityIcon className="w-12 h-12 stroke-[2px]" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">No recent activity</h2>
                        <p className="text-gray-500 text-center text-sm px-8 leading-relaxed max-w-sm">When you add expenses, settle up, or update splits, your activity will show up here automatically.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Recent Activity</h2>
                        {activities.map(expense => {
                            const isPaidByMe = expense.paidBy._id === user?.id;

                            // Calculate how much you owe or are owed for this specific expense
                            let mySplitAmount = 0;
                            const mySplit = expense.splits.find(s => s.user._id === user?.id);
                            if (mySplit) {
                                mySplitAmount = mySplit.amount;
                            }

                            let displayMessage = '';
                            let amountColor = '';
                            let amountDisplay = '';
                            let Icon = Receipt;

                            if (isPaidByMe) {
                                // I paid for it
                                const othersOweMe = expense.amount - mySplitAmount;
                                displayMessage = `You added "${expense.description}"`;
                                amountColor = 'text-teal-600';
                                amountDisplay = `You get back $${othersOweMe.toFixed(2)}`;
                                Icon = ArrowLeft;
                            } else {
                                // Someone else paid, I am involved
                                displayMessage = `${expense.paidBy.username} added "${expense.description}"`;
                                amountColor = 'text-rose-600';
                                amountDisplay = `You owe $${mySplitAmount.toFixed(2)}`;
                                Icon = ArrowRight;
                            }

                            // If it's a group expense, show the group name
                            const groupContext = expense.group ? ` in ${expense.group.name}` : '';

                            // Formatting date
                            const dateObj = new Date(expense.date);
                            const now = new Date();
                            const isToday = dateObj.getDate() === now.getDate() && dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
                            const dateString = isToday ? 'Today' : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                            return (
                                <Link
                                    to={expense.group ? `/group/${expense.group._id}` : '#'}
                                    key={expense._id}
                                    className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition active:scale-[0.99]"
                                >
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isPaidByMe ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-900 truncate">{displayMessage}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{expense.group ? `Group: ${expense.group.name}` : 'Individual Expense'}</p>
                                            <p className={`text-sm font-bold mt-2 ${amountColor}`}>{amountDisplay}</p>
                                        </div>
                                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                                            {dateString}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
