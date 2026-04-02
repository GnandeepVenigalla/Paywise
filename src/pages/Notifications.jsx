import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, Bell, BellOff, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
};

export default function Notifications() {
    const { api } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to load notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => 
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleAction = (notification) => {
        if (!notification.isRead) markAsRead(notification._id);
        if (notification.actionUrl) {
            let url = notification.actionUrl;
            
            // Smart Legacy URL Resolution
            // If the old notification has a generic URL but contains specific metadata, use it.
            const meta = notification.metadata || {};
            if (url === '/groups' && meta.groupId) {
                url = `/group/${meta.groupId}`;
                if (meta.expenseId) url += `?expenseId=${meta.expenseId}`;
            } else if (url === '/friends' && (meta.actorId || meta.friendId)) {
                url = `/friend/${meta.actorId || meta.friendId}`;
                if (meta.expenseId) url += `?expenseId=${meta.expenseId}`;
            } else if (url.startsWith('/friends/')) {
                url = url.replace('/friends/', '/friend/');
            }
            
            navigate(url);
        }
    };

    const getIcon = (type, category) => {
        switch (category) {
            case 'expense': return '💰';
            case 'loan': return '🤝';
            case 'friend': return '👋';
            case 'group': return '👥';
            default: return '🔔';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 font-sans text-slate-800 dark:text-slate-200">
            <header className="pt-8 pb-4 px-5 bg-white dark:bg-slate-900 sticky top-0 z-20 flex items-center justify-between shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Notifications</h1>
                <button 
                    onClick={markAllAsRead}
                    disabled={!notifications.some(n => !n.isRead)}
                    className="p-2 text-emerald-600 dark:text-emerald-400 disabled:opacity-30 disabled:grayscale transition"
                    title="Mark all as read"
                >
                    <CheckCheck className="w-6 h-6" />
                </button>
            </header>

            <main className="px-4 pt-4 max-w-lg mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
                            <BellOff className="w-10 h-10 text-slate-400 items-center" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">All quiet for now</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">When you get updates on expenses or friends, they'll show up here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((n) => (
                            <div 
                                key={n._id}
                                className={`group relative bg-white dark:bg-slate-800 p-4 rounded-3xl border transition-all duration-300 ${n.isRead ? 'border-transparent opacity-80' : 'border-emerald-100 dark:border-emerald-900/30 shadow-md shadow-emerald-500/5'}`}
                                onClick={() => handleAction(n)}
                            >
                                {!n.isRead && (
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                                )}
                                
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${n.isRead ? 'bg-slate-50 dark:bg-slate-700' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                                        {getIcon(n.type, n.category)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className={`font-bold text-[15px] truncate ${n.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                                {n.title}
                                            </h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 whitespace-nowrap">
                                                {formatTimeAgo(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug break-words">
                                            {n.message}
                                        </p>
                                        
                                        {n.actionUrl && (
                                            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 w-fit px-2.5 py-1 rounded-full">
                                                View details <ExternalLink className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(n._id);
                                    }}
                                    className="absolute -top-2 -right-2 p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm border border-rose-100 dark:border-rose-900/30"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
