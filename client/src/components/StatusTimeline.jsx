import React from 'react';
import StatusBadge from './StatusBadge';
import './StatusTimeline.css';

const StatusTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div style={{ padding: '1rem', color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
        No status history recorded yet.
      </div>
    );
  }

  return (
    <div className="status-timeline">
      {history.map((step, idx) => {
        const actorName = step.changedBy?.name || 'Authorized User';
        const actorRole = step.changedBy?.role ? ` (${step.changedBy.role})` : '';
        const formattedDate = step.changedAt
          ? new Date(step.changedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Date not recorded';

        const isResolved = step.status === 'Resolved';
        const isRejected = step.status === 'Rejected';
        const markerClass = isResolved ? 'resolved' : isRejected ? 'rejected' : '';

        return (
          <div key={step._id || idx} className="timeline-item">
            <div className={`timeline-marker ${markerClass}`}>
              {isResolved ? '✓' : isRejected ? '✕' : idx + 1}
            </div>

            <div className="timeline-content">
              <div className="timeline-header">
                <div>
                  <StatusBadge status={step.status} size="small" />
                  <span className="timeline-actor" style={{ marginLeft: '8px' }}>
                    by <strong>{actorName}</strong>{actorRole}
                  </span>
                </div>
                <span className="timeline-date">{formattedDate}</span>
              </div>

              {step.remark && (
                <div className="timeline-remark">
                  "{step.remark}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
