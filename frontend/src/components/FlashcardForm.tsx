import React, { useState } from 'react';
import { CreateFlashcardRequest, QuestionType } from '../types';
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
      questionType: 'multiple_choice',
      answerOptions: '',
      correctAnswer: '',
      correctAnswerExplanation: '',
    }
  );

  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [selectedCorrectOptions, setSelectedCorrectOptions] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<{
    frontContent?: string;
    backContent?: string;
    correctAnswerExplanation?: string;
  }>({});

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

  const handleQuestionTypeChange = (type: QuestionType) => {
    setFormData((prev) => ({
      ...prev,
      questionType: type,
      answerOptions: '',
      correctAnswer: '',
    }));
    setOptions(['', '', '', '']);
    setSelectedCorrectOptions(new Set());
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleToggleCorrectOption = (index: number) => {
    const newSelected = new Set(selectedCorrectOptions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCorrectOptions(newSelected);
  };

  const validate = (): boolean => {
    const newErrors: {
      frontContent?: string;
      backContent?: string;
      correctAnswerExplanation?: string;
    } = {};

    if (!formData.frontContent.trim()) {
      newErrors.frontContent = 'Question is required';
    } else if (formData.frontContent.trim().length < 3) {
      newErrors.frontContent = 'Question must be at least 3 characters';
    }

    if (!formData.backContent.trim()) {
      newErrors.backContent = 'Explanation/Answer is required';
    }

    if (formData.questionType === 'true_false' && !formData.correctAnswerExplanation?.trim()) {
      newErrors.correctAnswerExplanation = 'Correct answer explanation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submissionData: CreateFlashcardRequest = {
      ...formData,
    };

    if (formData.questionType === 'multiple_choice') {
      const validOptions = options.filter(opt => opt.trim() !== '');
      submissionData.answerOptions = JSON.stringify(validOptions);
      submissionData.correctAnswer = JSON.stringify(Array.from(selectedCorrectOptions).sort());
    } else if (formData.questionType === 'true_false') {
      submissionData.answerOptions = JSON.stringify(['True / Yes', 'False / No']);
      // correctAnswer is already set from the radio button
    }

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="flashcard-form">
      <div className="form-group">
        <label>Question Type *</label>
        <select
          className="form-select"
          value={formData.questionType}
          onChange={(e) => handleQuestionTypeChange(e.target.value as QuestionType)}
          disabled={isLoading}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True/False</option>
        </select>
      </div>

      <MarkdownEditor
        label="Question *"
        value={formData.frontContent}
        onChange={handleQuestionChange}
        placeholder="Enter the question... (Markdown supported)"
        error={errors.frontContent}
        disabled={isLoading}
        rows={5}
      />

      <MarkdownEditor
        label="Explanation/Answer *"
        value={formData.backContent}
        onChange={handleAnswerChange}
        placeholder="Enter the explanation or answer details... (Markdown supported)"
        error={errors.backContent}
        disabled={isLoading}
        rows={5}
      />

      {formData.questionType === 'multiple_choice' && (
        <div className="form-group">
          <label>Answer Options *</label>
          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="option-item">
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  disabled={isLoading}
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCorrectOptions.has(index)}
                    onChange={() => handleToggleCorrectOption(index)}
                    disabled={isLoading || !option.trim()}
                  />
                  <span>Correct</span>
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setOptions([...options, ''])}
            disabled={isLoading}
          >
            + Add Option
          </button>
        </div>
      )}

      {formData.questionType === 'true_false' && (
        <>
          <div className="form-group">
            <label>Correct Answer *</label>
            <div className="true-false-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="correctAnswer"
                  value="true"
                  checked={formData.correctAnswer === 'true'}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  disabled={isLoading}
                />
                <span>✓ True / Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="correctAnswer"
                  value="false"
                  checked={formData.correctAnswer === 'false'}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  disabled={isLoading}
                />
                <span>✗ False / No</span>
              </label>
            </div>
          </div>

          <MarkdownEditor
            label="Correct Answer Explanation *"
            value={formData.correctAnswerExplanation || ''}
            onChange={(value) => {
              setFormData({ ...formData, correctAnswerExplanation: value });
              if (errors.correctAnswerExplanation) {
                setErrors((prev) => ({ ...prev, correctAnswerExplanation: undefined }));
              }
            }}
            placeholder="Enter the explanation for the correct answer (shown when student answers incorrectly)..."
            error={errors.correctAnswerExplanation}
            disabled={isLoading}
            rows={5}
          />
        </>
      )}

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
