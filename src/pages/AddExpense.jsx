import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { X, Receipt, Check, ChevronRight, ChevronLeft, AlignJustify } from 'lucide-react';
import { useAppSettings, getCurrencySymbol } from '../hooks/useAppSettings';
import Avatar from '../components/UI/Avatar';

export default function AddExpense() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user } = useContext(AuthContext);
    const { defaultSplitMethod } = useAppSettings();
    const currSym = getCurrencySymbol(user?.defaultCurrency || 'USD');

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState(String(user?._id || user?.id));
    const [splitMethod, setSplitMethod] = useState('equally');
    const [members, setMembers] = useState([]);
    const [group, setGroup] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Split State Modals
    const [showSplitModal, setShowSplitModal] = useState(false);

    // Individual Split Method States
    const [selectedEqually, setSelectedEqually] = useState([]);
    const [exactAmounts, setExactAmounts] = useState({});
    const [percentages, setPercentages] = useState({});
    const [shares, setShares] = useState({});
    const [adjustments, setAdjustments] = useState({});

    // Payer State Modals & Logic
    const [showPayerModal, setShowPayerModal] = useState(false);
    const [showMultiplePayersModal, setShowMultiplePayersModal] = useState(false);
    const [payerMode, setPayerMode] = useState('single'); // 'single' or 'multiple'
    const [multiplePayersAmounts, setMultiplePayersAmounts] = useState({});

    useEffect(() => {
        if (defaultSplitMethod && defaultSplitMethod === 'equally') {
            setSplitMethod('equally');
        }
    }, [defaultSplitMethod]);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const res = await api.get(`/groups/${id}`);
                const fetchedMembers = res.data.group.members;
                setGroup(res.data.group);
                setMembers(fetchedMembers);

                setSelectedEqually(fetchedMembers.map(m => String(m._id || m.id)));
                const initShares = {};
                fetchedMembers.forEach(m => initShares[String(m._id || m.id)] = '1');
                setShares(initShares);
            } catch (err) {
                console.error(err);
            }
        };
        fetchGroup();
    }, [id, api]);

    const parsedAmount = parseFloat(amount) || 0;

    const buildSplits = () => {
        const total = parsedAmount;
        let splits = [];

        if (splitMethod === 'equally') {
            const splitAmt = total / (selectedEqually.length || 1);
            selectedEqually.forEach(memberId => splits.push({ user: memberId, amount: splitAmt }));
        } else if (splitMethod === 'exact') {
            Object.entries(exactAmounts).forEach(([memberId, amt]) => {
                const val = parseFloat(amt) || 0;
                if (val > 0) splits.push({ user: memberId, amount: val });
            });
        } else if (splitMethod === 'percentage') {
            Object.entries(percentages).forEach(([memberId, pct]) => {
                const val = parseFloat(pct) || 0;
                if (val > 0) splits.push({ user: memberId, amount: (total * val) / 100 });
            });
        } else if (splitMethod === 'shares') {
            let totalShares = Object.values(shares).reduce((sum, s) => sum + (parseFloat(s) || 0), 0);
            if (totalShares > 0) {
                Object.entries(shares).forEach(([memberId, s]) => {
                    const val = parseFloat(s) || 0;
                    if (val > 0) splits.push({ user: memberId, amount: (total * val) / totalShares });
                });
            }
        } else if (splitMethod === 'adjustment') {
            let totalAdj = Object.values(adjustments).reduce((sum, a) => sum + (parseFloat(a) || 0), 0);
            const remainder = total - totalAdj;
            const base = members.length > 0 ? remainder / members.length : 0;

            members.forEach(m => {
                const mid = String(m._id || m.id);
                const adj = parseFloat(adjustments[mid]) || 0;
                splits.push({ user: mid, amount: base + adj });
            });
        }
        return splits;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!description || parsedAmount <= 0 || members.length === 0) return;

        if (payerMode === 'multiple') {
            const sumPayers = Object.values(multiplePayersAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
            if (Math.abs(sumPayers - parsedAmount) > 0.01) {
                alert(`The paid amounts must add up to ${currSym}${parsedAmount.toFixed(2)}.`);
                return;
            }
        }

        if (splitMethod === 'exact') {
            const sumExact = Object.values(exactAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
            if (Math.abs(sumExact - parsedAmount) > 0.01) {
                alert(`The exact amounts must add up to ${currSym}${parsedAmount.toFixed(2)}.`);
                return;
            }
        } else if (splitMethod === 'percentage') {
            const sumPct = Object.values(percentages).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
            if (Math.abs(sumPct - 100) > 0.1) {
                alert(`The percentages must add up to exactly 100%. Currently at ${sumPct}%.`);
                return;
            }
        }

        setIsLoading(true);

        try {
            await api.post('/expenses', {
                description,
                amount: parsedAmount,
                currency: user?.defaultCurrency || 'USD',
                group: id,
                paidBy: payerMode === 'multiple' ? 'multiple' : paidBy,
                splits: buildSplits(),
            });
            navigate(`/group/${id}`);
        } catch (err) {
            console.error(err);
            alert('Error adding expense');
            setIsLoading(false);
        }
    };

    const isSaveEnabled = description.trim() !== '' && parsedAmount > 0;

    const handleToggleEqually = (mId) => {
        if (selectedEqually.includes(mId)) {
            setSelectedEqually(prev => prev.filter(id => id !== mId));
        } else {
            setSelectedEqually(prev => [...prev, mId]);
        }
    };

    const renderSplitDetailsHeader = () => {
        switch (splitMethod) {
            case 'equally': return (
                <div className="text-center pb-4 pt-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[15px]">Split equally</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-0.5">Select which people owe an equal share.</p>
                </div>
            );
            case 'exact': return (
                <div className="text-center pb-4 pt-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[15px]">Split by exact amounts</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-0.5">Specify exactly how much each person owes.</p>
                </div>
            );
            case 'percentage': return (
                <div className="text-center pb-4 pt-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[15px]">Split by percentages</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-0.5">Enter the percentage split that's fair.</p>
                </div>
            );
            case 'shares': return (
                <div className="text-center pb-4 pt-2 px-6">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[15px]">Split by shares</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-0.5 leading-tight">Great for time-based splitting and families.</p>
                </div>
            );
            case 'adjustment': return (
                <div className="text-center pb-4 pt-2 px-6">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[15px]">Split by adjustment</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-0.5 leading-tight">Enter adjustments; Paywise distributes remainder equally.</p>
                </div>
            );
            default: return null;
        }
    };

    const renderSplitFooter = () => {
        if (splitMethod === 'equally') {
            const count = selectedEqually.length;
            const perPerson = count > 0 ? (parsedAmount / count).toFixed(2) : '0.00';
            const allSelected = count === members.length;

            return (
                <div className="p-4 bg-gray-50 dark:bg-slate-950 flex items-center justify-between border-t border-gray-100 dark:border-slate-800">
                    <div className="flex-1 flex flex-col items-center justify-center -ml-10 text-gray-900 dark:text-white">
                        <span className="font-bold text-[15px]">{currSym}{perPerson}/person</span>
                        <span className="text-[12px] text-gray-500 dark:text-gray-400">({count} people)</span>
                    </div>
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setSelectedEqually(allSelected ? [] : members.map(m => String(m._id || m.id)))}
                    >
                        <span className="text-[14px] text-gray-600 dark:text-gray-300 font-medium">All</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${allSelected ? 'bg-[#19876e] border-[#19876e]' : 'border-gray-300 dark:border-slate-600'}`}>
                            {allSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                    </div>
                </div>
            );
        }

        if (splitMethod === 'exact') {
            const sumExact = Object.values(exactAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
            const diff = parsedAmount - sumExact;
            return (
                <div className="p-4 bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center border-t border-gray-100 dark:border-slate-800">
                    <span className="font-bold text-[15px] text-gray-900 dark:text-white">{currSym}{sumExact.toFixed(2)} of {currSym}{parsedAmount.toFixed(2)}</span>
                    <span className={`text-[12px] font-medium ${Math.abs(diff) < 0.01 ? 'text-gray-400 dark:text-gray-500' : diff > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-rose-500'}`}>
                        {Math.abs(diff) < 0.01 ? '0.00 left' : `${currSym}${diff.toFixed(2)} ${diff > 0 ? 'left' : 'over'}`}
                    </span>
                </div>
            );
        }

        if (splitMethod === 'percentage') {
            const sumPct = Object.values(percentages).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
            const diff = 100 - sumPct;
            return (
                <div className="p-4 bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center border-t border-gray-100 dark:border-slate-800">
                    <span className="font-bold text-[15px] text-gray-900 dark:text-white">{sumPct.toFixed(0)}% of 100%</span>
                    <span className={`text-[12px] font-medium ${Math.abs(diff) < 0.1 ? 'text-gray-400 dark:text-gray-500' : diff > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-rose-500'}`}>
                        {Math.abs(diff) < 0.1 ? '0% left' : `${diff.toFixed(0)}% ${diff > 0 ? 'left' : 'over'}`}
                    </span>
                </div>
            );
        }

        if (splitMethod === 'shares') {
            const sumShares = Object.values(shares).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
            return (
                <div className="p-5 bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center border-t border-gray-100 dark:border-slate-800">
                    <span className="font-bold text-[15px] text-gray-900 dark:text-white">{sumShares} total shares</span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 font-sans flex flex-col items-center transition-colors">
            {/* Header */}
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
                {/* Group Info Pill */}
                {group && (
                    <div className="flex items-center gap-2 mb-10 w-full justify-center">
                        <span className="text-[15px] text-gray-700 dark:text-gray-300">With <b className="dark:text-white">you</b> and:</span>
                        <div className="flex flex-col border border-gray-200 dark:border-slate-700 rounded-full px-4 py-1">
                            <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{group.name}</span>
                        </div>
                    </div>
                )}

                {/* Main Inputs */}
                <div className="w-full max-w-[280px] flex flex-col gap-5 items-center">
                    <div className="flex items-center gap-3 w-full border-b border-1 border-gray-900 dark:border-gray-500 pb-1">
                        <div className="w-12 h-12 bg-[#ebe5f8] dark:bg-[#2c2642] rounded-md border border-[#d2c9ef] dark:border-[#423963] flex items-center justify-center shadow-sm">
                            <Receipt className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </div>
                        <input
                            type="text"
                            placeholder="Enter a description"
                            className="bg-transparent text-[22px] text-gray-900 dark:text-white outline-none w-full placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full border-b-[2px] border-[#19876e] pb-1">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">{currSym}</span>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-transparent text-[32px] text-gray-900 dark:text-white outline-none w-full placeholder:text-gray-300 dark:placeholder:text-gray-600 font-medium"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>

                    {/* Action Sentence */}
                    {parsedAmount > 0 ? (
                        <div className="mt-8 mb-2 text-[15px] text-gray-800 dark:text-gray-200 flex items-center gap-1.5 flex-wrap justify-center font-medium">
                            Paid by <button
                                type="button"
                                onClick={() => setShowPayerModal(true)}
                                className="px-2 py-1.5 rounded-[6px] border border-gray-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-gray-50 transition"
                            >
                                {payerMode === 'multiple' ? 'multiple people' : (String(paidBy) === String(user?._id || user?.id) ? 'you' : members.find(m => String(m._id || m.id) === String(paidBy))?.username || 'someone')}
                            </button> and split <button
                                type="button"
                                onClick={() => setShowSplitModal(true)}
                                className="px-2 py-1.5 rounded-[6px] border border-gray-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-gray-50 transition"
                            >
                                {splitMethod === 'equally' ? (selectedEqually.length === members.length ? 'equally' : 'unequally') : splitMethod === 'exact' ? 'by exact amounts' : splitMethod === 'percentage' ? 'by percentages' : splitMethod === 'shares' ? 'by shares' : 'by adjustments'}
                            </button>.
                        </div>
                    ) : (
                        <div className="mt-4 px-4 py-2 border rounded-[6px] text-[14px] shadow-sm bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60">
                            Enter an amount to select split options
                        </div>
                    )}
                </div>
            </main>

            {/* FULL SCREEN SPLIT OPTIONS MODAL */}
            {showSplitModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 animate-in slide-in-from-bottom duration-300 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
                        <button onClick={() => setShowSplitModal(false)} className="text-[#19876e] font-medium text-[15px] px-2">Cancel</button>
                        <h2 className="text-[16px] font-medium text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2">Split options</h2>
                        <button onClick={() => setShowSplitModal(false)} className="text-[#19876e] font-bold text-[15px] px-2">Done</button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {renderSplitDetailsHeader()}

                        <div className="flex justify-center px-4 mb-4 pt-2 shrink-0">
                            <div className="flex items-center gap-1">
                                {[
                                    { id: 'equally', label: '=' },
                                    { id: 'exact', label: '1.23' },
                                    { id: 'percentage', label: '%' },
                                    { id: 'shares', label: <AlignJustify className="w-5 h-5 mx-auto" /> },
                                    { id: 'adjustment', label: '+/-' },
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSplitMethod(t.id)}
                                        className={`px-4 py-1.5 border text-lg font-bold transition-colors w-[60px] h-10 flex items-center justify-center ${splitMethod === t.id
                                            ? 'bg-[#19876e] text-white border-[#19876e]'
                                            : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col mt-2 shrink-0 pb-12">
                            {members.map((member) => {
                                const mId = String(member._id || member.id);
                                let subtext = '';
                                if (splitMethod === 'shares' || splitMethod === 'adjustment') {
                                    let calcArr = buildSplits();
                                    const mSplit = calcArr.find(s => String(s.user) === mId);
                                    subtext = mSplit ? `${currSym}${mSplit.amount.toFixed(2)}` : `${currSym}0.00`;
                                }

                                return (
                                    <div key={mId} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-50 dark:border-slate-800/50 transition">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={member.username} size="sm" />
                                            <div>
                                                <p className="text-[15px] font-medium text-gray-900 dark:text-white">{member.username}</p>
                                                {subtext && <p className="text-[12px] text-gray-500 dark:text-gray-400">{subtext}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            {splitMethod === 'equally' && (
                                                <div
                                                    onClick={() => handleToggleEqually(mId)}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 cursor-pointer transition-colors ${selectedEqually.includes(mId) ? 'bg-[#19876e] border-[#19876e]' : 'border-gray-300 dark:border-slate-600'
                                                        }`}
                                                >
                                                    {selectedEqually.includes(mId) && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                            )}

                                            {splitMethod === 'exact' && (
                                                <div className="flex items-center text-gray-400 font-medium">
                                                    <span className="mr-1">{currSym}</span>
                                                    <input
                                                        type="number" step="0.01"
                                                        value={exactAmounts[mId] || ''}
                                                        onChange={(e) => setExactAmounts({ ...exactAmounts, [mId]: e.target.value })}
                                                        placeholder="0.00"
                                                        className="w-20 border-b border-gray-300 dark:border-slate-600 text-right outline-none text-gray-700 dark:text-gray-200 focus:border-[#19876e] dark:focus:border-[#19876e] bg-transparent pb-0.5 text-[15px] font-medium"
                                                    />
                                                </div>
                                            )}

                                            {splitMethod === 'percentage' && (
                                                <div className="flex items-center text-gray-400 font-medium">
                                                    <input
                                                        type="number" step="1"
                                                        value={percentages[mId] || ''}
                                                        onChange={(e) => setPercentages({ ...percentages, [mId]: e.target.value })}
                                                        placeholder="0"
                                                        className="w-16 border-b border-gray-300 dark:border-slate-600 text-right outline-none text-gray-700 dark:text-gray-200 focus:border-[#19876e] dark:focus:border-[#19876e] bg-transparent pb-0.5 text-[15px] font-medium mr-1"
                                                    />
                                                    <span>%</span>
                                                </div>
                                            )}

                                            {splitMethod === 'shares' && (
                                                <div className="flex items-center text-gray-600 dark:text-gray-400 font-medium">
                                                    <input
                                                        type="number" step="1" min="0"
                                                        value={shares[mId] || ''}
                                                        onChange={(e) => setShares({ ...shares, [mId]: e.target.value })}
                                                        placeholder="1"
                                                        className="w-12 border-b border-gray-400 dark:border-slate-500 text-center outline-none text-gray-900 dark:text-white focus:border-[#19876e] dark:focus:border-[#19876e] bg-transparent pb-0.5 text-[16px] font-bold mr-2"
                                                    />
                                                    <span className="text-gray-500 dark:text-gray-400 text-[14px]">share(s)</span>
                                                </div>
                                            )}

                                            {splitMethod === 'adjustment' && (
                                                <div className="flex items-center text-gray-400 font-medium">
                                                    <span className="mr-2 text-gray-500 dark:text-gray-400">+</span>
                                                    <input
                                                        type="number" step="0.01"
                                                        value={adjustments[mId] || ''}
                                                        onChange={(e) => setAdjustments({ ...adjustments, [mId]: e.target.value })}
                                                        placeholder="0.00"
                                                        className="w-20 border-b border-gray-300 dark:border-slate-600 text-right outline-none text-gray-700 dark:text-gray-200 focus:border-[#19876e] dark:focus:border-[#19876e] bg-transparent pb-0.5 text-[15px] font-medium"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {renderSplitFooter()}
                </div>
            )}

            {/* Choose Payer Modal */}
            {showPayerModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 animate-in slide-in-from-bottom duration-300 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
                        <button onClick={() => setShowPayerModal(false)} className="text-[#19876e] font-medium text-[15px] px-2">Cancel</button>
                        <h2 className="text-[16px] font-medium text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2">Choose payer</h2>
                        <div className="px-2 w-[50px]"></div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="flex flex-col mt-2 pb-12">
                            {members.map((member) => {
                                const mId = String(member._id || member.id);
                                const isSelected = payerMode === 'single' && String(paidBy) === mId;
                                return (
                                    <div
                                        key={mId}
                                        onClick={() => {
                                            setPaidBy(mId);
                                            setPayerMode('single');
                                            setShowPayerModal(false);
                                        }}
                                        className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-50 dark:border-slate-800/50 cursor-pointer transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar name={member.username} size="sm" />
                                            <p className="text-[15px] font-medium text-gray-900 dark:text-white">{member.username}</p>
                                        </div>
                                        {isSelected && <Check className="w-5 h-5 text-[#19876e]" />}
                                    </div>
                                );
                            })}
                            <div
                                onClick={() => {
                                    setShowPayerModal(false);
                                    setShowMultiplePayersModal(true);
                                }}
                                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-50 dark:border-slate-800/50 cursor-pointer mt-2 transition"
                            >
                                <span className="text-[15px] font-medium text-gray-700 dark:text-gray-300">Multiple people</span>
                                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Multiple Payers Modal */}
            {showMultiplePayersModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 animate-in slide-in-from-right duration-300 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
                        <button onClick={() => {
                            setShowMultiplePayersModal(false);
                            setShowPayerModal(true);
                        }} className="p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition">
                            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h2 className="text-[16px] font-medium text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2">Enter paid amounts</h2>
                        <button onClick={() => {
                            setPayerMode('multiple');
                            setShowMultiplePayersModal(false);
                        }} className="text-[#19876e] font-bold text-[15px] px-2">Done</button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="flex flex-col mt-2 pb-12">
                            {members.map((member) => {
                                const mId = String(member._id || member.id);
                                return (
                                    <div key={mId} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-50 dark:border-slate-800/50 transition">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={member.username} size="sm" />
                                            <p className="text-[15px] font-medium text-gray-900 dark:text-white">{member.username}</p>
                                        </div>
                                        <div className="flex items-center text-gray-400 font-medium">
                                            <span className="mr-1">{currSym}</span>
                                            <input
                                                type="number" step="0.01"
                                                value={multiplePayersAmounts[mId] || ''}
                                                onChange={(e) => setMultiplePayersAmounts({ ...multiplePayersAmounts, [mId]: e.target.value })}
                                                placeholder="0.00"
                                                className="w-20 border-b border-gray-300 dark:border-slate-600 text-right outline-none text-gray-700 dark:text-gray-200 focus:border-[#19876e] dark:focus:border-[#19876e] bg-transparent pb-0.5 text-[15px] font-medium"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {(() => {
                        const sumPayers = Object.values(multiplePayersAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
                        const diff = parsedAmount - sumPayers;
                        return (
                            <div className="p-4 bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center border-t border-gray-100 dark:border-slate-800 transition">
                                <span className="font-bold text-[15px] text-gray-900 dark:text-white">{currSym}{sumPayers.toFixed(2)} of {currSym}{parsedAmount.toFixed(2)}</span>
                                <span className={`text-[12px] font-medium ${Math.abs(diff) < 0.01 ? 'text-gray-400 dark:text-gray-500' : diff > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-rose-500'}`}>
                                    {Math.abs(diff) < 0.01 ? '0.00 left' : `${currSym}${diff.toFixed(2)} ${diff > 0 ? 'left' : 'over'}`}
                                </span>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
