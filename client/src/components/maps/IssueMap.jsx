import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_MAP_CENTER = [22.8046, 86.2029];
const DEFAULT_MAP_ZOOM = 13;

const IssueMap = ({ issues }) => {
  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
      <MapContainer 
        center={DEFAULT_MAP_CENTER} 
        zoom={DEFAULT_MAP_ZOOM} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {issues.map((issue) => (
          <Marker key={issue._id} position={[issue.latitude, issue.longitude]}>
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1em' }}>{issue.title}</h4>
                {issue.imageUrl && (
                  <img 
                    src={issue.imageUrl} 
                    alt={issue.title} 
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} 
                  />
                )}
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}><strong>Category:</strong> {issue.category}</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}><strong>Severity:</strong> {issue.severity}</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}><strong>Status:</strong> {issue.status}</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}><strong>Date:</strong> {new Date(issue.createdAt).toLocaleDateString()}</p>
                {issue.confirmations && issue.confirmations.length > 0 && (
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: '#2e7d32', fontWeight: 'bold' }}>👍 {issue.confirmations.length} Confirmations</p>
                )}
                
                {issue.aiIssueType && (
                  <div style={{ marginTop: '8px', padding: '4px 6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🤖</span> 
                    <strong>AI:</strong> 
                    {issue.problemDetected ? <span style={{ color: '#16a34a' }}>{issue.aiConfidence}% Confident</span> : <span style={{ color: '#dc2626' }}>No Issue</span>}
                  </div>
                )}
                
                <div style={{ marginTop: '10px' }}>
                  <Link to={`/issues/${issue._id}`} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '8px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>View Details</Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default IssueMap;
