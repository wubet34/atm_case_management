import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import socketService from '../services/socket';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState(null);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Just now';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const showToastNotification = (notification) => {
    toast.success(notification.message, {
      duration: 5000,
      position: 'top-right',
      icon: '🔔',
    });
  };

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationAPI.getAll();
      if (response.success) {
        setNotifications(response.data);
        const unread = response.data.filter(n => !n.read).length;
        setUnreadCount(unread);
        if (response.data.length > 0) {
          setLastNotificationId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    console.log('Setting up socket listeners...');
    
    // Listen for new notifications
    socketService.onNewNotification((notification) => {
      console.log('🔥 New notification received via socket:', notification);
      
      // Add to state
      setNotifications(prev => {
        // Check if notification already exists
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev];
      });
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast
      showToastNotification(notification);
    });

    // Listen for unread count updates
    socketService.onUnreadCountUpdate((data) => {
      console.log('📊 Unread count update via socket:', data);
      setUnreadCount(data.unreadCount);
    });

    return () => {
      socketService.off('new-notification');
      socketService.off('unread-count-update');
    };
  }, []);

  // Poll as fallback (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await notificationAPI.getAll();
        if (response.success && response.data.length > 0) {
          const latestId = response.data[0].id;
          if (latestId !== lastNotificationId && lastNotificationId !== null) {
            // New notification found via polling
            const newNotifications = response.data.filter(n => n.id !== lastNotificationId);
            if (newNotifications.length > 0) {
              setNotifications(response.data);
              const unread = response.data.filter(n => !n.read).length;
              setUnreadCount(unread);
              newNotifications.forEach(showToastNotification);
            }
          }
          setLastNotificationId(latestId);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 10000); // Poll every 10 seconds as fallback
    
    return () => clearInterval(interval);
  }, [lastNotificationId]);

  const addNotification = (notification) => {
    // This is now handled by the socket
    loadNotifications();
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      deleteNotification,
      refreshNotifications,
      getRelativeTime,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};