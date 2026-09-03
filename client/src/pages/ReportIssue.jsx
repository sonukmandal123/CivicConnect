import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './ReportIssue.css';

const ReportIssue = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Basic protection: if not logged in, redirect to login
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleImageChange = (e) => {
    setError('');
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.match('image/jpeg|image/png|image/webp')) {
        setError('Only JPEG, PNG, and WebP images are allowed.');
        setImage(null);
        setImagePreview(null);
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB.');
        setImage(null);
        setImagePreview(null);
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!title || !description || !category || !severity || !image) {
      return setError('Please fill in all fields and upload an image.');
    }

    setLoading(true);

    try {
      // Use FormData to send file along with text fields
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('severity', severity);
      formData.append('image', image);

      await api.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Issue reported successfully!');
      
      // Redirect to dashboard after a short delay so user can see success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-container">
      <div className="report-card">
        <h2>Report a Civic Issue</h2>
        <p className="report-subtitle">Help us improve the community by reporting problems.</p>
        
        {error && <div className="report-alert error">{error}</div>}
        {success && <div className="report-alert success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              placeholder="e.g. Large pothole near college gate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              rows="4" 
              placeholder="Describe the problem in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required 
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="" disabled>Select Category</option>
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

            <div className="form-group half">
              <label>Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} required>
                <option value="" disabled>Select Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Upload Image</label>
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              onChange={handleImageChange}
              required 
            />
            <small className="form-hint">Max file size: 5MB</small>
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Issue Preview" />
            </div>
          )}

          <button type="submit" className="report-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
