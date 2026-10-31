import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import './Home.css';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="home-container">
      <nav className="home-nav">
        <div className="logo">
          <img src="/Logo.png" alt="Logo" style={{ height: '40px', width: 'auto' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ lineHeight: '1.2' }}>CivicConnect</span>
            <span style={{ fontSize: '0.45em', color: '#666', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' }}>Connect. Report. Resolve.</span>
          </div>
        </div>
        
        <div className="mobile-nav-actions">
          <button 
            type="button" 
            className="mobile-menu-btn" 
            onClick={() => setIsMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
          {user && (
            <div className="mobile-bell-wrapper">
              <NotificationBell />
            </div>
          )}
        </div>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/map" className="btn-secondary" onClick={() => setIsMenuOpen(false)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            Map
          </Link>
          {user ? (
            <>
              <Link 
                to={user.role === 'admin' ? '/admin' : '/dashboard'} 
                className="btn-secondary"
                onClick={() => setIsMenuOpen(false)}
              >
                {user.role === 'admin' ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    Admin Portal
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="9"></rect>
                      <rect x="14" y="3" width="7" height="5"></rect>
                      <rect x="14" y="12" width="7" height="9"></rect>
                      <rect x="3" y="16" width="7" height="5"></rect>
                    </svg>
                    Dashboard
                  </>
                )}
              </Link>
              <button 
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }} 
                className="btn-danger"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
              {/* Notification bell for desktop; hidden on mobile since it's displayed right of the hamburger menu */}
              <div className="desktop-bell-wrapper">
                <NotificationBell />
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary" onClick={() => setIsMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="nav-btn" onClick={() => setIsMenuOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Empower Your Community.<br/>
            <span className="text-gradient">Report Civic Issues Instantly.</span>
          </h1>
          <p className="hero-subtitle">
            Notice a pothole, broken streetlight, or water leak? CivicConnect makes it easy to report problems directly to local authorities and track their resolution.
          </p>
          <div className="hero-actions">
            <Link to="/report" className="primary-btn pulse">Report an Issue Now</Link>
            <Link to="/dashboard" className="secondary-btn">Track My Reports</Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="glass-card mockup-card">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <span className="mockup-app-title">civicconnect.app/report</span>
            </div>
            
            <div className="mockup-body">
              <div className="mockup-card-header">
                <div className="mockup-badge-row">
                  <span className="mockup-pill category">Pothole</span>
                  <span className="mockup-pill severity">High Severity</span>
                </div>
                <h4 className="mockup-title">Hazardous Road Crater</h4>
              </div>

              <div className="mockup-image-preview">
                <img 
                  src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80" 
                  alt="Issue Preview" 
                  className="mockup-photo" 
                />
                <div className="mockup-image-overlay">
                  <span className="mockup-ai-chip">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    AI Verified 96%
                  </span>
                </div>
              </div>

              <div className="mockup-meta">
                <span className="mockup-location">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Main Road Bistupur
                </span>
                <span className="mockup-gps-badge">GPS Tagged</span>
              </div>

              <div className="mockup-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"></path>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Submit Report
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="features-section">
        <div className="feature">
          <div className="feature-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <h3>Easy Reporting</h3>
          <p>Snap a photo and describe the problem in seconds.</p>
        </div>
        <div className="feature">
          <div className="feature-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3>Track Progress</h3>
          <p>See real-time updates as authorities review and fix issues.</p>
        </div>
        <div className="feature">
          <div className="feature-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3>Better Community</h3>
          <p>Work together to make your neighborhood safer and cleaner.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
