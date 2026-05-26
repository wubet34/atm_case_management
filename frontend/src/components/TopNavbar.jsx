import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, User, LogOut, Settings, Shield } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const TopNavbar = ({ sidebarWidth = 288 }) => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const navigate = useNavigate();
  
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Calculate navbar left position based on sidebar width
  const getNavbarLeft = () => {
    if (window.innerWidth < 1024) return '0px';
    return `${sidebarWidth}px`;
  };

  return (
    <nav 
      className={`fixed top-0 right-0 z-30 shadow-sm transition-all duration-300
        ${darkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-100'}
      `}
      style={{ left: getNavbarLeft() }}
    >
      <div className="flex items-center justify-end px-4 py-3">
        {/* Right Icons */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-gray-800 text-yellow-500 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative p-2 rounded-lg transition-colors ${
                isNotificationOpen 
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' 
                  : darkMode 
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl border overflow-hidden z-50 transition-all duration-200
                ${darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-100'
                }`}
              >
                <div className={`flex justify-between items-center p-3 border-b
                  ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Notifications
                  </h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={markAllAsRead} 
                      className={`text-xs ${darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'}`}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Bell size={40} className="mx-auto mb-2 opacity-50" />
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-3 border-b cursor-pointer transition-colors ${
                          !n.read 
                            ? darkMode 
                              ? 'bg-orange-900/20 hover:bg-orange-900/30' 
                              : 'bg-orange-50 hover:bg-orange-100'
                            : darkMode 
                              ? 'hover:bg-gray-700' 
                              : 'hover:bg-gray-50'
                        } ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                        onClick={() => { 
                          markAsRead(n.id); 
                          setIsNotificationOpen(false);
                          if (n.caseId) navigate('/cases');
                        }}
                      >
                        <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {n.message}
                        </p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {getRelativeTime(n.timestamp)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                isProfileOpen
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : darkMode
                    ? 'hover:bg-gray-800'
                    : 'hover:bg-gray-100'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className={`text-sm font-medium hidden md:block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
            </button>

            {isProfileOpen && (
              <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border overflow-hidden z-50
                ${darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-100'
                }`}
              >
                <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                  <p className={`text-xs capitalize ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.role}</p>
                </div>
                
                <button 
                  onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} 
                  className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${
                    darkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User size={16} /> My Profile
                </button>
                
                <button 
                  onClick={() => { navigate('/settings'); setIsProfileOpen(false); }} 
                  className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${
                    darkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings size={16} /> Settings
                </button>
                
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => { navigate('/technicians'); setIsProfileOpen(false); }} 
                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield size={16} /> Manage Team
                  </button>
                )}
                
                <button 
                  onClick={handleLogout} 
                  className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${
                    darkMode 
                      ? 'text-red-400 hover:bg-red-900/20' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;