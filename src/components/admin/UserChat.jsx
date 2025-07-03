import React, { useEffect, useState } from 'react';
import socket from '../socket';
import axios from 'axios';

const UserChat = ({ userId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit('register', userId);

    socket.on('receive_message', (msg) => {
      if (msg.from === 'admin' || msg.to === 'admin') {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socket.off('receive_message');
    };
  }, [userId]);

  useEffect(() => {
    axios.get(`/api/chat/history/${userId}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error('Error fetching messages:', err));
  }, [userId]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit('user_to_agent', {
      from: userId,
      message
    });

    setMessages(prev => [...prev, {
      from: userId,
      to: 'admin',
      message,
      senderRole: 'user',
      timestamp: new Date()
    }]);
    setMessage('');
  };

  return (
    <div>
      <h3>Chat with Admin</h3>
      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.senderRole === 'user' ? 'right' : 'left' }}>
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

export default UserChat;
