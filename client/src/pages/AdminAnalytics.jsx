import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import './AdminAnalytics.css';

const CATEGORY_COLORS = {
  'Pothole': '#f59e0b',
  'Damaged Road': '#ea580c',
  'Streetlight': '#eab308',
  'Garbage': '#84cc16',
  'Blocked Drain': '#06b6d4',
  'Water Leakage': '#3b82f6',
  'Damaged Facility': '#8b5cf6',
  'Other': '#64748b'
};

const AdminAnalytics = () => {
  const { user, token, loading: authLoading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [analytics, setAnalytics] = useState({
    summary: {
      totalIssues: 0,
      submitted: 0,
      underReview: 0,
      pendingReview: 0,
      verified: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
      criticalPriority: 0,
      highPriority: 0
    },
    categories: [],
    statuses: [],
    severities: [],
    priorities: [],
    timeline: [],
    resolution: {
      totalResolved: 0,
      avgResolutionHours: 0,
      avgResolutionDays: 0,
      fastestHours: 0,
      longestHours: 0
    },
    community: {
      totalConfirmations: 0,
      avgConfirmationsPerIssue: 0,
      topConfirmedIssues: []
    },
    ai: {
      totalWithAI: 0,
      avgConfidence: 0,
      problemDetectionRate: '0%',
      aiDetectedCategories: []
    }
  });

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await api.get('/admin/analytics');
      if (response.data && response.data.data) {
        setAnalytics(response.data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytical metrics from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!token || !user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate('/dashboard');
      }
    }
  }, [authLoading, token, user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAnalytics();
    }
  }, [user, fetchAnalytics]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b', fontSize: '1.1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px auto', animation: 'spin 1s linear infinite' }}></div>
        Checking municipal administrator session...
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ maxWidth: '480px', margin: '100px auto', padding: '32px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '8px' }}>Administrator Access Required</h2>
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.95rem' }}>
          Municipal intelligence analytics are restricted to authorized administrators.
        </p>
        <button 
          onClick={() => navigate('/login')}
          style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  const total = analytics.summary.totalIssues || 0;
  const resolutionRate = total > 0 ? Math.round((analytics.summary.resolved / total) * 100) : 0;
  const activeWork = (analytics.summary.verified || 0) + (analytics.summary.assigned || 0) + (analytics.summary.inProgress || 0);

  // Status order map for funnel display
  const STATUS_ORDER = ['Submitted', 'Under Review', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

  const getStatusCount = (statusName) => {
    const found = analytics.statuses?.find(s => s.status === statusName);
    return found ? found.count : 0;
  };

  return (
    <div className="analytics-page">
      {/* Top Header */}
      <header className="analytics-header">
        <div className="analytics-header-content">
          <div>
            <div className="analytics-badge-tag">MUNICIPAL CIVIC INTELLIGENCE</div>
            <h1>CivicConnect Analytics Dashboard</h1>
            <p className="analytics-subtitle">
              Real-time statistical aggregations, resolution throughput, and AI vision performance metrics.
            </p>
          </div>
          <div className="analytics-header-actions">
            <Link to="/admin" className="analytics-nav-btn secondary">
              Issue Queue
            </Link>
            <Link to="/map" className="analytics-nav-btn secondary">
              Map View
            </Link>
            <button
              onClick={() => fetchAnalytics(true)}
              className="analytics-nav-btn primary"
              disabled={refreshing}
            >
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
            <button onClick={handleLogout} className="analytics-nav-btn danger">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="analytics-main">
        {error && (
          <div className="analytics-error-banner">
            <span>{error}</span>
            <button onClick={() => fetchAnalytics()} className="analytics-retry-btn">Retry</button>
          </div>
        )}

        {/* Real-time sync timestamp bar */}
        <div className="analytics-status-bar">
          <div className="sync-indicator">
            <span className="live-dot"></span>
            <span>Live Aggregation Engine</span>
          </div>
          {lastUpdated && (
            <div className="timestamp-text">
              Last updated: {lastUpdated.toLocaleTimeString()} ({lastUpdated.toLocaleDateString()})
            </div>
          )}
        </div>

        {loading ? (
          <div className="analytics-loading-box">
            <div className="analytics-spinner"></div>
            <p>Aggregating municipal database records...</p>
          </div>
        ) : (
          <>
            {/* Top KPI Cards Row */}
            <section className="analytics-kpi-grid">
              <div className="stat-card blue">
                <div className="stat-card-header">
                  <span className="stat-label">Total Civic Reports</span>
                </div>
                <div className="stat-value">{analytics.summary.totalIssues}</div>
                <div className="stat-footer">Cumulative citizen submissions</div>
              </div>

              <div className="stat-card amber">
                <div className="stat-card-header">
                  <span className="stat-label">Pending Review</span>
                </div>
                <div className="stat-value">{analytics.summary.pendingReview}</div>
                <div className="stat-footer">
                  {analytics.summary.submitted} Submitted · {analytics.summary.underReview} Under Review
                </div>
              </div>

              <div className="stat-card indigo">
                <div className="stat-card-header">
                  <span className="stat-label">In-Flight Operations</span>
                </div>
                <div className="stat-value">{activeWork}</div>
                <div className="stat-footer">
                  {analytics.summary.verified} Verified · {analytics.summary.assigned} Assigned · {analytics.summary.inProgress} In Progress
                </div>
              </div>

              <div className="stat-card emerald">
                <div className="stat-card-header">
                  <span className="stat-label">Resolved Issues</span>
                </div>
                <div className="stat-value">{analytics.summary.resolved}</div>
                <div className="stat-footer">
                  Completion rate: <strong>{resolutionRate}%</strong>
                </div>
              </div>

              <div className="stat-card rose">
                <div className="stat-card-header">
                  <span className="stat-label">High / Critical Urgency</span>
                </div>
                <div className="stat-value">
                  {(analytics.summary.criticalPriority || 0) + (analytics.summary.highPriority || 0)}
                </div>
                <div className="stat-footer">
                  {analytics.summary.criticalPriority || 0} Critical · {analytics.summary.highPriority || 0} High Priority
                </div>
              </div>

              <div className="stat-card purple">
                <div className="stat-card-header">
                  <span className="stat-label">Community Confirmations</span>
                </div>
                <div className="stat-value">{analytics.community.totalConfirmations}</div>
                <div className="stat-footer">
                  Avg {analytics.community.avgConfirmationsPerIssue} per reported issue
                </div>
              </div>
            </section>

            {/* Middle Section: Categories & Status Funnel */}
            <div className="analytics-two-col">
              {/* Category Breakdown */}
              <div className="analytics-panel">
                <div className="panel-title-row">
                  <div>
                    <h3>Civic Issues by Category</h3>
                    <p className="panel-sub">Volume breakdown across municipal infrastructure types</p>
                  </div>
                  <span className="panel-counter-badge">{analytics.categories?.length || 0} Active Types</span>
                </div>

                <div className="category-bars-list">
                  {analytics.categories && analytics.categories.length > 0 ? (
                    analytics.categories.map((c) => {
                      const count = c.count || 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const color = CATEGORY_COLORS[c.category] || '#3b82f6';

                      return (
                        <div key={c.category} className="cat-bar-item">
                          <div className="cat-bar-label">
                            <span className="cat-icon-text">
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
                              <span className="cat-name">{c.category}</span>
                            </span>
                            <span className="cat-metrics">
                              <strong>{count}</strong> ({pct}%)
                            </span>
                          </div>
                          <div className="cat-bar-track">
                            <div
                              className="cat-bar-fill"
                              style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-panel-text">No category data recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Status Funnel */}
              <div className="analytics-panel">
                <div className="panel-title-row">
                  <div>
                    <h3>Lifecycle Status Funnel</h3>
                    <p className="panel-sub">Progress of issues through the verification & resolution state machine</p>
                  </div>
                  <span className="panel-counter-badge">7 Distinct States</span>
                </div>

                <div className="status-funnel-list">
                  {STATUS_ORDER.map((st) => {
                    const count = getStatusCount(st);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={st} className="status-funnel-row">
                        <div className="funnel-badge-col">
                          <StatusBadge status={st} />
                        </div>
                        <div className="funnel-bar-col">
                          <div className="funnel-track">
                            <div
                              className={`funnel-fill ${st.toLowerCase().replace(/\s+/g, '-')}`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="funnel-count-col">
                          <strong>{count}</strong>
                          <span className="funnel-pct">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Three Column Row: Priority vs Severity vs AI */}
            <div className="analytics-three-col">
              {/* Priority Distribution */}
              <div className="analytics-panel">
                <div className="panel-title-row">
                  <div>
                    <h3>Priority Scoring Tiers</h3>
                    <p className="panel-sub">Rule-based score (0–100)</p>
                  </div>
                </div>

                <div className="tier-breakdown-list">
                  {['Critical', 'High', 'Medium', 'Low'].map((tier) => {
                    const found = analytics.priorities?.find(p => p.priorityLevel === tier);
                    const count = found ? found.count : 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={tier} className="tier-card">
                        <div className="tier-badge-row">
                          <PriorityBadge priorityLevel={tier} />
                          <span className="tier-count"><strong>{count}</strong> ({pct}%)</span>
                        </div>
                        <div className="tier-track">
                          <div
                            className={`tier-fill tier-${tier.toLowerCase()}`}
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Severity Distribution */}
              <div className="analytics-panel">
                <div className="panel-title-row">
                  <div>
                    <h3>Reported Severity</h3>
                    <p className="panel-sub">Initial physical impact assessment</p>
                  </div>
                </div>

                <div className="tier-breakdown-list">
                  {['Critical', 'High', 'Medium', 'Low'].map((sev) => {
                    const found = analytics.severities?.find(s => s.severity === sev);
                    const count = found ? found.count : 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={sev} className="tier-card">
                        <div className="tier-badge-row">
                          <span className={`severity-tag sev-${sev.toLowerCase()}`}>{sev}</span>
                          <span className="tier-count"><strong>{count}</strong> ({pct}%)</span>
                        </div>
                        <div className="tier-track">
                          <div
                            className={`tier-fill sev-${sev.toLowerCase()}`}
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Vision Metrics */}
              <div className="analytics-panel ai-highlight-panel">
                <div className="panel-title-row">
                  <div>
                    <h3>Groq Vision AI Performance</h3>
                    <p className="panel-sub">qwen/qwen3.8-27b visual analysis</p>
                  </div>
                  <span className="ai-pill-tag">Vision AI</span>
                </div>

                <div className="ai-metrics-container">
                  <div className="ai-stat-box">
                    <span className="ai-stat-label">AI Analyzed Images</span>
                    <span className="ai-stat-num">{analytics.ai.totalWithAI}</span>
                  </div>
                  <div className="ai-stat-box">
                    <span className="ai-stat-label">Average Confidence</span>
                    <span className="ai-stat-num">{analytics.ai.avgConfidence}%</span>
                  </div>
                  <div className="ai-stat-box">
                    <span className="ai-stat-label">Defect Detection Rate</span>
                    <span className="ai-stat-num green">{analytics.ai.problemDetectionRate}</span>
                  </div>
                </div>

                <div className="ai-categories-container">
                  <div className="sub-header-label">Top AI-Identified Classes:</div>
                  <div className="ai-tags-wrap">
                    {analytics.ai.aiDetectedCategories && analytics.ai.aiDetectedCategories.length > 0 ? (
                      analytics.ai.aiDetectedCategories.map(cat => (
                        <span key={cat.category} className="ai-cat-pill">
                          {cat.category}: <strong>{cat.count}</strong>
                        </span>
                      ))
                    ) : (
                      <span className="empty-panel-text">No AI image classes logged yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Resolution Turnaround & Community Engagement */}
            <div className="analytics-two-col">
              {/* Resolution Turnaround Stats */}
              <div className="analytics-panel">
                <div className="panel-title-row">
                  <div>
                    <h3>Resolution Throughput & SLA</h3>
                    <p className="panel-sub">Calculated via MongoDB $subtract on resolvedAt & createdAt</p>
                  </div>
                  <span className="panel-counter-badge green">
                    {analytics.resolution.totalResolved} Closed
                  </span>
                </div>

                <div className="resolution-metrics-grid">
                  <div className="resolution-stat-tile">
                    <div className="tile-body">
                      <span className="tile-title">Average Turnaround</span>
                      <span className="tile-number">
                        {analytics.resolution.avgResolutionHours} <small>hrs</small>
                      </span>
                      <span className="tile-subtitle">
                        ≈ {analytics.resolution.avgResolutionDays} municipal working days
                      </span>
                    </div>
                  </div>

                  <div className="resolution-stat-tile">
                    <div className="tile-body">
                      <span className="tile-title">Fastest Resolution</span>
                      <span className="tile-number">
                        {analytics.resolution.fastestHours} <small>hrs</small>
                      </span>
                      <span className="tile-subtitle">Rapid response time</span>
                    </div>
                  </div>

                  <div className="resolution-stat-tile">
                    <div className="tile-body">
                      <span className="tile-title">Longest Resolution</span>
                      <span className="tile-number">
                        {analytics.resolution.longestHours} <small>hrs</small>
                      </span>
                      <span className="tile-subtitle">Complex infrastructure work</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Engagement Leaderboard */}
              <div className="analytics-panel">
                <div className="panel-title-row">
                  <div>
                    <h3>Community Engagement Leaderboard</h3>
                    <p className="panel-sub">Top crowdsourced civic reports by citizen confirmation votes</p>
                  </div>
                  <span className="panel-counter-badge">
                    {analytics.community.totalConfirmations} Total Votes
                  </span>
                </div>

                <div className="top-issues-table-wrap">
                  {analytics.community.topConfirmedIssues && analytics.community.topConfirmedIssues.length > 0 ? (
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Issue Title</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Confirmations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.community.topConfirmedIssues.map((issue) => (
                          <tr key={issue._id}>
                            <td>
                              <Link to={`/admin/issues/${issue._id}`} className="issue-link-title">
                                {issue.title}
                              </Link>
                            </td>
                            <td>
                              <span className="cat-inline-badge">{issue.category}</span>
                            </td>
                            <td>
                              <StatusBadge status={issue.status} />
                            </td>
                            <td className="votes-cell">
                              <span className="vote-chip">{issue.confirmationsCount} votes</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-panel-text">No citizen confirmations recorded yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Timeline Activity */}
            {analytics.timeline && analytics.timeline.length > 0 && (
              <div className="analytics-panel timeline-full-width">
                <div className="panel-title-row">
                  <div>
                    <h3>Report Volume Activity Timeline</h3>
                    <p className="panel-sub">Daily civic submissions grouped via $dateToString</p>
                  </div>
                </div>

                <div className="timeline-bars-track">
                  {analytics.timeline.map((entry) => {
                    const maxCount = Math.max(...analytics.timeline.map(t => t.count), 1);
                    const heightPct = Math.round((entry.count / maxCount) * 100);

                    return (
                      <div key={entry.date} className="timeline-day-col" title={`${entry.date}: ${entry.count} issues`}>
                        <div className="timeline-bar-wrapper">
                          <span className="timeline-count-badge">{entry.count}</span>
                          <div
                            className="timeline-day-bar"
                            style={{ height: `${Math.max(heightPct, 15)}%` }}
                          ></div>
                        </div>
                        <span className="timeline-day-label">
                          {entry.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminAnalytics;
