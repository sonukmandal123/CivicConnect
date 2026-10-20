import React from 'react';

const STATUS_STYLES = {
  'Submitted': {
    bg: '#e0f2fe',
    color: '#0369a1',
    border: '#bae6fd',
    dot: '#0284c7'
  },
  'Under Review': {
    bg: '#fef3c7',
    color: '#b45309',
    border: '#fde68a',
    dot: '#d97706'
  },
  'Verified': {
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
    dot: '#10b981'
  },
  'Assigned': {
    bg: '#f3e8ff',
    color: '#6b21a8',
    border: '#e9d5ff',
    dot: '#9333ea'
  },
  'In Progress': {
    bg: '#dbeafe',
    color: '#1d4ed8',
    border: '#bfdbfe',
    dot: '#3b82f6'
  },
  'Resolved': {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
    dot: '#22c55e'
  },
  'Rejected': {
    bg: '#fee2e2',
    color: '#b91c1c',
    border: '#fecaca',
    dot: '#ef4444'
  }
};

const StatusBadge = ({ status = 'Submitted', size = 'normal' }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES['Submitted'];
  const isSmall = size === 'small';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: isSmall ? '2px 8px' : '4px 10px',
        fontSize: isSmall ? '0.75rem' : '0.82rem',
        fontWeight: '600',
        borderRadius: '9999px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: style.dot,
          display: 'inline-block'
        }}
      />
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
