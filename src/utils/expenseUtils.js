/**
 * Utility functions for expense calculations and splitting
 */

/**
 * Recalculates user splits based on a list of items and assigned members
 * @param {Array} items - List of items { name, price, assignedTo (Array of user IDs) }
 * @returns {Array} - Array of split objects { user, amount }
 */
export const calculateSplitsFromItems = (items) => {
    if (!items || items.length === 0) return null;

    const userSplits = {};
    items.forEach(item => {
        if (item.assignedTo && item.assignedTo.length > 0) {
            const splitAmount = item.price / item.assignedTo.length;
            item.assignedTo.forEach(member => {
                const mId = member._id || member;
                userSplits[mId] = (userSplits[mId] || 0) + splitAmount;
            });
        }
    });

    return Object.keys(userSplits).map(userId => ({
        user: userId,
        amount: userSplits[userId]
    }));
};

/**
 * Normalizes item objects for API transmission
 * @param {Array} items - List of items with potentially populated user objects
 * @returns {Array} - List of items with user IDs only
 */
export const normalizeItemsForSave = (items) => {
    if (!items) return [];
    return items.map(i => ({
        name: i.name,
        price: i.price,
        assignedTo: i.assignedTo.map(u => u._id || u)
    }));
};

/**
 * Returns whether a given user paid for an expense
 * @param {Object} expense - The expense object
 * @param {Object} user - The user object to check against
 * @returns {boolean}
 */
export const isPaidByMember = (expense, user) => {
    const uId = user?.id || user?._id;
    return expense.paidBy?._id === uId || expense.paidBy === uId;
};

/**
 * Calculates current user's net split for an expense
 * (Positive if they lent, negative if they owe)
 * @param {Object} expense - The expense object
 * @param {Object} user - The current user object
 * @param {string} otherMemberId - The other member involved
 * @returns {number}
 */
export const getUserExpenseSplit = (expense, user, otherMemberId) => {
    const isPaidByMe = isPaidByMember(expense, user);
    const uId = user?.id || user?._id;

    if (expense.isGroupSummary) {
        return expense.balance;
    }

    if (isPaidByMe) {
        // Current user paid, they lent money to the other member
        const otherSplit = expense.splits?.find(s => (s.user._id || s.user) === otherMemberId);
        return otherSplit ? otherSplit.amount : 0;
    } else {
        // Someone else paid, current user owes money
        const mySplit = expense.splits?.find(s => (s.user._id || s.user) === uId);
        return mySplit ? -mySplit.amount : 0;
    }
};

/**
 * Toggles member assignments for a specific item in a bill
 * @param {Array} items - List of items
 * @param {string|number} itemId - ID of the item to update
 * @param {Array} selectedMemberIds - IDs of members to toggle
 * @param {Array} allAvailableMembers - List of all possible member objects
 * @returns {Array} - Updated list of items
 */
export const toggleItemAssignment = (items, itemId, selectedMemberIds, allAvailableMembers) => {
    return items.map(item => {
        if (item._id === itemId || item.id === itemId) {
            const itemAssignedIds = (item.assignedTo || []).map(u => u._id || u);
            const allSelectedAreAssigned = selectedMemberIds.every(id => itemAssignedIds.includes(id));

            if (allSelectedAreAssigned && itemAssignedIds.length > 0) {
                // Remove selected members from assignment
                const newAssigned = item.assignedTo.filter(u => !selectedMemberIds.includes(u._id || u));
                return { ...item, assignedTo: newAssigned };
            } else {
                // Add selected members to assignment
                const alreadyAssignedIds = new Set(itemAssignedIds);
                const membersToAdd = allAvailableMembers.filter(m =>
                    selectedMemberIds.includes(m._id || m.id) && !alreadyAssignedIds.has(m._id || m.id)
                );
                return { ...item, assignedTo: [...(item.assignedTo || []), ...membersToAdd] };
            }
        }
        return item;
    });
};

/**
 * Calculates splits for a group expense based on a strategy
 * @param {number} totalAmount - Total cost of the expense
 * @param {Array} members - List of group members
 * @param {string} strategy - 'equally' | 'full' | 'percentage'
 * @param {string} paidBy - ID of the member who paid
 * @returns {Array} - List of split objects
 */
export const calculateGroupSplits = (totalAmount, members, strategy, paidBy) => {
    if (!totalAmount || !members || members.length === 0) return [];

    if (strategy === 'equally' || strategy === 'percentage') {
        const each = totalAmount / members.length;
        return members.map(m => ({ user: m._id || m.id, amount: each }));
    } else if (strategy === 'full') {
        // Payer is owed everything — everyone else owes their share
        const othersCount = members.length - 1;
        if (othersCount <= 0) return [{ user: paidBy, amount: totalAmount }];

        const each = totalAmount / othersCount;
        return members
            .filter(m => (m._id || m.id) !== paidBy)
            .map(m => ({ user: m._id || m.id, amount: each }));
    }

    return members.map(m => ({ user: m._id || m.id, amount: totalAmount / members.length }));
};
