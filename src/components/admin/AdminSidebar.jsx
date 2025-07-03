import { useEffect, useState } from 'react'; // Import useState and useEffect
import { useNavigate, NavLink } from 'react-router-dom'; // Use NavLink for active state
import { useAuth } from '../../context/AuthContext';
// Keep existing icons
import { HiOutlineLogout, HiOutlineHome, HiOutlineUsers, HiOutlineChatAlt2, HiOutlineChartBar, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

// Re-use theme list if needed, or just fetch from localStorage
const themes = [    "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
  "winter", "dim", "nord", "sunset",];

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // --- Theme State (Copied from main Sidebar for consistency if needed, or read directly) ---
  const [currentTheme, setCurrentTheme] = useState(() => {
      return localStorage.getItem('chatbotTheme') || 'light';
  });

  // Effect to apply theme to <html> tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('chatbotTheme', currentTheme);
  }, [currentTheme]);

  // Handler for theme change
  const handleThemeChange = (newTheme) => {
      setCurrentTheme(newTheme);
      const elem = document.activeElement;
       if(elem && typeof elem.blur === 'function'){ elem.blur(); }
  };
  // --- End Theme State ---


  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle back to chat
  const handleBackToChat = () => {
    navigate('/');
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', path: '/admin', icon: <HiOutlineChartBar className="w-5 h-5" /> },
    { id: 'users', name: 'Users', path: '/admin/users', icon: <HiOutlineUsers className="w-5 h-5" /> },
    { id: 'conversations', name: 'Conversations', path: '/admin/conversations', icon: <HiOutlineChatAlt2 className="w-5 h-5" /> }
  ];

  return (
    // Use theme colors for sidebar background and borders
    <div className="w-64 bg-base-200 h-screen flex flex-col border-r border-base-300 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <h1 className="text-xl font-bold text-base-content">Admin Panel</h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Use DaisyUI menu for styling */}
        <ul className="menu p-0"> {/* Removed padding from menu */}
          {navItems.map((item) => (
            <li key={item.id}>
              {/* Use NavLink for active class styling */}
              <NavLink
                to={item.path}
                // DaisyUI active class or manual styling based on theme
                className={({ isActive }) =>
                  `flex items-center text-sm rounded-md ${
                    isActive ? 'active bg-primary text-primary-content' : 'hover:bg-base-300'
                  }`
                }
                end // Use 'end' prop for Dashboard link to only match exact path
              >
                <span className="mr-3 opacity-70">{item.icon}</span>
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-base-300">
         {/* Theme Switcher (Same as in main Sidebar) */}
         <div className="dropdown dropdown-top w-full mb-2">
           <div tabIndex={0} role="button" className="btn btn-sm btn-ghost flex justify-start items-center w-full font-normal normal-case">
              {['dark', 'night', 'synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'business', 'coffee', 'dim'].includes(currentTheme) ? ( <HiOutlineMoon className="w-4 h-4 mr-2 flex-shrink-0" /> ) : ( <HiOutlineSun className="w-4 h-4 mr-2 flex-shrink-0" /> )}
              <span className="flex-1 text-left">Theme: <span className='font-medium capitalize'>{currentTheme}</span></span>
              <svg width="12px" height="12px" className="ml-1 h-2 w-2 fill-current opacity-60 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
           </div>
           <ul tabIndex={0} className="dropdown-content z-[20] p-2 shadow-lg bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto menu menu-sm">
             {themes.map((theme) => ( <li key={theme}> <a onClick={(e) => { e.preventDefault(); handleThemeChange(theme); }} className={`capitalize ${currentTheme === theme ? 'active' : ''}`} > {theme} </a> </li> ))}
           </ul>
         </div>

        {/* Use DaisyUI Button styling */}
        <button
          onClick={handleBackToChat}
          className="btn btn-ghost btn-sm w-full justify-start font-normal normal-case mb-2"
        >
          <HiOutlineHome className="w-5 h-5 mr-3 opacity-70" />
          Back to Chat
        </button>

        <button
          onClick={handleLogout}
          // Use btn-error for visual cue
          className="btn btn-ghost btn-sm w-full justify-start font-normal normal-case text-error hover:bg-error/10"
        >
          <HiOutlineLogout className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;