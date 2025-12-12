import api from './api';
import { Deck, CreateDeckRequest } from '../types';

export const deckService = {
  // Get all decks
  getAllDecks: async (): Promise<Deck[]> => {
    const response = await api.get<Deck[]>('/decks');
    return response.data;
  },

  // Get a single deck by ID
  getDeckById: async (id: number): Promise<Deck> => {
    const response = await api.get<Deck>(`/decks/${id}`);
    return response.data;
  },

  // Create a new deck
  createDeck: async (deck: CreateDeckRequest): Promise<Deck> => {
    const response = await api.post<Deck>('/decks', deck);
    return response.data;
  },

  // Update a deck
  updateDeck: async (id: number, deck: CreateDeckRequest): Promise<Deck> => {
    const response = await api.put<Deck>(`/decks/${id}`, deck);
    return response.data;
  },

  // Delete a deck
  deleteDeck: async (id: number): Promise<void> => {
    await api.delete(`/decks/${id}`);
  },
};
