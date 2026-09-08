import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_MAP_CENTER = [22.8046, 86.2029]; // Center point as per prompt
const DEFAULT_MAP_ZOOM = 13;

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const LocationPicker = ({ latitude, longitude, onLocationSelect }) => {
  const [position, setPosition] = useState(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    if (position) {
      onLocationSelect(position.lat, position.lng);
    }
  }, [position, onLocationSelect]);

  const handleUseCurrentLocation = () => {
    setLocating(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        setPosition(newPos);
        setLocating(false);
        if (mapRef.current) {
          mapRef.current.flyTo(newPos, 15);
        }
      },
      (err) => {
        setLocationError('Unable to retrieve your location. Please ensure location permissions are granted.');
        setLocating(false);
      }
    );
  };

  return (
    <div className="location-picker">
      <div className="location-picker-controls" style={{ marginBottom: '10px' }}>
        <button 
          type="button" 
          onClick={handleUseCurrentLocation} 
          disabled={locating}
          className="report-btn"
          style={{ width: 'auto', padding: '8px 16px', marginBottom: '10px' }}
        >
          {locating ? 'Getting your location...' : 'Use My Current Location'}
        </button>
        {locationError && <div className="report-alert error" style={{ fontSize: '0.9em', padding: '8px' }}>{locationError}</div>}
      </div>
      
      <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
        <MapContainer 
          center={position || DEFAULT_MAP_CENTER} 
          zoom={DEFAULT_MAP_ZOOM} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
      
      {position && (
        <div className="selected-location-info" style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
          <strong>Location selected:</strong><br />
          Latitude: {position.lat.toFixed(4)}<br />
          Longitude: {position.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
