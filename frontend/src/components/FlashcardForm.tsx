import React, { useState } from 'react';
import { CreateFlashcardRequest } from '../types';
import MarkdownEditor from './MarkdownEditor';
import './FlashcardForm.css';

interface FlashcardFormProps {
  onSubmit: (flashcard: CreateFlashcardRequest) => void;
  onCancel: () => void;
  initialData?: CreateFlashcardRequest;
  isLoading?: boolean;
}

const FlashcardForm: React.FC<FlashcardFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateFlashcardRequest>(
    initialData || {
      frontContent: '',
      backContent: '',
    }
  );

  const [errors, setErrors] = useState<{ frontContent?: string; backContent?: string }>({});

  const handleQuestionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      frontContent: value,
    }));
    // Clear error when user starts typing
    if (errors.frontContent) {
      setErrors((prev) => ({
        ...prev,
        frontContent: undefined,
      }));
    }
  };

  const handleAnswerChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      backContent: value,
    }));
    // Clear error when user starts typing
    if (errors.backContent) {
      setErrors((prev) => ({
        ...prev,
        backContent: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { frontContent?: string; backContent?: string } = {};

    if (!formData.frontContent.trim()) {
      newErrors.frontContent = 'Question is required';
    } else if (formData.frontContent.trim().length < 3) {
      newErrors.frontContent = 'Question must be at least 3 characters';
    }

    if (!formData.backContent.trim()) {
      newErrors.backContent = 'Answer is required';
    } else if (formData.backContent.trim().length < 1) {
      newErrors.backContent = 'Answer cannot be empty';
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
    <form onSubmit={handleSubmit} className="flashcard-form">
      <MarkdownEditor
        label="Question (Front) *"
        value={formData.frontContent}
        onChange={handleQuestionChange}
        placeholder="Enter the question or prompt... (Markdown supported)"
        error={errors.frontContent}
        disabled={isLoading}
        rows={5}
      />

      <MarkdownEditor
        label="Answer (Back) *"
        value={formData.backContent}
        onChange={handleAnswerChange}
        placeholder="Enter the answer... (Markdown supported)"
        error={errors.backContent}
        disabled={isLoading}
        rows={5}
      />

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
          {isLoading ? 'Adding...' : 'Add Flashcard'}
        </button>
      </div>
    </form>
  );
};

export default FlashcardForm;
