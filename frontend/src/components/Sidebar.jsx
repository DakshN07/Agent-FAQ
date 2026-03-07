import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Activity,
  Lightbulb,
  Zap,
  ChevronRight,
  Plus,
  Users,
  Link2,
  LogOut
} from 'lucide-react';
import { useEvent } from '../contexts/EventContext';
import CreateEventModal from './CreateEventModal';

const NavItem = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items - center justify - between px - 4 py - 3.5 rounded - xl transition - all duration - 300 group ${active
      ? 'bg-primary-600/10 text-primary-600 font-medium'
      : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
      } `}
  >
    <div className="flex items-center space-x-3">
      <Icon className={`w - 5 h - 5 transition - colors ${active ? 'text-primary-500' : 'text-slate-500 group-hover:text-slate-300'} `} />
      <span>{label}</span>
    </div>
    {active && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50"></div>}
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const { events, activeEvent, selectEvent } = useEvent();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 w-72 bg-[#0F172A] border-r border-slate-800/50 flex flex-col z-50">
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center space-x-3 mb-10 px-2 min-w-0">
            <div className="w-10 h-10 shrink-0">
              <img src="/logo.png" alt="AgentFAQ Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight truncate">
                Agent FAQ
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <select
                  className="block flex-1 max-w-full w-full bg-slate-800 border-none text-xs text-slate-300 rounded-md focus:ring-0 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                  value={activeEvent?._id || ''}
                  onChange={(e) => selectEvent(e.target.value)}
                >
                  {events.length === 0 ? (
                    <option value="">No events found</option>
                  ) : (
                    events.map(event => (
                      <option key={event._id} value={event._id}>{event.name}</option>
                    ))
                  )}
                </select>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-primary-600 hover:bg-primary-500 text-white p-1 rounded-md transition-colors"
                  title="Create New Event"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-widest">Platform</p>
            <NavItem
              to="/dashboard"
              active={isActive('/dashboard')}
              label="Overview"
              icon={LayoutDashboard}
            />
            <NavItem
              to="/activity"
              active={isActive('/activity')}
              label="Activity Feed"
              icon={Activity}
            />
          </div>

          <div className="space-y-1 mt-8">
            <p className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-widest">Knowledge</p>
            <NavItem
              to="/faq"
              active={isActive('/faq')}
              label="Database"
              icon={MessageSquare}
            />
            <NavItem
              to="/suggested"
              active={isActive('/suggested')}
              label="Insights"
              icon={Lightbulb}
            />
            <NavItem
              to="/team"
              active={isActive('/team')}
              label="Team Access"
              icon={Users}
            />
            <NavItem
              to="/integrations"
              active={isActive('/integrations')}
              label="Integrations"
              icon={Link2}
            />
            <NavItem
              to="/settings"
              active={isActive('/settings')}
              label="Configuration"
              icon={Settings}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-6 border-t border-slate-800/50 flex items-center justify-between">
          <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors cursor-pointer group flex-1 text-left">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-700 to-slate-600 flex items-center justify-center text-sm font-bold text-white border-2 border-slate-700 group-hover:border-primary-500/50 transition-colors">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">My Profile</p>
              <p className="text-xs text-slate-500 truncate">Edit Contact Info</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
          </Link>

          <button
            onClick={handleLogout}
            title="Log Out / Go Home"
            className="ml-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 text-slate-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>
      <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
};

export default Sidebar;
