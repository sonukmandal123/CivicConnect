import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import IssueCard from '../components/IssueCard';
import NotificationBell from '../components/NotificationBell';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  
  const { user, token, loading: authLoading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Basic route protection and role redirection
  useEffect(() => {
    if (!authLoading) {
      if (!token || !user) {
        navigate('/login');
      } else if (user.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [authLoading, token, user, navigate]);

  const fetchMyIssues = useCallback(async () => {
    if (!token || !user || user.role === 'admin') return;

    try {
      setLoading(true);
      setError('');
      setIsSessionExpired(false);

      const response = await api.get('/issues/my');
      setIssues(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch citizen reports:', err);
      if (err.response?.status === 401) {
        setIsSessionExpired(true);
        setError('Your session has expired or is invalid. Please log in again to view your reports.');
      } else {
        const errorMsg = err.response?.data?.message 
          || (err.code === 'ERR_NETWORK' 
            ? 'Unable to reach the server. The backend may be starting up or sleeping (takes ~25s on free tier). Please retry.' 
            : 'Failed to load your reports.');
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchMyIssues();
  }, [fetchMyIssues]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }}></div>
        Loading your citizen dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '420px', margin: '80px auto', padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <h2>Sign In Required</h2>
        <p style={{ color: '#666', margin: '12px 0 20px 0' }}>Please log in to view and manage your submitted civic reports.</p>
        <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Citizen Dashboard</h1>
            <p className="welcome-msg">Welcome back, {user.name}!</p>
          </div>
          <div className="header-actions">
            <NotificationBell />
            <Link to="/" className="btn-secondary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Home
            </Link>
            <Link to="/map" className="btn-secondary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              Map View
            </Link>
            <Link to="/report" className="btn-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Report Issue
            </Link>
            <button onClick={handleLogout} className="btn-danger">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="section-header">
          <h2>My Reports</h2>
          <span className="issue-count">
            {loading ? 'Loading...' : error ? '—' : `${issues.length} Total`}
          </span>
        </div>

        {error && (
          <div className="dashboard-error" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
            <div>
              {isSessionExpired ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="btn-primary"
                  style={{ border: 'none', cursor: 'pointer', padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  Log In Again
                </button>
              ) : (
                <button
                  type="button"
                  onClick={fetchMyIssues}
                  className="btn-secondary"
                  style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  ↻ Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }}></div>
            Loading your reports...
          </div>
        ) : error ? null : issues.length === 0 ? (
          <div className="empty-state">
            <p>You haven't reported any issues yet.</p>
            <Link to="/report" className="btn-primary">Report Your First Issue</Link>
          </div>
        ) : (
          <div className="issues-grid">
            {issues.map(issue => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
