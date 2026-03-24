import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ChevronLeft, MessageCircle, HelpCircle, Send, Ticket } from 'lucide-react';

export default function HelpSupport() {
    const { user, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const toast = useRef(null);

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeTickets, setActiveTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [replyMsg, setReplyMsg] = useState({}); // Tracking reply per ticket ID

    useEffect(() => {
        fetchTickets();
    }, []);

    const faqs = [
        {
            q: "How do I add an expense?",
            a: "You can add an expense by clicking the '+' button on the Dashboard or within a specific Group or Friend page. Simply enter the description, amount, and who paid."
        },
        {
            q: "What is 'Settle Up'?",
            a: "Settle Up records a payment made between you and someone else. It clears the balance without creating a new shared expense. You can do this via Cash or Bank Transfer records."
        },
        {
            q: "How do I split expenses in a group?",
            a: "When adding a group expense, you can choose to split it equally, by percentage, or manually assign specific items using the 'Split by Items' feature."
        },
        {
            q: "What is a 'Loan' in Paywise?",
            a: "A loan is a special type of expense where you can track interest rates. Paywise will automatically calculate and add interest monthly based on the rate you set."
        },
        {
            q: "How can I change my currency?",
            a: "Go to Account > Currency Settings. You can set your default display currency there. Paywise handles the conversion automatically based on live exchange rates."
        }
    ];

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        if (!subject || !message) {
            toast.current.show({ severity: 'warn', summary: 'Required', detail: 'Please fill in all fields' });
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/support', { subject, message });
            toast.current.show({ severity: 'success', summary: 'Submitted', detail: 'Your ticket has been sent to our team!' });
            setSubject('');
            setMessage('');
            setShowForm(false);
            fetchTickets();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to submit ticket' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplySubmit = async (ticketId) => {
        const msg = replyMsg[ticketId];
        if (!msg?.trim()) return;

        try {
            await api.post(`/support/${ticketId}/reply`, { message: msg });
            setReplyMsg(prev => ({ ...prev, [ticketId]: '' }));
            fetchTickets();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to send reply' });
        }
    };

    const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
            const res = await api.get('/support');
            setActiveTickets(res.data);
        } catch (err) {
            console.error("Failed to fetch tickets");
        } finally {
            setLoadingTickets(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
            <Toast ref={toast} />
            
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 py-4 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/account')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                        <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-slate-400" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Help & Support</h1>
                </div>
            </header>

            <main className="p-4 max-w-lg mx-auto space-y-6">
                {/* FAQ Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <HelpCircle className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200">Common Questions</h2>
                    </div>
                    
                    <Accordion className="custom-accordion">
                        {faqs.map((faq, i) => (
                            <AccordionTab key={i} header={faq.q}>
                                <p className="text-gray-600 dark:text-slate-400 text-[14px] leading-relaxed">
                                    {faq.a}
                                </p>
                            </AccordionTab>
                        ))}
                    </Accordion>
                </section>

                {/* Tickets Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200">Your Tickets</h2>
                        </div>
                        <Button 
                            label={showForm ? "Cancel" : "New Ticket"} 
                            icon={showForm ? "pi pi-times" : "pi pi-plus"}
                            className={`p-button-sm ${showForm ? 'p-button-secondary' : 'p-button-success'}`}
                            onClick={() => setShowForm(!showForm)}
                        />
                    </div>

                    {showForm && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Subject</label>
                                    <InputText 
                                        value={subject} 
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="What's going on?"
                                        className="w-full bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 rounded-xl py-3 px-4 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                                    <InputTextarea 
                                        value={message} 
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Give us more details..."
                                        rows={4}
                                        className="w-full bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 rounded-xl py-3 px-4"
                                    />
                                </div>
                                <Button 
                                    label={submitting ? "Sending..." : "Submit Ticket"} 
                                    icon={<Send className="w-4 h-4 mr-2" />}
                                    disabled={submitting}
                                    className="w-full bg-emerald-600 border-none py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition"
                                />
                            </form>
                        </div>
                    )}

                    {activeTickets.length > 0 ? (
                        <div className="space-y-3">
                            {activeTickets.map(ticket => (
                                <div key={ticket._id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-slate-100 truncate flex-1 pr-2">{ticket.subject}</h3>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                            ticket.status === 'open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500' :
                                            ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {/* Main message */}
                                        <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg text-[13px] text-gray-700 dark:text-slate-300">
                                            {ticket.message}
                                        </div>

                                        {/* Admin response (Legacy/First) */}
                                        {ticket.adminResponse && (
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border-l-4 border-emerald-500 animate-in slide-in-from-left duration-300">
                                                <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-500 uppercase mb-1">Reponse from Support</p>
                                                <p className="text-[13px] text-emerald-800 dark:text-emerald-400 italic">"{ticket.adminResponse}"</p>
                                            </div>
                                        )}

                                        {/* Reply Thread */}
                                        {ticket.replies && ticket.replies.map((reply, idx) => (
                                            <div key={idx} className={`p-3 rounded-lg animate-in slide-in-from-bottom duration-300 ${
                                                reply.isAdmin 
                                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500' 
                                                : 'bg-indigo-50 dark:bg-indigo-950/20 border-r-4 border-indigo-500 text-right'
                                            }`}>
                                                <p className={`text-[10px] font-black uppercase mb-1 ${reply.isAdmin ? 'text-emerald-700 dark:text-emerald-500' : 'text-indigo-700 dark:text-indigo-400'}`}>
                                                    {reply.isAdmin ? 'Support' : 'You'}
                                                </p>
                                                <p className="text-[13px] text-gray-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                    {reply.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Reply Box */}
                                    {ticket.status !== 'closed' && (
                                        <div className="mt-4 flex gap-2">
                                            <InputText 
                                                value={replyMsg[ticket._id] || ''} 
                                                onChange={(e) => setReplyMsg(prev => ({ ...prev, [ticket._id]: e.target.value }))}
                                                placeholder="Reply back..."
                                                className="flex-1 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-sm rounded-lg py-2 px-3"
                                            />
                                            <Button 
                                                icon={<Send className="w-4 h-4" />}
                                                onClick={() => handleReplySubmit(ticket._id)}
                                                className="bg-emerald-600 border-none rounded-lg px-3"
                                                disabled={!replyMsg[ticket._id]}
                                            />
                                        </div>
                                    )}

                                    <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800/50">
                                        Ticket Opened: {new Date(ticket.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        !showForm && (
                            <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-slate-800 cursor-pointer hover:border-emerald-200 transition" onClick={() => setShowForm(true)}>
                                <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 dark:text-slate-400 font-medium">No open tickets. Need help?</p>
                                <p className="text-xs text-emerald-600 font-bold mt-1">Submit a request</p>
                            </div>
                        )
                    )}
                </section>
            </main>

            {/* Float helper button */}
            {!showForm && (
                <button 
                    onClick={() => navigate('/ai')}
                    className="fixed bottom-24 right-5 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition active:scale-95 animate-bounce-subtle"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}
