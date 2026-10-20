// Municipal Administrative Issue Detail & Action View
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import ActionModal from '../components/modals/ActionModal';
import './AdminIssueDetails.css';

const AdminIssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('verify');

  // Role Protection
  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/admin/issues/${id}`);
      setIssue(res.data.issue);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch issue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin' && id) {
      fetchIssue();
    }
  }, [user, id]);

  const handleOpenModal = (action) => {
    setModalAction(action);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchIssue();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
        Loading comprehensive issue details...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="admin-detail-container" style={{ padding: '2rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', maxWidth: '800px', margin: '0 auto 1rem auto' }}>
          {error || 'Issue not found.'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => navigate('/admin')} className="btn-secondary">
            ← Return to Admin Queue
          </button>
        </div>
      </div>
    );
  }

  const priority = issue.priority || {
    score: issue.priorityScore || 0,
    level: issue.priorityLevel || 'Low',
    factors: issue.priorityExplanation || {}
  };

  const hasDiscrepancy = issue.problemDetected === false || (issue.aiIssueType && issue.aiIssueType !== issue.category);
  const confirmationsCount = issue.confirmations ? issue.confirmations.length : 0;

  return (
    <div className="admin-detail-container">
      {/* Header */}
      <header className="admin-detail-header">
        <div className="admin-detail-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/admin')} className="modal-btn modal-btn-cancel" style={{ padding: '6px 12px' }}>
              ← Queue
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>{issue.title}</h1>
              <small style={{ color: '#64748b' }}>Report ID: {issue._id}</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <StatusBadge status={issue.status} />
            <PriorityBadge level={priority.level} score={priority.score} />
          </div>
        </div>
      </header>

      <main className="admin-detail-main">
        {/* Left Column: Details, Photos, AI, Timeline */}
        <div className="admin-detail-col-left">
          {/* Main Overview */}
          <div className="detail-card">
            <h2 className="detail-card-title">Issue Overview</h2>
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ lineHeight: '1.6', color: '#334155', fontSize: '0.98rem' }}>
                {issue.description}
              </p>
            </div>

            {issue.imageUrl && (
              <div style={{ marginBottom: '1.25rem' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: '#475569', fontSize: '0.85rem' }}>
                  Citizen Attached Photograph:
                </strong>
                <a href={issue.imageUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </a>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">Reported Category</span>
              <span className="detail-val">{issue.category}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Reported Severity</span>
              <span className="detail-val">{issue.severity}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Reported By</span>
              <span className="detail-val">{issue.reportedBy?.name || 'Citizen'} ({issue.reportedBy?.email || 'N/A'})</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date Submitted</span>
              <span className="detail-val">{new Date(issue.createdAt).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Geographic Coordinates</span>
              <span className="detail-val">
                {issue.latitude}, {issue.longitude}{' '}
                <Link to="/map" style={{ color: '#2563eb', marginLeft: '6px', textDecoration: 'none' }}>
                  (View on Map)
                </Link>
              </span>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="detail-card">
            <h2 className="detail-card-title">AI Vision Inspection</h2>
            {issue.aiIssueType ? (
              <div>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', flex: '1 1 140px' }}>
                    <small style={{ color: '#64748b', display: 'block' }}>Problem Detected</small>
                    <strong style={{ color: issue.problemDetected ? '#16a34a' : '#dc2626' }}>
                      {issue.problemDetected ? 'Yes' : 'No'}
                    </strong>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', flex: '1 1 140px' }}>
                    <small style={{ color: '#64748b', display: 'block' }}>Confidence</small>
                    <strong>{issue.aiConfidence}%</strong>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', flex: '1 1 140px' }}>
                    <small style={{ color: '#64748b', display: 'block' }}>Detected Type</small>
                    <strong>{issue.aiIssueType}</strong>
                  </div>
                </div>

                {hasDiscrepancy && (
                  <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#b91c1c', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                    <strong>Discrepancy Alert:</strong> The AI model's assessment diverges from the citizen's categorization. Manual inspection advised before verification.
                  </div>
                )}

                <div style={{ padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.9rem', color: '#0369a1' }}>
                  <strong>Visual Evidence:</strong> {issue.aiExplanation || 'No explanation provided.'}
                </div>
              </div>
            ) : (
              <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                No automated AI vision inspection recorded for this report.
              </p>
            )}
          </div>

          {/* Resolution Details (if Resolved) */}
          {issue.status === 'Resolved' && (
            <div className="detail-card" style={{ borderColor: '#86efac' }}>
              <h2 className="detail-card-title" style={{ color: '#15803d' }}>
                Resolution Completed
              </h2>
              <div className="detail-row">
                <span className="detail-label">Resolved At</span>
                <span className="detail-val">{new Date(issue.resolvedAt).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Resolved By</span>
                <span className="detail-val">{issue.resolvedBy?.name || 'Administrator'}</span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <strong style={{ color: '#334155', display: 'block', marginBottom: '4px' }}>Work Description:</strong>
                <p style={{ margin: 0, padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '6px', color: '#166534', border: '1px solid #bbf7d0' }}>
                  {issue.resolutionDescription}
                </p>
              </div>

              {issue.resolutionImageUrl && (
                <div style={{ marginTop: '1rem' }}>
                  <strong style={{ display: 'block', marginBottom: '6px', color: '#334155' }}>
                    Post-Repair Verification Photograph:
                  </strong>
                  <a href={issue.resolutionImageUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={issue.resolutionImageUrl}
                      alt="Resolution Proof"
                      style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #bbf7d0' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Full Audit History Timeline */}
          <div className="detail-card">
            <h2 className="detail-card-title">Lifecycle Audit Trail</h2>
            <StatusTimeline history={issue.statusHistory || []} />
          </div>
        </div>

        {/* Right Column: Priority Score Breakdown & Administrative Actions */}
        <div className="admin-detail-col-right">
          {/* Priority Score Card */}
          <div className="detail-card">
            <h2 className="detail-card-title">Priority Score Calculation</h2>

            <div className="priority-score-display">
              <div>
                <span className="priority-big-number">{priority.score}</span>
                <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 'bold' }}>/100</span>
              </div>
              <PriorityBadge level={priority.level} score={priority.score} />
            </div>

            {/* Visual Bar */}
            <div className="priority-bar-bg">
              <div
                className={`priority-bar-fill ${priority.level.toLowerCase()}`}
                style={{ width: `${Math.min(100, Math.max(5, priority.score))}%` }}
              />
            </div>

            {/* Factor breakdown */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <div className="priority-factor-item">
                <span className="factor-name">Severity ({issue.severity}):</span>
                <span className="factor-points">+{priority.factors?.severity?.points || 0} pts</span>
              </div>
              <div className="priority-factor-item">
                <span className="factor-name">Community Confirmations ({confirmationsCount}):</span>
                <span className="factor-points">+{priority.factors?.confirmations?.points || 0} pts</span>
              </div>
              <div className="priority-factor-item">
                <span className="factor-name">AI Assistive Support:</span>
                <span className="factor-points">+{priority.factors?.aiSupport?.points || 0} pts</span>
              </div>
              <div className="priority-factor-item">
                <span className="factor-name">Pending Duration:</span>
                <span className="factor-points">+{priority.factors?.timePending?.points || 0} pts</span>
              </div>
            </div>

            {priority.summary && (
              <div className="priority-summary-box">
                <strong>Algorithm Breakdown:</strong><br />
                {priority.summary}
              </div>
            )}
          </div>

          {/* Assignment Information */}
          <div className="detail-card">
            <h2 className="detail-card-title">Department Assignment</h2>
            <div className="detail-row">
              <span className="detail-label">Assigned Department</span>
              <span className="detail-val" style={{ color: issue.assignedDepartment ? '#7c3aed' : '#94a3b8' }}>
                {issue.assignedDepartment || 'Not yet assigned'}
              </span>
            </div>
            {issue.assignedAt && (
              <div className="detail-row">
                <span className="detail-label">Assigned At</span>
                <span className="detail-val">{new Date(issue.assignedAt).toLocaleDateString()}</span>
              </div>
            )}
            {issue.assignedBy && (
              <div className="detail-row">
                <span className="detail-label">Assigned By</span>
                <span className="detail-val">{issue.assignedBy.name}</span>
              </div>
            )}
          </div>

          {/* Administrative Action Control Panel */}
          <div className="detail-card">
            <h2 className="detail-card-title">Administrative Actions</h2>

            <div className="action-buttons-grid">
              {issue.status === 'Submitted' && (
                <button
                  className="action-btn-styled in-progress"
                  onClick={() => handleOpenModal('verify')}
                >
                  Move to Under Review
                </button>
              )}

              {issue.status === 'Under Review' && (
                <>
                  <button
                    className="action-btn-styled verify"
                    onClick={() => handleOpenModal('verify')}
                  >
                    Verify Report
                  </button>
                  <button
                    className="action-btn-styled reject"
                    onClick={() => handleOpenModal('reject')}
                  >
                    Reject Report
                  </button>
                </>
              )}

              {issue.status === 'Verified' && (
                <button
                  className="action-btn-styled assign"
                  onClick={() => handleOpenModal('assign')}
                >
                  Assign to Department
                </button>
              )}

              {issue.status === 'Assigned' && (
                <button
                  className="action-btn-styled in-progress"
                  onClick={() => handleOpenModal('in-progress')}
                >
                  Mark Work In Progress
                </button>
              )}

              {issue.status === 'In Progress' && (
                <button
                  className="action-btn-styled resolve"
                  onClick={() => handleOpenModal('resolve')}
                >
                  Mark as Resolved
                </button>
              )}

              <button
                className="action-btn-styled secondary"
                onClick={() => handleOpenModal('remark')}
              >
                Add Admin Remark
              </button>

              <button
                className="action-btn-styled secondary"
                onClick={() => handleOpenModal('duplicate')}
              >
                Mark as Duplicate
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
        issue={issue}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default AdminIssueDetails;
