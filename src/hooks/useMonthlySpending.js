import { useMemo } from 'react';
import { convertAmount } from '../utils/formatters';

/**
 * Custom hook to aggregate expenses into monthly spending data
 * @param {Array} expenses - List of expense objects
 * @param {Object} user - The current user object (for identifying splits)
 * @returns {Array} - Array of simplified month-based spending data
 */
export const useMonthlySpending = (expenses, user) => {
    return useMemo(() => {
        if (!expenses || expenses.length === 0) return [];

        const monthMap = {};
        const targetCurr = user?.defaultCurrency || 'USD';

        expenses.forEach(exp => {
            // Exclude payments and grouped summaries from the chart logic
            const desc = exp.description?.toLowerCase() || '';
            if (desc.includes('payment')) return;
            if (exp.isGroupSummary) return;

            const d = new Date(exp.date);
            if (isNaN(d.getTime())) return;

            const key = `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}`;
            const monthLabel = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            const shortMonth = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const sourceCurr = exp.currency || 'USD';

            if (!monthMap[key]) {
                monthMap[key] = {
                    key,
                    label: monthLabel,
                    shortMonth,
                    totalSpent: 0,
                    userShare: 0,
                    timestamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
                    expensesList: []
                };
            }

            // Convert and add amount
            const convertedTotal = convertAmount(exp.amount, sourceCurr, targetCurr);
            monthMap[key].totalSpent += convertedTotal;
            monthMap[key].expensesList.push(exp);

            // Find current user's split in this expense
            const uId = user?.id || user?._id;
            const userSplit = exp.splits?.find(s => (s.user._id || s.user) === uId);
            if (userSplit) {
                const convertedShare = convertAmount(userSplit.amount, sourceCurr, targetCurr);
                monthMap[key].userShare += convertedShare;
            }
        });

        // Sort by timestamp (chronological)
        return Object.values(monthMap).sort((a, b) => a.timestamp - b.timestamp);
    }, [expenses, user]);
};
