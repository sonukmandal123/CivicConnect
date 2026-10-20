import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import CategoryBadge from '../components/CategoryBadge';
import StatusTimeline from '../components/StatusTimeline';

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/issues/${id}`);
      setIssue(response.data);
    } catch (err) {
      setError('Failed to load issue details. You might not have permission to view this issue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetails();
  }, [id]);

  const handleConfirm = async () => {
    if (!user) {
      alert('You must be logged in to confirm an issue.');
      return;
    }
    
    try {
      setConfirming(true);
      const response = await api.put(`/issues/${id}/confirm`);
      setIssue(prev => ({ 
        ...prev, 
        confirmations: response.data.confirmations,
        priority: response.data.priority,
        priorityScore: response.data.priority?.score,
        priorityLevel: response.data.priority?.level
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm issue');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading issue details...</div>;
  }
  
  if (error || !issue) {
    return (
      <div className="dashboard-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div className="report-alert error">{error || 'Issue not found'}</div>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const confirmationsCount = issue.confirmations ? issue.confirmations.length : 0;
  const hasConfirmed = user && issue.confirmations && issue.confirmations.includes(user._id);
  const isAuthor = user && (issue.reportedBy?._id === user._id || issue.reportedBy === user._id);
  const priority = issue.priority || {
    score: issue.priorityScore || 0,
    level: issue.priorityLevel || 'Low'
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '860px', margin: '0 auto', padding: '30px 20px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.9rem' }}>
            ← Back
          </button>
          <Link to="/" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.9rem', color: '#4b5563', borderColor: '#cbd5e1' }}>
            Home
          </Link>
          <Link to="/map" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.9rem', color: '#2563eb', borderColor: '#93c5fd' }}>
            Map
          </Link>
        </div>

        {user && user.role === 'admin' && (
          <Link
            to={`/admin/issues/${issue._id}`}
            style={{
              padding: '6px 14px',
              backgroundColor: '#1e293b',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            Admin Inspection
          </Link>
        )}
      </div>

      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        {/* Title and Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: 0 }}>{issue.title}</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <StatusBadge status={issue.status} />
            <PriorityBadge level={priority.level} score={priority.score} />
          </div>
        </div>
        
        {/* Unified Pill Badges Row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
          <CategoryBadge category={issue.category} />
          <SeverityBadge severity={issue.severity} />
          
          {issue.assignedDepartment && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '0.82rem',
                fontWeight: '600',
                borderRadius: '9999px',
                backgroundColor: '#f3e8ff',
                color: '#6b21a8',
                border: '1px solid #e9d5ff',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#9333ea', display: 'inline-block' }} />
              <span>Assigned to {issue.assignedDepartment}</span>
            </span>
          )}

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              fontSize: '0.82rem',
              fontWeight: '600',
              borderRadius: '9999px',
              backgroundColor: confirmationsCount > 0 ? '#ecfdf5' : '#f1f5f9',
              color: confirmationsCount > 0 ? '#047857' : '#475569',
              border: `1px solid ${confirmationsCount > 0 ? '#a7f3d0' : '#cbd5e1'}`,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: confirmationsCount > 0 ? '#10b981' : '#94a3b8',
                display: 'inline-block'
              }}
            />
            <span>{confirmationsCount} Community Confirmation{confirmationsCount !== 1 ? 's' : ''}</span>
          </span>
        </div>

        {/* Citizen Image */}
        {issue.imageUrl && (
          <div style={{ marginBottom: '25px' }}>
            <img 
              src={issue.imageUrl} 
              alt={issue.title} 
              style={{ width: '100%', maxHeight: '450px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#1e293b' }}>Description</h3>
          <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '1rem', margin: 0 }}>{issue.description}</p>
        </div>

        <div style={{ marginBottom: '25px', color: '#64748b', fontSize: '0.88rem' }}>
          Reported on {new Date(issue.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {/* Resolution Section (Only displayed if Resolved) */}
        {issue.status === 'Resolved' && (
          <div style={{ margin: '25px 0', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
              Resolution Details
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#166534' }}>
              <strong>Status:</strong> Resolved on {issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString() : 'Recently'}
            </p>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.95rem', color: '#14532d', lineHeight: '1.5', background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
              <strong>Work Performed:</strong> {issue.resolutionDescription || 'Issue successfully rectified by the municipality.'}
            </p>

            {issue.resolutionImageUrl && (
              <div>
                <strong style={{ display: 'block', marginBottom: '6px', fontSize: '0.88rem', color: '#166534' }}>
                  Post-Resolution Verification Photo:
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

        {/* Community Confirmation Action */}
        <div style={{ margin: '25px 0', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1rem' }}>Have you seen this problem too?</h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
              Confirming helps prioritize the report on the municipal queue (+5 Priority Points).
            </p>
          </div>
          <button 
            onClick={handleConfirm}
            disabled={!user || hasConfirmed || isAuthor || confirming}
            style={{
              padding: '10px 22px',
              backgroundColor: hasConfirmed ? '#ecfdf5' : (isAuthor || !user) ? '#f1f5f9' : '#2563eb',
              color: hasConfirmed ? '#047857' : (isAuthor || !user) ? '#94a3b8' : '#fff',
              border: hasConfirmed ? '1px solid #a7f3d0' : 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: (hasConfirmed || isAuthor || !user || confirming) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.15s'
            }}
          >
            {confirming ? 'Confirming...' : hasConfirmed ? 'Confirmed by You' : isAuthor ? 'Your Own Report' : 'Confirm Issue'}
          </button>
        </div>

        {/* AI Analysis Section */}
        {issue.aiIssueType && (
          <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', margin: '0 0 12px 0', fontSize: '1.05rem' }}>
              AI Assistive Vision Inspection
            </h4>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#475569', fontSize: '0.85rem' }}>Problem Detected: </span> 
                <strong style={{ color: issue.problemDetected ? '#15803d' : '#dc2626' }}>
                  {issue.problemDetected ? 'Yes' : 'No'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#475569', fontSize: '0.85rem' }}>Confidence: </span> 
                <strong style={{ color: '#0f172a' }}>{issue.aiConfidence}%</strong>
              </div>
              <div>
                <span style={{ color: '#475569', fontSize: '0.85rem' }}>Suggested Type: </span> 
                <strong style={{ color: '#0f172a' }}>{issue.aiIssueType}</strong>
              </div>
            </div>

            <div>
              <strong style={{ color: '#0369a1', fontSize: '0.88rem' }}>AI Visual Observation:</strong>
              <p style={{ margin: '4px 0 0 0', color: '#334155', fontSize: '0.92rem', lineHeight: '1.5' }}>
                {issue.aiExplanation}
              </p>
            </div>
          </div>
        )}

        {/* Public Status Timeline */}
        <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '25px' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '15px' }}>
            Issue Progress & History
          </h3>
          <StatusTimeline history={issue.statusHistory || []} />
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;
