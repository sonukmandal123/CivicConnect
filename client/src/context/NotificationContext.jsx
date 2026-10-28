import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async (isPolling = false) => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      if (!isPolling) setLoading(true);
      const res = await api.get('/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Don't log expected 401s during token expiration
      if (err.response?.status !== 401) {
        console.error('Failed to load notifications:', err.message);
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [token]);

  // Initial load when token changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Background polling every 12 seconds while user is logged in
  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(() => {
      fetchNotifications(true);
    }, 12000);

    // Refresh immediately on window focus
    const handleFocus = () => {
      fetchNotifications(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
      fetchNotifications(true);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await api.patch('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err.message);
      fetchNotifications(true);
    }
  };

  // Delete a single notification
  const deleteNotification = async (id) => {
    try {
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      const res = await api.delete(`/notifications/${id}`);
      if (res.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
      fetchNotifications(true);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await api.delete('/notifications/clear-all');
    } catch (err) {
      console.error('Failed to clear notifications:', err.message);
      fetchNotifications(true);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
