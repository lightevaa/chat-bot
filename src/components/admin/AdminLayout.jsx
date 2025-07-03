import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    // Apply theme from localStorage on initial load for admin section
    const savedTheme = localStorage.getItem('chatbotTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (!isAdmin) {
        navigate('/');
      }
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  // Show loading state
  if (loading) {
    return (
      // Use theme background for loading screen
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        {/* Use primary color for spinner */}
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // If not authenticated or not admin, don't render content (redirect will happen)
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    // Use theme background color for the layout
    <div className="flex h-screen bg-base-100 text-base-content">
      <AdminSidebar />
      {/* Use theme base background for main content area */}
      <main className="flex-1 overflow-y-auto p-6 bg-base-100">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;