// Utility functions for Katha (User Debt Tracking) Module

export function fetchUserKathaList(allStores = [], currentUserId) {
  // Filter stores where current_user has a non-zero balance
  if (!currentUserId) return []

  return allStores
    .map(store => {
      const balances = store.balances || {}
      const userBalance = balances[currentUserId]

      if (userBalance && userBalance !== 0) {
        return {
          ...store,
          userBalance,
          isOwed: userBalance > 0, // positive = user owes merchant
          lastTransactionDate: store.lastTransactionDate || new Date(),
        }
      }
      return null
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastTransactionDate) - new Date(a.lastTransactionDate))
}

export function renderStoreCard(store) {
  // Render store card with logo, balance, and transaction date
  const isOwed = store.userBalance > 0
  const amountDisplay = Math.abs(store.userBalance)

  return {
    id: store.merchant_id || store.id,
    logo: store.logo || store.storeLogo || '🏪',
    storeName: store.storeName || store.name || 'Unknown Store',
    category: store.category || 'General',
    lastTransactionDate: store.lastTransactionDate,
    balance: store.userBalance,
    amountDisplay,
    isOwed,
    badgeColor: isOwed ? 'red' : 'green', // red = owed, green = advance
    badgeText: isOwed ? `₹${amountDisplay} Owed` : `₹${amountDisplay} Advance`,
    trustScore: store.trustScore || '0%',
    whatsappNumber: store.whatsappNumber,
  }
}

export function disableUserEdits() {
  // Constraint: disable edit functionality for users
  return {
    editable: false,
    canEdit: false,
    allowedActions: ['dispute', 'pay', 'view'],
    blockedActions: ['edit', 'delete'],
  }
}

export function initiatePayment(store, amount) {
  // Generate UPI link for user to pay the merchant
  const upiString = `upi://pay?pa=${encodeURIComponent(store.upi || '')}&pn=${encodeURIComponent(store.storeName)}&am=${amount}`
  return {
    status: 'payment_initiated',
    upiLink: upiString,
    amountToPay: amount,
    merchant: store.storeName,
    timestamp: new Date().toISOString(),
  }
}

export function raiseDisputeUser(store, transactionId, reason) {
  // User initiates dispute on a transaction
  const dispute = {
    id: `disp_user_${Date.now()}`,
    transactionId,
    userId: 'current_user', // would be from auth context
    merchantId: store.merchant_id,
    reason,
    status: 'pending_merchant_response',
    createdAt: new Date().toISOString(),
    message: `Dispute raised with ${store.storeName}. They will review and respond within 48 hours.`,
  }
  return dispute
}
