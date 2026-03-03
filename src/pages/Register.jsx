import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Mail, Lock, User } from 'lucide-react';
import logoFull from '../assets/logo_full.png';
export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isOtpMode, setIsOtpMode] = useState(false);
    const [otp, setOtp] = useState('');
    const { register, verifyOtp, api } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await register(username, email, phone, password);
            if (res && res.requireOtp) {
                setIsOtpMode(true);
                setSuccess(res.msg || 'Verification code sent!');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await verifyOtp(email, otp);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid verification code');
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/auth/resend-otp', { email });
            setSuccess(res.data.msg || 'Code resent successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to resend code');
        }
    };


    return (
        <div className="flex bg-gray-50 flex-col items-center justify-center min-h-[100dvh] px-5 py-8">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl transition-all border border-gray-100 mx-auto">
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <img src={logoFull} alt="Paywise Logo" className="h-16 object-contain" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
                    <p className="text-sm text-gray-500 mt-2">Join Paywise to split bills easily</p>
                </div>

                {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{error}</div>}

                {success && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center font-medium">{success}</div>}

                {!isOtpMode ? (
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all outline-none"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

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

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Wallet className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="tel"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all outline-none"
                                placeholder="Phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all outline-none"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-950 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 transition-all"
                        >
                            Sign Up
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-2">
                            <p className="text-sm font-medium text-gray-600 mb-1">Enter the 6-digit code sent to</p>
                            <p className="text-md font-bold text-slate-900">{email}</p>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all outline-none tracking-widest text-center text-lg font-bold"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength="6"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={otp.length < 6}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-950 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Verify Account
                        </button>

                        <p className="text-center text-sm text-gray-600 cursor-pointer hover:underline pt-2" onClick={handleResendOtp}>
                            Didn't receive a code? Resend
                        </p>
                    </form>
                )}

                {!isOtpMode && (
                    <p className="mt-8 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-slate-900 hover:text-slate-800 transition-colors">
                            Log in
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
