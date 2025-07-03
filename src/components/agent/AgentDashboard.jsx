import { useState, useEffect } from 'react';
import UserRequests from './UserRequests';
import ContactAdmin from './ContactAdmin';
import { getSocket } from '../../../socket';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { io } from "socket.io-client";
const AgentDashboard = () => {
  const [tab, setTab] = useState('requests');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;

    if (socket.connected) {
      setSocketConnected(true);
    } else {
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
    }

    socket.emit('join', { userId: 'agent', role: 'agent' });

    socket.on('support_request', ({ from, message }) => {
      if (from === selectedUser?._id) {
        setMessages((prev) => [...prev, { from, message, senderType: 'user' }]);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('support_request');
    };
  }, [selectedUser]);

  useEffect(() => {
    if (tab === 'chat') {
      axios.get('/api/agent/users').then(res => setUsers(res.data));
    }
  }, [tab]);

  const loadMessages = async (user) => {
    setSelectedUser(user);
    const res = await axios.get(`/api/agent/messages/${user._id}`);
    setMessages(res.data);
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;
    socket.emit('agent_to_user', { to: selectedUser._id, message: messageText });
    setMessages(prev => [...prev, { from: 'agent', message: messageText, senderType: 'agent' }]);
    setMessageText('');
  };

  if (loading || !isAuthenticated || !socketConnected) {
    return <div className="p-4">Loading agent dashboard...</div>;
  }

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="tabs mb-4">
        <button className={`tab tab-bordered ${tab === 'requests' ? 'tab-active' : ''}`} onClick={() => setTab('requests')}>User Requests</button>
        <button className={`tab tab-bordered ${tab === 'admin' ? 'tab-active' : ''}`} onClick={() => setTab('admin')}>Contact Admin</button>
        <button className={`tab tab-bordered ${tab === 'chat' ? 'tab-active' : ''}`} onClick={() => setTab('chat')}>Live Support Chat</button>
      </div>

      {/* Tab Content */}
      {tab === 'requests' && <UserRequests />}
      {tab === 'admin' && <ContactAdmin />}
      {tab === 'chat' && (
        <div className="flex h-[70vh]">
          <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Users</h2>
            {users.map(user => (
              <div key={user._id} className="p-2 hover:bg-gray-300 cursor-pointer" onClick={() => loadMessages(user)}>
                {user.name}
              </div>
            ))}
          </div>
          <div className="w-3/4 p-4 flex flex-col">
            <div className="flex-1 overflow-y-auto border p-4 mb-2">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.senderType === 'agent' ? 'text-right' : 'text-left'}>
                  <span className="inline-block bg-blue-100 px-2 py-1 rounded mb-1">{msg.message}</span>
                </div>
              ))}
            </div>
            {selectedUser && (
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 border p-2 rounded-l"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                />
                <button className="bg-blue-500 text-white px-4 rounded-r" onClick={sendMessage}>Send</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
