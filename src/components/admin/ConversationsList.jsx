import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { connectSocket, getSocket } from '../../../socket'; // ✅ import socket functions

const ConversationsList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch conversation list on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get('/api/admin/conversations');
        setConversations(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch conversations');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Setup socket for real-time updates
  useEffect(() => {
    const adminId = localStorage.getItem('userId') || 'admin';
    connectSocket(adminId, 'admin');
    const socket = getSocket();

    socket.on('admin_new_message', (data) => {
      setConversations((prevConversations) => {
        const existingIndex = prevConversations.findIndex(
          (conv) => conv._id === data.conversationId
        );

        const updatedConv = {
          ...prevConversations[existingIndex],
          updatedAt: new Date().toISOString(),
          messages: [...(prevConversations[existingIndex]?.messages || []), data.message]
        };

        if (existingIndex !== -1) {
          const newList = [...prevConversations];
          newList[existingIndex] = updatedConv;
          return newList;
        } else {
          // New conversation (fallback)
          return [
            {
              _id: data.conversationId,
              userId: { name: 'Unknown', email: '-' },
              useCase: 'Unknown',
              updatedAt: new Date().toISOString(),
              messages: [data.message]
            },
            ...prevConversations
          ];
        }
      });
    });

    return () => {
      socket.off('admin_new_message');
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const truncateText = (text, length = 40) => {
    if (!text) return '';
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-bold">Error</h3>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-md border border-base-300">
      <div className="card-body">
        <div className="flex justify-between items-center mb-6">
          <h1 className="card-title text-2xl">Conversations</h1>
          <span className="badge badge-lg badge-neutral">
            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full table-sm">
            <thead>
              <tr>
                <th>User</th>
                <th>Use Case</th>
                <th>Last Message</th>
                <th>Updated</th>
                <th>Msgs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <tr key={conversation._id} className="hover">
                    <td>
                      <div className="font-medium">{conversation.userId?.name || 'Unknown'}</div>
                      <div className="text-xs opacity-70">{conversation.userId?.email || '-'}</div>
                    </td>
                    <td>
                      <span className="badge badge-info badge-sm badge-outline">{conversation.useCase}</span>
                    </td>
                    <td
                      className="max-w-xs truncate"
                      title={
                        conversation.messages && conversation.messages.length > 0
                          ? conversation.messages[conversation.messages.length - 1].content
                          : ''
                      }
                    >
                      {conversation.messages && conversation.messages.length > 0
                        ? truncateText(conversation.messages[conversation.messages.length - 1].content)
                        : <span className="italic opacity-70">No messages</span>}
                    </td>
                    <td className="text-xs opacity-70">{formatDate(conversation.updatedAt)}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {conversation.messages ? conversation.messages.length : 0}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/admin/conversation/${conversation._id}`}
                        className="link link-primary link-hover text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-base-content/70 py-4">
                    No conversations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConversationsList;
