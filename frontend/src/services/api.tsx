import axios from 'axios';
import {
  Deck,
  Flashcard,
  StudySession,
  DeckStatistics,
  CreateDeckRequest,
  CreateFlashcardRequest,
  StartSessionRequest,
  CompleteSessionRequest,
} from '../types';

/**
 * Base API URL
 * In development: Vite proxy forwards /api to http://localhost:8080/api
 * In production: Served by Spring Boot, same origin
 */
const API_BASE_URL = '/api';

/**
 * Axios instance with default configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Deck API Service
 */
export const deckService = {
  /**
   * Get all decks
   */
  getAllDecks: async (): Promise<Deck[]> => {
    const response = await api.get<Deck[]>('/decks');
    return response.data;
  },

  /**
   * Get a single deck by ID
   */
  getDeckById: async (id: number): Promise<Deck> => {
    const response = await api.get<Deck>(`/decks/${id}`);
    return response.data;
  },

  /**
   * Get deck with all flashcards loaded
   */
  getDeckWithCards: async (id: number): Promise<Deck> => {
    const response = await api.get<Deck>(`/decks/${id}/with-cards`);
    return response.data;
  },

  /**
   * Create a new deck
   */
  createDeck: async (deck: CreateDeckRequest): Promise<Deck> => {
    const response = await api.post<Deck>('/decks', deck);
    return response.data;
  },

  /**
   * Update an existing deck
   */
  updateDeck: async (id: number, deck: CreateDeckRequest): Promise<Deck> => {
    const response = await api.put<Deck>(`/decks/${id}`, deck);
    return response.data;
  },

  /**
   * Delete a deck
   */
  deleteDeck: async (id: number): Promise<void> => {
    await api.delete(`/decks/${id}`);
  },

  /**
   * Search decks by title
   */
  searchDecks: async (keyword: string): Promise<Deck[]> => {
    const response = await api.get<Deck[]>(`/decks/search`, {
      params: { keyword },
    });
    return response.data;
  },

  /**
   * Get flashcard count for a deck
   */
  getCardCount: async (id: number): Promise<number> => {
    const response = await api.get<number>(`/decks/${id}/card-count`);
    return response.data;
  },
};

/**
 * Flashcard API Service
 */
export const flashcardService = {
  /**
   * Get all flashcards for a deck
   */
  getFlashcardsByDeck: async (deckId: number): Promise<Flashcard[]> => {
    const response = await api.get<Flashcard[]>(`/decks/${deckId}/cards`);
    return response.data;
  },

  /**
   * Get a single flashcard by ID
   */
  getFlashcardById: async (id: number): Promise<Flashcard> => {
    const response = await api.get<Flashcard>(`/cards/${id}`);
    return response.data;
  },

  /**
   * Create a new flashcard in a deck
   */
  createFlashcard: async (
    deckId: number,
    flashcard: CreateFlashcardRequest
  ): Promise<Flashcard> => {
    const response = await api.post<Flashcard>(
      `/decks/${deckId}/cards`,
      flashcard
    );
    return response.data;
  },

  /**
   * Update an existing flashcard
   */
  updateFlashcard: async (
    id: number,
    flashcard: CreateFlashcardRequest
  ): Promise<Flashcard> => {
    const response = await api.put<Flashcard>(`/cards/${id}`, flashcard);
    return response.data;
  },

  /**
   * Delete a flashcard
   */
  deleteFlashcard: async (id: number): Promise<void> => {
    await api.delete(`/cards/${id}`);
  },

  /**
   * Search flashcards within a deck
   */
  searchFlashcards: async (
    deckId: number,
    keyword: string
  ): Promise<Flashcard[]> => {
    const response = await api.get<Flashcard[]>(
      `/decks/${deckId}/cards/search`,
      {
        params: { keyword },
      }
    );
    return response.data;
  },
};

/**
 * Study Session API Service
 */
export const studySessionService = {
  /**
   * Start a new study session
   */
  startSession: async (
    request: StartSessionRequest
  ): Promise<StudySession> => {
    const response = await api.post<StudySession>('/study/sessions', request);
    return response.data;
  },

  /**
   * Complete a study session with final score
   */
  completeSession: async (
    sessionId: number,
    request: CompleteSessionRequest
  ): Promise<StudySession> => {
    const response = await api.put<StudySession>(
      `/study/sessions/${sessionId}`,
      request
    );
    return response.data;
  },

  /**
   * Get a study session by ID
   */
  getSessionById: async (id: number): Promise<StudySession> => {
    const response = await api.get<StudySession>(`/study/sessions/${id}`);
    return response.data;
  },

  /**
   * Get all completed study sessions
   */
  getAllSessions: async (): Promise<StudySession[]> => {
    const response = await api.get<StudySession[]>('/study/sessions');
    return response.data;
  },

  /**
   * Get recent completed sessions
   */
  getRecentSessions: async (): Promise<StudySession[]> => {
    const response = await api.get<StudySession[]>('/study/sessions/recent');
    return response.data;
  },

  /**
   * Get all study sessions for a deck
   */
  getDeckSessions: async (deckId: number): Promise<StudySession[]> => {
    const response = await api.get<StudySession[]>(
      `/study/decks/${deckId}/sessions`
    );
    return response.data;
  },

  /**
   * Get study statistics for a deck
   */
  getDeckStatistics: async (deckId: number): Promise<DeckStatistics> => {
    const response = await api.get<DeckStatistics>(
      `/study/decks/${deckId}/statistics`
    );
    return response.data;
  },
};

/**
 * Export default api instance for custom requests
 */
export default api;