import { describe, expect, it } from "vitest";
import { applyGrade, studyQueue } from "./queue";
import type { Card, Deck } from "./types";

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: "c",
    front: "Q",
    back: "A",
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    due: "",
    introduced: null,
    ...overrides,
  };
}

function deck(cards: Card[], newPerDay = 20): Deck {
  return { id: "d", name: "Test", newPerDay, cards, reviews: [] };
}

describe("studyQueue", () => {
  it("reviews overdue cards before new ones, oldest first", () => {
    const today = "2026-04-02";
    const queued = studyQueue(
      deck([
        card({ id: "n1" }),
        card({ id: "later", interval: 3, repetitions: 2, due: "2026-04-01" }),
        card({ id: "older", interval: 3, repetitions: 2, due: "2026-03-01" }),
        card({ id: "future", interval: 3, repetitions: 2, due: "2026-05-01" }),
      ]),
      today,
    );
    expect(queued.map((item) => item.id)).toEqual(["older", "later", "n1"]);
  });

  it("stops introducing new cards once today's limit is used", () => {
    const today = "2026-04-01";
    const queued = studyQueue(
      deck(
        [
          card({
            id: "seen",
            interval: 1,
            repetitions: 1,
            due: "2026-04-02",
            introduced: today,
          }),
          card({ id: "due", interval: 1, repetitions: 1, due: today }),
          card({ id: "n1" }),
          card({ id: "n2" }),
        ],
        1,
      ),
      today,
    );
    expect(queued.map((item) => item.id)).toEqual(["due"]);
  });

  it("marks a new card as introduced and leaves that date alone later", () => {
    const introduced = applyGrade(card({ id: "n" }), "good", "2026-04-01");
    expect(introduced.introduced).toBe("2026-04-01");
    expect(introduced.due).toBe("2026-04-02");
    expect(introduced.interval).toBe(1);

    const lapsed = applyGrade(introduced, "again", "2026-04-02");
    expect(lapsed.introduced).toBe("2026-04-01");
    expect(lapsed.repetitions).toBe(0);
    expect(lapsed.due).toBe("2026-04-03");
  });
});
