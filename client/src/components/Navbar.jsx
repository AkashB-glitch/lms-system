import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-white shadow-md border-b-[4px] border-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-black text-indigo-600 tracking-tight">LeaveSync</h1>
            </div>
            {user && (
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-700">Dashboard</Link>
                <Link to="/attendance" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-700">Attendance</Link>
                {['Admin', 'HOD'].includes(user.role) && (
                  <Link to="/analytics" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-700">Enterprise Analytics</Link>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-gray-600">Logged in as: <span className="font-bold text-gray-900">{user?.name}</span> (<span className="text-indigo-600 font-semibold">{user?.role}</span>)</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
