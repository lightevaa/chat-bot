import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

import { connectSocket } from '../../socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default Axios base URL
  axios.defaults.baseURL = 'http://localhost:5000';

  // Attach Authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user when token is present
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/user');
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
        setError(err.response?.data?.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Connect socket once user is loaded
  useEffect(() => {
    if (user?._id && user?.role) {
      connectSocket(user._id, user.role);
    }
  }, [user]);

  // Optional: preload user from token (if not calling API)
 

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const login = async (userData) => {
    try {
      const res = await axios.post('/api/auth/login', userData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        clearError,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
