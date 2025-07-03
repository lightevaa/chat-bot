import { useState, useEffect } from 'react';
import axios from 'axios';
import { connectSocket, getSocket } from '../../../socket'; // ✅ adjust path as needed

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/admin/users');
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ✅ Setup Socket.IO for real-time user updates
  useEffect(() => {
    const adminId = localStorage.getItem('userId') || 'admin';
    connectSocket(adminId, 'admin');
    const socket = getSocket();

    socket.on('new_user_registered', (newUser) => {
      setUsers(prev => [newUser, ...prev]);
    });

    return () => {
      socket.off('new_user_registered');
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-bold">Error</h3>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-md border border-base-300">
      <div className="card-body">
        <div className="flex justify-between items-center mb-6">
          <h1 className="card-title text-2xl">Users</h1>
          <span className="badge badge-lg badge-neutral">
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="hover">
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          user.role === 'admin' ? 'badge-secondary' :
                          user.role === 'agent' ? 'badge-info' : 'badge-accent'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-base-content/70 py-4">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersList;
