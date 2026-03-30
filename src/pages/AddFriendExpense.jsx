import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import Toggle from '../components/UI/Toggle';
import { useAppSettings } from '../hooks/useAppSettings';
import AdGate from '../components/UI/AdGate';
import Avatar from '../components/UI/Avatar';
import { CURRENCY_SYMBOLS, EXCHANGE_RATES } from '../utils/formatters';

export default function AddFriendExpense() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user, expenseCount, incrementExpenseCount } = useContext(AuthContext);
    const { defaultSplitMethod } = useAppSettings();

    const [showAd, setShowAd] = useState(false);

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
    const [currency, setCurrency] = useState(user?.defaultCurrency || 'USD');
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

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
                currency: currency,
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

            incrementExpenseCount();
            navigate(`/friend/${id}`, { replace: true });
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

    const currSym = CURRENCY_SYMBOLS[currency] || '$';

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

    const isSaveEnabled = description.trim() !== '' && parsedAmount > 0 && friend;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 font-sans flex flex-col items-center transition-colors">
            {/* Splitwise-style clean Header */}
            <header className="w-full max-w-lg flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-900 sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition">
                    <i className="pi pi-times text-[1.2rem] text-gray-700 dark:text-gray-300"></i>
                </button>
                <h1 className="text-[17px] font-medium text-gray-800 dark:text-gray-100 absolute left-1/2 -translate-x-1/2">
                    Add an expense
                </h1>
                <button
                    onClick={(e) => {
                        if (expenseCount >= 4) {
                            setShowAd(true);
                        } else {
                            handleSubmit(e);
                        }
                    }}
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
                                {friend?.username?.charAt(0) || '?'}
                                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/10" />
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-black/20" />
                            </div>
                            <span className="text-[14px] font-medium text-gray-800 dark:text-gray-100">{friend?.username || 'Friend'}</span>
                        </div>
                    </div>
                )}

                {/* Main Inputs Area (Centered visually) */}
                <div className="w-full max-w-[280px] flex flex-col gap-5 items-center">

                    {/* Description Input */}
                    <div className="flex items-center gap-3 w-full border-b border-1 border-gray-900 dark:border-gray-500 pb-1">
                        <div className="w-12 h-12 bg-[#ebe5f8] dark:bg-[#2c2642] rounded-md border border-[#d2c9ef] dark:border-[#423963] flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden">
                            <i className="pi pi-receipt text-[1.5rem] text-gray-700 dark:text-gray-300 relative z-10"></i>
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
                        <button 
                            type="button"
                            onClick={() => setShowCurrencyModal(true)}
                            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                        >
                            <span className="text-xl font-bold text-gray-700 dark:text-gray-200">{currSym}</span>
                        </button>
                        <InputNumber
                            value={amount}
                            onValueChange={(e) => setAmount(e.value)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            placeholder="0.00"
                            className="w-full"
                            inputClassName="bg-transparent text-[32px] text-gray-900 dark:text-white outline-none w-full placeholder:text-gray-300 dark:placeholder:text-gray-600 font-medium"
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
                            <i className="pi pi-camera text-[18px]"></i>
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
                            <i className={`pi pi-briefcase text-[18px] ${isLoan ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                            <span className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Treat as Loan?</span>
                        </div>
                        <div className="flex-shrink-0">
                            <Toggle checked={isLoan} onChange={setIsLoan} />
                        </div>
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-snug">
                        Loans can have custom interest rates applied automatically.
                    </p>

                    {isLoan && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1.5 block">Annual Interest Rate (%)</label>
                            <div className="relative">
                                <InputNumber
                                    value={loanInterestRate === 0 ? null : loanInterestRate}
                                    onValueChange={(e) => setLoanInterestRate(e.value || 0)}
                                    mode="decimal"
                                    minFractionDigits={1}
                                    maxFractionDigits={1}
                                    suffix=" %"
                                    className="w-full"
                                    inputClassName="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 rounded-xl py-2 px-3 text-[18px] font-bold text-emerald-900 dark:text-emerald-300 outline-none"
                                    placeholder="0.0"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Dialog 
                visible={showSplitModal} 
                onHide={() => setShowSplitModal(false)}
                position="bottom"
                draggable={false}
                resizable={false}
                className="w-full max-w-lg"
                contentClassName="p-0 scrollbar-hide overflow-hidden rounded-t-[16px]"
                header={
                    <div className="flex items-center justify-between w-full relative">
                        <button onClick={() => setShowSplitModal(false)} className="text-[#19876e] font-medium text-[15px]">
                            Cancel
                        </button>
                        <h2 className="text-[16px] font-medium text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                            Expense details
                        </h2>
                    </div>
                }
                closable={false}
            >
                <div className="bg-[#e9ecef] dark:bg-slate-800 py-4 border-b border-gray-200 dark:border-slate-700 text-center">
                    <p className="text-[15px] text-gray-700 dark:text-gray-300 font-medium">How was this expense split?</p>
                </div>

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
                                        <i className="pi pi-check text-[1rem] text-[#19876e]"></i>
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
            </Dialog>

            <Dialog
                visible={showCurrencyModal}
                onHide={() => setShowCurrencyModal(false)}
                position="bottom"
                draggable={false}
                resizable={false}
                className="w-full max-w-lg"
                contentClassName="p-0 overflow-hidden rounded-t-[32px]"
                header={
                   <div className="w-full text-center">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">Select Currency</h2>
                   </div>
                }
            >
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-2">
                    {Object.keys(EXCHANGE_RATES).map(code => {
                        const isSelected = currency === code;
                        return (
                            <button
                                key={code}
                                onClick={() => {
                                    setCurrency(code);
                                    setShowCurrencyModal(false);
                                }}
                                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                                    isSelected 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 shadow-sm' 
                                    : 'bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border-2 border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                                        isSelected ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 shadow-sm'
                                    }`}>
                                        {CURRENCY_SYMBOLS[code] || '$'}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-gray-900 dark:text-white text-[17px]">{code}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Global Standard</p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                                        <i className="pi pi-check text-[10px] text-white"></i>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="p-6 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 flex justify-center pb-12">
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Live exchange rates applied automatically</p>
                </div>
            </Dialog>

            <AdGate 
                isOpen={showAd}
                onClose={() => setShowAd(false)}
                onFinish={() => {
                    setShowAd(false);
                    handleSubmit();
                }}
                type="premium"
            />
        </div>
    );
}
