import React, { useEffect, useState } from 'react';
import socket from '../socket'; // adjust path if needed
import axios from 'axios';

const AdminChat = ({ selectedUserId, adminId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Register admin socket
  useEffect(() => {
    socket.emit('register', adminId);

    // Receive incoming messages
    socket.on('receive_message', (msg) => {
      if (msg.from === selectedUserId || msg.to === selectedUserId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socket.off('receive_message');
    };
  }, [selectedUserId, adminId]);

  // Fetch chat history
  useEffect(() => {
    if (!selectedUserId) return;

    axios.get(`/api/chat/history/${selectedUserId}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error('Error fetching messages:', err));
  }, [selectedUserId]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit('agent_to_user', {
      from: adminId,
      to: selectedUserId,
      message
    });

    setMessages(prev => [...prev, {
      from: adminId,
      to: selectedUserId,
      message,
      senderRole: 'admin',
      timestamp: new Date()
    }]);
    setMessage('');
  };

  return (
    <div>
      <h3>Chat with User {selectedUserId}</h3>
      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.senderRole === 'admin' ? 'right' : 'left' }}>
            <p><strong>{msg.senderRole}:</strong> {msg.message}</p>
          </div>
        ))}
      </div>
      <input
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default AdminChat;
