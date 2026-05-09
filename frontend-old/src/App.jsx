import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import { EventProvider } from './contexts/EventContext';
// Import from LOCAL src/pages now
import Dashboard from './pages/Dashboard.jsx';
import FAQManager from './pages/FAQManager.jsx';
import Activity from './pages/Activity.jsx';
import Settings from './pages/Settings.jsx';
import Suggested from './pages/Suggested.jsx';
import Team from './pages/Team.jsx';
import Integrations from './pages/Integrations.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <EventProvider>
      <Router>
        <Routes>
          {/* Public Routes without Layout */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes wrapped in Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/faq" element={<FAQManager />} />
                    <Route path="/activity" element={<Activity />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/suggested" element={<Suggested />} />
                    <Route path="*" element={<div className="text-center py-20 text-slate-500">404 - Page not found</div>} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{
          className: 'bg-slate-800 text-white border border-slate-700',
          style: { background: '#1e293b', color: '#fff' }
        }} />
      </Router>
    </EventProvider>
  );
}
