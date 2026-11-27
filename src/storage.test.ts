import { describe, expect, it } from "vitest";
import { normalizeState, parseBackup } from "./storage";

describe("normalizeState", () => {
  it("rejects anything that is not a version 1 backup", () => {
    expect(normalizeState(null)).toBeNull();
    expect(normalizeState({ version: 2, decks: [] })).toBeNull();
    expect(parseBackup("{")).toBeNull();
  });

  it("keeps an empty deck list", () => {
    expect(normalizeState({ version: 1, decks: [] })).toEqual({
      version: 1,
      decks: [],
    });
  });

  it("repairs numbers and drops cards and reviews that cannot be shown", () => {
    const state = normalizeState({
      version: 1,
      decks: [
        {
          id: "deck_1",
          name: "  Nouns  ",
          newPerDay: 9999,
          cards: [
            {
              id: "card_1",
              front: "A",
              back: "B",
              ease: 0.2,
              interval: 3.2,
              repetitions: 1,
              due: "2026-01-01",
              introduced: null,
            },
            { id: "card_1", front: "Dup", back: "Still kept" },
            { front: "no id", back: "kept too" },
            { id: "blank", front: "   ", back: "x" },
          ],
          reviews: [
            { cardId: "card_1", grade: "good", date: "2026-01-01" },
            { cardId: "card_1", grade: "nope", date: "2026-01-01" },
            { cardId: "card_1", grade: "hard", date: "yesterday" },
          ],
        },
        null,
      ],
    });

    expect(state?.decks).toHaveLength(1);
    const deck = state?.decks[0];
    expect(deck?.name).toBe("Nouns");
    expect(deck?.newPerDay).toBe(500);
    expect(deck?.cards.map((card) => card.front)).toEqual(["A", "Dup", "no id"]);
    expect(deck?.cards[0].ease).toBe(1.3);
    expect(deck?.cards[0].interval).toBe(3);
    expect(deck?.cards[1].id).not.toBe("card_1");
    expect(deck?.reviews).toEqual([
      { cardId: "card_1", grade: "good", date: "2026-01-01" },
    ]);
  });
});
