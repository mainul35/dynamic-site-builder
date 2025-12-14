import React, { useState } from 'react';
import { CreateDeckRequest } from '../types';
import './QuizForm.css';

interface QuizFormProps {
  onSubmit: (quiz: CreateDeckRequest) => void;
  onCancel: () => void;
  initialData?: CreateDeckRequest;
  isLoading?: boolean;
}

const QuizForm: React.FC<QuizFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateDeckRequest>(
    initialData || {
      title: '',
      description: '',
      displayOrder: 0,
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
      newErrors.title = 'Quiz title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Quiz title must be at least 3 characters';
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
    <form onSubmit={handleSubmit} className="quiz-form">
      <div className="form-group">
        <label htmlFor="title">Quiz Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          className={`form-control ${errors.title ? 'error' : ''}`}
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Module 1 Quiz"
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
          placeholder="Describe what this quiz covers..."
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
          {isLoading ? 'Creating...' : 'Create Quiz'}
        </button>
      </div>
    </form>
  );
};

export default QuizForm;
