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
  const pollingIntervalRef = useRef(null);

  // Improved getRelativeTime with better formatting
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    let date;
    try {
      // Handle various timestamp formats
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', timestamp);
        return 'Just now';
      }
    } catch (error) {
      console.error('Date parsing error:', error);
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

    // Handle future dates (shouldn't happen but just in case)
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
      
      // Handle different response formats
      let notificationsData = [];
      if (response.success && Array.isArray(response.data)) {
        notificationsData = response.data;
      } else if (Array.isArray(response)) {
        notificationsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        notificationsData = response.data;
      } else {
        console.warn('Unexpected notifications response format:', response);
        notificationsData = [];
      }
      
      // Deduplicate notifications by ID and sort by date (newest first)
      const uniqueNotifications = [];
      const seenIds = new Set();
      
      // Sort by created_at descending (newest first)
      const sorted = [...notificationsData].sort((a, b) => {
        const dateA = new Date(a.created_at || a.timestamp || 0);
        const dateB = new Date(b.created_at || b.timestamp || 0);
        return dateB - dateA;
      });
      
      for (const notif of sorted) {
        if (!seenIds.has(notif.id)) {
          seenIds.add(notif.id);
          uniqueNotifications.push(notif);
        }
      }
      
      setNotifications(uniqueNotifications);
      const unread = uniqueNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Update seen IDs
      notificationIdsRef.current.clear();
      uniqueNotifications.forEach(n => notificationIdsRef.current.add(n.id));
      
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Don't show error toast to avoid spam
    } finally {
      setLoading(false);
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
    const handleNewNotification = (notification) => {
      console.log('🔥 New notification received via socket:', notification);
      
      // Check if notification already exists
      if (notificationIdsRef.current.has(notification.id)) {
        console.log('⚠️ Duplicate notification ignored:', notification.id);
        return;
      }
      
      // Add to set and state
      notificationIdsRef.current.add(notification.id);
      
      setNotifications(prev => {
        // Final check for duplicates in current state
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev];
      });
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast
      showToastNotification(notification);
    };
    
    const handleUnreadCountUpdate = (data) => {
      console.log('📊 Unread count update via socket:', data);
      if (data && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };
    
    socketService.onNewNotification(handleNewNotification);
    socketService.onUnreadCountUpdate(handleUnreadCountUpdate);

    return () => {
      socketService.off('new-notification', handleNewNotification);
      socketService.off('unread-count-update', handleUnreadCountUpdate);
    };
  }, []);

  // Polling as fallback (every 30 seconds)
  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if socket is not connected
      if (!socketService.isConnected) {
        console.log('Polling for notifications (fallback)...');
        loadNotifications();
      }
    }, 30000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loadNotifications]);

  const addNotification = (notification) => {
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
      toast.error('Failed to mark notification as read');
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
      toast.error('Failed to mark all as read');
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
      toast.error('Failed to clear notifications');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      notificationIdsRef.current.delete(id);
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
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