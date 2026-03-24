import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, ChevronLeft, Sparkles, Plus, Check, X, Loader2, Trash2, HandCoins, Info } from 'lucide-react';
import AdGate from '../components/UI/AdGate';

export default function AiAssistant() {
    const { user, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { id: 1, text: `Hey ${user?.username}! 👋 I'm Paywise AI. I can add expenses, check balances, settle up, or delete expenses. Just tell me what you need!`, sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [proposedAction, setProposedAction] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showAd, setShowAd] = useState(false);
    const [isAiUnlocked, setIsAiUnlocked] = useState(localStorage.getItem('ai_unlocked') === 'true');
    const [pendingMessage, setPendingMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const res = await api.get('/ai/suggestions');
                setSuggestions(res.data);
            } catch (err) {
                setSuggestions([
                    { text: "Add $20 for coffee", icon: "☕" },
                    { text: "Who owes me?", icon: "💰" },
                    { text: "Delete last expense", icon: "🗑️" },
                    { text: "Check my balance", icon: "📊" }
                ]);
            }
        };
        fetchSuggestions();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, proposedAction]);

    const addBotMsg = (text) => {
        setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender: 'bot' }]);
    };

    const handleSend = async (e, overrideText = null, isRetry = false) => {
        if (e) e.preventDefault();
        const messageText = (overrideText || input || '').trim();
        if (!messageText || isLoading) return;

        const isCurrentlyUnlocked = isAiUnlocked || localStorage.getItem('ai_unlocked') === 'true';
        if (!isCurrentlyUnlocked && !isRetry) {
            setPendingMessage(messageText);
            setShowAd(true);
            return;
        }

        const userMsg = { id: Date.now() + Math.random(), text: messageText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setProposedAction(null);
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: messageText });
            const { reply, action } = res.data || {};

            // Show AI's text reply
            addBotMsg(reply || "Got it!");

            // If action returned and it's not INFO_ONLY, show the confirmation card
            if (action && action.type && action.type !== 'INFO_ONLY') {
                setProposedAction(action);
            }
        } catch (err) {
            console.error('AI Send Failure:', err);
            addBotMsg("Connection timed out. Please try again in a moment.");
        } finally {
            setIsLoading(false);
        }
    };

    // Execute the proposed action when user confirms
    const confirmAction = async () => {
        if (!proposedAction) return;
        setIsLoading(true);
        const action = proposedAction;
        setProposedAction(null);

        try {
            if (action.type === 'ADD_EXPENSE') {
                // 1:1 friend expense
                const payload = {
                    description: action.description,
                    amount: action.amount,
                    currency: action.currency || 'USD',
                    paidBy: action.paidById,
                    group: null,
                    splits: action.splits?.map(s => ({ user: s.userId, amount: s.amount })) || [
                        { user: action.friendId, amount: action.amount / 2 },
                        { user: action.paidById, amount: action.amount / 2 }
                    ]
                };
                await api.post('/expenses', payload);
                addBotMsg(`✅ Done! Added "${action.description}" for $${action.amount}. It's now tracked in your expenses.`);

            } else if (action.type === 'GROUP_EXPENSE') {
                // Group expense
                const payload = {
                    description: action.description,
                    amount: action.amount,
                    currency: action.currency || 'USD',
                    paidBy: action.paidById,
                    group: action.groupId,
                    splits: action.splits?.map(s => ({ user: s.userId, amount: s.amount })) || []
                };
                await api.post('/expenses', payload);
                addBotMsg(`✅ Done! Added "${action.description}" for $${action.amount} to the group.`);

            } else if (action.type === 'DELETE_EXPENSE') {
                await api.delete(`/expenses/${action.expenseId}`);
                addBotMsg(`🗑️ Deleted! "${action.description}" ($${action.amount}) has been removed.`);

            } else if (action.type === 'SETTLE_UP') {
                // Record a cash settle-up expense
                const amt = Math.abs(action.amount);
                const payerId = action.payerId || (user.id || user._id);
                const receiverId = action.friendId;
                const payload = {
                    description: 'Cash settle up',
                    amount: amt,
                    currency: 'USD',
                    paidBy: payerId,
                    group: null,
                    splits: [{ user: receiverId, amount: amt }]
                };
                await api.post('/expenses', payload);
                addBotMsg(`✅ Settlement recorded! ${action.friendName} is now marked as paid $${amt}.`);
            }
        } catch (err) {
            console.error('Action execution error:', err);
            addBotMsg(`❌ Couldn't complete that action. ${err.response?.data?.msg || 'Please try again.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Describe the proposed action in human-readable terms
    const describeAction = (action) => {
        switch (action.type) {
            case 'ADD_EXPENSE':
                return { label: 'Add Expense', detail: `"${action.description}" for $${action.amount}`, color: 'indigo', icon: <Plus className="w-4 h-4" /> };
            case 'GROUP_EXPENSE':
                return { label: 'Add Group Expense', detail: `"${action.description}" for $${action.amount}`, color: 'indigo', icon: <Plus className="w-4 h-4" /> };
            case 'DELETE_EXPENSE':
                return { label: 'Delete Expense', detail: `"${action.description}" ($${action.amount})`, color: 'rose', icon: <Trash2 className="w-4 h-4" /> };
            case 'SETTLE_UP':
                return { label: 'Settle Up', detail: `Pay ${action.friendName} $${Math.abs(action.amount)}`, color: 'emerald', icon: <HandCoins className="w-4 h-4" /> };
            default:
                return { label: action.type, detail: '', color: 'slate', icon: <Info className="w-4 h-4" /> };
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-[#0f172a] text-slate-100 font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Paywise AI</span>
                </div>
                <div className="w-8" />
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {/* Suggestion chips — only on first message */}
                {messages.length === 1 && suggestions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-200">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(null, suggestion.text, true)}
                                className="bg-slate-800/40 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 p-3 rounded-2xl text-left transition-all group"
                            >
                                <span className="text-xl mb-1 block">{suggestion.icon}</span>
                                <span className="text-xs font-medium text-slate-300 group-hover:text-white leading-tight">{suggestion.text}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Messages */}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                            </div>
                            <div className={`p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-100 rounded-tl-none border border-white/5'}`}>
                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="flex gap-3 items-center text-slate-400 ml-11">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">Thinking...</span>
                        </div>
                    </div>
                )}

                {/* Action confirmation card */}
                {proposedAction && proposedAction.type && proposedAction.type !== 'INFO_ONLY' && (() => {
                    const { label, detail, color, icon } = describeAction(proposedAction);
                    const colorMap = {
                        indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', text: 'text-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' },
                        rose:   { bg: 'bg-rose-500/10',   border: 'border-rose-500/25',   text: 'text-rose-400',   btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' },
                        emerald:{ bg: 'bg-emerald-500/10',border: 'border-emerald-500/25',text: 'text-emerald-400',btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' },
                        slate:  { bg: 'bg-slate-500/10',  border: 'border-slate-500/25',  text: 'text-slate-400',  btn: 'bg-slate-600 hover:bg-slate-700' },
                    };
                    const c = colorMap[color] || colorMap.slate;
                    return (
                        <div className={`mx-2 p-4 rounded-2xl border animate-in zoom-in-95 duration-300 ${c.bg} ${c.border}`}>
                            <div className={`flex items-center gap-2 mb-2 ${c.text}`}>
                                {icon}
                                <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
                            </div>
                            <p className="text-sm text-slate-200 mb-4">{detail}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={confirmAction}
                                    disabled={isLoading}
                                    className={`flex-1 text-white h-10 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${c.btn}`}
                                >
                                    <Check className="w-4 h-4" /> Confirm
                                </button>
                                <button
                                    onClick={() => setProposedAction(null)}
                                    className="px-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })()}

                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/10">
                <form onSubmit={handleSend} className="relative max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder='Try "Add $50 dinner with John" or "Who owes me?"'
                        className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-500"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 bottom-2 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
                <div className="mt-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Powered by Gemini · Paywise AI</p>
                </div>
            </footer>

            <AdGate
                isOpen={showAd}
                onClose={() => setShowAd(false)}
                onFinish={() => {
                    const msgToProcess = pendingMessage;
                    setPendingMessage('');
                    setShowAd(false);
                    setIsAiUnlocked(true);
                    localStorage.setItem('ai_unlocked', 'true');
                    handleSend(null, msgToProcess, true);
                }}
                type="ai"
            />
        </div>
    );
}
