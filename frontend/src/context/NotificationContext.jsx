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
    toast.success(notification.message || notification.title, {
      duration: 5000,
      position: 'top-right',
      icon: '🔔',
    });
  };

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationAPI.getAll();
      if (response.success && Array.isArray(response.data)) {
        // Deduplicate notifications by ID
        const uniqueNotifications = [];
        const seenIds = new Set();
        
        for (const notif of response.data) {
          if (!seenIds.has(notif.id)) {
            seenIds.add(notif.id);
            uniqueNotifications.push(notif);
          }
        }
        
        setNotifications(uniqueNotifications);
        const unread = uniqueNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        
        // Update seen IDs
        uniqueNotifications.forEach(n => notificationIdsRef.current.add(n.id));
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

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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
      notificationIdsRef.current.delete(id);
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