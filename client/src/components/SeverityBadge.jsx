import React from 'react';

const SEVERITY_STYLES = {
  Critical: {
    bg: '#fee2e2',
    color: '#991b1b',
    border: '#fca5a5',
    dot: '#dc2626'
  },
  High: {
    bg: '#ffedd5',
    color: '#9a3412',
    border: '#fdba74',
    dot: '#ea580c'
  },
  Medium: {
    bg: '#fef3c7',
    color: '#92400e',
    border: '#fcd34d',
    dot: '#d97706'
  },
  Low: {
    bg: '#dcfce7',
    color: '#166534',
    border: '#bbf7d0',
    dot: '#16a34a'
  }
};

const SeverityBadge = ({ severity = 'Low', showSuffix = true, showDot = true, size = 'normal' }) => {
  const normalized = ['Critical', 'High', 'Medium', 'Low'].includes(severity) ? severity : 'Low';
  const style = SEVERITY_STYLES[normalized] || SEVERITY_STYLES['Low'];
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
      title={`Severity: ${normalized}`}
    >
      {showDot && (
        <span
          style={{
            width: isSmall ? '6px' : '7px',
            height: isSmall ? '6px' : '7px',
            borderRadius: '50%',
            backgroundColor: style.dot,
            display: 'inline-block'
          }}
        />
      )}
      <span>{normalized}{showSuffix ? ' Severity' : ''}</span>
    </span>
  );
};

export default SeverityBadge;
