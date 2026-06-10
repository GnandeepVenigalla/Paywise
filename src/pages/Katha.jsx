import React, { useState } from 'react'
import './Katha.css'
import StoreCard from './StoreCard'
import { fetchUserKathaList, initiatePayment, raiseDisputeUser } from '../utils/kathaModules'

export default function Katha() {
  // Mock user data - in real app this would come from auth context
  const currentUserId = 'user_123'

  // Mock stores with balances - would come from backend API
  const [stores] = useState([
    {
      id: 'store_1',
      merchant_id: 'm_001',
      storeName: 'Rajesh Grocery Store',
      category: 'Grocery',
      logo: '🛒',
      balances: { user_123: 1250 }, // user owes
      lastTransactionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      trustScore: '98%',
      whatsappNumber: '9999999999',
      upi: 'rajesh@upi',
    },
    {
      id: 'store_2',
      merchant_id: 'm_002',
      storeName: 'Priya Clothing Boutique',
      category: 'Clothing',
      logo: '👕',
      balances: { user_123: -580 }, // user has advance
      lastTransactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      trustScore: '95%',
      whatsappNumber: '8888888888',
      upi: 'priya@upi',
    },
    {
      id: 'store_3',
      merchant_id: 'm_003',
      storeName: 'Amit Restaurant',
      category: 'Food & Beverage',
      logo: '🍱',
      balances: { user_123: 320 }, // user owes
      lastTransactionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      trustScore: '92%',
      whatsappNumber: '7777777777',
      upi: 'amit@upi',
    },
    {
      id: 'store_4',
      merchant_id: 'm_004',
      storeName: 'No Balance Store',
      category: 'General',
      logo: '🏢',
      balances: { user_123: 0 }, // no balance - should not appear
      lastTransactionDate: new Date(),
      trustScore: '0%',
      whatsappNumber: '6666666666',
      upi: 'store4@upi',
    },
  ])

  const [disputes, setDisputes] = useState([])
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [paymentLink, setPaymentLink] = useState(null)

  // Fetch user's Katha list (stores with non-zero balance)
  const kathaList = fetchUserKathaList(stores, currentUserId)

  function handlePay(store) {
    const amountOwed = Math.abs(store.userBalance)
    const result = initiatePayment(store, amountOwed)

    // In real app, open UPI app or show QR
    setPaymentLink(result)
    alert(`Open UPI to pay ₹${amountOwed} to ${store.storeName}\nUPI: ${result.upiLink}`)
  }

  function handleDispute(store) {
    const reason = prompt(`Raise dispute with ${store.storeName}.\n\nReason (required):`)
    if (!reason) return

    const transactionId = `txn_${Date.now()}`
    const dispute = raiseDisputeUser(store, transactionId, reason)

    setDisputes([dispute, ...disputes])
    setSelectedDispute(dispute)
    alert(`📢 Dispute raised!\n${dispute.message}`)
  }

  const owedTotal = kathaList
    .filter(s => s.userBalance > 0)
    .reduce((sum, s) => sum + s.userBalance, 0)

  const advanceTotal = kathaList
    .filter(s => s.userBalance < 0)
    .reduce((sum, s) => sum + Math.abs(s.userBalance), 0)

  return (
    <div className="katha-page">
      <h1>📕 Katha - Your Debt Tracker</h1>
      <p className="subtitle">Track your balance with all your stores in one place</p>

      <div className="summary-section">
        <div className="summary-card owed">
          <h3>Total Owed</h3>
          <p className="amount">₹{owedTotal.toLocaleString()}</p>
        </div>
        <div className="summary-card advance">
          <h3>Total Advance</h3>
          <p className="amount">₹{advanceTotal.toLocaleString()}</p>
        </div>
        <div className="summary-card stores">
          <h3>Stores</h3>
          <p className="amount">{kathaList.length}</p>
        </div>
      </div>

      {kathaList.length === 0 ? (
        <div className="empty-state">
          <p>✨ No pending balances. You're all set!</p>
        </div>
      ) : (
        <div className="stores-grid">
          {kathaList.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              onPay={handlePay}
              onDispute={handleDispute}
            />
          ))}
        </div>
      )}

      {disputes.length > 0 && (
        <div className="disputes-section">
          <h2>Disputes ({disputes.length})</h2>
          <div className="disputes-list">
            {disputes.map(disp => (
              <div
                key={disp.id}
                className={`dispute-item ${disp.status}`}
                onClick={() => setSelectedDispute(disp)}
              >
                <div className="dispute-header">
                  <strong>{disp.id}</strong>
                  <span className="status-badge">{disp.status}</span>
                </div>
                <p>{disp.reason}</p>
                <small>{new Date(disp.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDispute && (
        <div className="dispute-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Dispute Details</h3>
              <button className="btn-close" onClick={() => setSelectedDispute(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>ID:</strong> {selectedDispute.id}
              </p>
              <p>
                <strong>Status:</strong> {selectedDispute.status}
              </p>
              <p>
                <strong>Reason:</strong> {selectedDispute.reason}
              </p>
              <p>
                <strong>Message:</strong> {selectedDispute.message}
              </p>
              <p className="note">
                📝 <em>Merchant will respond to this dispute within 48 hours.</em>
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="katha-footer">
        <p>💡 Tip: Always keep your payments on time to maintain good merchant relationships!</p>
      </footer>
    </div>
  )
}
