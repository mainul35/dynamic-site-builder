import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { moduleService } from '../services/moduleService';
import { Course, Module, CreateModuleRequest } from '../types';
import ModuleForm from '../components/ModuleForm';
import './CourseDetailPage.css';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseAndModules();
    }
  }, [courseId]);

  const loadCourseAndModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const [courseData, modulesData] = await Promise.all([
        courseService.getCourseById(parseInt(courseId!)),
        moduleService.getModulesByCourseId(parseInt(courseId!))
      ]);
      setCourse(courseData);
      setModules(modulesData);
    } catch (err) {
      setError('Failed to load course details. Please try again.');
      console.error('Error loading course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (moduleData: CreateModuleRequest) => {
    try {
      setIsCreating(true);
      setError(null);
      const newModule = await moduleService.createModule(parseInt(courseId!), moduleData);
      setModules((prev) => [...prev, newModule]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to create module. Please try again.');
      console.error('Error creating module:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!window.confirm('Are you sure you want to delete this module? This will also delete all lessons within it.')) {
      return;
    }

    try {
      await moduleService.deleteModule(parseInt(courseId!), moduleId);
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    } catch (err) {
      setError('Failed to delete module. Please try again.');
      console.error('Error deleting module:', err);
    }
  };

  if (loading) {
    return (
      <div className="course-detail-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <div className="error-state">
          <h2>Course not found</h2>
          <Link to="/courses" className="btn btn-primary">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
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

      <div className="course-detail-header">
        <div className="breadcrumb">
          <Link to="/courses">Courses</Link>
          <span className="separator">›</span>
          <span>{course.title}</span>
        </div>

        <div className="course-info">
          <h1>{course.title}</h1>
          <p className="course-description">{course.description}</p>
          <div className="course-meta">
            <span className="meta-item">
              📚 {modules.length} {modules.length === 1 ? 'Module' : 'Modules'}
            </span>
            <span className="meta-item">Order: {course.displayOrder || 0}</span>
          </div>
        </div>
      </div>

      <div className="modules-section">
        {!showForm ? (
          <>
            <div className="modules-header">
              <h2>Modules</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                + Create Module
              </button>
            </div>
          </>
        ) : (
          <div className="create-module-section">
            <h3>Create New Module</h3>
            <ModuleForm
              onSubmit={handleCreateModule}
              onCancel={() => setShowForm(false)}
              isLoading={isCreating}
            />
          </div>
        )}

        {!showForm && modules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>No modules yet</h3>
            <p>Start building your course by adding modules</p>
          </div>
        ) : !showForm ? (
          <div className="modules-grid">
            {modules.map((module) => (
              <div key={module.id} className="module-card">
                <div className="module-card-header">
                  <h3>{module.title}</h3>
                  <span className="module-order">Order: {module.displayOrder || 0}</span>
                </div>
                <p className="module-description">{module.description}</p>
                <div className="module-card-actions">
                  <Link
                    to={`/courses/${courseId}/modules/${module.id}`}
                    className="btn btn-primary"
                  >
                    View Lessons →
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteModule(module.id!)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CourseDetailPage;
