// src/components/agent/AgentSidebar.jsx
import { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineLogout,
  HiOutlineChatAlt2,
  HiOutlineUserGroup,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineHome,
  HiOutlineChartBar, // 👈 added for dashboard icon
} from 'react-icons/hi';

const themes = ['coffee', 'dark', 'light', 'dracula', 'dim', 'halloween'];

const AgentSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('chatbotTheme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('chatbotTheme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    const el = document.activeElement;
    if (el?.blur) el.blur();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ✅ Added Dashboard to navItems
  const navItems = [
    {
      name: 'Dashboard',
      path: '/agent',
      icon: <HiOutlineChartBar className="w-5 h-5" />
    },
    {
      name: 'User Requests',
      path: '/agent',
      icon: <HiOutlineUserGroup className="w-5 h-5" />
    },
    {
      name: 'Contact Admin',
      path: '/agent/admin',
      icon: <HiOutlineChatAlt2 className="w-5 h-5" />
    }
  ];

  return (
    <div className="w-64 h-screen bg-base-200 flex flex-col border-r border-base-300">
      <div className="p-4 border-b border-base-300">
        <h1 className="text-xl font-bold">Agent Panel</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <ul className="menu">
          {navItems.map(({ name, path, icon }) => (
            <li key={name}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center text-sm rounded-md ${
                    isActive ? 'active bg-primary text-primary-content' : 'hover:bg-base-300'
                  }`
                }
                end
              >
                <span className="mr-3 opacity-70">{icon}</span>
                {name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-base-300">
        <div className="dropdown dropdown-top w-full mb-2">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-sm btn-ghost flex justify-start items-center w-full font-normal normal-case"
          >
            {['dark', 'coffee', 'dracula', 'dim'].includes(currentTheme) ? (
              <HiOutlineMoon className="w-4 h-4 mr-2" />
            ) : (
              <HiOutlineSun className="w-4 h-4 mr-2" />
            )}
            <span className="flex-1 text-left">
              Theme: <span className="font-medium capitalize">{currentTheme}</span>
            </span>
          </div>
          <ul className="dropdown-content p-2 shadow-lg bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto menu menu-sm z-20">
            {themes.map((theme) => (
              <li key={theme}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    handleThemeChange(theme);
                  }}
                  className={`capitalize ${currentTheme === theme ? 'active' : ''}`}
                >
                  {theme}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate('/')}
          className="btn btn-ghost btn-sm w-full justify-start font-normal normal-case mb-2"
        >
          <HiOutlineHome className="w-5 h-5 mr-2 opacity-70" />
          Back to Chat
        </button>

        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm w-full justify-start font-normal normal-case text-error hover:bg-error/10"
        >
          <HiOutlineLogout className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AgentSidebar;
