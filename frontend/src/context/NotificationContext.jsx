import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationAPI } from '../services/api';
import socketService from '../services/socket';
import { toast } from 'react-hot-toast';

// Create notification sound
const notificationSound = () => {
  try {
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
    
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

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
  const [soundEnabled, setSoundEnabled] = useState(true);

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
      
      // Play sound when new notification arrives
      if (soundEnabled) {
        notificationSound();
      }
      
      // Immediately reload notifications
      loadNotifications();
      
      // Show toast
      showToastNotification(notification);
    };
    
    const handleUnreadCountUpdate = (data) => {
      console.log('📊 Unread count update via socket:', data);
      setUnreadCount(data.unreadCount);
    };
    
    socketService.onNewNotification(handleNewNotification);
    socketService.onUnreadCountUpdate(handleUnreadCountUpdate);

    return () => {
      socketService.off('new-notification', handleNewNotification);
      socketService.off('unread-count-update', handleUnreadCountUpdate);
    };
  }, [loadNotifications, soundEnabled]);

  // Polling as fallback (every 30 seconds)
  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    let lastNotificationCount = notifications.length;
    
    pollingIntervalRef.current = setInterval(async () => {
      // Only poll if socket is not connected
      if (!socketService.isConnected) {
        console.log('Polling for notifications (fallback)...');
        const response = await notificationAPI.getAll();
        const newCount = response.data?.length || 0;
        
        if (newCount > lastNotificationCount && soundEnabled) {
          notificationSound();
        }
        lastNotificationCount = newCount;
        loadNotifications();
      }
    }, 30000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loadNotifications, soundEnabled, notifications.length]);

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