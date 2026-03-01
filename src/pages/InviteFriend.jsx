import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export default function InviteFriend() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { api } = useContext(AuthContext);
    const navigate = useNavigate();

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

            <main className="flex-1 p-4 flex flex-col items-center pt-10">
                <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Send className="w-10 h-10 text-slate-900 ml-1" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2text-center">Grow Your Squad</h3>
                <p className="text-gray-500 text-center mb-8 px-4 font-medium">
                    Invite your friends to Paywise to make splitting bills effortless. We'll send them a clean email invitation with a link to join!
                </p>

                <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{error}</div>}

                    {success && (
                        <div className="mb-6 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center fade-in">
                            <CheckCircle2 className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                            <p className="text-sm text-slate-950 font-medium">{success}</p>
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
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-slate-800/20 text-sm font-bold text-white bg-slate-900 hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? 'Sending Invite...' : 'Send Invite'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
