import React from 'react';
import './IssueCard.css';

const IssueCard = ({ issue }) => {
  // Format the date to be more readable
  const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Determine CSS classes for badges based on values
  const severityClass = `severity-badge ${issue.severity.toLowerCase()}`;
  const statusClass = `status-badge ${issue.status.replace(/\s+/g, '-').toLowerCase()}`;

  // Truncate description for preview
  const descriptionPreview = issue.description.length > 80 
    ? issue.description.substring(0, 80) + '...' 
    : issue.description;

  const hasAiData = issue.aiIssueType !== undefined && issue.aiConfidence !== undefined;
  const hasDiscrepancy = hasAiData && (
    !issue.problemDetected || 
    (issue.aiIssueType !== 'Unknown/Unclear' && issue.aiIssueType !== issue.category)
  );
  
  const confirmationsCount = issue.confirmations ? issue.confirmations.length : 0;

  return (
    <div className="issue-card">
      <div className="issue-image-container" style={{ position: 'relative' }}>
        {issue.imageUrl ? (
          <img src={issue.imageUrl} alt={issue.title} className="issue-image" />
        ) : (
          <div className="no-image">No Image</div>
        )}
        {hasAiData && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(59, 130, 246, 0.9)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75em', fontWeight: 'bold' }}>
            🤖 AI: {issue.problemDetected ? `${issue.aiConfidence}% Confident` : 'No Issue'}
          </div>
        )}
        {confirmationsCount > 0 && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(46, 125, 50, 0.9)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75em', fontWeight: 'bold' }}>
            👍 {confirmationsCount}
          </div>
        )}
      </div>
      
      <div className="issue-content">
        <div className="issue-header">
          <span className="category-tag">{issue.category}</span>
          <span className="issue-date">{formattedDate}</span>
        </div>
        
        <h3 className="issue-title" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {issue.title}
          {hasDiscrepancy && <span title="AI flagged a discrepancy with this report" style={{ color: '#ef4444', fontSize: '1.2em' }}>⚠️</span>}
        </h3>
        <p className="issue-description">{descriptionPreview}</p>
        
        <div className="issue-footer">
          <span className={severityClass}>{issue.severity} Severity</span>
          <span className={statusClass}>{issue.status}</span>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
