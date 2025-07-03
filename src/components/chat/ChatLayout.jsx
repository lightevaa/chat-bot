import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import ChatBox from './ChatBox';
import FloatingSupportButton from './FloatingSupportButton';
import FloatingSupportChat from './FloatingSupportChat';

const ChatLayout = () => {
  const { isAuthenticated, loading, user } = useAuth(); // ⬅️ Added user here
  const navigate = useNavigate();
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen relative">
      <Sidebar />
      <div className="flex-1 relative">
        <ChatBox />
        
        {/* ✅ Only users see the floating support button */}
        {user?.role === 'user' && (
          <>
            <FloatingSupportButton onClick={() => setShowSupport(!showSupport)} />
            {showSupport && <FloatingSupportChat onClose={() => setShowSupport(false)} />}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
