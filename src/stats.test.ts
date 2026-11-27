import { describe, expect, it } from "vitest";
import { retention, reviewHistory } from "./stats";
import type { Deck } from "./types";

function deck(reviews: Deck["reviews"]): Deck {
  return { id: "d", name: "Test", newPerDay: 20, cards: [], reviews };
}

describe("stats", () => {
  it("counts remembered reviews over the last 30 days", () => {
    const today = "2026-04-30";
    const sample = deck([
      { cardId: "a", grade: "good", date: "2026-04-30" },
      { cardId: "a", grade: "again", date: "2026-04-29" },
      { cardId: "a", grade: "easy", date: "2026-04-02" },
      { cardId: "a", grade: "good", date: "2026-03-01" },
    ]);

    expect(retention(sample, today)).toBeCloseTo(2 / 3, 5);
    expect(retention(deck([]), today)).toBeNull();

    const history = reviewHistory(sample, today);
    expect(history).toHaveLength(30);
    expect(history.at(-1)).toEqual({ date: today, count: 1 });
    expect(history[0].date).toBe("2026-04-01");
    expect(history.find((day) => day.date === "2026-04-02")?.count).toBe(1);
  });
});
