import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const notificationIdsRef = useRef(new Set());

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    let date;
    try {
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
    } catch (error) {
      return 'Just now';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMs < 0) return 'Just now';
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    if (diffYears === 1) return '1 year ago';
    return `${diffYears} years ago`;
  };

  const showToastNotification = (notification) => {
    const message = notification.message || notification.title || 'New notification';
    toast.success(message, {
      duration: 5000,
      position: 'top-right',
      icon: '🔔',
    });
  };

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll();
      
      let notificationsData = [];
      if (response?.success && Array.isArray(response.data)) {
        notificationsData = response.data;
      } else if (Array.isArray(response)) {
        notificationsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        notificationsData = response.data;
      }
      
      // Sort by created_at descending (newest first)
      const sorted = [...notificationsData].sort((a, b) => {
        const dateA = new Date(a.created_at || a.timestamp || 0);
        const dateB = new Date(b.created_at || b.timestamp || 0);
        return dateB - dateA;
      });
      
      setNotifications(sorted);
      const unread = sorted.filter(n => !n.read).length;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNotifications();
    
    // Set up polling as fallback (every 10 seconds)
    const interval = setInterval(() => {
      if (!socketService.isConnected) {
        console.log('Polling for notifications (fallback)...');
        loadNotifications();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    console.log('Setting up notification socket listeners...');
    
    const handleNewNotification = (notification) => {
      console.log('🔔 New notification received via socket:', notification);
      
      // Immediately reload notifications to show the new one
      loadNotifications();
      
      // Show toast popup
      showToastNotification(notification);
    };
    
    const handleUnreadCountUpdate = (data) => {
      console.log('📊 Unread count update via socket:', data);
      if (data && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };
    
    // Register listeners
    socketService.onNewNotification(handleNewNotification);
    socketService.onUnreadCountUpdate(handleUnreadCountUpdate);
    
    // Also listen for any socket events for debugging
    if (socketService.socket) {
      socketService.socket.on('connect', () => {
        console.log('Socket reconnected, refreshing notifications');
        loadNotifications();
      });
    }
    
    return () => {
      socketService.off('new-notification', handleNewNotification);
      socketService.off('unread-count-update', handleUnreadCountUpdate);
    };
  }, [loadNotifications]);

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
      notificationIdsRef.current.clear();
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