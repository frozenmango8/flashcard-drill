import { addDays } from "./dates";
import type { Deck } from "./types";

export interface DayCount {
  date: string;
  count: number;
}

export function reviewHistory(deck: Deck, today: string, days = 30): DayCount[] {
  const counts = new Map<string, number>();
  for (const review of deck.reviews) {
    counts.set(review.date, (counts.get(review.date) ?? 0) + 1);
  }

  const history: DayCount[] = [];
  for (let ago = days - 1; ago >= 0; ago--) {
    const date = addDays(today, -ago);
    history.push({ date, count: counts.get(date) ?? 0 });
  }
  return history;
}

/** Share of reviews in the window that were not Again. Null when there are none. */
export function retention(deck: Deck, today: string, days = 30): number | null {
  const start = addDays(today, -(days - 1));
  const recent = deck.reviews.filter(
    (review) => review.date >= start && review.date <= today,
  );
  if (recent.length === 0) return null;
  const remembered = recent.filter((review) => review.grade !== "again").length;
  return remembered / recent.length;
}
