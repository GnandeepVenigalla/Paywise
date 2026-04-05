import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, BellOff, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
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

// Swipeable notification card — swipe left to reveal delete button
function NotificationCard({ n, onAction, onDelete }) {
    const startX = useRef(null);
    const [offsetX, setOffsetX] = useState(0);
    const [swiped, setSwiped] = useState(false);
    const SWIPE_THRESHOLD = 60;

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
    };
    const handleTouchMove = (e) => {
        if (startX.current === null) return;
        const diff = e.touches[0].clientX - startX.current;
        if (diff < 0) setOffsetX(Math.max(diff, -80));
    };
    const handleTouchEnd = () => {
        if (offsetX < -SWIPE_THRESHOLD) {
            setSwiped(true);
            setOffsetX(-72);
        } else {
            setSwiped(false);
            setOffsetX(0);
        }
        startX.current = null;
    };

    const handleTap = () => {
        if (swiped) {
            // If already swiped open, close it on tap
            setSwiped(false);
            setOffsetX(0);
            return;
        }
        onAction(n);
    };

    const getIcon = (category) => {
        switch (category) {
            case 'expense': return '💰';
            case 'loan': return '🤝';
            case 'friend': return '👋';
            case 'group': return '👥';
            default: return '🔔';
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl mb-3 shadow-sm">
            {/* Red delete strip behind */}
            <div className="absolute inset-y-0 right-0 w-20 bg-rose-500 flex items-center justify-center rounded-3xl">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(n._id); }}
                    className="flex flex-col items-center gap-0.5 text-white"
                >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Delete</span>
                </button>
            </div>

            {/* Card that slides left */}
            <div
                className={`relative bg-white dark:bg-slate-800 p-4 rounded-3xl border transition-all duration-200 ease-out will-change-transform ${n.isRead ? 'border-transparent opacity-85' : 'border-emerald-100 dark:border-emerald-900/30'}`}
                style={{ transform: `translateX(${offsetX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleTap}
            >
                {/* Unread dot */}
                {!n.isRead && (
                    <div className="absolute top-3.5 right-14 w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
                )}

                {/* Always-visible delete button (for desktop + accessibility) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(n._id); }}
                    className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex gap-3 pr-6">
                    <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl shadow-inner ${n.isRead ? 'bg-slate-50 dark:bg-slate-700' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                        {getIcon(n.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                            <h4 className={`font-bold text-[14px] leading-snug ${n.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                {n.title}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mt-0.5">
                                {formatTimeAgo(n.createdAt)}
                            </span>
                        </div>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug break-words">
                            {n.message}
                        </p>

                        {n.actionUrl && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
                                View details <ExternalLink className="w-2.5 h-2.5" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Swipe hint text — only on unread */}
                {!n.isRead && !swiped && (
                    <p className="text-[9px] text-slate-300 text-right mt-1.5 pr-1 select-none">← swipe to delete</p>
                )}
            </div>
        </div>
    );
}

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

    useEffect(() => { fetchNotifications(); }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) { console.error(err); }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) { console.error(err); }
    };

    const deleteNotification = async (id) => {
        // Optimistic UI — remove instantly
        setNotifications(prev => prev.filter(n => n._id !== id));
        try {
            await api.delete(`/notifications/${id}`);
        } catch (err) {
            console.error(err);
            fetchNotifications(); // re-sync on failure
        }
    };

    const clearAll = async () => {
        if (!window.confirm('Delete all notifications?')) return;
        const ids = notifications.map(n => n._id);
        setNotifications([]);
        try {
            await Promise.all(ids.map(id => api.delete(`/notifications/${id}`)));
        } catch (err) {
            console.error(err);
            fetchNotifications();
        }
    };

    const handleAction = (notification) => {
        if (!notification.isRead) markAsRead(notification._id);
        if (notification.actionUrl) {
            let url = notification.actionUrl;
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

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 font-sans text-slate-800 dark:text-slate-200">
            <header className="pt-8 pb-4 px-5 bg-white dark:bg-slate-900 sticky top-0 z-20 flex items-center justify-between shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Notifications</h1>
                    {unreadCount > 0 && (
                        <p className="text-[11px] text-emerald-600 font-semibold">{unreadCount} unread</p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="p-2 text-emerald-600 dark:text-emerald-400 transition"
                            title="Mark all as read"
                        >
                            <CheckCheck className="w-5 h-5" />
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition"
                            title="Clear all notifications"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </header>

            <main className="px-4 pt-4 max-w-lg mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
                            <BellOff className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">All quiet for now</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">When you get updates on expenses or friends, they'll show up here.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-3 px-1">
                            Tap to open · Swipe left or tap 🗑 to delete
                        </p>
                        <div>
                            {notifications.map((n) => (
                                <NotificationCard
                                    key={n._id}
                                    n={n}
                                    onAction={handleAction}
                                    onDelete={deleteNotification}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
