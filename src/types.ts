export type Grade = "again" | "hard" | "good" | "easy";

export interface Card {
  id: string;
  front: string;
  back: string;
  ease: number;
  interval: number;
  repetitions: number;
  /** YYYY-MM-DD. Empty while the card has never been reviewed. */
  due: string;
  /** The day a new card was first graded, or null if it is still new. */
  introduced: string | null;
}

export interface ReviewEvent {
  cardId: string;
  grade: Grade;
  date: string;
}

export interface Deck {
  id: string;
  name: string;
  newPerDay: number;
  cards: Card[];
  reviews: ReviewEvent[];
}

export interface State {
  version: 1;
  decks: Deck[];
}
