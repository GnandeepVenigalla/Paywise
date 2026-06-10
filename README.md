# <img src="src/assets/logo.png" width="40" height="40" /> Paywise — Effortless Expense Splitting

> **Current Release: V1.6.0** — *The "Smart Automation" Update*
> Available at: [www.paywiseapp.com](https://www.paywiseapp.com)

![Paywise Hero Banner](docs/images/hero_banner.png)

## 🚀 Overview

**Paywise** is a next-generation expense management and bill-splitting application built by [GD Enterprises](https://gdenterprises.gnandeep.com), founded by **Gnandeep Venigalla** with **Sai Sujitha** serving as CEO of Paywise.

Whether you're sharing a meal, splitting rent with roommates, or managing travel expenses, Paywise provides a sleek, AI-powered platform to track, split, and settle up with precision — in any currency, across any device.

---

## ✨ Core Features

### 📸 AI-Powered Bill Scanning
Upload a photo of your receipt and our AI (Google Gemini) instantly extracts every item, price, and tax. Assign items to friends with a single tap.

### 👥 Groups & Friends
Organize shared expenses into **Groups** (Home, Trip, Dinner) or track one-on-one debts directly. View crystal-clear "who owes who" summaries at a glance.

### 💸 Settle Up
Record full or partial cash/bank settlements. Paywise automatically clears the expense history on full settlement, leaving a clean `$0 / ₹0` balance.

### 🌍 Multi-Currency (No Phantom Balances)
- Pure INR-INR pairs stay in ₹ — no USD conversion involved
- Pure USD-USD pairs stay in $ — no conversion involved
- Mixed pairs normalise through USD with a smart phantom-balance guard that eliminates tiny rounding residuals after settle-up

### 📅 Daily Ad Frequency Cap
Users get **3 free expense entries per day** before an ad is shown. The counter resets every midnight. Scan-to-split always shows a sponsored message (premium feature).

### 🤖 Paywise AI Assistant (Powered by Gemini)
Conversational expense management — add expenses, check balances ("Who owes me?"), or settle up using plain English.

### 🏦 Community Groups (Rotation Cycle)
Track who pays next in a rotating payment cycle — perfect for regular group dinners or club contributions.

### 🔐 Security
- Email OTP Verification
- Biometric Authentication (FaceID / TouchID / Fingerprint)
- Secure PIN Fallback
- End-to-end encrypted sessions

### 📱 Progressive Web App (PWA)
Install Paywise on your home screen for a native app experience on iOS and Android — no App Store required.

### 📊 Financial Exports
Export detailed group or friend summaries as PDF or CSV for record-keeping.

---

## 🛠 Tech Stack (Frontend)

| Layer | Technology |
|---|---|
| Framework | React 19 (Vite) |
| Styling | Tailwind CSS 4 + Custom CSS |
| Icons | Lucide React · PrimeIcons |
| AI & OCR | Google Gemini 2.5 Flash · Tesseract.js |
| Monetization | Google AdSense · Internal AdGate |
| State | React Context API |
| Routing | React Router 7 |
| PDF Exports | jsPDF + AutoTable |
| Auth | JWT + Google OAuth |
| Notifications | Custom WebSocket push system |

---

## 🗂 Project Structure

```
src/
├── assets/           # Static images, logo
├── components/
│   ├── BottomNav.jsx
│   ├── UI/
│   │   ├── AdGate.jsx        # Monetization gate
│   │   ├── Avatar.jsx
│   │   └── ...
│   └── ...
├── context/
│   └── AuthContext.jsx       # Global user state + daily expense counter
├── hooks/                    # Custom React hooks
├── pages/
│   ├── Account.jsx           # Profile & settings
│   ├── AddExpense.jsx        # Group expense entry
│   ├── AddFriendExpense.jsx  # 1-on-1 expense entry
│   ├── Dashboard.jsx         # Groups overview
│   ├── Friends.jsx           # Friends list + balances
│   ├── FriendDetails.jsx     # Friend ledger + settle-up
│   ├── GroupDetails.jsx      # Group ledger + settle-up
│   ├── ScanBill.jsx          # Camera OCR flow
│   ├── AiAssistant.jsx       # Gemini AI chat
│   └── ...
├── utils/
│   ├── formatters.js         # formatCurrency, convertAmount, EXCHANGE_RATES
│   └── ...
└── version.js                # ← Edit this to update app version everywhere
```


## 📜 Version History & Release Log

### v1.6.0 — "Smart Automation" Update
*Released: April 2026*
*Founded by Gnandeep Venigalla (GD Enterprises) · CEO: Sai Sujitha*

#### 👤 Personal Khata (Self Ledger)
- New **"Self" profile** accessible from the Friends screen — acts as a private personal expense notebook
- Log expenses exclusively for yourself (no friend splits, no group context)
- Fully isolated from friend/group feeds — only personal entries appear here
- Monthly budget tracking with visual spending chart in the Self view
- Expenses display a clean **"PERSONAL EXPENSE"** tag instead of split debt labels
- Friend settings gear icon hidden on Self view (can't block or report yourself!)

#### 🔁 Recurring Expenses (Inline)
- **"Repeat this expense?"** toggle embedded directly inside the Add Expense screen (group & friend)
- Select repeat interval: **Weekly, Bi-Weekly, Monthly, Yearly**
- Optional end date — leave blank to repeat until cancelled
- The first saved expense becomes the **template** and appears immediately in history with a **🔁 AUTO** badge
- Daily CRON job at **00:01 AM** silently clones the expense into transaction history on schedule
- All instances share a `recurrenceId` linking them as a series
- Push notification sent to all split participants each time a bill is auto-posted
- **Cancel recurring** from inside the expense detail sheet:
  - **"Stop Recurring (keep history)"** — stops all future auto-posts; existing history untouched
  - **"Delete Entire Expense"** — removes the record completely
- Recurring info shown in expense detail: next auto-post date, frequency, end date
- Month-end safe scheduling: a bill set for the 31st correctly fires on Feb 28/29

#### 🛡️ UX & Bug Fixes
- Fixed crash (`TypeError`) in `useMonthlySpending` hook on null/legacy split data
- Fixed `isLoan` accidentally removed from `ExpenseItem` props causing app-wide crash
- Settlement delete button now correctly visible for the **receiver** of a settlement, not just the payer
- Settle-up records excluded from personal spending chart to prevent inflated monthly totals

---

### v1.5.0 — "Settlement Precision" Update
*Released: April 2026*
*Founded by Gnandeep Venigalla (GD Enterprises) · CEO: Sai Sujitha*

#### ⚖️ Settlement Fixes
- **Full INR⇄INR settle-up** now works correctly — balance and breakdown rows use the backend's `balanceCurrency`, not the user's display preference
- **Friends list** now calculates per-pair dominant currency (INR-INR stays ₹, USD-USD stays $) matching the FriendDetails view — no more "$0.04 phantom" after settling
- **Full settle clears all history** — old code kept the settle expense causing a phantom residual balance; now all history is deleted after a full settlement, leaving a clean $0

#### 🛡️ Phantom Balance Guard
- Backend now detects cross-currency pairs and snaps any residual < $0.50 to zero after full settlement
- Backend static exchange rates synced between `currency.js` (backend) and `formatters.js` (frontend) — previously INR was 83.12 on backend vs 92.01 on frontend causing ~10% discrepancy

#### 📅 Daily Ad Frequency Cap
- Users get **3 free expense additions per day** before the AdGate triggers
- Counter resets every midnight (client local time) via `localStorage`
- Scan receipt always shows an ad (premium AI feature — no daily cap)

#### 🖼️ Internal Ad Image
- `public/ads.png` now displays immediately inside AdGate while Google AdSense loads
- Ensures users always see a visual during the sponsored wait period

#### ⚙️ Version System
- New `src/version.js` central config — edit one file to update version across the entire app

#### 🌙 Landing Page
- Dark mode support added to landing page
- Founder credits: Gnandeep Venigalla (GD Enterprises) & Sai Sujitha (CEO, Paywise)

---

### v1.4.0 — "Intelligence & Precision" Update
*Released: March 24, 2026*

#### 🤖 Paywise AI (Powered by Gemini)
- Conversational expense addition, balance query, and deletion via natural language
- Floating AI Assistant accessible from any page
- Action confirmation UI before applying any AI-proposed change
- Smart prompt suggestions based on recent activity

#### 💰 Advanced Financial Features
- Partial settlements for recording incremental payments
- Individual expense settlement within a group
- Monthly budget tracker with visual overage warnings
- Default split method preferences in Settings
- Privacy Mode (hide balances in public)

#### 🔐 Security & Personalization
- WebAuthn biometric lock (FaceID, TouchID, Fingerprint)
- Secure PIN fallback for non-biometric devices
- Profile visibility controls (email discovery toggle)
- Auto-accept friends from known contacts
- Verified account deletion flow

#### 🌍 Accessibility
- 10+ language support (Spanish, French, Hindi, and more)
- High Contrast Mode
- Custom date (MM/DD vs DD/MM) and time (12h/24h) formats
- Payment reminder quick-share templates

#### 🛠 Stability
- Global Error Boundary with crash recovery
- Cache management tools
- AdSense + AdGate integration
- 35+ component refactor for performance

---

### v1.3.0 — "Migration & Mobility" Update
*Released: March 10, 2026*
- Full Splitwise data import support
- PWA install prompts for Android and iOS
- Improved PDF settlement reports
- Multi-currency historical data fixes

### v1.2.0 — "Security First" Update
*Released: March 5, 2026*
- Biometric lock (FaceID / Fingerprint)
- Email OTP two-factor authentication
- Real-time activity feed and notifications

### v1.1.0 — "Intelligence" Update
*Released: February 25, 2026*
- AI receipt scanning (Tesseract + Gemini)
- Itemized splitting (assign specific items to specific people)
- Profile pictures and receipt images on Oracle Cloud (OCI)

### v1.0.0 — Initial Launch
*Released: February 1, 2026*
- Core group expense management
- Friend system with email invites
- Equal / percentage / exact split logic
- Real-time balance dashboard

---

## 🚧 Running Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build
```

---

© 2026 Paywise App & GD Enterprises. All rights reserved.  
Visit: [www.paywiseapp.com](https://www.paywiseapp.com) · Founded by Gnandeep Venigalla
