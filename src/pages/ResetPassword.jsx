import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import logoFull from '../assets/logo_full.png';
export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { resettoken } = useParams();
    const { api } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await api.put(`/auth/resetpassword/${resettoken}`, { password });
            setSuccess('Your password has been successfully reset! You can now log in.');
            setTimeout(() => navigate('/login'), 3000); // Redirect after 3s
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid or expired token. Please request a new reset link.');
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
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create New Password</h2>
                    <p className="text-sm text-gray-500 mt-2">Enter the new password for your account</p>
                </div>

                {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{error}</div>}

                {success ? (
                    <div className="text-center py-6">
                        <CheckCircle2 className="w-16 h-16 text-teal-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h3>
                        <p className="text-gray-500 mb-6">{success}</p>
                        <Link to="/login" className="inline-block bg-teal-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-teal-700 transition">
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all cursor-pointer"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
