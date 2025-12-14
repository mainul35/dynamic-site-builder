import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { Course, CreateCourseRequest } from '../types';
import CourseForm from '../components/CourseForm';
import './CourseListPage.css';

const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses. Please try again.');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadCourses();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await courseService.searchCourses(searchKeyword);
      setCourses(data);
    } catch (err) {
      setError('Failed to search courses. Please try again.');
      console.error('Error searching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (courseData: CreateCourseRequest) => {
    try {
      setIsCreating(true);
      setError(null);
      const newCourse = await courseService.createCourse(courseData);
      setCourses((prev) => [...prev, newCourse]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to create course. Please try again.');
      console.error('Error creating course:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this course? This will also delete all modules and lessons within it.')) {
      return;
    }

    try {
      await courseService.deleteCourse(id);
      setCourses((prev) => prev.filter((course) => course.id !== id));
    } catch (err) {
      setError('Failed to delete course. Please try again.');
      console.error('Error deleting course:', err);
    }
  };

  if (loading) {
    return (
      <div className="course-list-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-list-page">
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

      {!showForm ? (
        <>
          <div className="course-list-header">
            <h1>All Courses</h1>
            <div className="header-actions">
              <div className="search-box">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search courses..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn btn-secondary" onClick={handleSearch}>
                  Search
                </button>
                {searchKeyword && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchKeyword('');
                      loadCourses();
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                + Create Course
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="create-course-section">
          <h2>Create New Course</h2>
          <CourseForm
            onSubmit={handleCreateCourse}
            onCancel={() => setShowForm(false)}
            isLoading={isCreating}
          />
        </div>
      )}

      {!showForm && courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No courses found</h3>
          <p>{searchKeyword ? 'Try a different search term' : 'Start by creating your first course'}</p>
        </div>
      ) : !showForm ? (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-card-header">
                <h3>{course.title}</h3>
                <span className="course-order">Order: {course.displayOrder || 0}</span>
              </div>
              <p className="course-description">{course.description}</p>
              <div className="course-card-actions">
                <Link
                  to={`/courses/${course.id}`}
                  className="btn btn-primary"
                >
                  View Modules →
                </Link>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteCourse(course.id!)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default CourseListPage;
