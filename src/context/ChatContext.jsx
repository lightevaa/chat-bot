import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { connectSocket, getSocket } from '../../socket';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const [conversationSummaries, setConversationSummaries] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingLoading, setEditingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeUseCase, setActiveUseCase] = useState('Default');

  const addMessageFromSocket = useCallback((newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const getConversationSummaries = useCallback(async (showLoading = false) => {
    if (!isAuthenticated || !token) return;
    if (showLoading) setLoading(true);
    try {
      const res = await axios.get('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversationSummaries(res.data);
    } catch (err) {
      console.error('Failed to fetch summaries:', err);
      setError(err.response?.data?.message || 'Failed to fetch conversation list');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isAuthenticated, token]);

  const loadFullConversation = useCallback(async (id, showLoading = true) => {
    if (!isAuthenticated || !token || !id) {
      setCurrentConversation(null);
      setMessages([]);
      return;
    }
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/chat/conversation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentConversation(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(`Failed to load conversation ${id}:`, err);
      setError(err.response?.data?.message || `Failed to load conversation ${id}`);
      setCurrentConversation(null);
      setMessages([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isAuthenticated, token]);

  const sendMessage = useCallback(async (messageText, files = []) => {
    if (!isAuthenticated || !token) return;
    if (!messageText.trim() && files.length === 0) {
      setError('Cannot send empty message/file.');
      return;
    }
    setLoading(true);
    setError(null);
    const timestamp = new Date();
    const tempMessageId = `optimistic-${Date.now()}`;
    let tempBlobUrls = [];

    try {
      const optimisticAttachments = files.map((file) => {
        let tempUrl = null;
        if (['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
          tempUrl = URL.createObjectURL(file);
          tempBlobUrls.push(tempUrl);
        }
        return {
          _id: `optimistic-att-${Date.now()}-${Math.random()}`,
          originalname: file.name,
          mimetype: file.type,
          tempUrl: tempUrl,
        };
      });

      const newUserMessage = {
        _id: tempMessageId,
        role: 'user',
        content: messageText || `Attached file(s): ${files.map((f) => f.name).join(', ')}`,
        attachments: optimisticAttachments,
        timestamp,
        isOptimistic: true,
      };

      setMessages((prev) => [...prev, newUserMessage]);

      const formData = new FormData();
      formData.append('message', messageText);
      if (currentConversation?._id) {
        formData.append('conversationId', currentConversation._id);
      }
      formData.append('useCase', activeUseCase);
      files.forEach((file) => formData.append('attachments', file));

      const res = await axios.post('/api/chat/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const conversationId = res.data.conversationId;
      if (conversationId) {
        await loadFullConversation(conversationId, false);
        if (!currentConversation?._id) {
          await getConversationSummaries(false);
        }
      } else {
        setError('Failed to get updated conversation ID from server.');
        setMessages((prev) => prev.filter((msg) => msg._id !== tempMessageId));
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.response?.data?.message || 'Failed send');
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessageId));
    } finally {
      tempBlobUrls.forEach((url) => URL.revokeObjectURL(url));
      setLoading(false);
    }
  }, [isAuthenticated, token, currentConversation?._id, activeUseCase, loadFullConversation, getConversationSummaries]);

  const deleteConversation = useCallback(async (idToDelete) => {
    if (!isAuthenticated || !token || !idToDelete) return;
    setError(null);
    try {
      await axios.delete(`/api/chat/conversation/${idToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversationSummaries((prev) => prev.filter((conv) => conv._id !== idToDelete));
      if (currentConversation?._id === idToDelete) {
        setCurrentConversation(null);
        setMessages([]);
        setActiveUseCase('Default');
      }
    } catch (err) {
      console.error('Delete conversation error:', err);
      setError(err.response?.data?.message || 'Failed delete');
    }
  }, [isAuthenticated, token, currentConversation?._id]);

  const editMessage = useCallback(async (messageId, newContent) => {
    if (!isAuthenticated || !token || !currentConversation?._id || !messageId || !newContent.trim()) {
      setError('Cannot edit message: missing data or empty content.');
      return;
    }

    const messageIndex = messages.findIndex((m) => m._id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'user') {
      setError('Message not found or cannot edit this message.');
      return;
    }

    setEditingLoading(true);
    setError(null);

    try {
      const res = await axios.put(
        `/api/chat/conversation/${currentConversation._id}/message/${messageId}`,
        { newContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedConversation = res.data.updatedConversation;
      if (updatedConversation && updatedConversation.messages) {
        setCurrentConversation(updatedConversation);
        setMessages(updatedConversation.messages);
        await getConversationSummaries(false);
      } else {
        await loadFullConversation(currentConversation._id, false);
      }
    } catch (err) {
      console.error('Edit message error:', err);
      setError(err.response?.data?.message || 'Failed to edit message');
    } finally {
      setEditingLoading(false);
    }
  }, [isAuthenticated, token, currentConversation?._id, messages, loadFullConversation, getConversationSummaries]);

  const changeUseCase = useCallback((useCase) => {
    setActiveUseCase(useCase);
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
    setLoading(false);
  }, []);

  const selectConversation = useCallback((id) => {
    if (currentConversation?._id !== id) {
      loadFullConversation(id);
      const summary = conversationSummaries.find((c) => c._id === id);
      if (summary) setActiveUseCase(summary.useCase);
    }
  }, [currentConversation?._id, conversationSummaries, loadFullConversation]);

  const startNewChat = useCallback((useCase = 'Default') => {
    setActiveUseCase(useCase);
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (isAuthenticated && token && currentConversation?._id && user?._id) {
      connectSocket(user._id, user.role);
      const socket = getSocket();
      socket.on('new_message', (data) => {
        if (data.conversationId === currentConversation._id) {
          addMessageFromSocket(data.message);
        }
      });
      return () => {
        socket.off('new_message');
      };
    }
  }, [isAuthenticated, token, user?._id, user?.role, currentConversation?._id, addMessageFromSocket]);

  useEffect(() => {
    if (isAuthenticated && token) {
      getConversationSummaries(true);
    } else {
      setConversationSummaries([]);
      setCurrentConversation(null);
      setMessages([]);
      setActiveUseCase('Default');
      setError(null);
      setLoading(false);
    }
  }, [isAuthenticated, token, getConversationSummaries]);

  return (
    <ChatContext.Provider
      value={{
        conversationSummaries,
        currentConversation,
        messages,
        loading,
        editingLoading,
        error,
        activeUseCase,
        getConversationSummaries,
        sendMessage,
        deleteConversation,
        editMessage,
        changeUseCase,
        startNewChat,
        selectConversation,
        clearError,
        addMessageFromSocket,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};