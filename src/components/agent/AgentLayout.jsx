// src/components/agent/AgentLayout.jsx
import { Outlet } from 'react-router-dom';
import AgentSidebar from './AgentSidebar';

const AgentLayout = () => {
  return (
    <div className="flex min-h-screen">
      <AgentSidebar />
      <div className="flex-1 p-4 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AgentLayout;
