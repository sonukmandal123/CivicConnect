import React from 'react';

const CATEGORY_COLORS = {
  'Pothole': { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', dot: '#ef4444' },
  'Streetlight': { bg: '#fffbeb', color: '#92400e', border: '#fde68a', dot: '#f59e0b' },
  'Water Leakage': { bg: '#f0f9ff', color: '#075985', border: '#bae6fd', dot: '#0284c7' },
  'Drainage': { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe', dot: '#6366f1' },
  'Blocked Drain': { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe', dot: '#6366f1' },
  'Garbage': { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', dot: '#10b981' },
  'Traffic Signal': { bg: '#fdf2f8', color: '#9d174d', border: '#fbcfe8', dot: '#ec4899' },
  'Broken Sidewalk': { bg: '#f8fafc', color: '#334155', border: '#cbd5e1', dot: '#64748b' },
  'Tree Hazard': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', dot: '#22c55e' }
};

const DEFAULT_CATEGORY_STYLE = {
  bg: '#e0e7ff',
  color: '#3730a3',
  border: '#c7d2fe',
  dot: '#4f46e5'
};

const CategoryBadge = ({ category = 'General', showDot = true, size = 'normal' }) => {
  const style = CATEGORY_COLORS[category] || DEFAULT_CATEGORY_STYLE;
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
      title={`Category: ${category}`}
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
      <span>{category}</span>
    </span>
  );
};

export default CategoryBadge;
