import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { X, Receipt, Check, Camera, Trash2 } from 'lucide-react';
import { useAppSettings, getCurrencySymbol } from '../hooks/useAppSettings';
import Avatar from '../components/UI/Avatar';

export default function AddFriendExpense() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user } = useContext(AuthContext);
    const { defaultSplitMethod } = useAppSettings();
    const currSym = getCurrencySymbol(user?.defaultCurrency || 'USD');

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState(user?.id);
    const [splitMethod, setSplitMethod] = useState('equally');
    const [friend, setFriend] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoan, setIsLoan] = useState(false);
    const [loanInterestRate, setLoanInterestRate] = useState(0);
    const [billImage, setBillImage] = useState(null);
    const [billImagePreview, setBillImagePreview] = useState(null);

    // UI State
    const [showSplitModal, setShowSplitModal] = useState(false);

    useEffect(() => {
        if (defaultSplitMethod) {
            setSplitMethod(defaultSplitMethod);
        }
    }, [defaultSplitMethod]);

    useEffect(() => {
        const fetchFriend = async () => {
            try {
                const fRes = await api.get(`/expenses/friends/${id}`);
                setFriend(fRes.data.friend);
            } catch (err) {
                console.error(err);
            }
        };
        fetchFriend();
    }, [id, api]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!description || !amount || Number(amount) <= 0) return;

        setIsLoading(true);

        try {
            let splitsArray;
            const total = parseFloat(amount);
            if (splitMethod === 'full') {
                const other = paidBy === user.id ? friend?._id : user.id;
                splitsArray = [{ user: other, amount: total }];
            } else {
                const half = total / 2;
                splitsArray = [
                    { user: user.id, amount: half },
                    { user: id, amount: half }
                ];
            }

            const expRes = await api.post('/expenses', {
                description,
                amount: parseFloat(amount),
                currency: user?.defaultCurrency || 'USD',
                group: null,
                paidBy: paidBy,
                splits: splitsArray,
                isLoan: isLoan,
                loanInterestRate: isLoan ? loanInterestRate : 0
            });

            if (billImage) {
                try {
                    const formData = new FormData();
                    formData.append('image', billImage);
                    await api.post(`/upload/bill/${expRes.data._id}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } catch (imgErr) {
                    console.error('Failed to upload bill image:', imgErr);
                }
            }

            navigate(`/friend/${id}`);
        } catch (err) {
            console.error(err);
            alert('Error adding expense');
            setIsLoading(false);
        }
    };

    const parsedAmount = parseFloat(amount) || 0;
    const halfAmount = (parsedAmount / 2).toFixed(2);
    const fullAmount = parsedAmount.toFixed(2);
    const friendName = friend?.username || 'Friend';

    const getSummaryText = () => {
        const payer = paidBy === user.id ? 'you' : friendName;
        if (splitMethod === 'equally') return `Paid by ${payer} and split equally`;
        if (splitMethod === 'full') return paidBy === user.id ? `You are owed the full amount` : `${friendName} is owed the full amount`;
        return 'Split method';
    };

    const splitOptions = [
        {
            id: 'you_equally',
            paidBy: user.id,
            method: 'equally',
            title: 'You paid, split equally.',
            sub: `${friendName} owes you ${currSym}${halfAmount}.`,
            subColor: 'text-[#19876e]' // Emerald green
        },
        {
            id: 'you_full',
            paidBy: user.id,
            method: 'full',
            title: 'You are owed the full amount.',
            sub: `${friendName} owes you ${currSym}${fullAmount}.`,
            subColor: 'text-[#19876e]'
        },
        {
            id: 'friend_equally',
            paidBy: friend?._id,
            method: 'equally',
            title: `${friendName} paid, split equally.`,
            sub: `You owe ${friendName} ${currSym}${halfAmount}.`,
            subColor: 'text-[#d65228]' // Orange/red
        },
        {
            id: 'friend_full',
            paidBy: friend?._id,
            method: 'full',
            title: `${friendName} is owed the full amount.`,
            sub: `You owe ${friendName} ${currSym}${fullAmount}.`,
            subColor: 'text-[#d65228]'
        }
    ];

    const isSaveEnabled = description.trim() !== '' && parsedAmount > 0;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 font-sans flex flex-col items-center transition-colors">
            {/* Splitwise-style clean Header */}
            <header className="w-full max-w-lg flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-900 sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition">
                    <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-[17px] font-medium text-gray-800 dark:text-gray-100 absolute left-1/2 -translate-x-1/2">
                    Add an expense
                </h1>
                <button
                    onClick={handleSubmit}
                    disabled={!isSaveEnabled || isLoading}
                    className={`font-bold text-[16px] px-2 transition ${isSaveEnabled ? 'text-[#19876e] hover:opacity-80' : 'text-gray-300 dark:text-gray-600'}`}
                >
                    Save
                </button>
            </header>

            <main className="w-full max-w-lg px-4 flex flex-col items-center pt-2">
                {/* "With you and: [Friend]" Pill */}
                {friend && (
                    <div className="flex items-center gap-2 mb-10 w-full justify-center">
                        <span className="text-[15px] text-gray-700 dark:text-gray-300">With <b className="dark:text-white">you</b> and:</span>
                        <div className="flex items-center gap-1.5 border border-gray-200 dark:border-slate-700 rounded-full pr-3 pl-1 py-1 cursor-pointer">
                            <div className="w-6 h-6 bg-[#0E3552] text-white rounded-full flex items-center justify-center font-bold text-xs uppercase overflow-hidden relative">
                                {friend.username.charAt(0)}
                                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/10" />
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-black/20" />
                            </div>
                            <span className="text-[14px] font-medium text-gray-800 dark:text-gray-100">{friend.username}</span>
                        </div>
                    </div>
                )}

                {/* Main Inputs Area (Centered visually) */}
                <div className="w-full max-w-[280px] flex flex-col gap-5 items-center">

                    {/* Description Input */}
                    <div className="flex items-center gap-3 w-full border-b border-1 border-gray-900 dark:border-gray-500 pb-1">
                        <div className="w-12 h-12 bg-[#ebe5f8] dark:bg-[#2c2642] rounded-md border border-[#d2c9ef] dark:border-[#423963] flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden">
                            <Receipt className="w-6 h-6 text-gray-700 dark:text-gray-300 relative z-10" />
                            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/40" />
                        </div>
                        <input
                            type="text"
                            placeholder="Enter a description"
                            className="bg-transparent text-[22px] text-gray-900 dark:text-white outline-none w-full placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal font-medium"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Amount Input */}
                    <div className="flex items-center gap-3 w-full border-b-[2px] border-[#19876e] pb-1">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">{currSym}</span>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-transparent text-[32px] text-gray-900 dark:text-white outline-none w-full placeholder:text-gray-300 dark:placeholder:text-gray-600 font-medium"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Split Action Pill */}
                    <button
                        onClick={() => parsedAmount > 0 && setShowSplitModal(true)}
                        className={`mt-4 px-4 py-2 border rounded-[6px] text-[14px] shadow-sm transition ${parsedAmount > 0
                            ? 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer active:bg-gray-100 dark:active:bg-slate-600'
                            : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                            }`}
                        title={parsedAmount <= 0 ? "Please enter an amount first" : ""}
                    >
                        {getSummaryText()}
                    </button>

                    {parsedAmount <= 0 && (
                        <p className="text-[12px] text-gray-400 dark:text-gray-500 -mt-2">Enter an amount to choose split method</p>
                    )}
                </div>

                {/* Bill Image Attachment */}
                <div className="w-full max-w-[280px] mt-6">
                    {!billImagePreview ? (
                        <label 
                            htmlFor="manual-bill-upload"
                            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-gray-400 dark:text-gray-500 hover:border-emerald-300 dark:hover:border-emerald-800 hover:text-emerald-500 transition-all cursor-pointer bg-gray-50/50 dark:bg-slate-900/50"
                        >
                            <Camera className="w-5 h-5" />
                            <span className="text-[14px] font-bold">Attach receipt</span>
                            <input 
                                id="manual-bill-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setBillImage(file);
                                        setBillImagePreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </label>
                    ) : (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-800 animate-in zoom-in-95 duration-200">
                            <img src={billImagePreview} alt="Receipt preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20" />
                            <button 
                                onClick={() => {
                                    setBillImage(null);
                                    setBillImagePreview(null);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-full text-rose-500 shadow-md hover:scale-110 active:scale-95 transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Receipt Attached</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loan Option */}
                <div className="w-full max-w-[280px] mt-8 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Receipt className={`w-5 h-5 ${isLoan ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                            <span className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Treat as Loan?</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isLoan}
                                onChange={(e) => setIsLoan(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-snug">
                        Loans can have custom interest rates applied automatically.
                    </p>

                    {isLoan && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1.5 block">Annual Interest Rate (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={loanInterestRate}
                                    onChange={(e) => setLoanInterestRate(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 rounded-xl py-2 px-3 text-[18px] font-bold text-emerald-900 dark:text-emerald-300 outline-none"
                                    placeholder="0.0"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-emerald-600/50 dark:text-emerald-400/50">%</span>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Split Method Bottom Modal */}
            {showSplitModal && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div
                        className="absolute inset-0 bg-black/30 animate-in fade-in duration-200"
                        onClick={() => setShowSplitModal(false)}
                    />

                    <div className="bg-white dark:bg-slate-900 w-full rounded-t-[16px] flex flex-col relative z-10 animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 py-4 relative border-b border-gray-100 dark:border-slate-800">
                            <button onClick={() => setShowSplitModal(false)} className="text-[#19876e] font-medium text-[15px] px-2">
                                Cancel
                            </button>
                            <h2 className="text-[16px] font-medium text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2">
                                Expense details
                            </h2>
                        </div>

                        <div className="bg-[#e9ecef] dark:bg-slate-800 py-4 border-b border-gray-200 dark:border-slate-700 text-center">
                            <p className="text-[15px] text-gray-700 dark:text-gray-300 font-medium">How was this expense split?</p>
                        </div>

                        {/* Options List */}
                        <div className="flex flex-col">
                            {splitOptions.map((opt, idx) => {
                                const isSelected = paidBy === opt.paidBy && splitMethod === opt.method;
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => {
                                            setPaidBy(opt.paidBy);
                                            setSplitMethod(opt.method);
                                            setShowSplitModal(false);
                                        }}
                                        className={`flex items-center px-5 py-[18px] cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition border-b border-gray-100 dark:border-slate-800/50 ${isSelected ? 'bg-emerald-50/10 dark:bg-emerald-900/10' : ''}`}
                                    >
                                        <div className="w-[15%] flex-shrink-0 flex -space-x-3">
                                            {/* Simulate the Splitwise icon overlaps */}
                                            {opt.paidBy === user.id ? (
                                                <>
                                                    <div className="w-[38px] h-[38px] bg-[#111] dark:bg-[#222] rounded-full flex items-center justify-center text-white dark:text-gray-200 text-xs border-[3px] border-white dark:border-slate-900 z-10">You</div>
                                                    <div className="w-[38px] h-[38px] bg-[#0E3552] rounded-full border-[3px] border-white dark:border-slate-900 z-0" />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-[38px] h-[38px] bg-[#0E3552] rounded-full border-[3px] border-white dark:border-slate-900 z-10" />
                                                    <div className="w-[38px] h-[38px] bg-[#111] dark:bg-[#222] rounded-full flex items-center justify-center text-white dark:text-gray-200 text-[10px] border-[3px] border-white dark:border-slate-900 z-0">{friend?.username?.substring(0, 3)}</div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex-1 ml-4 pl-2">
                                            <p className="text-[15px] text-gray-900 dark:text-white leading-snug">{opt.title}</p>
                                            <p className={`text-[14px] ${opt.subColor}`}>
                                                {opt.sub}
                                            </p>
                                        </div>

                                        {isSelected && (
                                            <div className="flex-shrink-0 pl-3">
                                                <Check className="w-6 h-6 text-[#19876e]" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 flex justify-center pb-8 border-t border-gray-100 dark:border-slate-800 bg-[#fbfbfb] dark:bg-slate-950">
                            <button
                                onClick={() => alert('Advanced split options coming soon!')}
                                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-md font-bold text-[14px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                            >
                                More options
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
