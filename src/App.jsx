import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import ScanBill from './pages/ScanBill';
import SplitItems from './pages/SplitItems';
import AddExpense from './pages/AddExpense';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import InviteFriend from './pages/InviteFriend';
import Friends from './pages/Friends';
import FriendDetails from './pages/FriendDetails';
import AddFriendExpense from './pages/AddFriendExpense';
import Activity from './pages/Activity';
import Account from './pages/Account';
import AccountSettings from './pages/AccountSettings';
import Notifications from './pages/Notifications';
import NotificationSettings from './pages/NotificationSettings';
import PrivacySecurity from './pages/PrivacySecurity';
import CurrencySettings from './pages/CurrencySettings';
import AppSettings from './pages/AppSettings';
import JoinGroup from './pages/JoinGroup';
import SplitwiseCallback from './pages/SplitwiseCallback';
import AiAssistant from './pages/AiAssistant';
import BetaHandler from './pages/BetaHandler';
import HelpSupport from './pages/HelpSupport';
import TermsOfService from './pages/TermsOfService';
import Katha from './pages/Katha';
import KathaDetail from './pages/KathaDetail';
import LoanRequests from './pages/LoanRequests';
import BlockedUsers from './pages/BlockedUsers';
import Landing from './pages/Landing';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import logoImg from './assets/logo.png';
import { useAppSettings } from './hooks/useAppSettings';
import BiometricGate from './components/BiometricGate';
import ErrorBoundary from './components/ErrorBoundary';
import InstallGate from './components/InstallGate';

// Applies theme + high contrast to <html> globally
function ThemeApplier() {
  useAppSettings(); // side-effects only
  return null;
}

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#1e293b] flex flex-col items-center justify-center z-[100]">
        <div className="w-[110px] h-[110px] animate-pulse">
          <img src={logoImg} alt="Paywise Logo" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeApplier />
          <div className="min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-gray-50 text-gray-900 font-sans relative">
            <BiometricGate>
              <Routes>
                {/* ── Public Marketing & Policy Routes (Gate-Free) ── */}
                <Route path="/" element={<Landing />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacySecurity />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/resetpassword/:resettoken" element={<ResetPassword />} />

                {/* ── App Environment (Wrapped in InstallGate) ── */}
                <Route element={<InstallGate><Outlet /></InstallGate>}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/splitwise-callback" element={<PrivateRoute><SplitwiseCallback /></PrivateRoute>} />
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
                  <Route path="/friend/:id" element={<PrivateRoute><FriendDetails /></PrivateRoute>} />
                  <Route path="/friend/:id/add" element={<PrivateRoute><AddFriendExpense /></PrivateRoute>} />
                  <Route path="/friend/:id/scan" element={<PrivateRoute><ScanBill /></PrivateRoute>} />
                  <Route path="/friend/:id/split" element={<PrivateRoute><SplitItems /></PrivateRoute>} />
                  <Route path="/activity" element={<PrivateRoute><Activity /></PrivateRoute>} />
                  <Route path="/katha" element={<PrivateRoute><Katha /></PrivateRoute>} />
                  <Route path="/katha/:merchantId" element={<PrivateRoute><KathaDetail /></PrivateRoute>} />
                  <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
                  <Route path="/account/settings" element={<PrivateRoute><AccountSettings /></PrivateRoute>} />
                  <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                  <Route path="/account/notifications" element={<PrivateRoute><NotificationSettings /></PrivateRoute>} />
                  <Route path="/account/privacy" element={<PrivateRoute><PrivacySecurity /></PrivateRoute>} />
                  <Route path="/account/currency" element={<PrivateRoute><CurrencySettings /></PrivateRoute>} />
                  <Route path="/account/app-settings" element={<PrivateRoute><AppSettings /></PrivateRoute>} />
                  <Route path="/account/help" element={<PrivateRoute><HelpSupport /></PrivateRoute>} />
                  <Route path="/account/blocked" element={<PrivateRoute><BlockedUsers /></PrivateRoute>} />
                  <Route path="/invite" element={<PrivateRoute><InviteFriend /></PrivateRoute>} />
                  <Route path="/join/:id" element={<JoinGroup />} />
                  <Route path="/group/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
                  <Route path="/group/:id/scan" element={<PrivateRoute><ScanBill /></PrivateRoute>} />
                  <Route path="/group/:id/split" element={<PrivateRoute><SplitItems /></PrivateRoute>} />
                  <Route path="/group/:id/add" element={<PrivateRoute><AddExpense /></PrivateRoute>} />
                  <Route path="/ai" element={<PrivateRoute><AiAssistant /></PrivateRoute>} />
                  <Route path="/loans" element={<PrivateRoute><LoanRequests /></PrivateRoute>} />
                  <Route path="/beta" element={<BetaHandler />} />
                  <Route path="/friends/:id" element={<PrivateRoute><FriendDetails /></PrivateRoute>} />
                  <Route path="/groups" element={<Navigate to="/dashboard" />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Route>
              </Routes>
            </BiometricGate>
          </div>
        </AuthProvider>

      </ErrorBoundary>
    </Router>
  );
}

export default App;
