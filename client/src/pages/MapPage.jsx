import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import IssueMap from '../components/maps/IssueMap';
import NotificationBell from '../components/NotificationBell';
import api from '../services/api';
import './Dashboard.css';

const MapPage = () => {
  const { user } = useContext(AuthContext);
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  
  // Nearby location states
  const [radius, setRadius] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const fetchMapIssues = async () => {
      try {
        const response = await api.get('/issues/map');
        setIssues(response.data);
        setFilteredIssues(response.data);
      } catch (err) {
        setError('Failed to load map issues.');
      } finally {
        setLoading(false);
      }
    };

    fetchMapIssues();
  }, []);

  // Filter logic runs whenever issues or any filter state changes
  useEffect(() => {
    let result = issues;

    // 1. Text Search (Title or Category)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (issue) =>
          issue.title.toLowerCase().includes(q) ||
          issue.category.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (category !== 'All') {
      result = result.filter((issue) => issue.category === category);
    }

    // 3. Severity Filter
    if (severity !== 'All') {
      result = result.filter((issue) => issue.severity === severity);
    }

    // 4. Status Filter
    if (status !== 'All') {
      result = result.filter((issue) => issue.status === status);
    }

    // 5. Nearby Filter
    if (radius !== 'All' && userLocation) {
      const radiusKm = parseFloat(radius);
      result = result.filter((issue) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          issue.latitude,
          issue.longitude
        );
        return distance <= radiusKm;
      });
    }

    setFilteredIssues(result);
  }, [issues, searchQuery, category, severity, status, radius, userLocation]);

  // Handle request for user location when a radius is selected
  const handleRadiusChange = (e) => {
    const newRadius = e.target.value;
    setRadius(newRadius);

    if (newRadius !== 'All' && !userLocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        (err) => {
          alert('Could not get your location. Nearby filter disabled.');
          setRadius('All');
          setLocating(false);
        }
      );
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1>CivicConnect Map</h1>
            <p className="welcome-msg" style={{ margin: '5px 0 0 0', color: '#666' }}>Explore reported civic issues in your area.</p>
          </div>
          <div className="header-actions">
            {user && <NotificationBell />}
            <Link to="/" className="btn-secondary">Home</Link>
            <Link to="/dashboard" className="btn-secondary">Dashboard</Link>
          </div>
        </div>
      </header>

      {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '20px' }}>{error}</div>}

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        
        {/* Filters Section */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          
          {/* Search */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px', color: '#555' }}>Search</label>
            <input 
              type="text" 
              placeholder="Search issues..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          {/* Category */}
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px', color: '#555' }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="All">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Damaged Road">Damaged Road</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Garbage">Garbage</option>
              <option value="Blocked Drain">Blocked Drain</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Damaged Facility">Damaged Facility</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Severity */}
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px', color: '#555' }}>Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Status */}
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px', color: '#555' }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Nearby Filter */}
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px', color: '#555' }}>
              Nearby Issues {locating && <span style={{fontSize: '0.8em', color: '#0066cc'}}>(locating...)</span>}
            </label>
            <select value={radius} onChange={handleRadiusChange} disabled={locating} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="All">Anywhere</option>
              <option value="1">Within 1 km</option>
              <option value="3">Within 3 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
            </select>
          </div>

        </div>

        {/* Map Area */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading civic issues...</div>
        ) : (
          <>
            <div style={{ marginBottom: '15px', color: '#444' }}>
              <strong>Showing {filteredIssues.length} issues on the map</strong>
              {filteredIssues.length === 0 && <span style={{ marginLeft: '10px', color: '#888' }}>(Try adjusting your filters)</span>}
            </div>
            <IssueMap issues={filteredIssues} />
          </>
        )}
      </div>
    </div>
  );
};

export default MapPage;
