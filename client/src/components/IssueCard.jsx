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

  return (
    <div className="issue-card">
      <div className="issue-image-container">
        {issue.imageUrl ? (
          <img src={issue.imageUrl} alt={issue.title} className="issue-image" />
        ) : (
          <div className="no-image">No Image</div>
        )}
      </div>
      
      <div className="issue-content">
        <div className="issue-header">
          <span className="category-tag">{issue.category}</span>
          <span className="issue-date">{formattedDate}</span>
        </div>
        
        <h3 className="issue-title">{issue.title}</h3>
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
