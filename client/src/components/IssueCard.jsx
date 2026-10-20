import React from 'react';
import { Link } from 'react-router-dom';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import './IssueCard.css';

const LIFECYCLE_STEPS = [
  { key: 'Submitted', label: 'Submit' },
  { key: 'Under Review', label: 'Review' },
  { key: 'Verified', label: 'Verify' },
  { key: 'Assigned', label: 'Assign' },
  { key: 'In Progress', label: 'Progress' },
  { key: 'Resolved', label: 'Resolved' }
];

const IssueCard = ({ issue }) => {
  const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const descriptionPreview = issue.description.length > 75 
    ? issue.description.substring(0, 75) + '...' 
    : issue.description;

  const hasAiData = issue.aiIssueType !== undefined && issue.aiConfidence !== undefined;
  const hasDiscrepancy = hasAiData && (
    !issue.problemDetected || 
    (issue.aiIssueType !== 'Unknown/Unclear' && issue.aiIssueType !== issue.category)
  );
  
  const confirmationsCount = issue.confirmations ? issue.confirmations.length : 0;

  // Determine Lifecycle Progress
  const isRejected = issue.status === 'Rejected';
  const currentStepIndex = LIFECYCLE_STEPS.findIndex(s => s.key === issue.status);

  return (
    <div className="issue-card">
      {/* Image Container with Badges */}
      <div className="issue-image-container" style={{ position: 'relative' }}>
        {issue.imageUrl ? (
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="issue-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
            }}
          />
        ) : (
          <div className="no-image">No Photo Uploaded</div>
        )}

        {/* AI Confidence Chip */}
        {hasAiData && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>AI:</span>
            <span>{issue.problemDetected ? `${issue.aiConfidence}%` : 'Flagged'}</span>
          </div>
        )}

        {/* Confirmations Chip */}
        {confirmationsCount > 0 && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(22, 163, 74, 0.9)', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold' }}>
            {confirmationsCount} {confirmationsCount === 1 ? 'confirmation' : 'confirmations'}
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="issue-content">
        <div className="issue-header">
          <span className="category-tag">{issue.category}</span>
          <span className="issue-date">{formattedDate}</span>
        </div>
        
        <h3 className="issue-title">
          <Link to={`/issues/${issue._id}`} style={{ textDecoration: 'none', color: '#1e293b' }}>
            {issue.title}
          </Link>
          {hasDiscrepancy && (
            <span title="AI analysis noted a potential category discrepancy" style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#b91c1c', padding: '1px 5px', borderRadius: '3px', marginLeft: '6px', fontWeight: 'bold' }}>
              Mismatch
            </span>
          )}
        </h3>

        <p className="issue-description">{descriptionPreview}</p>

        {/* Department tag if assigned */}
        {issue.assignedDepartment && (
          <div style={{ fontSize: '0.78rem', color: '#6b21a8', background: '#f3e8ff', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', marginBottom: '8px', fontWeight: '600' }}>
            {issue.assignedDepartment}
          </div>
        )}

        {/* Lifecycle Stepper */}
        <div className="card-lifecycle-stepper">
          {isRejected ? (
            <>
              <div className="stepper-step">
                <span className="stepper-dot completed" />
                <span className="stepper-line completed" />
                <span className="stepper-label">Submit</span>
              </div>
              <div className="stepper-step">
                <span className="stepper-dot completed" />
                <span className="stepper-line" style={{ backgroundColor: '#dc2626' }} />
                <span className="stepper-label">Review</span>
              </div>
              <div className="stepper-step">
                <span className="stepper-dot rejected" />
                <span className="stepper-label" style={{ color: '#dc2626', fontWeight: 'bold' }}>Rejected</span>
              </div>
            </>
          ) : (
            LIFECYCLE_STEPS.map((step, idx) => {
              const isPassed = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;
              const isLast = idx === LIFECYCLE_STEPS.length - 1;

              return (
                <div key={step.key} className="stepper-step">
                  <span
                    className={`stepper-dot ${isCurrent ? 'active' : isPassed ? 'completed' : ''}`}
                    title={step.key}
                  />
                  {!isLast && (
                    <span className={`stepper-line ${isPassed ? 'completed' : ''}`} />
                  )}
                  <span className={`stepper-label ${isCurrent ? 'active' : ''}`}>
                    {step.label}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Status and Priority Badges */}
        <div className="issue-footer" style={{ marginTop: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={issue.status} size="small" />
            <PriorityBadge level={issue.priorityLevel} score={issue.priorityScore} size="small" />
          </div>

          <Link
            to={`/issues/${issue._id}`}
            style={{
              fontSize: '0.82rem',
              color: '#2563eb',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Track →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
