import { useGoogleLogin } from '@react-oauth/google';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Google "G" SVG logo
function GoogleLogo() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

export default function GoogleSignInButton({ onError, onRequireOtp }) {
    const { googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const login = useGoogleLogin({
        flow: 'implicit',
        onSuccess: async (tokenResponse) => {
            try {
                // Get user info from Google using access token
                const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                }).then(r => r.json());

                // Build a minimal ID token substitute — we send the sub+email+name directly
                // OR: use auth-code flow. Here we use access_token to fetch user info
                // then call our own backend with the info
                const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://paywise-backend-lemon.vercel.app/api' : '/api')) + '/auth/google-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        googleId: userInfo.sub,
                        email: userInfo.email,
                        name: userInfo.name,
                        picture: userInfo.picture
                    })
                });
                
                const data = await res.json();
                
                if (!res.ok) {
                    throw new Error(data.msg || 'Google sign-in failed');
                }
                
                if (data.requireOtp) {
                    if (onRequireOtp) {
                        onRequireOtp(data.email, data.msg);
                    }
                    return;
                }
                
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard';
            } catch (err) {
                if (onError) onError(err.message || 'Google sign-in failed. Please try again.');
            }
        },
        onError: () => {
            if (onError) onError('Google sign-in was cancelled or failed.');
        }
    });

    return (
        <button
            type="button"
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold text-gray-700 text-sm shadow-sm hover:shadow-md active:scale-[0.98]"
        >
            <GoogleLogo />
            Continue with Google
        </button>
    );
}
