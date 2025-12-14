import React from 'react';
import { Link } from 'react-router-dom';
import { ModuleContentItem, Lesson, Deck } from '../types';
import './ModuleContentCard.css';

interface ModuleContentCardProps {
  item: ModuleContentItem;
  courseId: number;
  moduleId: number;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const ModuleContentCard: React.FC<ModuleContentCardProps> = ({
  item,
  courseId,
  moduleId,
  isExpanded = false,
  onToggleExpand,
  onDelete,
  isDragging = false,
  dragHandleProps,
}) => {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${item.type}?`)) {
      onDelete(item.id);
    }
  };

  const renderLessonContent = (lesson: Lesson) => {
    return (
      <div className="lesson-content-wrapper">
        <div className="lesson-info-section">
          <div className="lesson-type-badge">📖 Lesson</div>
          <h3>{lesson.title}</h3>
          <p className="lesson-description">{lesson.description}</p>
        </div>

        <div className="lesson-actions">
          <Link
            to={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
            className="view-lesson-btn btn-primary"
          >
            View Full Lesson →
          </Link>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onToggleExpand?.(item.id)}
          >
            {isExpanded ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>

        {isExpanded && (
          <div className="lesson-preview-content">
            <h4>Lesson Content Preview</h4>
            <div
              className="lesson-content-html"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderQuizContent = (quiz: Deck) => {
    return (
      <div className="quiz-content-wrapper">
        <div className="quiz-info-section">
          <div className="quiz-type-badge">❓ Quiz</div>
          <h3>{quiz.title}</h3>
          <p className="quiz-description">{quiz.description}</p>
        </div>

        <div className="quiz-actions">
          <Link
            to={`/courses/${courseId}/modules/${moduleId}/study/${quiz.id}`}
            className="view-quiz-btn btn-success"
          >
            Start Quiz →
          </Link>
          <Link
            to={`/courses/${courseId}/modules/${moduleId}/quizzes/${quiz.id}`}
            className="btn btn-secondary btn-sm"
          >
            Manage Cards
          </Link>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`module-content-card ${isDragging ? 'dragging' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <div className="content-order-indicator">
        <span className="order-number">{item.displayOrder + 1}</span>
        <div className="drag-handle" title="Drag to reorder" {...dragHandleProps}>
          ⋮⋮
        </div>
      </div>

      <div className="content-body">
        {item.type === 'lesson'
          ? renderLessonContent(item.data as Lesson)
          : renderQuizContent(item.data as Deck)
        }
      </div>
    </div>
  );
};

export default ModuleContentCard;
