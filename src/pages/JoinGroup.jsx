import { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function JoinGroup() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, api, loading } = useContext(AuthContext);
    const [error, setError] = useState('');

    useEffect(() => {
        if (loading) return;

        const joinGroup = async () => {
            try {
                if (user) {
                    await api.post(`/groups/${id}/join`);
                    navigate(`/group/${id}`);
                } else {
                    localStorage.setItem('joinGroupId', id);
                    navigate('/register');
                }
            } catch (err) {
                setError(err.response?.data?.msg || 'Failed to join group');
            }
        };

        joinGroup();
    }, [user, loading, id, navigate, api]);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-5">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl">Go Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-gray-600">Joining group...</p>
            </div>
        </div>
    );
}
