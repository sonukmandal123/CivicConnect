import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Protect route for admin only
  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      navigate('/dashboard'); // Citizens go to citizen dashboard
    }
  }, [token, user, navigate]);

  const fetchIssues = async () => {
    try {
      const response = await api.get('/issues');
      setIssues(response.data);
    } catch (err) {
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchIssues();
    }
  }, [user]);

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      // Optimistically update UI
      setIssues(issues.map(issue => 
        issue._id === issueId ? { ...issue, status: newStatus } : issue
      ));
      
      // Update in backend
      await api.put(`/issues/${issueId}/status`, { status: newStatus });
    } catch (err) {
      alert('Failed to update status. Please refresh.');
      fetchIssues(); // Revert to correct state
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <div>
            <h1>Admin Control Panel</h1>
            <p className="welcome-msg">Manage civic issues across the platform.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/map" className="btn-secondary">Map</Link>
            <button onClick={handleLogout} className="btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading database...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reported By</th>
                  <th>Issue Details</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Image</th>
                  <th>AI Analysis</th>
                  <th>Status Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue._id}>
                    <td>
                      <strong>{issue.reportedBy?.name || 'Unknown'}</strong><br/>
                      <small>{issue.reportedBy?.email || ''}</small>
                    </td>
                    <td>
                      <strong>{issue.title}</strong><br/>
                      <small className="desc-preview">
                        {issue.description.length > 50 ? issue.description.substring(0, 50) + '...' : issue.description}
                      </small>
                    </td>
                    <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge category-badge">{issue.category}</span></td>
                    <td><span className={`badge severity-${issue.severity.toLowerCase()}`}>{issue.severity}</span></td>
                    <td>
                      {issue.imageUrl ? (
                        <a href={issue.imageUrl} target="_blank" rel="noopener noreferrer" className="view-img-link">
                          View Image
                        </a>
                      ) : (
                        <span className="no-img-text">No Image</span>
                      )}
                    </td>
                    <td>
                      {issue.aiIssueType ? (
                        <div>
                          <div style={{ fontSize: '0.85em', color: issue.problemDetected ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                            {issue.problemDetected ? `${issue.aiConfidence}% Confident` : 'No Issue'}
                          </div>
                          {(!issue.problemDetected || (issue.aiIssueType !== 'Unknown/Unclear' && issue.aiIssueType !== issue.category)) && (
                            <div style={{ fontSize: '0.8em', color: '#ef4444', marginTop: '4px' }}>⚠️ Discrepancy</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85em', color: '#888' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <select 
                        value={issue.status} 
                        onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                        className={`status-select ${issue.status.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Verified">Verified</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {issues.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-row">No issues reported yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
