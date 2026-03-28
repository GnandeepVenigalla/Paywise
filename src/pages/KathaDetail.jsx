import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, AlertCircle, Package, Shield, Info, ChevronDown, ChevronUp, X, ChevronRight, Store, Banknote } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const fmt = n => '₹' + Math.abs(n).toLocaleString('en-IN');
const dateStr = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const timeStr = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const CATEGORY_ICONS = {
    'Grocery': '🛒', 'Clothing': '👕', 'Restaurant & Food': '🍱', 'Restaurant': '🍱',
    'Pharmacy': '💊', 'Electronics': '📱', 'Hardware': '🔧', 'Services': '🛠', 'General': '🏢'
};

export default function KathaDetail() {
    const { api } = useContext(AuthContext);
    const { merchantId } = useParams();
    const navigate = useNavigate();

    const [entries, setEntries] = useState([]);
    const [storeInfo, setStoreInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [disputeId, setDisputeId] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputing, setDisputing] = useState(false);
    const [disputeSuccess, setDisputeSuccess] = useState('');
    const [showSettleModal, setShowSettleModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                // Load katha entries
                const eRes = await api.get(`/merchant/${merchantId}/my-katha`);
                setEntries(eRes.data || []);

                // Load store info from my-stores (we derive the store from entries)
                const sRes = await api.get('/merchant/my-stores');
                const store = (sRes.data || []).find(s => s.merchantId === merchantId);
                setStoreInfo(store || null);
            } catch (err) {
                setError('Could not load katha history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [merchantId, api]);

    const balance = entries.reduce((sum, e) => {
        return e.entryType === 'UDHAR' ? sum + e.amount : sum - e.amount;
    }, 0);

    const handleDispute = async (entryId) => {
        if (!disputeReason.trim()) return;
        setDisputing(true);
        try {
            await api.post(`/merchant/dispute/${entryId}`, { reason: disputeReason });
            setDisputeSuccess('Dispute raised successfully. The merchant will be notified.');
            setDisputeId(null);
            setDisputeReason('');
            // Refresh entries
            const eRes = await api.get(`/merchant/${merchantId}/my-katha`);
            setEntries(eRes.data || []);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to raise dispute.');
        } finally {
            setDisputing(false);
        }
    };

    const handleRecordCash = async () => {
        setDisputing(true); // reusing state for loading
        try {
            await api.post(`/merchant/${merchantId}/record-cash`, { amount: balance });
            setDisputeSuccess('Cash record submitted. Merchant will verify and settle.');
            setShowSettleModal(false);
            // Refresh entries
            const eRes = await api.get(`/merchant/${merchantId}/my-katha`);
            setEntries(eRes.data || []);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to record cash.');
        } finally {
            setDisputing(false);
        }
    };

    const icon = CATEGORY_ICONS[storeInfo?.category] || '🏪';

    return (
        <div className="min-h-screen bg-gray-50 pb-24 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm pt-8 pb-4 px-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => navigate('/katha')} className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 transition">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-gray-900 truncate">{storeInfo?.shopName || 'Store'}</h1>
                        <p className="text-xs text-gray-400">{storeInfo?.category || ''}</p>
                    </div>
                    {storeInfo?.whatsappNumber && (
                        <a href={`https://wa.me/91${storeInfo.whatsappNumber}`} target="_blank" rel="noreferrer"
                            className="p-2 rounded-full bg-emerald-50 hover:bg-emerald-100 transition">
                            <MessageCircle className="w-5 h-5 text-emerald-600" />
                        </a>
                    )}
                </div>

                {/* Balance pill */}
                {!loading && (
                    <div className={`rounded-2xl p-4 flex justify-between items-center ${balance > 0 ? 'bg-rose-50 border border-rose-100' : balance < 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50 border border-gray-100'}`}>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${balance > 0 ? 'text-rose-500' : balance < 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {balance > 0 ? 'You Owe' : balance < 0 ? 'Store Owes You' : 'All Clear ✓'}
                            </p>
                            <p className={`text-2xl font-black leading-none ${balance > 0 ? 'text-rose-600' : balance < 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {balance === 0 ? '₹0' : fmt(balance)}
                            </p>
                            {balance > 0 && storeInfo?.upiId && (
                                <button 
                                    onClick={() => setShowSettleModal(true)}
                                    className="mt-2 inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm shadow-rose-200"
                                >
                                    Settle via UPI
                                </button>
                            )}
                        </div>
                        <div className="text-right">
                            {storeInfo && (
                                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl px-3 py-2">
                                    <Shield className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[12px] font-bold text-gray-700">{storeInfo.trustScore}% Trust</span>
                                </div>
                            )}
                            <p className="text-[11px] text-gray-400 mt-1">{entries.length} entries</p>
                        </div>
                    </div>
                )}
            </header>

            <main className="px-4 pt-4 max-w-md mx-auto w-full flex-1">
                {/* Notice: read-only */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        Katha entries are added by the merchant. You <strong>cannot edit</strong> them — but you can raise a dispute if something looks wrong.
                    </p>
                </div>

                {disputeSuccess && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                        <span className="text-emerald-600 text-sm font-semibold">✓ {disputeSuccess}</span>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse h-20" />
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                        <p className="text-sm text-rose-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Empty */}
                {!loading && entries.length === 0 && (
                    <div className="flex flex-col items-center py-16">
                        <Package className="w-10 h-10 text-gray-200 mb-3" />
                        <p className="text-gray-500 font-semibold text-sm">No entries yet</p>
                        <p className="text-gray-400 text-xs mt-1">The merchant hasn't added any transactions yet.</p>
                    </div>
                )}

                {/* Entries */}
                {!loading && entries.length > 0 && (
                    <div className="space-y-2">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Transaction History</h2>
                        {entries.map(entry => (
                            <div key={entry._id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${entry.status === 'DISPUTED' ? 'border-orange-200' : entry.entryType === 'UDHAR' ? 'border-rose-100' : 'border-emerald-100'}`}>
                                {/* Main row */}
                                <button className="w-full p-4 text-left flex items-start gap-3"
                                    onClick={() => setExpanded(expanded === entry._id ? null : entry._id)}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${entry.entryType === 'UDHAR' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {entry.entryType === 'UDHAR' ? '📦' : '💰'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-bold text-gray-900 leading-tight truncate">
                                            {entry.description || (entry.itemList?.length > 0 ? entry.itemList.map(i => i.name).join(', ') : entry.entryType === 'UDHAR' ? 'Purchase on credit' : 'Payment received')}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{dateStr(entry.createdAt)} · {timeStr(entry.createdAt)}</p>
                                        {entry.status === 'DISPUTED' && <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">⚠ Disputed</span>}
                                        {entry.isSettled && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Settled</span>}
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <div className={`text-[17px] font-black leading-none ${entry.entryType === 'UDHAR' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {entry.entryType === 'UDHAR' ? '+' : '-'}{fmt(entry.amount)}
                                        </div>
                                    </div>
                                    {expanded === entry._id ? <ChevronUp className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />}
                                </button>

                                {/* Expanded detail */}
                                {expanded === entry._id && (
                                    <div className="px-4 pb-4 border-t border-gray-50">
                                        {/* Items list */}
                                        {entry.itemList?.length > 0 && (
                                            <div className="mt-3 mb-3">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Items</p>
                                                <div className="space-y-1">
                                                    {entry.itemList.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center">
                                                            <span className="text-[13px] text-gray-700">{item.name}</span>
                                                            <span className="text-[13px] font-bold text-gray-900">₹{item.price?.toLocaleString('en-IN')}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between items-center pt-1 border-t border-gray-100 mt-1">
                                                        <span className="text-[13px] font-bold text-gray-700">Total</span>
                                                        <span className="text-[14px] font-black text-gray-900">₹{entry.amount?.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Dispute button */}
                                        {entry.status !== 'DISPUTED' && !entry.isSettled && (
                                            disputeId === entry._id ? (
                                                <div className="mt-3">
                                                    <textarea
                                                        value={disputeReason}
                                                        onChange={e => setDisputeReason(e.target.value)}
                                                        placeholder="Briefly explain why this entry is wrong…"
                                                        rows={2}
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-orange-400 resize-none"
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={() => { setDisputeId(null); setDisputeReason(''); }} className="flex-1 py-2 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl">Cancel</button>
                                                        <button onClick={() => handleDispute(entry._id)} disabled={disputing || !disputeReason.trim()} className="flex-1 py-2 text-sm font-bold text-white bg-orange-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                                                            {disputing ? 'Raising…' : '⚠ Raise Dispute'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => setDisputeId(entry._id)} className="mt-3 text-[12px] font-bold text-orange-500 underline underline-offset-2">
                                                    Something wrong? Raise a dispute
                                                </button>
                                            )
                                        )}
                                        {entry.status === 'DISPUTED' && entry.disputeReason && (
                                            <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                                                <p className="text-[11px] font-bold text-orange-700">Dispute reason:</p>
                                                <p className="text-[12px] text-orange-800 mt-1">{entry.disputeReason}</p>
                                            </div>
                                        )}
                                        {entry.merchantReply && (
                                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                                                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-widest text-[9px]">Merchant's reply</p>
                                                <p className="text-[12px] text-blue-800 mt-1 italic font-medium">"{entry.merchantReply}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Settle Modal */}
            {showSettleModal && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowSettleModal(false)}>
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[18px] font-black text-gray-900">Settle Balance</h3>
                            <button onClick={() => setShowSettleModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center mb-6">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Total Amount To Pay</p>
                            <p className="text-4xl font-black text-rose-600 tracking-tight">₹{balance.toLocaleString('en-IN')}</p>
                            <div className="mt-4 bg-white border border-rose-100 rounded-xl px-4 py-2 inline-flex items-center gap-2 shadow-sm">
                                <Store className="w-4 h-4 text-rose-500" />
                                <span className="text-[13px] font-bold text-gray-800">{storeInfo?.shopName}</span>
                            </div>
                        </div>

                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">Choose payment method</p>
                        <div className="space-y-3 mb-6">
                            <a href={`phonepe://pay?pa=${storeInfo.upiId}&pn=${encodeURIComponent(storeInfo.shopName)}&am=${balance}&cu=INR`} 
                            className="w-full flex items-center justify-between p-4 bg-[#f8f5ff] border border-purple-100 rounded-xl active:scale-95 transition-all hover:shadow-md">
                                <span className="font-bold text-[#5e2392]">PhonePe</span>
                                <ChevronRight className="w-5 h-5 text-purple-300" />
                            </a>
                            <a href={`gpay://upi/pay?pa=${storeInfo.upiId}&pn=${encodeURIComponent(storeInfo.shopName)}&am=${balance}&cu=INR`} 
                            className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl active:scale-95 transition-all hover:shadow-md">
                                <span className="font-bold text-[#1c69d4]">Google Pay</span>
                                <ChevronRight className="w-5 h-5 text-blue-300" />
                            </a>
                            <a href={`paytmmp://pay?pa=${storeInfo.upiId}&pn=${encodeURIComponent(storeInfo.shopName)}&am=${balance}&cu=INR`} 
                            className="w-full flex items-center justify-between p-4 bg-sky-50 border border-sky-100 rounded-xl active:scale-95 transition-all hover:shadow-md">
                                <span className="font-bold text-[#00baf2]">Paytm</span>
                                <ChevronRight className="w-5 h-5 text-sky-300" />
                            </a>
                            <button onClick={handleRecordCash} disabled={disputing}
                            className="w-full flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl active:scale-95 transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Banknote className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="font-bold text-emerald-700">Record Cash Payment</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-emerald-300" />
                            </button>
                        </div>

                        <div className="text-center pt-4 border-t border-gray-100">
                            <p className="text-[11px] text-gray-400 font-medium tracking-wide">MERCHANT UPI ID</p>
                            <p className="text-sm font-bold text-gray-700 mt-0.5">{storeInfo.upiId}</p>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
