import { applyGrade } from "./queue";
import { freshSchedule } from "./scheduler";
import type { Card, Deck, Grade } from "./types";

export const DEFAULT_NEW_PER_DAY = 20;
export const MAX_NEW_PER_DAY = 500;
export const MAX_REVIEWS = 4000;

export function clampNewPerDay(value: unknown): number {
  const number = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(number)) return DEFAULT_NEW_PER_DAY;
  return Math.min(MAX_NEW_PER_DAY, Math.max(0, Math.round(number)));
}

export function makeCard(front: string, back: string): Card {
  const blank = freshSchedule();
  return {
    id: crypto.randomUUID(),
    front,
    back,
    ease: blank.ease,
    interval: blank.interval,
    repetitions: blank.repetitions,
    due: "",
    introduced: null,
  };
}

export function makeDeck(name: string, pairs: { front: string; back: string }[]): Deck {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Untitled",
    newPerDay: DEFAULT_NEW_PER_DAY,
    cards: pairs.map((pair) => makeCard(pair.front, pair.back)),
    reviews: [],
  };
}

export function reviewCard(deck: Deck, cardId: string, grade: Grade, today: string): void {
  const index = deck.cards.findIndex((card) => card.id === cardId);
  if (index === -1) return;
  deck.cards[index] = applyGrade(deck.cards[index], grade, today);
  deck.reviews.push({ cardId, grade, date: today });
  if (deck.reviews.length > MAX_REVIEWS) {
    deck.reviews.splice(0, deck.reviews.length - MAX_REVIEWS);
  }
}
