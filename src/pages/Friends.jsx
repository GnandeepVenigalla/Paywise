import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, HeartHandshake, Search, Plus, ArrowRight, ArrowLeft, Contact, Share2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import logoImg from '../assets/logo.png';
import { formatCurrency } from '../utils/formatters';

export default function Friends() {
    const { api, user } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [scannedResults, setScannedResults] = useState(null);
    const [isContactsSupported, setIsContactsSupported] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            setIsContactsSupported(true);
        }
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
        setScannedResults(null);

        if (!q) {
            setSearchResults([]);
            return;
        }

        const isEmail = q.includes('@') && q.includes('.');
        const isPhone = q.length >= 10 && /^\d+$/.test(q.replace(/[^\d]/g, ''));

        if (isEmail || isPhone) {
            try {
                const res = await api.get(`/auth/users?q=${encodeURIComponent(q)}`);
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

    const handleScanContacts = async () => {
        const props = ['name', 'email', 'tel'];
        const opts = { multiple: true };
        try {
            const contacts = await navigator.contacts.select(props, opts);
            if (contacts.length === 0) return;

            setLoading(true);

            const contactIdentifiers = [];
            const rawContacts = [];

            contacts.forEach(c => {
                let identifier = null;
                if (c.email && c.email.length > 0) identifier = c.email[0];
                else if (c.tel && c.tel.length > 0) {
                    identifier = c.tel[0].replace(/[^\d+]/g, '');
                    // sometimes it includes things like spaces, just basic sanitization
                }

                if (identifier) {
                    contactIdentifiers.push(identifier);
                    rawContacts.push({ name: c.name?.[0] || 'Unknown', identifier, email: c.email?.[0], tel: c.tel?.[0] });
                }
            });

            if (contactIdentifiers.length === 0) {
                setLoading(false);
                alert('Selected contacts have no email or phone.');
                return;
            }

            const res = await api.post('/auth/users/bulk', { contacts: contactIdentifiers });
            const foundUsers = res.data;

            const existingFriendIds = friends.map(f => f.id);
            const foundOnPaywise = foundUsers.filter(u => u._id !== user.id && !existingFriendIds.includes(u._id));

            const notFound = [];
            const foundIdentifiers = foundUsers.map(u => u.email).concat(foundUsers.map(u => u.phone));

            rawContacts.forEach(rc => {
                if (!foundIdentifiers.includes(rc.email) && !foundIdentifiers.includes(rc.identifier) && rc.identifier !== user.email && rc.identifier !== user.phone) {
                    notFound.push(rc);
                }
            });

            setScannedResults({ foundOnPaywise, notFound });
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) {
            console.error('Contact scan failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteShare = async (contact) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Paywise',
                    text: `Hey ${contact.name}! Let's use Paywise to split expenses. Join here:`,
                    url: window.location.origin,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            alert('Share not supported');
        }
    };

    const handleAddFriend = async (friendId) => {
        try {
            await api.post('/auth/friends', { friendId });
            setIsAddingMode(false);
            setSearchQuery('');
            setSearchResults([]);
            setScannedResults(null);
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
                        onClick={() => { setIsAddingMode(!isAddingMode); setScannedResults(null); setSearchQuery(''); setSearchResults([]); }}
                        className="p-2 rounded-full bg-slate-50 text-slate-900 hover:bg-slate-100 transition shadow-sm"
                    >
                        {isAddingMode ? <HeartHandshake className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    </button>
                    <Link to="/account" className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-50 text-slate-950 flex items-center justify-center font-bold text-lg uppercase shadow-sm border-l-gray-200 ml-1 cursor-pointer hover:bg-slate-200 transition">
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
                                placeholder="Enter exact email or phone number..."
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none shadow-sm"
                                autoFocus
                            />
                        </div>

                        {isContactsSupported && !scannedResults ? (
                            <button
                                onClick={handleScanContacts}
                                className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                            >
                                <Contact className="w-5 h-5 text-slate-600" />
                                Select from Phone Contacts
                            </button>
                        ) : !isContactsSupported && !scannedResults ? (
                            <div className="w-full mb-6 p-4 border border-emerald-200 bg-emerald-50 rounded-xl shadow-sm">
                                <h4 className="flex items-center gap-2 font-bold text-emerald-900 mb-1">
                                    <Share2 className="w-4 h-4 text-emerald-700" /> Share Invite Link
                                </h4>
                                <p className="text-xs text-emerald-800/80 mb-3 font-medium leading-relaxed">
                                    Apple highly restricts contact access on iPhones for strict privacy. Safely invite friends via iMessage, WhatsApp, or SMS using the secure Share Link below!
                                </p>
                                <button
                                    onClick={() => handleInviteShare({ name: 'friend' })}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                                >
                                    Share Link Now
                                </button>
                            </div>
                        ) : null}

                        {(searchResults.length > 0 || (scannedResults && scannedResults.foundOnPaywise.length > 0)) && (
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">On Paywise</h3>
                        )}

                        <div className="space-y-3">
                            {searchResults.length > 0 && searchResults.map(result => (
                                <div key={result._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 text-slate-950 rounded-full flex items-center justify-center font-bold uppercase">
                                            {result.username.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{result.username}</h4>
                                            <p className="text-xs text-gray-500">{result.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddFriend(result._id)}
                                        className="px-3 py-1.5 bg-slate-50 text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition"
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}

                            {scannedResults && scannedResults.foundOnPaywise.map(result => (
                                <div key={result._id} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold uppercase">
                                            {result.username.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{result.username}</h4>
                                            <p className="text-xs text-emerald-600 font-medium">Found on Paywise</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddFriend(result._id)}
                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 transition"
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>

                        {scannedResults && scannedResults.notFound.length > 0 && (
                            <>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">Invite to Paywise</h3>
                                <div className="space-y-3">
                                    {scannedResults.notFound.map((contact, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center font-bold uppercase">
                                                    {contact.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{contact.name}</h4>
                                                    <p className="text-xs text-gray-500">{contact.identifier}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleInviteShare(contact)}
                                                className="px-3 py-1.5 bg-slate-50 text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition flex items-center gap-1"
                                            >
                                                <Share2 className="w-4 h-4" /> Invite
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {(!scannedResults && searchResults.length === 0 && searchQuery.length > 5) ? (
                            <p className="text-center text-sm text-gray-500 py-8">No matching users found for "{searchQuery}". Make sure you entered the full exact email or phone number.</p>
                        ) : null}

                        {scannedResults && scannedResults.foundOnPaywise.length === 0 && scannedResults.notFound.length === 0 && (
                            <p className="text-center text-sm text-gray-500 py-8">No contacts matched.</p>
                        )}
                    </div>
                ) : (
                    <>
                        {loading ? (
                            <div className="fixed inset-0 bg-[#1e293b] flex flex-col items-center justify-center z-[100]">
                                <div className="w-[110px] h-[110px] animate-pulse">
                                    <img src={logoImg} alt="Paywise Logo" className="w-full h-full object-contain drop-shadow-lg" />
                                </div>
                            </div>
                        ) : friends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center mt-32">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
                                    <HeartHandshake className="w-12 h-12" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">No friends yet</h2>
                                <p className="text-gray-500 text-center text-sm px-8 leading-relaxed max-w-sm">Search the app and add friends to split bills instantly without making a group.</p>
                                <button
                                    onClick={() => setIsAddingMode(true)}
                                    className="mt-8 font-bold bg-slate-900 text-white rounded-xl py-4 px-10 shadow-md hover:bg-slate-950 transition"
                                >
                                    Find a Friend
                                </button>
                                <p className="text-xs text-gray-400 mt-6 uppercase tracking-wider font-semibold">Or share an invite link</p>
                                <Link to="/invite" className="mt-2 text-sm text-slate-900 hover:text-slate-950 font-bold transition flex items-center gap-1">
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
                                        className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-slate-100 transition-all group"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center font-bold text-lg uppercase flex-shrink-0 group-hover:scale-105 transition-all">
                                                    {friend.username.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-gray-900 text-[16px] truncate leading-tight">{friend.username}</h3>
                                                    <p className="text-[12px] text-gray-400 truncate mt-0.5">{friend.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                {friend.balance > 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[11px] font-black uppercase tracking-tight text-emerald-500/80 mb-0.5">owes you</span>
                                                        <span className="text-[16px] font-black text-emerald-500 leading-none">
                                                            {formatCurrency(friend.balance, user.defaultCurrency)}
                                                        </span>
                                                    </div>
                                                ) : friend.balance < 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[11px] font-black uppercase tracking-tight text-rose-500/80 mb-0.5">you owe</span>
                                                        <span className="text-[16px] font-black text-rose-600 leading-none">
                                                            {formatCurrency(Math.abs(friend.balance), user.defaultCurrency)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">settled up</p>
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
