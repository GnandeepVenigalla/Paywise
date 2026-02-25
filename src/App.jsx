import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import PrivacySecurity from './pages/PrivacySecurity';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-gray-50 text-gray-900 font-sans relative">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/resetpassword/:resettoken" element={<ResetPassword />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
            <Route path="/friend/:id" element={<PrivateRoute><FriendDetails /></PrivateRoute>} />
            <Route path="/friend/:id/add" element={<PrivateRoute><AddFriendExpense /></PrivateRoute>} />
            <Route path="/activity" element={<PrivateRoute><Activity /></PrivateRoute>} />
            <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
            <Route path="/account/settings" element={<PrivateRoute><AccountSettings /></PrivateRoute>} />
            <Route path="/account/privacy" element={<PrivateRoute><PrivacySecurity /></PrivateRoute>} />
            <Route path="/invite" element={<PrivateRoute><InviteFriend /></PrivateRoute>} />
            <Route path="/group/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
            <Route path="/group/:id/scan" element={<PrivateRoute><ScanBill /></PrivateRoute>} />
            <Route path="/group/:id/split" element={<PrivateRoute><SplitItems /></PrivateRoute>} />
            <Route path="/group/:id/add" element={<PrivateRoute><AddExpense /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
