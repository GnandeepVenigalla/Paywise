import { Receipt, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const ExpenseItem = ({
    description,
    amount,
    date,
    payerName,
    userSplit,
    targetCurrency = 'USD',
    sourceCurrency = 'USD',
    onClick,
    isGroup = false,
    groupName
}) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer border-b border-gray-50 group"
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
                    <Receipt className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 truncate leading-tight">
                        {description}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[13px] text-gray-400">
                        <span className="font-medium text-gray-500 uppercase tracking-wider">{formattedDate}</span>
                        <span>•</span>
                        <span className="truncate">Paid by {payerName}</span>
                    </div>
                    {isGroup && groupName && (
                        <div className="mt-1 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-widest">{groupName}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-right flex-shrink-0 ml-4">
                <p className="text-[17px] font-black text-gray-900 leading-none mb-1">
                    {formatCurrency(amount, targetCurrency, sourceCurrency)}
                </p>
                <p className={`text-[12px] font-bold uppercase tracking-tight ${userSplit > 0 ? 'text-emerald-500' : userSplit < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {userSplit > 0 ? 'You are owed' : userSplit < 0 ? 'You owe' : 'Settled'}
                    <span className="ml-1 font-black">
                        {formatCurrency(Math.abs(userSplit), targetCurrency, sourceCurrency)}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default ExpenseItem;
