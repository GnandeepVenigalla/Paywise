import React, { useState } from 'react'

export default function StoreCard({ store, onPay, onDispute }) {
  const [showOptions, setShowOptions] = useState(false)

  const isOwed = store.userBalance > 0
  const amountDisplay = Math.abs(store.userBalance)
  const badgeColor = isOwed ? 'red' : 'green'
  const badgeText = isOwed ? `₹${amountDisplay} Owed` : `₹${amountDisplay} Advance`

  return (
    <div className={`store-card ${isOwed ? 'owed' : 'advance'}`}>
      <div className="card-header">
        <div className="store-logo">{store.logo}</div>
        <div className="store-info">
          <h3 className="store-name">{store.storeName}</h3>
          <p className="store-category">{store.category}</p>
        </div>
        <div className={`balance-badge ${badgeColor}`}>{badgeText}</div>
      </div>

      <div className="card-body">
        <div className="transaction-info">
          <span className="label">Last Transaction:</span>
          <span className="value">
            {new Date(store.lastTransactionDate).toLocaleDateString()}
          </span>
        </div>
        {store.trustScore && (
          <div className="trust-info">
            <span className="label">Trust Score:</span>
            <span className="value">{store.trustScore}</span>
          </div>
        )}
      </div>

      <div className="card-actions">
        {isOwed && (
          <button
            className="btn-pay"
            onClick={() => onPay(store)}
            title="Pay this merchant"
          >
            💳 Pay
          </button>
        )}
        <button
          className="btn-dispute"
          onClick={() => onDispute(store)}
          title="Raise a dispute"
        >
          ⚠️ Dispute
        </button>
        <button
          className="btn-details"
          onClick={() => setShowOptions(!showOptions)}
          title="More options"
        >
          ⋯
        </button>
      </div>

      {showOptions && (
        <div className="card-options">
          <p>Contact: {store.whatsappNumber}</p>
          <small>ID: {store.id}</small>
        </div>
      )}
    </div>
  )
}
