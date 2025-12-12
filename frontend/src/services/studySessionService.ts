import api from './api';
import { StudySession } from '../types';

export const studySessionService = {
  // Start a new study session
  startStudySession: async (deckId: number, totalCards: number): Promise<StudySession> => {
    const response = await api.post<StudySession>('/study/sessions', {
      deckId,
      totalCards,
    });
    return response.data;
  },

  // Complete a study session with final score
  completeStudySession: async (sessionId: number, score: number): Promise<StudySession> => {
    const response = await api.put<StudySession>(`/study/sessions/${sessionId}`, {
      score,
    });
    return response.data;
  },

  // Get a specific study session
  getStudySessionById: async (sessionId: number): Promise<StudySession> => {
    const response = await api.get<StudySession>(`/study/sessions/${sessionId}`);
    return response.data;
  },

  // Get all study sessions (history)
  getAllStudySessions: async (): Promise<StudySession[]> => {
    const response = await api.get<StudySession[]>('/study/sessions');
    return response.data;
  },

  // Get study sessions for a specific deck
  getStudySessionsByDeck: async (deckId: number): Promise<StudySession[]> => {
    const response = await api.get<StudySession[]>(`/study/sessions/deck/${deckId}`);
    return response.data;
  },
};
