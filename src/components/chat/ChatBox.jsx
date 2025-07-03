// ChatBox.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  HiPaperClip, HiX, HiOutlineDocumentText, HiOutlinePhotograph,
  HiOutlineFolder, HiOutlinePencil, HiCheck, HiXCircle
} from 'react-icons/hi';
import { connectSocket, getSocket } from '../../../socket'; // <-- added

// --- Message Component ---
const MessageItem = ({ message }) => {
  const { editMessage, editingLoading } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const editInputRef = useRef(null);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (mimetype = '', originalname = '') => {
    if (mimetype.startsWith('image/')) return <HiOutlinePhotograph className="w-5 h-5 text-purple-500 flex-shrink-0" />;
    if (mimetype === 'application/pdf') return <HiOutlineDocumentText className="w-5 h-5 text-red-500 flex-shrink-0" />;
    if (mimetype === 'application/zip' || originalname.toLowerCase().endsWith('.zip')) return <HiOutlineFolder className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
    return <HiOutlineDocumentText className="w-5 h-5 text-blue-500 flex-shrink-0" />;
  };

  const handleEditClick = () => {
    setEditText(message.content);
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  const handleCancelEdit = () => setIsEditing(false);
  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.content && !editingLoading) {
      editMessage(message._id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const isThisMessageEditing = editingLoading && isEditing;

  return (
    <div key={message._id} className={`group flex relative ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl rounded-lg px-4 py-2 shadow-sm relative ${message.role === 'user' ? 'bg-primary text-primary-content rounded-br-none' : 'bg-base-300 text-base-content rounded-bl-none'} ${(message.isOptimistic || message.isOptimisticEdit || isThisMessageEditing) ? 'opacity-70' : ''}`}>
        {isEditing ? (
          <div className="flex flex-col">
            <textarea
              ref={editInputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              disabled={isThisMessageEditing}
              className="text-sm bg-base-100 text-base-content rounded p-1 border border-base-content/30 focus:ring-1 focus:ring-primary focus:outline-none resize-none w-full min-w-[200px]"
              rows={Math.max(1, Math.min(5, editText.split('\n').length))}
            />
            <div className="flex justify-end items-center mt-1 space-x-1">
              {isThisMessageEditing ? (
                <span className="loading loading-spinner loading-xs text-base-content/70"></span>
              ) : (
                <>
                  <button onClick={handleCancelEdit} title="Cancel" className="p-1 text-error/80 hover:text-error rounded-full hover:bg-error/10"><HiXCircle className="w-4 h-4" /></button>
                  <button onClick={handleSaveEdit} title="Save" className="p-1 text-success/80 hover:text-success rounded-full hover:bg-success/10"><HiCheck className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {message.content && (
              <div
                className={`text-sm break-words whitespace-pre-wrap ${
                  message.role === 'assistant'
                    ? 'prose prose-sm max-w-full prose-p:my-1 prose-code:px-1 prose-code:py-0.5 prose-code:bg-base-200 prose-code:rounded prose-code:text-sm prose-pre:bg-base-200 prose-pre:text-sm prose-pre:p-2 prose-pre:rounded overflow-x-auto'
                    : ''
                }`}
                dangerouslySetInnerHTML={{
                  __html:
                    message.role === 'assistant'
                      ? message.content
                      : message.content.replace(/\n/g, '<br />'),
                }}
              />
            )}

            {message.attachments?.length > 0 && (
              <div className={`mt-2 pt-2 ${message.content ? 'border-t' : ''} ${message.role === 'user' ? 'border-primary-content/30' : 'border-base-content/20'}`}>
                {!(message.content?.startsWith('Attached file(s):') && message.attachments.length > 0) && (
                  <p className="text-xs font-medium mb-1 opacity-80">{message.attachments.length} Attachment(s):</p>
                )}
                <div className="space-y-1">
                  {message.attachments.map((att, idx) => (
                    <div key={att._id || idx} className={`flex items-center p-1 rounded text-xs ${message.role === 'user' ? 'bg-primary-focus/30' : 'bg-base-100'}`}>
                      <span className="mr-2">{getFileIcon(att.mimetype || '', att.originalname || '')}</span>
                      {att.path ? (
                        <a
                          href={att.path.startsWith('uploads/') ? `/${att.path}` : att.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline flex-1 min-w-0 opacity-90 hover:opacity-100"
                          title={att.originalname}
                        >
                          {att.originalname}
                        </a>
                      ) : (
                        <span className="truncate flex-1 min-w-0 opacity-90" title={att.originalname}>{att.originalname}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end items-center text-xs mt-1 opacity-70">
              {message.role === 'user' && !message.isOptimistic && !isThisMessageEditing && (
                <button onClick={handleEditClick} title="Edit message" className="mr-2 p-0.5 hover:text-primary-content text-primary-content/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-primary-content/20"><HiOutlinePencil className="w-3 h-3" /></button>
              )}
              <span>{message.isOptimistic ? 'Sending...' : formatTime(message.timestamp)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Main ChatBox Component ---
const ChatBox = () => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const {
    messages,
    loading,
    editingLoading,
    sendMessage,
    activeUseCase,
    currentConversation,
    error,
    clearError,
    addMessageFromSocket // <-- make sure this exists in context
  } = useChat();

  // Connect to socket and listen for new AI messages
  useEffect(() => {
    if (currentConversation?._id) {
      const userId = localStorage.getItem('userId'); // Or however you store it
      connectSocket(userId, 'user');
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
  }, [currentConversation?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, editingLoading]);

  useEffect(() => {
    setInput('');
    setAttachments([]);
    if (error) clearError();
  }, [currentConversation?._id, activeUseCase, clearError]);

  const handleFileChange = useCallback((event) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setAttachments(prev => [...prev, ...files].slice(0, 5));
    }
    if (event.target) event.target.value = null;
  }, []);

  const removeAttachment = useCallback((indexToRemove) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading || editingLoading || (!input.trim() && attachments.length === 0)) return;
    const currentInput = input;
    const currentAttachments = attachments;
    setInput('');
    setAttachments([]);
    try {
      await sendMessage(currentInput, currentAttachments);
    } catch (submitError) {
      console.error("Submit Error in ChatBox:", submitError);
    }
  }, [input, attachments, loading, editingLoading, sendMessage]);

  const getPreviewFileIcon = (mimetype = '', originalname = '') => {
    if (mimetype.startsWith('image/')) return <HiOutlinePhotograph className="w-5 h-5 text-purple-500 flex-shrink-0" />;
    if (mimetype === 'application/pdf') return <HiOutlineDocumentText className="w-5 h-5 text-red-500 flex-shrink-0" />;
    if (mimetype === 'application/zip' || originalname.toLowerCase().endsWith('.zip')) return <HiOutlineFolder className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
    return <HiOutlineDocumentText className="w-5 h-5 text-blue-500 flex-shrink-0" />;
  };

  return (
    <div className="flex flex-col h-screen bg-base-100 text-base-content">
      {/* Header */}
      <div className="p-4 bg-primary text-primary-content flex justify-between items-center shadow-sm flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold">{activeUseCase} Assistant</h2>
          <p className="text-xs text-primary-content/70 truncate max-w-xs sm:max-w-sm md:max-w-md">
            {currentConversation ? `ID: ${currentConversation._id}` : `New Chat`}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-2 bg-error text-error-content text-sm text-center border-b border-error/30 flex-shrink-0 flex justify-between items-center">
          <span>Error: {error}</span>
          <button onClick={clearError} className="ml-2 text-error-content/80 hover:text-error-content font-bold">X</button>
        </div>
      )}

      {/* Chat Message Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-base-100 relative">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageItem key={message._id || message.timestamp} message={message} />
          ))}

          {loading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && !editingLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl rounded-lg px-4 py-2 bg-base-300 text-base-content rounded-bl-none shadow-sm">
                <div className="flex items-center space-x-2 text-sm text-base-content/70">
                  <span className="loading loading-dots loading-xs"></span>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} className="h-0" />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-base-300 bg-base-200 flex-shrink-0">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 border-b border-base-300 pb-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center bg-base-100 text-base-content rounded-full px-2 py-1 text-xs max-w-[150px]">
                <span className="flex-shrink-0">{getPreviewFileIcon(file.type, file.name)}</span>
                <span className="ml-1 truncate flex-1" title={file.name}>{file.name}</span>
                <button onClick={() => removeAttachment(index)} className="ml-1 p-0.5 hover:bg-error/20 text-error rounded-full flex-shrink-0">
                  <HiX className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <button type="button" onClick={triggerFileInput} title="Attach files" className={`p-2 text-base-content/70 hover:text-primary mr-2 rounded-full ${(loading || editingLoading) ? 'cursor-not-allowed opacity-50' : 'hover:bg-base-300'}`} disabled={loading || editingLoading}>
            <HiPaperClip className="w-5 h-5" />
          </button>
          <input type="file" ref={fileInputRef} multiple onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.png,.zip,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.html,.css,.json,.md" disabled={loading || editingLoading} />

          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything or attach files..."
            className="flex-1 px-4 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none max-h-24 overflow-y-auto mr-2 bg-base-100 text-base-content"
            disabled={loading || editingLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
              const textarea = e.currentTarget;
              textarea.style.height = 'auto';
              textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
            }}
            style={{ height: '42px' }}
          />

          <button
            type="submit"
            disabled={loading || editingLoading || (!input.trim() && attachments.length === 0)}
            className={`p-2 rounded-md bg-primary text-primary-content flex items-center justify-center h-10 w-10 flex-shrink-0 ${ (loading || editingLoading || (!input.trim() && attachments.length === 0)) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-focus' }`}
            title="Send Message"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3.105 3.105a.75.75 0 0 1 .814-.156l14.69 8.263a.75.75 0 0 1 0 1.342L3.919 21.05a.75.75 0 0 1-1.156-.814l1.93-6.951L16.25 12l-11.557-1.285L3.105 3.105Z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
