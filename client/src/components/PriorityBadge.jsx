import React from 'react';

const PRIORITY_STYLES = {
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
    bg: '#f1f5f9',
    color: '#475569',
    border: '#cbd5e1',
    dot: '#64748b'
  }
};

const PriorityBadge = ({ level, priorityLevel, score, showDot = true, size = 'normal' }) => {
  const effectiveLevel = level || priorityLevel || 'Low';
  const normalizedLevel = ['Critical', 'High', 'Medium', 'Low'].includes(effectiveLevel) ? effectiveLevel : 'Low';
  const style = PRIORITY_STYLES[normalizedLevel] || PRIORITY_STYLES.Low;

  const isSmall = size === 'small';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: isSmall ? '2px 8px' : '4px 10px',
        fontSize: isSmall ? '0.75rem' : '0.82rem',
        fontWeight: '700',
        borderRadius: '9999px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}
      title={`Priority Level: ${normalizedLevel}${typeof score === 'number' ? ` (${score}/100)` : ''}`}
    >
      {showDot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: style.dot,
            display: 'inline-block'
          }}
        />
      )}
      <span>{normalizedLevel}</span>
      {typeof score === 'number' && (
        <span
          style={{
            fontSize: '0.85em',
            opacity: 0.85,
            marginLeft: '1px',
            fontWeight: '600'
          }}
        >
          ({score})
        </span>
      )}
    </span>
  );
};

export default PriorityBadge;
