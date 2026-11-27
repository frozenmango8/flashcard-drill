import { describe, expect, it } from "vitest";
import { freshSchedule, schedule } from "./scheduler";

describe("schedule", () => {
  it("starts at ease 2.5 with no interval", () => {
    expect(freshSchedule()).toEqual({ ease: 2.5, interval: 0, repetitions: 0 });
  });

  it("follows SM-2 across a streak of Good reviews", () => {
    const first = schedule(freshSchedule(), "good");
    expect(first).toEqual({ ease: 2.5, interval: 1, repetitions: 1 });

    const second = schedule(first, "good");
    expect(second).toEqual({ ease: 2.5, interval: 6, repetitions: 2 });

    const third = schedule(second, "good");
    expect(third).toEqual({ ease: 2.5, interval: 15, repetitions: 3 });
  });

  it("uses the previous ease when picking an Easy interval", () => {
    const card = { ease: 2.2, interval: 10, repetitions: 3 };
    const next = schedule(card, "easy");
    expect(next.interval).toBe(29);
    expect(next.repetitions).toBe(4);
    expect(next.ease).toBeCloseTo(2.3, 5);
  });

  it("lowers ease on Hard without using that new ease for the interval", () => {
    const card = { ease: 2.5, interval: 6, repetitions: 2 };
    const next = schedule(card, "hard");
    expect(next.interval).toBe(7);
    expect(next.repetitions).toBe(3);
    expect(next.ease).toBeCloseTo(2.36, 5);
  });

  it("separates Hard, Good, and Easy on the second review", () => {
    const once = schedule(freshSchedule(), "good");
    expect(schedule(once, "hard").interval).toBe(4);
    expect(schedule(once, "good").interval).toBe(6);
    expect(schedule(once, "easy").interval).toBe(8);
  });

  it("gives the first Easy review a 4 day interval and a higher ease", () => {
    const next = schedule(freshSchedule(), "easy");
    expect(next).toMatchObject({ interval: 4, repetitions: 1 });
    expect(next.ease).toBeCloseTo(2.6, 5);
  });

  it("resets a forgotten card and starts the steps over", () => {
    const lapsed = schedule(
      { ease: 2.5, interval: 15, repetitions: 3 },
      "again",
    );
    expect(lapsed.repetitions).toBe(0);
    expect(lapsed.interval).toBe(1);
    expect(lapsed.ease).toBeCloseTo(1.7, 5);

    const recovered = schedule(lapsed, "good");
    expect(recovered.interval).toBe(1);
    expect(recovered.repetitions).toBe(1);
  });

  it("does not let ease fall below 1.3", () => {
    const next = schedule({ ease: 1.3, interval: 10, repetitions: 4 }, "again");
    expect(next.ease).toBe(1.3);
  });
});
