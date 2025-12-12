export interface Deck {
  id?: number;
  title: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Flashcard {
  id?: number;
  frontContent: string;
  backContent: string;
  deckId?: number;
  createdAt?: string;
  updatedAt?: string;
  // Aliases for backward compatibility
  question?: string;
  answer?: string;
}

export interface StudySession {
  id?: number;
  deckId: number;
  score: number;
  totalCards: number;
  completedAt?: string;
  createdAt?: string;
}

export interface CreateDeckRequest {
  title: string;
  description: string;
}

export interface CreateFlashcardRequest {
  frontContent: string;
  backContent: string;
}
