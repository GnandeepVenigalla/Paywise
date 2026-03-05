import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, Share2, Contact } from 'lucide-react';

export default function InviteFriend() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isContactsSupported, setIsContactsSupported] = useState(false);
    const { api } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            setIsContactsSupported(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/auth/invite', { email });
            setSuccess(res.data.msg || 'Invitation sent successfully!');
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to send invitation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Paywise',
                    text: "Hey! Let's use Paywise to split our expenses. It makes things so much easier. Join me here:",
                    url: window.location.origin,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            alert('Sharing is not supported on this browser. Please use the email invite below.');
        }
    };

    const handleContactPick = async () => {
        const props = ['name', 'email', 'tel'];
        const opts = { multiple: false };
        try {
            const contacts = await navigator.contacts.select(props, opts);
            if (contacts.length > 0) {
                const contact = contacts[0];
                if (contact.email && contact.email.length > 0) {
                    setEmail(contact.email[0]);
                    setSuccess(`Selected ${contact.name[0] || 'contact'}. You can now send them an email invite.`);
                } else if (contact.tel && contact.tel.length > 0) {
                    // Using native share if they only have a phone number (SMS/WhatsApp)
                    if (navigator.share) {
                        try {
                            await navigator.share({
                                title: 'Join Paywise',
                                text: `Hey ${contact.name[0] || ''}! Let's use Paywise to split expenses. Join here:`,
                                url: window.location.origin,
                            });
                        } catch (err) {
                            console.log('Error sharing via SMS/WhatsApp:', err);
                        }
                    } else {
                        alert(`Selected contact doesn't have an email address. Try adding them manually.`);
                    }
                } else {
                    alert('Selected contact has no email or phone number.');
                }
            }
        } catch (err) {
            console.error('Contact selection failed:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white px-4 py-4 pt-8 shadow-sm sticky top-0 z-10">
                <div className="flex justify-between items-center mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">Invite a Friend</h2>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="flex-1 p-4 flex flex-col items-center pt-8">
                <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Share2 className="w-10 h-10 text-emerald-700" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Grow Your Squad</h3>
                <p className="text-gray-500 text-center mb-8 px-4 font-medium text-sm">
                    Invite your friends to Paywise to make splitting bills effortless.
                </p>

                <div className="w-full max-w-sm space-y-4 mb-4">
                    <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                    >
                        <Share2 className="w-5 h-5" />
                        Share Invite Link (WhatsApp, SMS, etc.)
                    </button>

                    {isContactsSupported && (
                        <button
                            onClick={handleContactPick}
                            className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                        >
                            <Contact className="w-5 h-5 text-slate-600" />
                            Select from Contacts
                        </button>
                    )}
                </div>

                <div className="flex items-center w-full max-w-sm my-4">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="mx-4 text-gray-400 text-xs font-bold uppercase">OR SEND EMAIL</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{error}</div>}

                    {success && (
                        <div className="mb-6 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center fade-in">
                            <CheckCircle2 className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                            <p className="text-xs text-slate-950 font-medium">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Friend's Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all outline-none"
                                    placeholder="friend@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? 'Sending Email...' : 'Send Email Invite'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
