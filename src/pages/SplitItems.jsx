import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Check, Users, Receipt, DollarSign } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { formatCurrency } from '../utils/formatters';

export default function SplitItems() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { api, user } = useContext(AuthContext);

    const [items, setItems] = useState([]);
    const [group, setGroup] = useState(null);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]); // Default for assigning items
    const [paidBy, setPaidBy] = useState(user.id);
    const [isLoading, setIsLoading] = useState(false);
    const [saveReceipt, setSaveReceipt] = useState(true);

    useEffect(() => {
        fetchGroup();
        if (location.state?.aiItems) {
            // Transform cleanly formatted AI strings to exact objects
            const formattedAiItems = location.state.aiItems.map((item, index) => ({
                id: index + 1,
                name: item.name,
                price: item.price,
                assignedTo: []
            }));
            setItems(formattedAiItems);
        } else if (location.state?.text) {
            parseReceiptText(location.state.text);
        } else {
            // For testing if accessed directly without scan
            setItems([
                { id: 1, name: "Burger", price: 15.50, assignedTo: [] },
                { id: 2, name: "Fries", price: 5.00, assignedTo: [] },
                { id: 3, name: "Soda", price: 3.00, assignedTo: [] },
                { id: 4, name: "Tax", price: 2.35, assignedTo: [] }
            ]);
        }
    }, [id, location.state]);

    const fetchGroup = async () => {
        try {
            const isFriend = location.pathname.includes('/friend/');
            if (isFriend) {
                const res = await api.get(`/expenses/friends/${id}`);
                // Create a mock group with just the user and friend
                const currentUser = { ...user, _id: user.id || user._id };
                setGroup({ members: [currentUser, res.data.friend] });
                setSelectedMemberIds([currentUser._id]);
            } else {
                const res = await api.get(`/groups/${id}`);
                setGroup(res.data.group);
                setSelectedMemberIds([user.id]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const parseReceiptText = (text) => {
        const lines = text.split('\n');
        let parsedItems = [];
        let idCounter = 1;

        // Matches lines ending in a price (allowing an optional character at the very end like 'A' or 'E')
        const priceRegex = /(.+?)\s+[$]?(\d+\.\d{2})(?:\s*[A-Za-z%]{1,2})?$/;
        const ignoreKeywords = ['total', 'subtotal', 'change', 'amount', 'visa', 'mastercard', 'cash', 'due', 'balance', 'items sold', 'approved'];

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            const match = line.match(priceRegex);
            if (match) {
                let name = match[1].trim();
                const price = parseFloat(match[2]);

                // Filter out common non-item lines
                const isIgnored = ignoreKeywords.some(keyword => name.toLowerCase().includes(keyword));

                if (name && !isNaN(price) && !isIgnored && name.length > 2 && price > 0) {
                    // Clean up Costco/retailer SKUs (e.g., "E 782796 ***KSWTR40PK" -> "KSWTR40PK", "4873222 ALL F&C" -> "ALL F&C")
                    let cleanName = name.replace(/^(?:[A-Za-z]\s+)?\d+\s+/, '').trim();
                    cleanName = cleanName.replace(/^\*+/, '').trim(); // Remove leading asterisks

                    parsedItems.push({
                        id: idCounter++,
                        name: cleanName || name,
                        price,
                        assignedTo: []
                    });
                }
            }
        });

        if (parsedItems.length === 0) {
            alert("No items could be automatically detected. You may need to enter them manually.");
        }
        setItems(parsedItems);
    };

    const toggleAssign = (itemId) => {
        if (selectedMemberIds.length === 0) {
            alert("Please select at least one member at the top first.");
            return;
        }

        setItems(items.map(item => {
            if (item.id === itemId) {
                // If the currently selected members are ALL already assigned to this item, 
                // clicking it again should REMOVE them (deselect).
                const allSelectedAreAssigned = selectedMemberIds.every(id => item.assignedTo.includes(id));

                if (allSelectedAreAssigned && item.assignedTo.length > 0) {
                    const newAssigned = item.assignedTo.filter(id => !selectedMemberIds.includes(id));
                    return { ...item, assignedTo: newAssigned };
                } else {
                    // Otherwise, ADD the currently selected members to this item
                    const newAssigned = [...new Set([...item.assignedTo, ...selectedMemberIds])];
                    return { ...item, assignedTo: newAssigned };
                }
            }
            return item;
        }));
    };

    const clearAssignment = (itemId, e) => {
        e.stopPropagation();
        setItems(items.map(item =>
            item.id === itemId ? { ...item, assignedTo: [] } : item
        ));
    };

    const toggleMemberSelection = (memberId) => {
        setSelectedMemberIds(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const saveExpense = async () => {
        // Validate
        const totalAssigned = items.reduce((acc, item) => item.assignedTo.length > 0 ? acc + item.price : acc, 0);
        if (totalAssigned === 0) {
            alert('Please assign at least one item');
            return;
        }

        setIsLoading(true);

        // Calculate splits
        const userSplits = {};
        items.forEach(item => {
            if (item.assignedTo.length > 0) {
                // Split item cost equally among assigned members
                const splitAmount = item.price / item.assignedTo.length;
                item.assignedTo.forEach(memberId => {
                    userSplits[memberId] = (userSplits[memberId] || 0) + splitAmount;
                });
            }
        });

        const splitsArray = Object.keys(userSplits).map(userId => ({
            user: userId,
            amount: userSplits[userId]
        }));

        const totalAmount = items.reduce((acc, item) => acc + item.price, 0);
        const description = "Receipt Scan " + new Date().toLocaleDateString();

        const isFriend = location.pathname.includes('/friend/');

        try {
            const expRes = await api.post('/expenses', {
                description,
                amount: totalAmount, // or totalAssigned? usually receipt total
                currency: user?.defaultCurrency || 'USD',
                group: isFriend ? null : id,
                paidBy: paidBy,
                splits: splitsArray,
                items: items.map(i => ({
                    name: i.name,
                    price: i.price,
                    assignedTo: i.assignedTo
                }))
            });

            // If an image was scanned, upload it as a bill image for this expense
            if (location.state?.imageSrc && saveReceipt) {
                try {
                    const fetchRes = await fetch(location.state.imageSrc);
                    const blob = await fetchRes.blob();
                    const formData = new FormData();
                    formData.append('image', blob, 'receipt.jpg');
                    await api.post(`/upload/bill/${expRes.data._id}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } catch (imgErr) {
                    console.error('Failed to upload receipt image:', imgErr);
                }
            }

            navigate(isFriend ? `/friend/${id}` : `/group/${id}`);
        } catch (err) {
            console.error(err);
            alert('Failed to save expense');
            setIsLoading(false);
        }
    };

    if (!group) {
        return (
            <div className="fixed inset-0 bg-[#1e293b] flex flex-col items-center justify-center z-[100]">
                <div className="w-[110px] h-[110px] animate-pulse">
                    <img src={logoImg} alt="Paywise Logo" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
            </div>
        );
    }

    const total = items.reduce((sum, item) => sum + item.price, 0);
    const assignedTotal = items.reduce((sum, item) => item.assignedTo.length > 0 ? sum + item.price : sum, 0);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white px-4 py-4 pt-8 shadow-sm sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">Assign Items</h2>
                    <button
                        onClick={saveExpense}
                        disabled={isLoading || assignedTotal === 0}
                        className="text-slate-900 font-bold px-3 py-1.5 rounded-full hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>

                {/* Member selection pills */}
                <div className="flex justify-between items-center mt-2 px-1 pb-1">
                    <p className="text-xs text-gray-500 font-medium">Select recipients:</p>
                    <button
                        onClick={() => {
                            if (selectedMemberIds.length === group.members.length) {
                                setSelectedMemberIds([]);
                            } else {
                                setSelectedMemberIds(group.members.map(m => m._id));
                            }
                        }}
                        className="text-xs font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded hover:bg-slate-100 transition"
                    >
                        {selectedMemberIds.length === group.members.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mt-1">
                    {group.members.map(member => {
                        const isSelected = selectedMemberIds.includes(member._id);
                        return (
                            <button
                                key={member._id}
                                onClick={() => toggleMemberSelection(member._id)}
                                className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full border-2 transition-all font-semibold text-sm shadow-sm ${isSelected
                                    ? 'border-transparent bg-slate-900 text-white transform scale-105'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-slate-200'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] uppercase font-bold ${isSelected ? 'bg-white text-slate-900' : 'bg-gray-100 text-gray-500'}`}>
                                    {member.username.charAt(0)}
                                </div>
                                {member._id === user.id ? 'Me' : member.username}
                            </button>
                        )
                    })}
                </div>
                <p className="text-xs text-gray-500 font-medium text-center mt-2 mb-2">Tap recipients above, then tap items below to assign</p>

                <div className="flex items-center justify-center gap-2 mb-2 bg-gray-50 border border-gray-100 rounded-lg p-2 max-w-[200px] mx-auto shadow-inner">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid By:</span>
                    <select
                        className="text-sm font-bold bg-transparent text-slate-950 outline-none w-auto appearance-none cursor-pointer"
                        value={paidBy}
                        onChange={e => setPaidBy(e.target.value)}
                    >
                        {group.members.map(m => (
                            <option key={m._id} value={m._id}>{m._id === user.id ? 'You' : m.username}</option>
                        ))}
                    </select>
                </div>

                {/* Receipt Preview & Toggle */}
                {location.state?.imageSrc && (
                    <div className="mt-2 flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-xl mb-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white shadow-sm flex-shrink-0">
                                <img src={location.state.imageSrc} alt="Scan preview" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">Receipt Scanned</p>
                                <p className="text-[10px] text-slate-500 font-medium leading-none">Save with expense?</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer scale-90">
                            <input
                                type="checkbox"
                                checked={saveReceipt}
                                onChange={(e) => setSaveReceipt(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                    </div>
                )}
            </header>

            <main className="flex-1 p-4 pb-24 overflow-y-auto">
                <div className="space-y-3">
                    {items.map(item => {
                        const isAssigned = item.assignedTo.length > 0;
                        const isFullyAssignedToSelected = isAssigned &&
                            item.assignedTo.length === selectedMemberIds.length &&
                            item.assignedTo.every(id => selectedMemberIds.includes(id));

                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleAssign(item.id)}
                                className={`bg-white p-4 justify-between flex items-center rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${isAssigned ? 'border-slate-400 bg-slate-50/30' : 'border-gray-200 hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex-1 pr-4">
                                    <h3 className={`font-bold text-lg ${isAssigned ? 'text-gray-900' : 'text-gray-700'}`}>{item.name}</h3>
                                    {isAssigned && (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {item.assignedTo.map(uid => {
                                                const m = group.members.find(m => m._id === uid);
                                                return m ? (
                                                    <span key={uid} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-950 uppercase tracking-wide">
                                                        {m.username}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`text-xl font-extrabold ${isAssigned ? 'text-slate-950' : 'text-gray-900'}`}>
                                        {formatCurrency(item.price, user?.defaultCurrency)}
                                    </span>

                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${isAssigned
                                        ? 'bg-slate-800 border-slate-800 text-white scale-110'
                                        : 'border-gray-300 text-transparent'
                                        }`}>
                                        <Check className="w-5 h-5" />
                                    </div>
                                </div>

                                {isAssigned && (
                                    <button
                                        onClick={(e) => clearAssignment(item.id, e)}
                                        className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white hover:bg-rose-200 transition"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200 p-5 pb-8 fixed bottom-0 w-full max-w-lg left-1/2 -translate-x-1/2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 font-semibold text-sm uppercase tracking-wider">Assigned Total</span>
                    <span className="text-gray-900 font-extrabold text-2xl">{formatCurrency(assignedTotal, user?.defaultCurrency)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                    <span>Receipt Total: {formatCurrency(total, user?.defaultCurrency)}</span>
                    <span>{items.filter(i => i.assignedTo.length > 0).length} of {items.length} items</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full mt-4 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-slate-400 to-slate-800 rounded-full transition-all duration-500"
                        style={{ width: `${total > 0 ? (assignedTotal / total) * 100 : 0}%` }}
                    ></div>
                </div>
            </footer>
        </div>
    );
}
