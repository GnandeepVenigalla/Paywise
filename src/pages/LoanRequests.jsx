import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { formatCurrency, CURRENCY_SYMBOLS } from '../utils/formatters';
import logoImg from '../assets/logo.png';
import { ShieldCheck, ShieldX, Eye, EyeOff, Clock, AlertTriangle, CheckCircle2, XCircle, Lock } from 'lucide-react';

export default function LoanRequests() {
    const { api, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [pendingLoans, setPendingLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Accept modal state
    const [acceptingLoan, setAcceptingLoan] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null); // { type: 'success'|'error', msg: '' }

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const res = await api.get('/loans/pending');
            setPendingLoans(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (loan) => {
        if (loan.requiresPasswordConfirmation && !password) {
            setResult({ type: 'error', msg: 'Please enter your account password to accept this loan.' });
            return;
        }
        setIsSubmitting(true);
        setResult(null);
        try {
            await api.post(`/loans/${loan._id}/accept`, { password });
            setResult({ type: 'success', msg: `Loan accepted! Interest at ${loan.interestRate}% APR starts today.` });
            setAcceptingLoan(null);
            setPassword('');
            setTimeout(fetchPending, 1000);
        } catch (err) {
            setResult({ type: 'error', msg: err.response?.data?.msg || 'Failed to accept loan.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (loan) => {
        const loanId = loan._id;
        const expId = loan.expense?._id || loan.expense;
        
        if (!window.confirm('Reject this loan invitation? If you decline, this whole expense will be deleted from your ledger for security and clarity.')) return;
        
        setIsSubmitting(true);
        try {
            await api.post(`/loans/${loanId}/reject`, {});
            if (expId) {
                await api.delete(`/expenses/${expId}`);
            }
            fetchPending();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to reject loan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#1e293b] flex flex-col items-center justify-center z-[100]">
                <div className="w-[110px] h-[110px] animate-pulse">
                    <img src={logoImg} alt="Paywise" className="w-full h-full object-contain" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24">
            {/* Header */}
            <header className="bg-white sticky top-0 z-10 border-b border-gray-100 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
                    <i className="pi pi-arrow-left text-gray-700 text-[18px]" />
                </button>
                <div>
                    <h1 className="text-[18px] font-bold text-gray-900">Loan Requests</h1>
                    <p className="text-[12px] text-gray-500">Pending your acceptance</p>
                </div>
                {pendingLoans.length > 0 && (
                    <span className="ml-auto bg-rose-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full">
                        {pendingLoans.length}
                    </span>
                )}
            </header>

            {/* Result toast */}
            {result && (
                <div className={`mx-4 mt-4 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
                    result.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-rose-50 border border-rose-200'
                }`}>
                    {result.type === 'success'
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        : <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />}
                    <p className={`text-[14px] font-medium ${result.type === 'success' ? 'text-emerald-800' : 'text-rose-700'}`}>
                        {result.msg}
                    </p>
                    <button onClick={() => setResult(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                        <i className="pi pi-times text-[12px]" />
                    </button>
                </div>
            )}

            <main className="max-w-lg mx-auto px-4 pt-4">
                {pendingLoans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-[20px] font-bold text-gray-800 mb-2">All clear!</h2>
                        <p className="text-gray-500 text-[15px] max-w-[260px] leading-relaxed">
                            You have no pending loan requests. Any new ones from friends will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Info banner */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[13px] text-amber-800 leading-relaxed">
                                <strong>Review before accepting.</strong> Once you accept a loan, interest will start accruing immediately from today at the stated rate.
                            </p>
                        </div>

                        {pendingLoans.map(loan => {
                            const isLarge = loan.requiresPasswordConfirmation;
                            const sym = CURRENCY_SYMBOLS[loan.currency] || '$';
                            const lenderName = loan.lender?.username || 'Someone';

                            return (
                                <div key={loan._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-lg uppercase">
                                            {lenderName.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-[15px]">{lenderName}</p>
                                            <p className="text-white/60 text-[12px]">sent you a loan request</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 px-2.5 py-1 rounded-full">
                                            <Clock className="w-3 h-3 text-amber-300" />
                                            <span className="text-amber-300 text-[10px] font-black uppercase tracking-wide">Pending</span>
                                        </div>
                                    </div>

                                    {/* Loan details */}
                                    <div className="p-5">
                                        <p className="text-[13px] text-gray-500 font-medium uppercase tracking-widest mb-1">For</p>
                                        <p className="text-[18px] font-black text-gray-900 mb-4 leading-tight">{loan.expense?.description || 'Loan'}</p>

                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <div className="bg-slate-50 rounded-xl p-3">
                                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">Amount</p>
                                                <p className="text-[22px] font-black text-slate-900">{sym}{loan.amount.toFixed(2)}</p>
                                                <p className="text-[11px] text-gray-400 font-bold">{loan.currency}</p>
                                            </div>
                                            <div className="bg-emerald-50 rounded-xl p-3">
                                                <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-widest mb-1">Interest APR</p>
                                                <p className="text-[22px] font-black text-emerald-800">{loan.interestRate}%</p>
                                                <p className="text-[11px] text-emerald-600 font-bold">per year</p>
                                            </div>
                                        </div>

                                        {/* Monthly projection */}
                                        <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Est. Monthly Interest</p>
                                                <p className="text-[16px] font-black text-gray-800">
                                                    {sym}{((loan.amount * (loan.interestRate / 100)) / 12).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Accrues From</p>
                                                <p className="text-[14px] font-bold text-gray-700">Day of Acceptance</p>
                                            </div>
                                        </div>

                                        {/* Large loan password warning */}
                                        {isLarge && (
                                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                                                <Lock className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-[12.5px] text-rose-700 font-medium leading-snug">
                                                    This loan exceeds $100. <strong>Your account password is required</strong> to accept it as a security measure.
                                                </p>
                                            </div>
                                        )}

                                        {/* Password input for large loans */}
                                        {acceptingLoan?._id === loan._id && isLarge && (
                                            <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
                                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                                                    Account Password
                                                </label>
                                                <div className="flex items-center border-2 border-slate-800 rounded-xl px-4 py-3 gap-2 bg-white">
                                                    <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        placeholder="Enter your Paywise password"
                                                        className="flex-1 outline-none text-[15px] text-gray-900 bg-transparent placeholder-gray-300"
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(p => !p)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleReject(loan)}
                                                disabled={isSubmitting}
                                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-rose-200 text-rose-600 font-bold text-[15px] hover:bg-rose-50 transition disabled:opacity-50"
                                            >
                                                <ShieldX className="w-4 h-4" />
                                                Reject
                                            </button>

                                            {acceptingLoan?._id === loan._id ? (
                                                <button
                                                    onClick={() => handleAccept(loan)}
                                                    disabled={isSubmitting || (isLarge && !password)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-[15px] hover:bg-emerald-700 transition disabled:opacity-50 shadow-md"
                                                >
                                                    {isSubmitting ? (
                                                        <i className="pi pi-spin pi-spinner text-[14px]" />
                                                    ) : (
                                                        <ShieldCheck className="w-4 h-4" />
                                                    )}
                                                    {isSubmitting ? 'Accepting...' : 'Confirm Accept'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setAcceptingLoan(loan);
                                                        setPassword('');
                                                        setResult(null);
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-[15px] hover:bg-emerald-700 transition shadow-md"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                    {isLarge ? 'Accept with Password' : 'Accept Loan'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Date sent */}
                                        <p className="text-center text-[11px] text-gray-400 mt-3">
                                            Sent {new Date(loan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
