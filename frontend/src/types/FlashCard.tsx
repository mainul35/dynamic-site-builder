/**
 * Flashcard entity - represents a single card with question/answer
 */
export interface Flashcard {
  id: number;
  frontContent: string;
  backContent: string;
  createdAt: string;
  deckId?: number;  // Not returned by API (JsonIgnore on backend)
}