import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/map" className="nav-link">Map</Link>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-btn">Sign Up</Link>
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
                <span className="image-icon">📸</span>
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
          <div className="feature-icon">📍</div>
          <h3>Easy Reporting</h3>
          <p>Snap a photo and describe the problem in seconds.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🔍</div>
          <h3>Track Progress</h3>
          <p>See real-time updates as authorities review and fix issues.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🤝</div>
          <h3>Better Community</h3>
          <p>Work together to make your neighborhood safer and cleaner.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
