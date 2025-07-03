import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user.role === 'agent') return <Navigate to="/agent" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  return <Navigate to="/chat" />;
};

export default RoleRedirect;
