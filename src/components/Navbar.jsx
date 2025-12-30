import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CompanyLogo from '../assets/logo.png';
import { Bell, Menu, X, User, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  if (!user) return null;

  const { role, employeeId } = user;

  // Cleaned up menu items with proper role-based access
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    
    // Admin + HR access
    ...(role === 'admin' || role === 'hr' ? [{ name: 'Employees', path: '/employees' }] : []),
    
    // Admin + Manager + Employee access
    ...(role === 'admin' || role === 'manager' || role === 'employee'
      ? [
          { name: 'Team', path: '/team' },
          { name: 'Tickets', path: '/tasks' },
          { name: 'Projects', path: '/projects' },
        ]
      : []),
    
    // Admin + HR + Manager + Employee access
    ...(role === 'admin' || role === 'hr' || role === 'manager' || role === 'employee'
      ? [{ name: 'Attendance', path: '/attendance' }]
      : []),
    
    // Admin + HR access
    ...(role === 'admin' || role === 'hr' ? [{ name: 'Leave', path: '/leave' }] : []),
    
    // Employee access
    ...(role === 'employee'
      ? [{ name: 'Leave', path: '/leave' }]
      : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-xl border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10  rounded-lg flex items-center justify-center shadow-lg">
                <img
                  src={CompanyLogo}
                  alt="Wordlane Tech Logo"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="text-lg font-bold text-gray-800">Wordlane Tech</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-full px-6 py-2 shadow-inner">
              <ul className="flex items-center space-x-4">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                        location.pathname === item.path
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-blue-200'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-all duration-200 group"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-fade-in">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <ul className="py-2 space-y-1">
                      <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>New ticket assigned</span>
                      </li>
                      <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Leave request approved</span>
                      </li>
                      <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Attendance reminder</span>
                      </li>
                      <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Performance review pending</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-all duration-200 group"
              >
                <User size={22} />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-fade-in">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm">{employeeId}</p>
                    <p className="text-xs text-gray-500">{role.toUpperCase()}</p>
                  </div>
                  <ul className="py-2">
                    <li>
                      <Link
                        to="/profile"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        View Profile
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-blue-600"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 pt-4 pb-2">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                  onClick={() => setMobileMenu(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;