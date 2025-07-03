import { useState, useEffect } from 'react';
import axios from 'axios';
import { HiOutlineUsers, HiOutlineChatAlt2, HiOutlineUserGroup } from 'react-icons/hi';
import { connectSocket, getSocket } from '../../../socket'; // ✅ Adjust path as needed

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  // Fetch initial dashboard data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/admin/stats');
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Socket.IO for real-time dashboard updates
  useEffect(() => {
    const adminId = localStorage.getItem('userId') || 'admin';
    connectSocket(adminId, 'admin');
    const socket = getSocket();

    // Real-time user registration
    socket.on('new_user_registered', (newUser) => {
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          userStats: {
            ...prev.userStats,
            totalUsers: prev.userStats.totalUsers + 1,
            totalAdmins: newUser.role === 'admin' ? prev.userStats.totalAdmins + 1 : prev.userStats.totalAdmins,
          },
          recentUsers: [newUser, ...prev.recentUsers.slice(0, 4)], // keep max 5
        };
      });
    });

    // Real-time new conversation message
    socket.on('admin_new_message', (data) => {
      setStats((prev) => {
        if (!prev) return prev;
        const updatedUseCases = [...(prev.conversationStats.byUseCase || [])];
        const index = updatedUseCases.findIndex((u) => u._id === data.useCase);
        if (index !== -1) {
          updatedUseCases[index].count += 1;
        } else {
          updatedUseCases.push({ _id: data.useCase, count: 1 });
        }

        return {
          ...prev,
          conversationStats: {
            ...prev.conversationStats,
            total: prev.conversationStats.total + 1,
            byUseCase: updatedUseCases,
          },
        };
      });
    });

    // Real-time message reception
    socket.on('receive_message', (msg) => {
      console.log('Received:', msg);
      setMessages((prev) => [...prev, msg]);
    });

    // Join the room for real-time updates
    socket.emit('register', adminId); // Join room

    // Cleanup on component unmount
    return () => {
      socket.off('new_user_registered');
      socket.off('admin_new_message');
      socket.off('receive_message');
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-base-content">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-200 shadow-md border border-base-300">
          <div className="card-body items-center text-center md:items-start md:text-left md:flex-row md:space-x-4">
            <div className="p-3 rounded-full bg-primary text-primary-content">
              <HiOutlineUsers className="w-6 h-6" />
            </div>
            <div className="stat p-0">
              <div className="stat-title text-base-content/70">Total Users</div>
              <div className="stat-value text-base-content">{stats?.userStats?.totalUsers || 0}</div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-md border border-base-300">
          <div className="card-body items-center text-center md:items-start md:text-left md:flex-row md:space-x-4">
            <div className="p-3 rounded-full bg-secondary text-secondary-content">
              <HiOutlineUserGroup className="w-6 h-6" />
            </div>
            <div className="stat p-0">
              <div className="stat-title text-base-content/70">Admin Users</div>
              <div className="stat-value text-base-content">{stats?.userStats?.totalAdmins || 0}</div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-md border border-base-300">
          <div className="card-body items-center text-center md:items-start md:text-left md:flex-row md:space-x-4">
            <div className="p-3 rounded-full bg-accent text-accent-content">
              <HiOutlineChatAlt2 className="w-6 h-6" />
            </div>
            <div className="stat p-0">
              <div className="stat-title text-base-content/70">Total Conversations</div>
              <div className="stat-value text-base-content">{stats?.conversationStats?.total || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-md border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg">Conversations by Use Case</h2>
          {stats?.conversationStats?.byUseCase?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {stats.conversationStats.byUseCase.map((item) => (
                <div key={item._id} className="flex justify-between items-center p-3 border-b border-base-300">
                  <span className="font-medium">{item._id}</span>
                  <span className="badge badge-ghost badge-sm">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base-content/70 mt-4">No conversation data available</p>
          )}
        </div>
      </div>

      <div className="card bg-base-200 shadow-md border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Recent User Registrations</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentUsers?.length > 0 ? (
                  stats.recentUsers.map((user) => (
                    <tr key={user._id} className="hover">
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge badge-sm ${
                            user.role === 'admin' ? 'badge-secondary' : 'badge-accent'
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
                      No recent users
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
