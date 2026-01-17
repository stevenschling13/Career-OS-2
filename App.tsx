import React from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import SmartInbox from './pages/SmartInbox';
import Prep from './pages/Prep';
import Settings from './pages/Settings';
import { AuthProvider } from './contexts/AuthContext';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="ml-64 flex-1">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="inbox" element={<SmartInbox />} />
            <Route path="prep" element={<Prep />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<div className="p-8">Page not found</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;