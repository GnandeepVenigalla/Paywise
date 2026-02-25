import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Users, Search, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import logoImg from '../assets/logo.png';

export default function Friends() {
    const { api, user } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFriends();
    }, [api]);

    const fetchFriends = async () => {
        try {
            const res = await api.get('/auth/friends');
            setFriends(res.data);
        } catch (err) {
            console.error('Failed to fetch friends', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (q.length > 2) {
            try {
                const res = await api.get(`/auth/users?q=${q}`);
                // Filter out current user and existing friends
                const friendIds = friends.map(f => f.id);
                const results = res.data.filter(u => u._id !== user.id && !friendIds.includes(u._id));
                setSearchResults(results);
            } catch (err) {
                console.error(err);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleAddFriend = async (friendId) => {
        try {
            await api.post('/auth/friends', { friendId });
            setIsAddingMode(false);
            setSearchQuery('');
            setSearchResults([]);
            setLoading(true);
            fetchFriends();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error adding friend');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm pt-8 pb-4 px-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={logoImg} alt="Paywise" className="w-8 h-8 object-contain" />
                    <h1 className="text-xl font-bold text-gray-900">Paywise</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddingMode(!isAddingMode)}
                        className="p-2 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 transition shadow-sm"
                    >
                        {isAddingMode ? <Users className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    </button>
                    <Link to="/account" className="w-9 h-9 rounded-full bg-teal-100 border-2 border-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg uppercase shadow-sm border-l-gray-200 ml-1 cursor-pointer hover:bg-teal-200 transition">
                        {user?.username?.charAt(0) || 'U'}
                    </Link>
                </div>
            </header>

            <main className="px-4 pt-6 max-w-md mx-auto">
                {isAddingMode ? (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Find Friends</h2>
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search by email or username..."
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-3">
                            {searchResults.length > 0 ? (
                                searchResults.map(result => (
                                    <div key={result._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold uppercase">
                                                {result.username.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{result.username}</h4>
                                                <p className="text-xs text-gray-500">{result.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddFriend(result._id)}
                                            className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg text-sm font-bold hover:bg-teal-100 transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))
                            ) : searchQuery.length > 2 ? (
                                <p className="text-center text-sm text-gray-500 py-8">No matching users found.</p>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <>
                        {loading ? (
                            <div className="flex justify-center mt-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                            </div>
                        ) : friends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center mt-32">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
                                    <Users className="w-12 h-12" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">No friends yet</h2>
                                <p className="text-gray-500 text-center text-sm px-8 leading-relaxed max-w-sm">Search the app and add friends to split bills instantly without making a group.</p>
                                <button
                                    onClick={() => setIsAddingMode(true)}
                                    className="mt-8 font-bold bg-teal-600 text-white rounded-xl py-4 px-10 shadow-md hover:bg-teal-700 transition"
                                >
                                    Find a Friend
                                </button>
                                <p className="text-xs text-gray-400 mt-6 uppercase tracking-wider font-semibold">Or share an invite link</p>
                                <Link to="/invite" className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-bold transition flex items-center gap-1">
                                    Invite outside Paywise <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-800 mb-2">Your Friends</h2>
                                {friends.map(friend => (
                                    <Link
                                        to={`/friend/${friend.id}`}
                                        key={friend.id}
                                        className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-100 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center font-bold text-lg uppercase group-hover:scale-105 transition">
                                                    {friend.username.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{friend.username}</h3>
                                                    <p className="text-xs text-gray-500">{friend.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                {friend.balance > 0 ? (
                                                    <p className="font-bold text-teal-600">owes you ${friend.balance.toFixed(2)}</p>
                                                ) : friend.balance < 0 ? (
                                                    <p className="font-bold text-rose-600">you owe ${Math.abs(friend.balance).toFixed(2)}</p>
                                                ) : (
                                                    <p className="font-medium text-gray-400">settled up</p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
