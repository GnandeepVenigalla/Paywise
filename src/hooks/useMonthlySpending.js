import { useMemo } from 'react';
import { convertAmount } from '../utils/formatters';

export const useMonthlySpending = (expenses, user, displayCurrency = 'USD') => {
    return useMemo(() => {
        if (!expenses || expenses.length === 0) return [];

        const monthMap = {};
        const targetCurr = displayCurrency;

        expenses.forEach(exp => {
            // Include Direct expenses ("Self" mode brings in all types) and Group expenses
            if (!exp || exp.description?.toLowerCase().includes('settle')) return;
            // Additional guard: prevent loans or interest logic from inflating raw spend
            if (exp.isLoan || exp.parentLoan || exp.description?.toLowerCase().includes('interest accrual')) return;

            const date = new Date(exp.date);
            if (isNaN(date.getTime())) return;
            
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthMap[key]) {
                monthMap[key] = {
                    key,
                    timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
                    label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    totalSpent: 0,
                    userShare: 0,
                    expensesList: []
                };
            }

            const sourceCurr = exp.currency || 'USD';

            // Convert totalSpent from expense currency to target display currency
            const convertedTotal = convertAmount(exp.amount || 0, sourceCurr, targetCurr);
            monthMap[key].totalSpent += convertedTotal;
            monthMap[key].expensesList.push(exp);

            // Find current user's split in this expense
            const uId = user?.id || user?._id;
            const userSplit = exp.splits?.find(s => (s?.user?._id || s?.user) === uId);
            if (userSplit) {
                // Split amount is stored in the expense's currency, convert to target
                const convertedShare = convertAmount(userSplit.amount || 0, sourceCurr, targetCurr);
                monthMap[key].userShare += convertedShare;
            }
        });

        // Sort by timestamp (chronological)
        return Object.values(monthMap).sort((a, b) => a.timestamp - b.timestamp);
    }, [expenses, user, displayCurrency]);
};
