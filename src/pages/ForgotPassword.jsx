import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import logoFull from '../assets/logo_full.png';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState(''); // 'not_found' | 'google' | 'server'
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { api } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setErrorType('');
        setSuccess('');

        try {
            await api.post('/auth/forgotpassword', { email });
            setSuccess('Password reset link sent! Check your inbox (and spam folder).');
        } catch (err) {
            const msg = err.response?.data?.msg || 'Something went wrong. Please try again.';
            const status = err.response?.status;
            setError(msg);
            if (status === 404) setErrorType('not_found');
            else if (status === 400 && msg.toLowerCase().includes('google')) setErrorType('google');
            else setErrorType('server');
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
                    <p className="text-sm text-gray-500 mt-2">Enter your registered email to receive a reset link</p>
                </div>

                {/* Success state */}
                {success && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center space-y-2">
                        <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
                        <p className="text-sm text-emerald-800 font-semibold">{success}</p>
                        <p className="text-xs text-emerald-600 mt-1">The link expires in 10 minutes.</p>
                    </div>
                )}

                {/* Error: email not registered */}
                {error && errorType === 'not_found' && (
                    <div className="mb-5 bg-red-50 border border-red-100 p-4 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-700">{error}</p>
                                <Link
                                    to="/register"
                                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
                                >
                                    Create an account <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error: Google account */}
                {error && errorType === 'google' && (
                    <div className="mb-5 bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-blue-700">{error}</p>
                                <Link
                                    to="/login"
                                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                                >
                                    Go to Login <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error: generic server error */}
                {error && errorType === 'server' && (
                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                {/* Form — hidden once success */}
                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all outline-none"
                                placeholder="Your registered email"
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

                <div className="mt-8 flex items-center justify-center gap-4 text-sm">
                    <Link to="/login" className="font-semibold text-slate-900 hover:text-slate-700 transition-colors">
                        Back to login
                    </Link>
                    <span className="text-gray-300">·</span>
                    <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                        Create account
                    </Link>
                </div>
            </div>
        </div>
    );
}
