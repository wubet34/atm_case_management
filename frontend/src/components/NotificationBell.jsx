import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, X, Clock, FileText, UserCheck, Wrench, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const { darkMode } = useDarkMode();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications, 
    deleteNotification,
    refreshNotifications,
    getRelativeTime
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [processedIds, setProcessedIds] = useState(new Set());

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen(true);
    await refreshNotifications();
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'case_created':
        return <FileText size={14} className="text-green-500" />;
      case 'case_appointed':
        return <UserCheck size={14} className="text-blue-500" />;
      case 'case_started':
        return <Wrench size={14} className="text-purple-500" />;
      case 'case_completed':
        return <CheckCheck size={14} className="text-green-500" />;
      case 'case_terminated':
        return <AlertTriangle size={14} className="text-red-500" />;
      default:
        return <Bell size={14} className="text-orange-500" />;
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    
    if (notification.case_id) {
      navigate('/cases');
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleClearAll = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      await clearNotifications();
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 text-gray-500 hover:text-orange-500 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                    title="Clear all notifications"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List - Fixed mobile overflow */}
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell size={40} className="mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-2 sm:gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white break-words">
                        {notification.message || notification.title}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {getRelativeTime(notification.created_at || notification.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0"
                      aria-label="Delete notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 text-center border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;