import api from './api';
import { Flashcard, CreateFlashcardRequest } from '../types';

export const flashcardService = {
  // Get all flashcards for a deck
  getFlashcardsByDeckId: async (deckId: number): Promise<Flashcard[]> => {
    const response = await api.get<Flashcard[]>(`/decks/${deckId}/cards`);
    return response.data;
  },

  // Get a single flashcard by ID
  getFlashcardById: async (flashcardId: number): Promise<Flashcard> => {
    const response = await api.get<Flashcard>(`/cards/${flashcardId}`);
    return response.data;
  },

  // Create a new flashcard in a deck
  createFlashcard: async (deckId: number, flashcard: CreateFlashcardRequest): Promise<Flashcard> => {
    const response = await api.post<Flashcard>(`/decks/${deckId}/cards`, flashcard);
    return response.data;
  },

  // Update a flashcard
  updateFlashcard: async (
    flashcardId: number,
    flashcard: CreateFlashcardRequest
  ): Promise<Flashcard> => {
    const response = await api.put<Flashcard>(
      `/cards/${flashcardId}`,
      flashcard
    );
    return response.data;
  },

  // Delete a flashcard
  deleteFlashcard: async (flashcardId: number): Promise<void> => {
    await api.delete(`/cards/${flashcardId}`);
  },
};
