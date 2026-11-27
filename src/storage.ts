import { STARTING_EASE } from "./scheduler";
import { clampNewPerDay, MAX_REVIEWS } from "./model";
import { sampleDeck } from "./sample";
import type { Card, Deck, Grade, ReviewEvent, State } from "./types";

export const STORAGE_KEY = "flashcard-drill";
export const THEME_KEY = "flashcard-drill-theme";

const GRADES = new Set<Grade>(["again", "hard", "good", "easy"]);

export type ThemeChoice = "light" | "dark" | "system";

export interface LoadResult {
  state: State;
  corrupt: boolean;
  fresh: boolean;
}

export function seedState(): State {
  return { version: 1, decks: [sampleDeck()] };
}

export function loadState(): LoadResult {
  const empty: State = { version: 1, decks: [] };
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { state: seedState(), corrupt: false, fresh: true };
  }
  if (raw === null) return { state: seedState(), corrupt: false, fresh: true };
  const state = parseBackup(raw);
  if (!state) return { state: empty, corrupt: true, fresh: false };
  return { state, corrupt: false, fresh: false };
}

export function saveState(state: State): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    return "system";
  }
  return "system";
}

export function saveTheme(theme: ThemeChoice): void {
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be blocked. The choice still applies for this visit.
  }
}

export function serializeBackup(state: State): string {
  return `${JSON.stringify(state, null, 2)}\n`;
}

export function parseBackup(text: string): State | null {
  try {
    return normalizeState(JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}

export function normalizeState(value: unknown): State | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.decks)) {
    return null;
  }
  const seen = new Set<string>();
  const decks: Deck[] = [];
  for (const entry of value.decks) {
    const deck = normalizeDeck(entry, seen);
    if (deck) decks.push(deck);
  }
  return { version: 1, decks };
}

function normalizeDeck(value: unknown, deckIds: Set<string>): Deck | null {
  if (!isRecord(value)) return null;
  const id = uniqueId(value.id, deckIds);
  const name =
    typeof value.name === "string" && value.name.trim() ? value.name.trim() : "Untitled";
  const cardIds = new Set<string>();
  const cards = Array.isArray(value.cards)
    ? value.cards.flatMap((entry) => {
        const card = normalizeCard(entry, cardIds);
        return card ? [card] : [];
      })
    : [];
  const reviews = Array.isArray(value.reviews)
    ? value.reviews.flatMap((entry) => {
        const review = normalizeReview(entry);
        return review ? [review] : [];
      }).slice(-MAX_REVIEWS)
    : [];
  return {
    id,
    name,
    newPerDay: clampNewPerDay(value.newPerDay),
    cards,
    reviews,
  };
}

function normalizeCard(value: unknown, seen: Set<string>): Card | null {
  if (!isRecord(value)) return null;
  const front = typeof value.front === "string" ? value.front : "";
  const back = typeof value.back === "string" ? value.back : "";
  if (!front.trim() || !back.trim()) return null;

  const interval = nonNegative(value.interval);
  const repetitions = nonNegative(value.repetitions);
  const introduced = dateString(value.introduced);
  return {
    id: uniqueId(value.id, seen),
    front,
    back,
    ease: Math.max(1.3, finite(value.ease, STARTING_EASE)),
    interval,
    repetitions,
    due: dateString(value.due) ?? "",
    introduced,
  };
}

function normalizeReview(value: unknown): ReviewEvent | null {
  if (!isRecord(value)) return null;
  if (typeof value.cardId !== "string" || value.cardId === "") return null;
  if (typeof value.grade !== "string" || !GRADES.has(value.grade as Grade)) return null;
  const date = dateString(value.date);
  if (!date) return null;
  return { cardId: value.cardId, grade: value.grade as Grade, date };
}

function uniqueId(value: unknown, seen: Set<string>): string {
  if (typeof value === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value) && !seen.has(value)) {
    seen.add(value);
    return value;
  }
  let id = crypto.randomUUID();
  while (seen.has(id)) id = crypto.randomUUID();
  seen.add(id);
  return id;
}

function nonNegative(value: unknown): number {
  const number = finite(value, 0);
  return Math.max(0, Math.round(number));
}

function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function dateString(value: unknown): string | null {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
