import { Flashcard } from "./Flashcard";

/**
 * Deck entity - represents a collection of flashcards
 */
export interface Deck {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  flashcards?: Flashcard[];  // Optional, loaded with 'with-cards' endpoint
}