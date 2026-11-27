import { describe, expect, it } from "vitest";
import { addDays, daysBetween } from "./dates";

describe("dates", () => {
  it("steps across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("counts whole days, including across a daylight-saving change", () => {
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
    expect(daysBetween("2026-11-01", "2026-11-01")).toBe(0);
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
  });
});
