import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, X, Clock, FileText, UserCheck, Wrench, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate } from 'react-router-dom';
import notificationSound from '../services/notificationSound';

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


  // Add this useEffect to initialize sound on first click
useEffect(() => {
  const initAudio = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    document.removeEventListener('click', initAudio);
  };
  
  document.addEventListener('click', initAudio);
  
  return () => document.removeEventListener('click', initAudio);
}, []);

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
    notificationSound.init();
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
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="fixed bottom-0 left-0 right-0 lg:absolute lg:bottom-auto lg:left-auto lg:right-0 lg:top-full lg:mt-2 
                         bg-white dark:bg-gray-800 rounded-t-xl lg:rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 
                         z-50 overflow-hidden
                         lg:w-96 w-full max-h-[80vh] lg:max-h-96
                         animate-slide-up lg:animate-none">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
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
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors lg:hidden"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors hidden lg:block"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

                // Add this button inside the component for testing
<button 
  onClick={() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.3;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }}
  className="ml-2 p-1 text-xs bg-gray-200 rounded"
>
  Test Sound
</button>


            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[60vh] lg:max-h-96">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Bell size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`group p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white break-words">
                          {notification.message || notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={10} className="flex-shrink-0" />
                          <span>{getRelativeTime(notification.created_at || notification.timestamp)}</span>
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
              <div className="p-2 text-center border-t border-gray-100 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add animation CSS */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @media (min-width: 1024px) {
          .animate-slide-up {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;