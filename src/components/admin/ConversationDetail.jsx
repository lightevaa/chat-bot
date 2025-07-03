import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { HiArrowLeft } from 'react-icons/hi';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { connectSocket, getSocket, sendAdminMessageToUser } from '../../../socket'; // <-- added here

const ConversationDetail = () => {
  const { id } = useParams();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Fetch conversation
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await axios.get(`/api/admin/conversation/${id}`);
        setConversation(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch conversation');
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [id]);

  // Setup Socket.IO
  useEffect(() => {
    const adminId = localStorage.getItem('userId') || 'admin';
    connectSocket(adminId, 'admin');

    const socket = getSocket();
    socket.on('admin_new_message', (data) => {
      if (data.conversationId === id) {
        setConversation(prev => ({
          ...prev,
          messages: [...prev.messages, data.message],
          updatedAt: new Date().toISOString()
        }));
      }
    });

    return () => {
      socket.off('admin_new_message');
    };
  }, [id]);

  const handleSendMessage = () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !conversation?.userId?._id) return;

    setSending(true);
    sendAdminMessageToUser({
      to: conversation.userId._id,
      message: trimmed,
    });

    // Optimistically update UI
    setConversation(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          role: 'admin',
          content: trimmed,
          timestamp: new Date().toISOString(),
        },
      ],
    }));

    setNewMessage('');
    setSending(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
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
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link to="/admin/conversations" className="btn btn-ghost btn-sm normal-case">
          <HiArrowLeft className="mr-1" /> Back to Conversations
        </Link>
      </div>

      {conversation ? (
        <>
          <div className="card bg-base-200 shadow-md border border-base-300">
            <div className="card-body">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="card-title text-2xl mb-1">Conversation Details</h1>
                  <p className="text-xs opacity-70 font-mono">ID: {conversation._id}</p>
                </div>
                <span className="badge badge-info badge-lg">{conversation.useCase}</span>
              </div>

              <div className="divider my-1"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-base-content/70 mb-1">User Information</h3>
                  <p><span className="font-semibold">Name:</span> {conversation.userId?.name || 'N/A'}</p>
                  <p><span className="font-semibold">Email:</span> {conversation.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-base-content/70 mb-1">Details</h3>
                  <p><span className="font-semibold">Created:</span> {formatDate(conversation.createdAt)}</p>
                  <p><span className="font-semibold">Updated:</span> {formatDate(conversation.updatedAt)}</p>
                  <p><span className="font-semibold">Messages:</span> {conversation.messages?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Messages</h2>
              <div className="space-y-4">
                {conversation.messages && conversation.messages.length > 0 ? (
                  conversation.messages.map((message, index) => (
                    <div key={index} className={`chat ${message.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                      <div className="chat-header text-xs opacity-50 mb-1">
                        {message.role === 'user' ? (conversation.userId?.name || 'User') : 'Admin'}
                        <time className="ml-1">{formatDate(message.timestamp)}</time>
                      </div>
                      <div className={`chat-bubble ${message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-accent'}`}>
                        {message.content}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-base-content/20">
                            <p className="text-xs font-medium mb-1 opacity-80">{message.attachments.length} Attachment(s):</p>
                            <div className="space-y-1">
                              {message.attachments.map((att, idx) => (
                                <div key={idx} className="flex items-center p-1 rounded text-xs bg-base-100/60">
                                  <HiOutlineDocumentText className="w-4 h-4 mr-2 flex-shrink-0 text-base-content/70" />
                                  <a href={att.path.startsWith('uploads/') ? `/${att.path}` : att.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate hover:underline flex-1 min-w-0 opacity-90 hover:opacity-100"
                                    title={att.originalname}
                                  >
                                    {att.originalname}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-base-content/70 py-6">No messages in this conversation</p>
                )}
              </div>
            </div>
          </div>

          {/* Admin Message Input */}
          <div className="card bg-base-200 shadow-md border border-base-300 mt-6">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Send Message to User</h2>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  className="btn btn-primary self-stretch md:self-auto"
                  disabled={sending || !newMessage.trim()}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div role="alert" className="alert alert-warning">
          <span>Conversation not found.</span>
        </div>
      )}
    </div>
  );
};

export default ConversationDetail;
