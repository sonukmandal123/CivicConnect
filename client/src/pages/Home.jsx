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
        
        <div className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? '✕' : '☰'}
        </div>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/map" className="nav-link">Map</Link>
          {user ? (
            <>
              <NotificationBell />
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="nav-link">
                {user.role === 'admin' ? 'Admin Portal' : 'Dashboard'}
              </Link>
              <button 
                onClick={logout} 
                className="nav-btn" 
                style={{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', color: 'white', fontWeight: '600' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-btn">Sign Up</Link>
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
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="mockup-body">
              <div className="skeleton-title"></div>
              <div className="skeleton-image">
                <span className="image-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </span>
              </div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
              <div className="mockup-btn">Submit Report</div>
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
