/**
 * Study Session entity - represents a study session
 */
export interface StudySession {
  id: number;
  startedAt: string;
  completedAt: string | null;
  score: number;
  totalCards: number;
  deckId?: number;  // Not returned by API
}
