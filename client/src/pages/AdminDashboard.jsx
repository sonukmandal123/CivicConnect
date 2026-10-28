import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import ActionModal from '../components/modals/ActionModal';
import NotificationBell from '../components/NotificationBell';
import './AdminDashboard.css';

const DEPARTMENTS = [
  'All',
  'Road Maintenance',
  'Electrical',
  'Sanitation',
  'Drainage',
  'Water',
  'Public Facilities',
  'Other'
];

const CATEGORIES = [
  'All',
  'Pothole',
  'Damaged Road',
  'Streetlight',
  'Garbage',
  'Blocked Drain',
  'Water Leakage',
  'Damaged Facility',
  'Other'
];

const SEVERITIES = ['All', 'Low', 'Medium', 'High'];
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Submitted', 'Under Review', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

const AdminDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    criticalPriority: 0,
    highPriority: 0
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 15
  });

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [priority, setPriority] = useState('All');
  const [department, setDepartment] = useState('All');
  const [sort, setSort] = useState('priority_desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('verify');
  const [selectedIssue, setSelectedIssue] = useState(null);

  const { user, token, logout, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Role Protection
  useEffect(() => {
    if (!authLoading) {
      if (!token || !user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate('/dashboard');
      }
    }
  }, [token, user, authLoading, navigate]);

  const fetchIssues = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: 15,
        search,
        status,
        category,
        severity,
        priority,
        department,
        sort
      };

      const response = await api.get('/admin/issues', { params });
      setIssues(response.data.issues);
      setSummary(response.data.summary);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch issues from administration service.');
    } finally {
      setLoading(false);
    }
  }, [search, status, category, severity, priority, department, sort]);

  // Fetch when filters or page change
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchIssues(1);
    }
  }, [user, fetchIssues]);

  const openActionModal = (issue, action) => {
    setSelectedIssue(issue);
    setModalAction(action);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchIssues(pagination.page);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('All');
    setCategory('All');
    setSeverity('All');
    setPriority('All');
    setDepartment('All');
    setSort('priority_desc');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: '#f8fafc', color: '#64748b' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p>Loading administration portal...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: '#f8fafc', color: '#1e293b' }}>
        <h2>Administrator Access Required</h2>
        <p style={{ color: '#64748b' }}>Please login with an administrator account to view this page.</p>
        <Link to="/login" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Top Header */}
      <header className="admin-header">
        <div className="header-content">
          <div>
            <h1>CivicConnect Administration</h1>
            <p className="welcome-msg">Issue Verification, Department Assignment & Priority Management</p>
          </div>
          <div className="header-actions">
            <NotificationBell variant="admin" />
            <Link to="/map" className="admin-nav-btn secondary">
              Map View
            </Link>
            <Link to="/admin/analytics" className="admin-nav-btn primary">
              Analytics
            </Link>
            <button onClick={handleLogout} className="admin-nav-btn danger">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {error && <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

        {/* KPI Summary Cards */}
        <div className="kpi-grid">
          <div className={`kpi-card ${status === 'All' ? 'active' : ''}`} onClick={() => setStatus('All')}>
            <span className="kpi-label">Total Reports</span>
            <span className="kpi-value">{summary.total}</span>
          </div>

          <div className={`kpi-card pending ${status === 'Under Review' ? 'active' : ''}`} onClick={() => setStatus('Under Review')}>
            <span className="kpi-label">Pending Review</span>
            <span className="kpi-value">{summary.pending}</span>
          </div>

          <div className={`kpi-card ${status === 'Verified' ? 'active' : ''}`} onClick={() => setStatus('Verified')}>
            <span className="kpi-label">Verified</span>
            <span className="kpi-value">{summary.verified}</span>
          </div>

          <div className={`kpi-card ${status === 'Assigned' ? 'active' : ''}`} onClick={() => setStatus('Assigned')}>
            <span className="kpi-label">Assigned</span>
            <span className="kpi-value">{summary.assigned}</span>
          </div>

          <div className={`kpi-card in-progress ${status === 'In Progress' ? 'active' : ''}`} onClick={() => setStatus('In Progress')}>
            <span className="kpi-label">In Progress</span>
            <span className="kpi-value">{summary.inProgress}</span>
          </div>

          <div className={`kpi-card resolved ${status === 'Resolved' ? 'active' : ''}`} onClick={() => setStatus('Resolved')}>
            <span className="kpi-label">Resolved</span>
            <span className="kpi-value">{summary.resolved}</span>
          </div>

          <div className={`kpi-card critical ${priority === 'Critical' ? 'active' : ''}`} onClick={() => setPriority(priority === 'Critical' ? 'All' : 'Critical')}>
            <span className="kpi-label">Critical Priority</span>
            <span className="kpi-value">{summary.criticalPriority}</span>
          </div>
        </div>

        {/* Controls: Search, Filters, and Sorting */}
        <div className="admin-controls">
          <div className="search-input-wrapper">
            <span className="search-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by title, description, category, or Issue ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-grid">
            <div className="filter-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Sort Order</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="priority_desc">Highest Priority First</option>
                <option value="priority_asc">Lowest Priority First</option>
                <option value="newest">Newest Reports First</option>
                <option value="oldest">Oldest Reports First</option>
                <option value="confidence">Highest AI Confidence</option>
                <option value="longest_pending">Longest Pending</option>
              </select>
            </div>

            <button type="button" className="reset-filter-btn" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        </div>

        {/* Issue Management Table */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Loading issue management queue...
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Issue</th>
                  <th style={{ width: '9%' }}>Category</th>
                  <th style={{ width: '7%' }} className="th-center">Severity</th>
                  <th style={{ width: '11%' }} className="th-center">Priority</th>
                  <th style={{ width: '10%' }} className="th-center">Status</th>
                  <th style={{ width: '5%' }} className="th-center" title="Citizen Community Confirmations">Votes</th>
                  <th style={{ width: '6%' }} className="th-center" title="AI Computer Vision Signal">AI Conf</th>
                  <th style={{ width: '10%' }}>Dept</th>
                  <th style={{ width: '8%' }} className="th-center">Date</th>
                  <th style={{ width: '12%' }} className="th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => {
                  const confirmationsCount = issue.confirmations ? issue.confirmations.length : 0;
                  const hasDiscrepancy = issue.problemDetected === false || (issue.aiIssueType && issue.aiIssueType !== issue.category);

                  return (
                    <tr key={issue._id}>
                      <td>
                        <div className="table-issue-title">
                          <Link to={`/admin/issues/${issue._id}`} style={{ textDecoration: 'none', color: '#0f172a' }}>
                            {issue.title}
                          </Link>
                          {issue.duplicateOf && (
                            <span style={{ fontSize: '0.68rem', padding: '1px 5px', background: '#fee2e2', color: '#b91c1c', borderRadius: '3px', fontWeight: 'bold' }}>
                              Dup
                            </span>
                          )}
                        </div>
                        <div className="table-issue-desc">{issue.description}</div>
                        <div className="table-reporter">
                          <small>By: {issue.reportedBy?.name || 'Citizen'}</small>
                        </div>
                      </td>

                      <td>
                        <span className="badge category-badge">{issue.category}</span>
                      </td>

                      <td className="td-center">
                        <span className={`badge severity-${issue.severity.toLowerCase()}`}>
                          {issue.severity}
                        </span>
                      </td>

                      <td className="td-center">
                        <PriorityBadge level={issue.priorityLevel} score={issue.priorityScore} size="small" />
                      </td>

                      <td className="td-center">
                        <StatusBadge status={issue.status} size="small" />
                      </td>

                      <td className="td-center">
                        <strong style={{ color: confirmationsCount > 0 ? '#15803d' : '#94a3b8', fontSize: '0.82rem' }}>
                          {confirmationsCount}
                        </strong>
                      </td>

                      <td className="td-center">
                        {issue.aiConfidence ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: issue.problemDetected ? '#15803d' : '#dc2626' }}>
                              {issue.aiConfidence}%
                            </span>
                            {hasDiscrepancy && (
                              <span title="AI category mismatch detected" style={{ cursor: 'help', fontSize: '0.65rem', background: '#fee2e2', color: '#b91c1c', padding: '1px 3px', borderRadius: '2px', fontWeight: 'bold' }}>
                                Diff
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>

                      <td>
                        {issue.assignedDepartment ? (
                          <span className="table-dept" title={issue.assignedDepartment}>{issue.assignedDepartment}</span>
                        ) : (
                          <span className="unassigned-text">Unassigned</span>
                        )}
                      </td>

                      <td className="td-center">
                        <span style={{ fontSize: '0.76rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' }) : '—'}
                        </span>
                      </td>

                      <td className="td-right">
                        <div className="table-actions">
                          <Link to={`/admin/issues/${issue._id}`} className="btn-action-view">
                            Inspect
                          </Link>

                          {/* Quick Workflow Action Button */}
                          {issue.status === 'Submitted' && (
                            <button
                              className="btn-action-quick"
                              onClick={() => openActionModal(issue, 'review')}
                              style={{ backgroundColor: '#0284c7' }}
                            >
                              Review
                            </button>
                          )}

                          {issue.status === 'Under Review' && (
                            <button
                              className="btn-action-quick"
                              onClick={() => openActionModal(issue, 'verify')}
                              style={{ backgroundColor: '#16a34a' }}
                            >
                              Verify
                            </button>
                          )}

                          {issue.status === 'Verified' && (
                            <button
                              className="btn-action-quick"
                              onClick={() => openActionModal(issue, 'assign')}
                              style={{ backgroundColor: '#7c3aed' }}
                            >
                              Assign
                            </button>
                          )}

                          {issue.status === 'Assigned' && (
                            <button
                              className="btn-action-quick"
                              onClick={() => openActionModal(issue, 'in-progress')}
                              style={{ backgroundColor: '#2563eb' }}
                            >
                              Start
                            </button>
                          )}

                          {issue.status === 'In Progress' && (
                            <button
                              className="btn-action-quick"
                              onClick={() => openActionModal(issue, 'resolve')}
                              style={{ backgroundColor: '#15803d' }}
                            >
                              Resolve
                            </button>
                          )}

                          {issue.status === 'Rejected' && (
                            <button
                              className="btn-action-quick"
                              onClick={() => openActionModal(issue, 'review')}
                              style={{ backgroundColor: '#64748b' }}
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {issues.length === 0 && (
                  <tr>
                    <td colSpan="10" className="empty-row">
                      No civic reports match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          <div className="pagination-bar">
            <span>
              Showing {issues.length} of <strong>{pagination.total}</strong> reports (Page {pagination.page} of {pagination.pages})
            </span>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchIssues(pagination.page - 1)}
              >
                ← Previous
              </button>
              <button
                className="pagination-btn"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => fetchIssues(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      <ActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        actionType={modalAction}
        issue={selectedIssue}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default AdminDashboard;
