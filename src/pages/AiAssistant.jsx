import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, ChevronLeft, Sparkles, Plus, Check, X, Loader2, Trash2 } from 'lucide-react';
import logoImg from '../assets/logo.png';
import AdGate from '../components/UI/AdGate';

export default function AiAssistant() {
    const { user, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { id: 1, text: `Hi ${user?.username}! I'm Paywise AI. How can I help you today?`, sender: 'bot' }
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
                console.error('Failed to fetch suggestions:', err);
                // Fallback
                setSuggestions([
                    { text: "Add $20 for coffee", icon: "☕" },
                    { text: "Who owes me?", icon: "💰" },
                    { text: "Delete last expense", icon: "🗑️" },
                    { text: "Check balance", icon: "📊" }
                ]);
            }
        };
        fetchSuggestions();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (e, overrideText = null, isRetry = false) => {
        if (e) e.preventDefault();
        const messageText = (overrideText || input || '').trim();
        
        if (!messageText || isLoading) return;
        
        // Skip ad check ONLY if explicitly allowed OR if already unlocked
        const isCurrentlyUnlocked = isAiUnlocked || localStorage.getItem('ai_unlocked') === 'true';

        if (!isCurrentlyUnlocked && !isRetry) {
            setPendingMessage(messageText);
            setShowAd(true);
            return;
        }

        // Add user message immediately
        const userMsg = { id: Date.now() + Math.random(), text: messageText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: messageText });
            const data = res.data || {};
            const reply = typeof data.reply === 'string' ? data.reply : "I received a response, but couldn't understand it.";

            // Extract action if present
            const actionMatch = reply.match(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/);
            let cleanedReply = reply.replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/, '').trim();
            
            if (!cleanedReply) cleanedReply = "Action processed!";

            setMessages(prev => [...prev, { 
                id: Date.now() + Math.random(), 
                text: cleanedReply, 
                sender: 'bot' 
            }]);

            if (actionMatch) {
                try {
                    const actionData = JSON.parse(actionMatch[1]);
                    setProposedAction(actionData);
                } catch (err) {
                    console.error('Failed to parse AI action:', err);
                }
            }
        } catch (err) {
            console.error('AI Send Failure:', err);
            setMessages(prev => [...prev, { 
                id: Date.now() + Math.random(), 
                text: "My connection timed out! Please try again in 5 seconds.", 
                sender: 'bot' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmAction = async () => {
        if (!proposedAction) return;
        setIsLoading(true);
        try {
            if (proposedAction.type === 'ADD_EXPENSE') {
                const { description, amount, recipientType, recipientId, participants, paidBy: actionPaidBy } = proposedAction.data;
                const payload = {
                    description,
                    amount,
                    [recipientType === 'group' ? 'group' : 'paidBy']: recipientId,
                    paidBy: actionPaidBy || user.id, 
                    splits: []
                };

                if (participants && participants.length > 0) {
                    const splitAmt = amount / participants.length;
                    payload.splits = participants.map(pId => ({
                        user: pId,
                        amount: splitAmt
                    }));
                }

                await api.post('/expenses', payload);
                setMessages(prev => [...prev, { id: Date.now(), text: `Done! I've added the expense: "${description}" for $${amount}.`, sender: 'bot' }]);
                setProposedAction(null);
            } else if (proposedAction.type === 'DELETE_EXPENSE') {
                const { expenseId, description, amount } = proposedAction.data;
                await api.delete(`/expenses/${expenseId}`);
                setMessages(prev => [...prev, { id: Date.now(), text: `Removed! I've deleted the expense: "${description}" for $${amount}.`, sender: 'bot' }]);
                setProposedAction(null);
            }
        } catch (err) {
            setMessages(prev => [...prev, { id: Date.now(), text: `I couldn't perform that action. ${err.response?.data?.msg || "There might be a technical issue."}`, sender: 'bot' }]);
        } finally {
            setIsLoading(false);
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
                <div className="w-8" /> {/* Spacer */}
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {messages.length === 1 && suggestions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-200">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInput(suggestion.text);
                                }}
                                className="bg-slate-800/40 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 p-3 rounded-2xl text-left transition-all group"
                            >
                                <span className="text-xl mb-1 block">{suggestion.icon}</span>
                                <span className="text-xs font-medium text-slate-300 group-hover:text-white leading-tight">{suggestion.text}</span>
                            </button>
                        ))}
                    </div>
                )}

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
                
                {isLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="flex gap-3 items-center text-slate-400 ml-11">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">Thinking...</span>
                        </div>
                    </div>
                )}

                {proposedAction && proposedAction.data && (
                    <div className={`mx-11 p-4 rounded-2xl border animate-in zoom-in-95 duration-300 ${proposedAction.type === 'DELETE_EXPENSE' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                        <div className={`flex items-center gap-2 mb-2 ${proposedAction.type === 'DELETE_EXPENSE' ? 'text-rose-400' : 'text-indigo-400'}`}>
                            {proposedAction.type === 'DELETE_EXPENSE' ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            <span className="text-sm font-bold uppercase tracking-wider">
                                {proposedAction.type === 'DELETE_EXPENSE' ? 'Confirm Deletion' : 'Proposed Action'}
                            </span>
                        </div>
                        <p className="text-sm mb-4">
                            {proposedAction.type === 'DELETE_EXPENSE' ? (
                                <>Delete expense: <strong className="text-white">"{proposedAction.data.description || 'Untitled'}"</strong> for <strong className="text-rose-400">${proposedAction.data.amount || 0}</strong>?</>
                            ) : (
                                <>Add expense: <strong className="text-white">"{proposedAction.data.description || 'New Expense'}"</strong> for <strong className="text-emerald-400">${proposedAction.data.amount || 0}</strong>?</>
                            )}
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={confirmAction}
                                className={`flex-1 text-white h-10 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${proposedAction.type === 'DELETE_EXPENSE' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 shadow-lg'}`}
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
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/10">
                <form onSubmit={handleSend} className="relative max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder='Try "Add $20 for coffee" or "What do I owe Suzz?"'
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
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Powered by Gemini 2.5 Flash</p>
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
                    // Pass isRetry = true to bypass the lock check
                    handleSend(null, msgToProcess, true);
                }}
                type="ai"
            />
        </div>
    );
}
