// RequireAgent.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RequireAgent = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="p-4">Loading...</div>;

  if (!isAuthenticated || user?.role !== 'agent') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAgent;
