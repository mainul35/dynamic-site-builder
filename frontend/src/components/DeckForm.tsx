import React, { useState } from 'react';
import { CreateDeckRequest } from '../types';

interface DeckFormProps {
  onSubmit: (deck: CreateDeckRequest) => void;
  onCancel: () => void;
  initialData?: CreateDeckRequest;
  isLoading?: boolean;
}

const DeckForm: React.FC<DeckFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateDeckRequest>(
    initialData || {
      title: '',
      description: '',
    }
  );

  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="deck-form">
      <div className="form-group">
        <label htmlFor="title">Deck Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          className={`form-control ${errors.title ? 'error' : ''}`}
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Spanish Vocabulary"
          disabled={isLoading}
        />
        {errors.title && <div className="error-message">{errors.title}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          className={`form-control ${errors.description ? 'error' : ''}`}
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe what this deck is about..."
          rows={4}
          disabled={isLoading}
        />
        {errors.description && (
          <div className="error-message">{errors.description}</div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Deck'}
        </button>
      </div>
    </form>
  );
};

export default DeckForm;
