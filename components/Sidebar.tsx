import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, login, logout } = useAuth();

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-lg">C</span>
          Career OS
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-indigo-50 to-brand-50 p-4 rounded-xl mb-4">
          <p className="text-xs font-semibold text-brand-900 mb-1">Weekly Goal</p>
          <p className="text-sm text-gray-700">Apply to 5 Senior roles</p>
          <div className="w-full bg-white h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-brand-500 h-full w-3/5"></div>
          </div>
        </div>

        {/* Auth Section */}
        {user ? (
          <div className="flex items-center gap-3 px-2">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                <UserIcon size={16} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <LogOut size={10} /> Sign Out
              </button>
            </div>
          </div>
        ) : (
           <button 
             onClick={login}
             className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
           >
             <UserIcon size={16} /> Sign In
           </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
