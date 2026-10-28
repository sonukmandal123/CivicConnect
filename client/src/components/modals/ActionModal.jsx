import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ActionModal.css';

const DEPARTMENTS = [
  'Road Maintenance',
  'Electrical',
  'Sanitation',
  'Drainage',
  'Water',
  'Public Facilities',
  'Other'
];

const ActionModal = ({
  isOpen,
  onClose,
  actionType, // 'review', 'verify', 'reject', 'assign', 'in-progress', 'resolve', 'remark', 'duplicate'
  issue,
  onSuccess
}) => {
  const [remark, setRemark] = useState('');
  const [department, setDepartment] = useState('Road Maintenance');
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [resolutionImage, setResolutionImage] = useState(null);
  const [duplicateOf, setDuplicateOf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form and errors when modal opens or actionType changes
  useEffect(() => {
    if (isOpen) {
      setRemark('');
      setDepartment('Road Maintenance');
      setResolutionDescription('');
      setResolutionImage(null);
      setDuplicateOf('');
      setError('');
      setLoading(false);
    }
  }, [isOpen, actionType, issue]);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (actionType === 'review' || actionType === 'under-review') {
        res = await api.patch(`/admin/issues/${issue._id}/status`, {
          status: 'Under Review',
          remark: remark.trim() || 'Moved to Under Review by administrator'
        });
      } else if (actionType === 'verify') {
        res = await api.patch(`/admin/issues/${issue._id}/status`, {
          status: 'Verified',
          remark: remark.trim() || 'Verified by administrator'
        });
      } else if (actionType === 'reject') {
        if (!remark.trim()) {
          setError('Rejection reason is required.');
          setLoading(false);
          return;
        }
        res = await api.patch(`/admin/issues/${issue._id}/status`, {
          status: 'Rejected',
          remark: remark.trim()
        });
      } else if (actionType === 'assign') {
        res = await api.patch(`/admin/issues/${issue._id}/assign`, {
          department,
          remark: remark.trim()
        });
      } else if (actionType === 'in-progress') {
        res = await api.patch(`/admin/issues/${issue._id}/in-progress`, {
          remark: remark.trim()
        });
      } else if (actionType === 'resolve') {
        if (!resolutionDescription.trim()) {
          setError('Resolution description is required.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('resolutionDescription', resolutionDescription.trim());
        if (resolutionImage) {
          formData.append('image', resolutionImage);
        }

        res = await api.post(`/admin/issues/${issue._id}/resolve`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (actionType === 'remark') {
        if (!remark.trim()) {
          setError('Remark text is required.');
          setLoading(false);
          return;
        }
        res = await api.post(`/admin/issues/${issue._id}/remarks`, {
          text: remark.trim()
        });
      } else if (actionType === 'duplicate') {
        if (!duplicateOf.trim()) {
          setError('Target original issue ID is required.');
          setLoading(false);
          return;
        }
        res = await api.post(`/admin/issues/${issue._id}/duplicate`, {
          duplicateOf: duplicateOf.trim(),
          remark: remark.trim()
        });
      }

      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getModalConfig = () => {
    switch (actionType) {
      case 'review':
      case 'under-review':
        return {
          title: 'Move to Under Review',
          btnClass: 'modal-btn-primary',
          btnText: 'Move to Under Review'
        };
      case 'verify':
        return {
          title: 'Verify Civic Issue',
          btnClass: 'modal-btn-success',
          btnText: 'Confirm & Verify'
        };
      case 'reject':
        return {
          title: 'Reject Civic Issue',
          btnClass: 'modal-btn-danger',
          btnText: 'Confirm & Reject'
        };
      case 'assign':
        return {
          title: 'Assign to Department',
          btnClass: 'modal-btn-primary',
          btnText: 'Assign Issue'
        };
      case 'in-progress':
        return {
          title: 'Mark Work In Progress',
          btnClass: 'modal-btn-primary',
          btnText: 'Start Work'
        };
      case 'resolve':
        return {
          title: 'Complete & Resolve Issue',
          btnClass: 'modal-btn-success',
          btnText: 'Mark as Resolved'
        };
      case 'duplicate':
        return {
          title: 'Mark as Duplicate Report',
          btnClass: 'modal-btn-danger',
          btnText: 'Mark Duplicate'
        };
      case 'remark':
        return {
          title: 'Add Administrative Remark',
          btnClass: 'modal-btn-primary',
          btnText: 'Save Remark'
        };
      default:
        return {
          title: 'Action',
          btnClass: 'modal-btn-primary',
          btnText: 'Submit'
        };
    }
  };

  const config = getModalConfig();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{config.title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="modal-alert error">{error}</div>}

            <div className="modal-issue-context">
              <strong>Issue:</strong> {issue.title}
              <br />
              <small>Current Status: <strong>{issue.status}</strong></small>
            </div>

            {/* Department Selection */}
            {actionType === 'assign' && (
              <div className="modal-field">
                <label>Responsible Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Duplicate Issue ID */}
            {actionType === 'duplicate' && (
              <div className="modal-field">
                <label>Original Issue ID (24 hex characters) *</label>
                <input
                  type="text"
                  placeholder="e.g. 6a9ed8862796b002b79a1c08"
                  value={duplicateOf}
                  onChange={(e) => setDuplicateOf(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Resolution Fields */}
            {actionType === 'resolve' && (
              <>
                <div className="modal-field">
                  <label>Resolution Work Description *</label>
                  <textarea
                    rows="3"
                    placeholder="Describe how the problem was resolved (e.g., Pothole filled and road repaved)..."
                    value={resolutionDescription}
                    onChange={(e) => setResolutionDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>Resolution Proof Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={(e) => setResolutionImage(e.target.files[0])}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    Uploaded photo will be safely stored under civicconnect/resolutions
                  </small>
                </div>
              </>
            )}

            {/* General Remarks / Rejection Reason */}
            {actionType !== 'resolve' && (
              <div className="modal-field">
                <label>
                  {actionType === 'reject'
                    ? 'Rejection Reason *'
                    : 'Administrative Remark (Optional)'}
                </label>
                <textarea
                  rows="3"
                  placeholder={
                    actionType === 'reject'
                      ? 'Explain why this report is rejected (e.g. Private property, invalid duplicate)...'
                      : (actionType === 'review' || actionType === 'under-review')
                      ? 'Add an optional review note before taking administrative action...'
                      : 'Add an optional note to record in the audit timeline...'
                  }
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  required={actionType === 'reject' || actionType === 'remark'}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`modal-btn ${config.btnClass}`}
              disabled={loading}
            >
              {loading ? 'Processing...' : config.btnText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionModal;
