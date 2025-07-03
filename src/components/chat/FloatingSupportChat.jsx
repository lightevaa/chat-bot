import { useState, useEffect } from 'react';
import { getSocket, sendUserMessageToAgent } from '../../../socket';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const FloatingSupportChat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { user } = useAuth();  // Get user from context

  useEffect(() => {
    if (!user?._id) return; // Avoid fetching if user._id is undefined

    const fetchChatHistory = () => {
      axios.get(`/api/chat/history/${user._id}`)
        .then(res => {
          const formattedMessages = res.data.map(msg => ({
            from: msg.from === user._id ? 'user' : 'admin',
            text: msg.message
          }));
          setMessages(formattedMessages);
        })
        .catch(error => {
          console.error('Failed to fetch chat history:', error);
        });
    };

    fetchChatHistory();

    const socket = getSocket();
    if (!socket) return;

    socket.on('agent_reply', ({ message }) => {
      setMessages((prev) => [...prev, { from: 'agent', text: message }]);
    });

    socket.on('admin_new_message', ({ message }) => {
      setMessages((prev) => [...prev, { from: 'admin', text: message }]);
    });

    return () => {
      socket?.off('agent_reply');
      socket?.off('admin_new_message');
    };
  }, [user?._id]); // Re-run effect when user._id changes

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = { from: 'user', text: input };
    setMessages((prev) => [...prev, newMessage]);

    sendUserMessageToAgent({ from: user._id, message: input });
    setInput('');
  };

  return (
    <div className="fixed bottom-28 right-6 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-300 flex flex-col">
      <div className="bg-blue-600 text-white p-2 flex justify-between items-center rounded-t-lg">
        <h3 className="text-sm font-bold">Agent Support</h3>
        <button onClick={onClose} className="text-white text-sm">✕</button>
      </div>

      <div className="flex-1 p-2 h-64 overflow-y-auto text-sm">
        {messages.map((msg, i) => (
          <div key={i} className={`my-1 ${msg.from === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-2 py-1 rounded ${msg.from === 'user' ? 'bg-blue-100' : 'bg-gray-200'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 input input-bordered input-sm"
          placeholder="Type your question..."
        />
        <button onClick={handleSend} className="btn btn-sm btn-primary">Send</button>
      </div>
    </div>
  );
};

export default FloatingSupportChat;
