import { useEffect, useState } from 'react';
import { getSocket, sendAgentMessageToAdmin } from '../../../socket';
import { useAuth } from '../../context/AuthContext';

const ContactAdmin = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const socket = getSocket();

    socket.on('admin_reply', ({ message }) => {
      setMessages(prev => [...prev, { from: 'admin', text: message }]);
    });

    return () => {
      socket.off('admin_reply');
    };
  }, []);

  const handleSend = () => {
    if (!input) return;
    sendAgentMessageToAdmin({ from: user._id, message: input });
    setMessages(prev => [...prev, { from: 'agent', text: input }]);
    setInput('');
  };

  return (
    <div className="border p-4 rounded bg-base-100">
      <div className="h-64 overflow-y-auto mb-2 text-sm">
        {messages.map((msg, idx) => (
          <div key={idx} className={`my-1 ${msg.from === 'agent' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-2 py-1 rounded ${msg.from === 'agent' ? 'bg-blue-100' : 'bg-gray-200'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input input-sm input-bordered flex-1"
          placeholder="Message admin..."
        />
        <button className="btn btn-sm btn-primary" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ContactAdmin;
