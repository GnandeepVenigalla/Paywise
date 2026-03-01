import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import logoFull from '../assets/logo_full.png';
export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { api } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/auth/forgotpassword', { email });
            setSuccess('If an account exists with that email, we have sent a password reset link.');
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col bg-gray-50 items-center justify-center min-h-[100dvh] px-5 py-8">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl transition-all border border-gray-100 mx-auto">
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <img src={logoFull} alt="Paywise Logo" className="h-16 object-contain" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Forgot Password?</h2>
                    <p className="text-sm text-gray-500 mt-2">Enter your email and we'll send you a reset link</p>
                </div>

                {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{error}</div>}
                {success && (
                    <div className="mb-6 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                        <CheckCircle2 className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                        <p className="text-sm text-slate-950 font-medium">{success}</p>
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all outline-none"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 transition-all cursor-pointer"
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm font-semibold text-slate-900 hover:text-slate-800 transition-colors">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}
