import api from './api';
import { Course, CreateCourseRequest } from '../types';

export const courseService = {
  // Get all courses
  getAllCourses: async (): Promise<Course[]> => {
    const response = await api.get<Course[]>('/courses');
    return response.data;
  },

  // Get a single course by ID
  getCourseById: async (id: number): Promise<Course> => {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data;
  },

  // Get course with modules
  getCourseWithModules: async (id: number): Promise<Course> => {
    const response = await api.get<Course>(`/courses/${id}/with-modules`);
    return response.data;
  },

  // Get course with modules and lessons
  getCourseWithModulesAndLessons: async (id: number): Promise<Course> => {
    const response = await api.get<Course>(`/courses/${id}/with-modules-and-lessons`);
    return response.data;
  },

  // Create a new course
  createCourse: async (course: CreateCourseRequest): Promise<Course> => {
    const response = await api.post<Course>('/courses', course);
    return response.data;
  },

  // Update a course
  updateCourse: async (id: number, course: CreateCourseRequest): Promise<Course> => {
    const response = await api.put<Course>(`/courses/${id}`, course);
    return response.data;
  },

  // Delete a course
  deleteCourse: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  // Search courses by keyword
  searchCourses: async (keyword: string): Promise<Course[]> => {
    const response = await api.get<Course[]>('/courses/search', {
      params: { keyword }
    });
    return response.data;
  },
};
