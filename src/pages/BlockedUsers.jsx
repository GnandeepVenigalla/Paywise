import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, UserX, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Avatar from '../components/UI/Avatar';

export default function BlockedUsers() {
    const { api } = useContext(AuthContext);
    const navigate = useNavigate();
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBlockedUsers = async () => {
        try {
            const res = await api.get('/auth/friends/blocked');
            setBlockedUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch blocked users:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const handleUnblock = async (userId) => {
        if (!window.confirm('Are you sure you want to unblock this user?')) return;

        try {
            await api.post(`/auth/friends/unblock/${userId}`);
            // Update local state
            setBlockedUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
        } catch (err) {
            alert('Failed to unblock user: ' + (err.response?.data?.msg || err.message));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white px-6 py-6 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-4">
                <button
                    onClick={() => navigate('/account')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Blocked Users</h1>
            </header>

            <main className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : blockedUsers.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserCheck className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Clean Slate!</h2>
                        <p className="text-gray-500 max-w-[240px] mx-auto text-sm">
                            You haven't blocked anyone yet. Your community is looking friendly.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 mb-2">
                            {blockedUsers.length} Blocked {blockedUsers.length === 1 ? 'User' : 'Users'}
                        </p>
                        {blockedUsers.map(user => (
                            <Card key={user._id || user.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <Avatar name={user.username} size="md" />
                                        <div className="min-w-0">
                                            <h3 className="text-gray-900 font-bold truncate leading-tight">
                                                {user.username}
                                            </h3>
                                            <p className="text-gray-400 text-xs truncate mt-0.5">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="!px-4 !py-2 !h-auto text-xs font-bold"
                                        onClick={() => handleUnblock(user._id || user.id)}
                                    >
                                        Unblock
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
