import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { courseService } from '../services/courseService';
import { moduleService } from '../services/moduleService';
import { lessonService } from '../services/lessonService';
import { quizService } from '../services/quizService';
import {
  Course,
  Module,
  Lesson,
  CreateLessonRequest,
  Deck,
  CreateDeckRequest,
  ModuleContentItem,
} from '../types';
import ModuleContentCard from '../components/ModuleContentCard';
import LessonForm from '../components/LessonForm';
import QuizForm from '../components/QuizForm';
import './ModuleDetailPage.css';

// Wrapper component for sortable items
interface SortableItemProps {
  item: ModuleContentItem;
  courseId: number;
  moduleId: number;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  courseId,
  moduleId,
  expandedId,
  onToggleExpand,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners}>
        <ModuleContentCard
          item={item}
          courseId={courseId}
          moduleId={moduleId}
          isExpanded={expandedId === item.id}
          onToggleExpand={onToggleExpand}
          onDelete={onDelete}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
};

const ModuleDetailPage: React.FC = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [contentItems, setContentItems] = useState<ModuleContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedContentId, setExpandedContentId] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (courseId && moduleId) {
      loadData();
    }
  }, [courseId, moduleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [courseData, moduleData, lessonsData, quizzesData] = await Promise.all([
        courseService.getCourseById(parseInt(courseId!)),
        moduleService.getModuleById(parseInt(courseId!), parseInt(moduleId!)),
        lessonService.getLessonsByModuleId(parseInt(courseId!), parseInt(moduleId!)),
        quizService.getQuizzesByModuleId(parseInt(courseId!), parseInt(moduleId!)),
      ]);

      setCourse(courseData);
      setModule(moduleData);

      // Combine lessons and quizzes into unified content items
      const lessons = Array.isArray(lessonsData) ? lessonsData : [];
      const quizzes = Array.isArray(quizzesData) ? quizzesData : [];

      console.log('Loaded lessons:', lessons.map(l => ({ id: l.id, title: l.title, displayOrder: l.displayOrder })));
      console.log('Loaded quizzes:', quizzes.map(q => ({ id: q.id, title: q.title, displayOrder: q.displayOrder })));

      const combined: ModuleContentItem[] = [
        ...lessons.map((lesson) => ({
          id: `lesson-${lesson.id}`,
          type: 'lesson' as const,
          title: lesson.title,
          description: lesson.description,
          displayOrder: lesson.displayOrder ?? 0,
          data: lesson,
        })),
        ...quizzes.map((quiz) => ({
          id: `quiz-${quiz.id}`,
          type: 'quiz' as const,
          title: quiz.title,
          description: quiz.description,
          displayOrder: quiz.displayOrder ?? 0,
          data: quiz,
        })),
      ];

      // Sort by display order, then by type and id for stability
      combined.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        // If same displayOrder, sort by type then id for stability
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.id.localeCompare(b.id);
      });

      console.log('Combined and sorted items:', combined.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        displayOrder: item.displayOrder
      })));

      setContentItems(combined);
    } catch (err) {
      setError('Failed to load module details. Please try again.');
      console.error('Error loading module:', err);
      setContentItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (contentId: string) => {
    setExpandedContentId((prev) => (prev === contentId ? null : contentId));
  };

  const handleCreateLesson = async (lessonData: CreateLessonRequest) => {
    try {
      setIsCreating(true);
      setError(null);

      // Calculate the next display order
      const nextOrder = contentItems.length;

      const newLesson = await lessonService.createLesson(
        parseInt(courseId!),
        parseInt(moduleId!),
        { ...lessonData, displayOrder: nextOrder }
      );

      const newContentItem: ModuleContentItem = {
        id: `lesson-${newLesson.id}`,
        type: 'lesson',
        title: newLesson.title,
        description: newLesson.description,
        displayOrder: newLesson.displayOrder ?? nextOrder,
        data: newLesson,
      };

      setContentItems((prev) => [...prev, newContentItem]);
      setShowLessonForm(false);
    } catch (err) {
      setError('Failed to create lesson. Please try again.');
      console.error('Error creating lesson:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateQuiz = async (quizData: CreateDeckRequest) => {
    try {
      setIsCreating(true);
      setError(null);

      // Calculate the next display order
      const nextOrder = contentItems.length;

      const newQuiz = await quizService.createQuiz(
        parseInt(courseId!),
        parseInt(moduleId!),
        { ...quizData, displayOrder: nextOrder }
      );

      const newContentItem: ModuleContentItem = {
        id: `quiz-${newQuiz.id}`,
        type: 'quiz',
        title: newQuiz.title,
        description: newQuiz.description,
        displayOrder: newQuiz.displayOrder ?? nextOrder,
        data: newQuiz,
      };

      setContentItems((prev) => [...prev, newContentItem]);
      setShowQuizForm(false);
    } catch (err) {
      setError('Failed to create quiz. Please try again.');
      console.error('Error creating quiz:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    try {
      const item = contentItems.find((c) => c.id === contentId);
      if (!item) return;

      if (item.type === 'lesson') {
        const lesson = item.data as Lesson;
        await lessonService.deleteLesson(parseInt(courseId!), parseInt(moduleId!), lesson.id!);
      } else {
        const quiz = item.data as Deck;
        await quizService.deleteQuiz(quiz.id!);
      }

      setContentItems((prev) => prev.filter((c) => c.id !== contentId));
      if (expandedContentId === contentId) {
        setExpandedContentId(null);
      }
    } catch (err) {
      setError(`Failed to delete ${contentItems.find((c) => c.id === contentId)?.type}. Please try again.`);
      console.error('Error deleting content:', err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = contentItems.findIndex((item) => item.id === active.id);
    const newIndex = contentItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const newItems = arrayMove(contentItems, oldIndex, newIndex);

    console.log('After arrayMove:', newItems.map(item => ({
      id: item.id,
      type: item.type,
      oldOrder: item.displayOrder
    })));

    // Update display order for all items (both wrapper and nested data)
    const updatedItems = newItems.map((item, index) => {
      // Create a new data object with updated displayOrder
      const updatedData = item.type === 'lesson'
        ? { ...(item.data as Lesson), displayOrder: index }
        : { ...(item.data as Deck), displayOrder: index };

      if (item.type === 'quiz') {
        console.log(`Creating updated quiz data for ${item.id}:`, {
          originalId: (item.data as Deck).id,
          originalOrder: (item.data as Deck).displayOrder,
          newId: updatedData.id,
          newOrder: updatedData.displayOrder,
          index
        });
      }

      return {
        ...item,
        displayOrder: index,
        data: updatedData,
      };
    });

    console.log('After updating displayOrder:', updatedItems.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      newOrder: item.displayOrder,
      dataOrder: item.data.displayOrder
    })));

    setContentItems(updatedItems);

    // Log the state after setting (use setTimeout to let React update)
    setTimeout(() => {
      console.log('State after update (via setTimeout):', contentItems.map(item => ({
        id: item.id,
        type: item.type,
        displayOrder: item.displayOrder
      })));
    }, 100);

    // Update backend
    try {
      await updateBackendOrdering(updatedItems);
    } catch (err) {
      setError('Failed to update ordering. Please refresh the page.');
      console.error('Error updating ordering:', err);
      // Reload data to get correct state
      loadData();
    }
  };

  const updateBackendOrdering = async (items: ModuleContentItem[]) => {
    console.log('Updating backend ordering:', items.map(item => ({
      id: item.id,
      type: item.type,
      displayOrder: item.displayOrder
    })));

    const updatePromises = items.map(async (item) => {
      try {
        if (item.type === 'lesson') {
          const lesson = item.data as Lesson;
          console.log(`Updating lesson ${lesson.id} order to ${item.displayOrder}`);
          const result = await lessonService.updateLessonOrder(
            parseInt(courseId!),
            parseInt(moduleId!),
            lesson.id!,
            item.displayOrder
          );
          console.log(`Lesson ${lesson.id} update result:`, result);
          return result;
        } else {
          const quiz = item.data as Deck;
          console.log(`Updating quiz ${quiz.id} (type: ${typeof quiz.id}) order to ${item.displayOrder} (type: ${typeof item.displayOrder})`);
          const result = await quizService.updateQuizOrder(quiz.id!, item.displayOrder);
          console.log(`Quiz ${quiz.id} update result:`, result);
          return result;
        }
      } catch (error) {
        console.error(`Error updating ${item.type} ${item.id}:`, error);
        throw error;
      }
    });

    const results = await Promise.all(updatePromises);
    console.log('Backend ordering updated successfully. Total updates:', results.length);
    return results;
  };

  if (loading) {
    return (
      <div className="module-detail-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!module || !course) {
    return (
      <div className="module-detail-page">
        <div className="error-state">
          <h2>Module not found</h2>
          <Link to={courseId ? `/courses/${courseId}` : '/courses'} className="btn btn-primary">
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="module-detail-page">
      {error && (
        <div className="error-banner">
          {error}
          <button
            className="btn-close"
            onClick={() => setError(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      <div className="module-detail-header">
        <div className="breadcrumb">
          <Link to="/courses">Courses</Link>
          <span className="separator">›</span>
          <Link to={`/courses/${courseId}`}>{course.title}</Link>
          <span className="separator">›</span>
          <span>{module.title}</span>
        </div>

        <div className="module-info">
          <h1>{module.title}</h1>
          <p className="module-description">{module.description}</p>
          <div className="module-meta">
            <span className="meta-item">
              📚 {contentItems.length} {contentItems.length === 1 ? 'Item' : 'Items'}
            </span>
            <span className="meta-item">Order: {module.displayOrder || 0}</span>
          </div>
        </div>

        <div className="module-actions">
          <Link to={`/courses/${courseId}`} className="btn btn-secondary">
            ← Back to Modules
          </Link>
        </div>
      </div>

      <div className="content-section">
        <div className="content-header">
          <h2>Content</h2>
          <div className="content-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowLessonForm(true);
                setShowQuizForm(false);
              }}
            >
              + Add Lesson
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowQuizForm(true);
                setShowLessonForm(false);
              }}
            >
              + Add Quiz
            </button>
          </div>
        </div>

        {showLessonForm && (
          <div className="create-form-section">
            <h3>Create New Lesson</h3>
            <LessonForm
              onSubmit={handleCreateLesson}
              onCancel={() => setShowLessonForm(false)}
              isLoading={isCreating}
            />
          </div>
        )}

        {showQuizForm && (
          <div className="create-form-section">
            <h3>Create New Quiz</h3>
            <QuizForm
              onSubmit={handleCreateQuiz}
              onCancel={() => setShowQuizForm(false)}
              isLoading={isCreating}
            />
          </div>
        )}

        {!showLessonForm && !showQuizForm && contentItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No content yet</h3>
            <p>Start adding lessons and quizzes to this module</p>
          </div>
        ) : !showLessonForm && !showQuizForm ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={contentItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="content-list">
                {contentItems.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    courseId={parseInt(courseId!)}
                    moduleId={parseInt(moduleId!)}
                    expandedId={expandedContentId}
                    onToggleExpand={handleToggleExpand}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : null}
      </div>
    </div>
  );
};

export default ModuleDetailPage;
