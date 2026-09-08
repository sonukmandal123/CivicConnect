import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import IssueCard from '../components/IssueCard';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Basic route protection and role redirection
  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [token, user, navigate]);

  useEffect(() => {
    const fetchMyIssues = async () => {
      try {
        const response = await api.get('/issues/my');
        setIssues(response.data);
      } catch (err) {
        setError('Failed to load your reports.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchMyIssues();
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null; // Wait for redirect or user data

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Citizen Dashboard</h1>
            <p className="welcome-msg">Welcome back, {user.name}!</p>
          </div>
          <div className="header-actions">
            <Link to="/map" className="btn-secondary" style={{ marginRight: '10px' }}>Map</Link>
            <Link to="/report" className="btn-primary">Report Issue</Link>
            <button onClick={handleLogout} className="btn-secondary" style={{ marginLeft: '10px' }}>Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="section-header">
          <h2>My Reports</h2>
          <span className="issue-count">{issues.length} Total</span>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading your reports...</div>
        ) : issues.length === 0 ? (
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
