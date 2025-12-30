import React, { useState, useEffect } from 'react';
import { ModalBase, ModalSection, ModalField, ModalActions, ModalButton } from './ModalBase';
import { useAuthStore, UserProfile } from '../../stores/authStore';
import './ProfileModal.css';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ProfileModal - User profile editing modal
 */
export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    avatarUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        avatarUrl: user.avatarUrl || '',
      });
      setErrors({});
      setSuccessMessage('');
    }
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSuccessMessage('');

    try {
      // TODO: Replace with actual API call
      if (user) {
        const updatedUser: UserProfile = {
          ...user,
          fullName: formData.fullName,
          email: formData.email,
          avatarUrl: formData.avatarUrl || undefined,
        };
        setUser(updatedUser);
      }

      setSuccessMessage('Profile updated successfully');
      setTimeout(() => onClose(), 1000);
    } catch {
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  const footer = (
    <ModalActions>
      <ModalButton variant="secondary" onClick={onClose} disabled={isSaving}>
        Cancel
      </ModalButton>
      <ModalButton variant="primary" onClick={handleSave} loading={isSaving}>
        Save Changes
      </ModalButton>
    </ModalActions>
  );

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Edit Profile" size="medium" footer={footer}>
      <div className="profile-avatar-section">
        <div className="profile-avatar">
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="Profile" />
          ) : (
            <span className="profile-avatar-initials">
              {getInitials(formData.fullName || user.username)}
            </span>
          )}
        </div>
        <div className="profile-avatar-info">
          <span className="profile-username">@{user.username}</span>
          <span className="profile-roles">
            {user.roles.map((role) => (
              <span key={role} className="profile-role-badge">{role}</span>
            ))}
          </span>
        </div>
      </div>

      {successMessage && <div className="modal-alert modal-alert-success">{successMessage}</div>}
      {errors.submit && <div className="modal-alert modal-alert-error">{errors.submit}</div>}

      <ModalSection title="Personal Information">
        <ModalField label="Full Name" htmlFor="fullName" required error={errors.fullName}>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Enter your full name"
          />
        </ModalField>

        <ModalField label="Email Address" htmlFor="email" required error={errors.email}>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your email"
          />
        </ModalField>

        <ModalField label="Avatar URL" htmlFor="avatarUrl" hint="Optional profile picture URL">
          <input
            id="avatarUrl"
            type="url"
            value={formData.avatarUrl}
            onChange={(e) => handleChange('avatarUrl', e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
        </ModalField>
      </ModalSection>

      <ModalSection title="Account Information">
        <div className="profile-info-row">
          <span className="profile-info-label">Username</span>
          <span className="profile-info-value">@{user.username}</span>
        </div>
        <div className="profile-info-row">
          <span className="profile-info-label">User ID</span>
          <span className="profile-info-value">#{user.id}</span>
        </div>
      </ModalSection>
    </ModalBase>
  );
};

export default ProfileModal;
