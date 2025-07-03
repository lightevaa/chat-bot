import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { HiHome, HiOutlineLogout, HiPlus, HiChatAlt2, HiTrash, HiOutlineCog, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { FaHospital, FaUniversity, FaShoppingCart, FaChartLine } from 'react-icons/fa';
import { BsBuildingFillCheck } from 'react-icons/bs';

// List of all DaisyUI themes from your config
const themes = [
    "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
    "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
    "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
    "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
    "winter", "dim", "nord", "sunset",
];

const Sidebar = () => {
  const { logout, user, isAdmin } = useAuth();
  const {
    activeUseCase, conversationSummaries, currentConversation,
    selectConversation, startNewChat, getConversationSummaries, deleteConversation
  } = useChat();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(null); // State to track which confirmation is shown
  // --- Theme State ---
  const [currentTheme, setCurrentTheme] = useState(() => {
      // Get theme from localStorage or default to 'light'
      return localStorage.getItem('chatbotTheme') || 'light';
  });

  // Effect to apply theme to <html> tag when component mounts or theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('chatbotTheme', currentTheme); // Save theme choice
  }, [currentTheme]);

  // Handler for theme change
  const handleThemeChange = (newTheme) => {
      setCurrentTheme(newTheme);
      // Close the dropdown if needed by blurring the active element
      const elem = document.activeElement;
       if(elem && typeof elem.blur === 'function'){ // Check if blur exists
         elem.blur();
       }
  };
  // --- End Theme State ---


  useEffect(() => { getConversationSummaries(); }, [getConversationSummaries]);
  const handleUseCaseChange = (useCase) => { startNewChat(useCase); };
  const handleSelectConversation = (id) => { setShowConfirm(null); selectConversation(id); };
  const handleDeleteClick = (e, convId) => { e.stopPropagation(); setShowConfirm(convId); };
  const confirmDelete = (e, convId) => { e.stopPropagation(); deleteConversation(convId); setShowConfirm(null); };
  const cancelDelete = (e) => { e.stopPropagation(); setShowConfirm(null); };
  const handleLogout = () => { logout(); navigate('/login'); };
  const handleAdminDashboard = () => { navigate('/admin'); };
  const handleAgentDashboard = () => { navigate('/agent'); };

  const truncateText = (text, length = 20) => {
    if (!text) return '...';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };


  const useCases = [
    { id: 'Default', name: 'Default', icon: <HiHome className="w-5 h-5" /> },
    { id: 'Healthcare', name: 'Healthcare', icon: <FaHospital className="w-5 h-5" /> },
    { id: 'Banking', name: 'Banking', icon: <BsBuildingFillCheck className="w-5 h-5" /> },
    { id: 'Education', name: 'Education', icon: <FaUniversity className="w-5 h-5" /> },
    { id: 'E-commerce', name: 'E-commerce', icon: <FaShoppingCart className="w-5 h-5" /> },
    { id: 'Lead Generation', name: 'Lead Generation', icon: <FaChartLine className="w-5 h-5" /> }
  ];

  return (
    <div className="w-64 bg-base-200 text-base-content h-screen flex flex-col border-r border-base-300">
      <div className="p-4 border-b border-base-300 flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-bold">Chatbot</h1>
         <button
            onClick={() => startNewChat()}
            title="Start New Chat"
            className="btn btn-ghost btn-sm p-1"
          >
            <HiPlus className="w-5 h-5" />
          </button>
      </div>

      <div className="p-4 border-b border-base-300 flex-shrink-0">
        <h2 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2">
          Start New Chat
        </h2>
        <nav className="mt-2 space-y-1">
           {useCases.map((useCase) => (
             <button
               key={useCase.id}
               onClick={() => handleUseCaseChange(useCase.id)}
               title={`Start new ${useCase.name} chat`}
               className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                 activeUseCase === useCase.id && !currentConversation
                   ? 'bg-primary text-primary-content font-medium'
                   : 'hover:bg-base-300'
               }`}
             >
               <span className="mr-3 text-base-content/70">{useCase.icon}</span>
               {useCase.name}
             </button>
           ))}
        </nav>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex-grow min-h-0">
        <h2 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2">
          Recent Chats
        </h2>
        <nav className="mt-2 space-y-1">
          {conversationSummaries && conversationSummaries.length > 0 ? (
             conversationSummaries.map((conv) => (
               <div key={conv._id} className="relative group">
                 <button
                   onClick={() => handleSelectConversation(conv._id)}
                   title={`Continue chat: ${conv.lastMessage}`}
                   className={`flex items-center w-full px-3 py-2 text-sm rounded-md text-left transition-colors duration-150 ${
                     currentConversation?._id === conv._id
                       ? 'bg-primary text-primary-content font-medium'
                       : 'hover:bg-base-300'
                   }`}
                 >
                   <HiChatAlt2 className="w-4 h-4 mr-2 flex-shrink-0 text-base-content/70" />
                   <span className="flex-1 truncate pr-4">
                     {truncateText(conv.lastMessage) || `(${conv.useCase} Chat)`}
                   </span>
                 </button>
                 {showConfirm !== conv._id && (
                    <button
                        onClick={(e) => handleDeleteClick(e, conv._id)}
                        title="Delete conversation"
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-error opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-error/20"
                    >
                        <HiTrash className="w-4 h-4" />
                    </button>
                 )}
                 {showConfirm === conv._id && (
                    <div className="absolute inset-x-1 bottom-0 top-0 z-10 bg-base-200 bg-opacity-95 flex items-center justify-center rounded-md p-1 text-xs">
                        <span className="mr-1 text-error font-medium">Delete?</span>
                        <button onClick={(e) => confirmDelete(e, conv._id)} className="btn btn-error btn-xs mr-1">Yes</button>
                        <button onClick={cancelDelete} className="btn btn-ghost btn-xs">No</button>
                    </div>
                 )}
               </div>
             ))
          ) : (
             <p className="text-sm text-base-content/70 px-3 py-2">No recent chats.</p>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-base-300 flex-shrink-0">
         <div className="mb-3 text-sm">
           <p className="font-medium text-base-content truncate">{user?.name}</p>
           <p className="text-xs text-base-content/70 truncate">{user?.email}</p>
         </div>

        {isAdmin && (
          <button
            onClick={handleAdminDashboard}
            className="flex items-center w-full px-3 py-2 text-sm hover:bg-base-300 rounded-md mb-2"
          >
             <svg className="w-5 h-5 mr-3 text-base-content/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Admin Panel
          </button>
        )}
        {user?.role === 'agent' && (
          <button
            onClick={handleAgentDashboard}
            className="flex items-center w-full px-3 py-2 text-sm hover:bg-base-300 rounded-md mb-2"
          >
            <svg className="w-5 h-5 mr-3 text-base-content/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3 8 4-16 3 8h4" /></svg>
            Agent Panel
          </button>
        )}

        <div className="dropdown dropdown-top w-full mb-2">
          <div tabIndex={0} role="button" className="btn btn-sm btn-ghost flex justify-start items-center w-full font-normal normal-case">
             {['dark', 'night', 'synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'business', 'coffee', 'dim'].includes(currentTheme) ? (
                 <HiOutlineMoon className="w-4 h-4 mr-2 flex-shrink-0" />
             ) : (
                 <HiOutlineSun className="w-4 h-4 mr-2 flex-shrink-0" />
             )}
             <span className="flex-1 text-left">Theme: <span className='font-medium capitalize'>{currentTheme}</span></span>
             <svg width="12px" height="12px" className="ml-1 h-2 w-2 fill-current opacity-60 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
          </div>
          <ul tabIndex={0} className="dropdown-content z-[20] p-2 shadow-lg bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto menu menu-sm">
            {themes.map((theme) => (
              <li key={theme}>
                <a
                  onClick={(e) => { e.preventDefault(); handleThemeChange(theme); }}
                  className={`capitalize ${currentTheme === theme ? 'active' : ''}`}
                >
                  {theme}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm text-error hover:bg-error/20 rounded-md"
        >
          <span className="mr-3">
            <HiOutlineLogout className="w-5 h-5" />
          </span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
