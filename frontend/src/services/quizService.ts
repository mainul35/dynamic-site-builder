import api from './api';
import { Deck, CreateDeckRequest } from '../types';

export const quizService = {
  /**
   * Get all quizzes for a specific module
   */
  getQuizzesByModuleId: async (courseId: number, moduleId: number): Promise<Deck[]> => {
    const response = await api.get<Deck[]>(`/decks/courses/${courseId}/modules/${moduleId}/quizzes`);
    return response.data;
  },

  /**
   * Create a quiz for a module
   */
  createQuiz: async (courseId: number, moduleId: number, quiz: CreateDeckRequest): Promise<Deck> => {
    const response = await api.post<Deck>(`/decks/courses/${courseId}/modules/${moduleId}/quizzes`, quiz);
    return response.data;
  },

  /**
   * Get a quiz by ID (uses existing deck endpoint)
   */
  getQuizById: async (id: number): Promise<Deck> => {
    const response = await api.get<Deck>(`/decks/${id}`);
    return response.data;
  },

  /**
   * Update a quiz
   */
  updateQuiz: async (id: number, quiz: CreateDeckRequest): Promise<Deck> => {
    const response = await api.put<Deck>(`/decks/${id}`, quiz);
    return response.data;
  },

  /**
   * Delete a quiz
   */
  deleteQuiz: async (id: number): Promise<void> => {
    await api.delete(`/decks/${id}`);
  },

  /**
   * Update quiz display order
   */
  updateQuizOrder: async (id: number, displayOrder: number): Promise<Deck> => {
    const response = await api.patch<Deck>(`/decks/${id}/order`, displayOrder, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },
};
