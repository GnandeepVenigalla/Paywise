import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, Check } from 'lucide-react';
import logoImg from '../assets/logo.png';

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
];

export default function CurrencySettings() {
    const { user, api, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [selected, setSelected] = useState(user?.defaultCurrency || 'USD');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = CURRENCIES.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = async (code) => {
        setSelected(code);
        setSaving(true);
        try {
            await api.put('/auth/preferences', { defaultCurrency: code });
            // Update local user context so header reflects new currency instantly
            if (setUser) setUser(prev => ({ ...prev, defaultCurrency: code }));
            navigate(-1);
        } catch (err) {
            alert('Failed to save currency. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24 font-sans text-gray-800 flex flex-col">
            {/* Header */}
            <div className="flex items-center px-4 pt-6 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-gray-900">Default Currency</h1>
            </div>

            {/* Explanation */}
            <div className="px-5 pt-5 pb-3 bg-[#f0faf7] border-b border-[#d1f0e7]">
                <p className="text-[14px] text-[#108c73] font-medium leading-snug">
                    Choose the currency that will be used by default when you add new expenses. Your existing expenses won't be affected.
                </p>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100 sticky top-[61px] bg-white z-10">
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search currencies..."
                        className="flex-1 bg-transparent outline-none text-[15px] text-gray-800 placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Currency List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {filtered.map(currency => {
                    const isSelected = selected === currency.code;
                    return (
                        <button
                            key={currency.code}
                            onClick={() => handleSave(currency.code)}
                            disabled={saving}
                            className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left ${isSelected ? 'bg-[#f0faf7]' : ''}`}
                        >
                            <span className="text-[26px] flex-shrink-0">{currency.flag}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[16px] font-semibold ${isSelected ? 'text-[#108c73]' : 'text-gray-800'}`}>
                                    {currency.code}
                                    <span className="ml-2 text-[14px] font-normal text-gray-500">{currency.symbol}</span>
                                </p>
                                <p className="text-[13px] text-gray-400 truncate">{currency.name}</p>
                            </div>
                            {isSelected && <Check className="w-5 h-5 text-[#108c73] flex-shrink-0" />}
                        </button>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-[16px] font-medium">No currencies found</p>
                        <p className="text-[13px] mt-1">Try a different search term</p>
                    </div>
                )}
            </div>

            {saving && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center shadow-lg">
                        <div className="w-10 h-10 animate-pulse mb-3">
                            <img src={logoImg} alt="Saving..." className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[14px] text-gray-600 font-medium">Saving...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
