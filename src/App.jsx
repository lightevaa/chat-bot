import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ChatLayout from './components/chat/ChatLayout';

import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import UsersList from './components/admin/UsersList';
import ConversationsList from './components/admin/ConversationsList';
import ConversationDetail from './components/admin/ConversationDetail';

import AgentLayout from './components/agent/AgentLayout';
import ContactAdmin from './components/agent/ContactAdmin';
import UserRequests from './components/agent/UserRequests';
import RequireAgent from './components/agent/RequireAgent';

import { connectSocket } from '../socket';

// ✅ Component to initialize socket AFTER AuthContext is available
const InitSocket = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?._id && user?.role) {
      connectSocket(user._id, user.role);
    }
  }, [isAuthenticated, user]);

  return null;
};

// ✅ Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <InitSocket /> {/* ✅ Initializes socket only when auth is ready */}

          <div className="min-h-screen">
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Chat Page for Regular Users */}
              <Route path="/" element={<ChatLayout />} />

              {/* Admin Section */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UsersList />} />
                <Route path="conversations" element={<ConversationsList />} />
                <Route path="conversation/:id" element={<ConversationDetail />} />
              </Route>

              {/* Agent Section (Protected) */}
              <Route element={<RequireAgent />}>
                <Route element={<AgentLayout />}>
                  <Route path="/agent" element={<UserRequests />} />
                  <Route path="/agent/admin" element={<ContactAdmin />} />
                </Route>
              </Route>
            </Routes>
          </div>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
