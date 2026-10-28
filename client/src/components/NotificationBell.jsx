import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import './NotificationBell.css';

// Helper to format relative timestamps
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper to render crisp professional SVG icon based on notification type
const renderNotificationIcon = (type) => {
  switch (type) {
    case 'ISSUE_SUBMITTED':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
    case 'ISSUE_ASSIGNED':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18"></path>
          <path d="M5 21V7l8-4v18"></path>
          <path d="M19 21V11l-6-3"></path>
          <line x1="9" y1="9" x2="9" y2="9.01"></line>
          <line x1="9" y1="13" x2="9" y2="13.01"></line>
          <line x1="9" y1="17" x2="9" y2="17.01"></line>
        </svg>
      );
    case 'ISSUE_IN_PROGRESS':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      );
    case 'ISSUE_RESOLVED':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
    case 'ISSUE_REJECTED':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      );
    case 'ISSUE_CONFIRMED':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
      );
    case 'ADMIN_REMARK':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      );
    case 'STATUS_CHANGED':
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      );
  }
};

const getNotificationStyleClass = (type) => {
  switch (type) {
    case 'ISSUE_SUBMITTED':
      return 'issue-submitted';
    case 'ISSUE_ASSIGNED':
      return 'issue-assigned';
    case 'ISSUE_IN_PROGRESS':
      return 'issue-in-progress';
    case 'ISSUE_RESOLVED':
      return 'issue-resolved';
    case 'ISSUE_REJECTED':
      return 'issue-rejected';
    case 'ISSUE_CONFIRMED':
      return 'issue-confirmed';
    case 'ADMIN_REMARK':
      return 'admin-remark';
    case 'STATUS_CHANGED':
    default:
      return 'status-changed';
  }
};

const NotificationBell = ({ variant = 'default', className = '' }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    setIsOpen(false);

    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const isAdminStyle = variant === 'admin' || variant === 'dark' || variant === 'secondary';

  return (
    <div className={`notification-bell-container ${isAdminStyle ? 'admin-variant' : ''}`} ref={containerRef}>
      <button
        className={`notification-bell-btn ${isAdminStyle ? 'admin-variant' : ''} ${isOpen ? 'active' : ''} ${className}`.trim()}
        onClick={handleToggle}
        aria-label="Notifications"
        title="Notifications"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <div className="notification-header-title">
              <h4>Notifications</h4>
              {unreadCount > 0 && (
                <span className="notification-count-pill">{unreadCount} New</span>
              )}
            </div>

            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button
                  className="notif-action-link"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="notif-action-link danger"
                  onClick={clearAllNotifications}
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          {notifications.length > 0 && (
            <div className="notification-tabs">
              <button
                className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </button>
              <button
                className={`notif-tab ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="notification-list">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => {
                const styleClass = getNotificationStyleClass(notif.type);
                return (
                  <div
                    key={notif._id}
                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={`notif-icon-box ${styleClass}`}>
                      {renderNotificationIcon(notif.type)}
                    </div>

                    <div className="notif-details">
                      <div className="notif-title-row">
                        <h5 className="notif-item-title">{notif.title}</h5>
                        <span className="notif-item-time">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="notif-item-msg">{notif.message}</p>
                    </div>

                    <div className="notif-item-actions">
                      {!notif.isRead && <span className="notif-unread-dot" />}
                      <button
                        className="notif-delete-btn"
                        onClick={(e) => handleDelete(e, notif._id)}
                        title="Dismiss notification"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="notification-empty">
                <div className="notif-empty-icon">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <h5>All caught up!</h5>
                <p>
                  {filter === 'unread'
                    ? 'You have read all your notifications.'
                    : 'No notifications at this time.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
