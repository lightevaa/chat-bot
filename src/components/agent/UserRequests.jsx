import { useEffect, useState } from 'react';
import { getSocket, sendAgentReplyToUser } from '../../../socket';
import { useAuth } from '../../context/AuthContext';

const UserRequests = () => {
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [input, setInput] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const socket = getSocket();

    socket.on('support_request', ({ from, message }) => {
      setMessages(prev => [...prev, { from, text: message }]);
    });

    return () => {
      socket.off('support_request');
    };
  }, []);

  // Automatically set activeUser to first user in list when messages or activeUser changes
  useEffect(() => {
    const users = [...new Set(messages.map(m => m.from))];
    if (!activeUser && users.length > 0) {
      setActiveUser(users[0]);
    }
  }, [messages, activeUser]);

  const handleReply = () => {
    if (!activeUser || !input) return;

    sendAgentReplyToUser({ to: activeUser, message: input });
    setMessages(prev => [...prev, { from: 'agent', to: activeUser, text: input }]);
    setInput('');
  };

  const users = [...new Set(messages.map(m => m.from))];

  return (
    <div className="flex gap-4">
      <div className="w-1/3 border p-2 rounded">
        <h3 className="font-bold mb-2">Users</h3>
        {users.map(uid => (
          <div
            key={uid}
            onClick={() => setActiveUser(uid)}
            className={`p-1 cursor-pointer rounded ${activeUser === uid ? 'bg-blue-200' : 'hover:bg-gray-100'}`}
          >
            {uid}
          </div>
        ))}
      </div>

      <div className="flex-1 border rounded p-2">
        <div className="h-60 overflow-y-auto text-sm mb-2">
          {messages
            .filter(m => m.from === activeUser || m.to === activeUser)
            .map((m, i) => (
              <div key={i} className={`my-1 ${m.from === 'agent' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-2 py-1 rounded ${m.from === 'agent' ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  {m.text}
                </div>
              </div>
            ))}
        </div>
        {activeUser && (
          <div className="flex gap-2">
            <input
              className="input input-sm input-bordered flex-1"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Reply to user..."
            />
            <button className="btn btn-sm btn-primary" onClick={handleReply}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRequests;
