import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIssueDetails = async () => {
      try {
        const response = await api.get(`/issues/${id}`);
        setIssue(response.data);
      } catch (err) {
        setError('Failed to load issue details. You might not have permission to view this issue.');
      } finally {
        setLoading(false);
      }
    };

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
      setIssue(prev => ({ ...prev, confirmations: response.data.confirmations }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm issue');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading issue details...</div>;
  
  if (error) return (
    <div className="dashboard-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div className="report-alert error">{error}</div>
      <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
    </div>
  );

  if (!issue) return null;

  const confirmationsCount = issue.confirmations ? issue.confirmations.length : 0;
  const hasConfirmed = user && issue.confirmations && issue.confirmations.includes(user._id);
  const isAuthor = user && issue.reportedBy === user._id;

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Issue Details</h2>
        <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.5em', marginBottom: '10px' }}>{issue.title}</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge category-badge" style={{ padding: '4px 8px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '4px' }}>{issue.category}</span>
          <span className={`badge severity-${issue.severity.toLowerCase()}`} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}>{issue.severity} Severity</span>
          <span className="badge" style={{ padding: '4px 8px', backgroundColor: '#f3f4f6', color: '#1f2937', borderRadius: '4px' }}>Status: {issue.status}</span>
          
          <span className="badge" style={{ padding: '4px 8px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontWeight: 'bold' }}>
            👍 {confirmationsCount} Confirmations
          </span>
        </div>

        {issue.imageUrl && (
          <img 
            src={issue.imageUrl} 
            alt={issue.title} 
            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }} 
          />
        )}

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '8px' }}>Description</h4>
          <p style={{ lineHeight: '1.6', color: '#444' }}>{issue.description}</p>
        </div>

        <div style={{ marginBottom: '20px', color: '#666', fontSize: '0.9em' }}>
          Reported on {new Date(issue.createdAt).toLocaleDateString()}
        </div>

        {/* AI Analysis Section */}
        {issue.aiIssueType && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', margin: '0 0 15px 0' }}>
              <span>🤖</span> AI Analysis
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
              <div>
                <strong style={{ color: '#333' }}>Problem Detected:</strong> 
                <span style={{ color: issue.problemDetected ? '#16a34a' : '#dc2626', marginLeft: '8px', fontWeight: 'bold' }}>
                  {issue.problemDetected ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#333' }}>AI Confidence:</strong> 
                <span style={{ marginLeft: '8px', color: '#444' }}>{issue.aiConfidence}%</span>
              </div>
              <div>
                <strong style={{ color: '#333' }}>Suggested Category:</strong> 
                <span style={{ marginLeft: '8px', color: '#444' }}>{issue.aiIssueType}</span>
              </div>
            </div>

            {(!issue.problemDetected || (issue.aiIssueType !== 'Unknown/Unclear' && issue.aiIssueType !== issue.category)) && (
              <div style={{ padding: '10px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', marginBottom: '15px', color: '#b91c1c', fontSize: '0.9em' }}>
                <strong>⚠️ Discrepancy Flagged:</strong> The AI analysis differs significantly from the user's report. Please review manually.
              </div>
            )}

            <div>
              <strong style={{ color: '#333' }}>AI Explanation:</strong>
              <p style={{ marginTop: '5px', color: '#444', fontSize: '0.95em', lineHeight: '1.5' }}>{issue.aiExplanation}</p>
            </div>
          </div>
        )}

        {/* Community Confirmation Section */}
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Community Confirmation</h4>
            <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>Help authorities prioritize by confirming if you also see this issue.</p>
          </div>
          <button 
            onClick={handleConfirm}
            disabled={!user || hasConfirmed || isAuthor || confirming}
            style={{
              padding: '10px 20px',
              backgroundColor: hasConfirmed ? '#e8f5e9' : (isAuthor || !user) ? '#e9ecef' : '#007bff',
              color: hasConfirmed ? '#2e7d32' : (isAuthor || !user) ? '#6c757d' : '#fff',
              border: hasConfirmed ? '1px solid #2e7d32' : 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: (hasConfirmed || isAuthor || !user || confirming) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            👍 {confirming ? 'Confirming...' : hasConfirmed ? 'Confirmed' : 'Confirm Issue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;
