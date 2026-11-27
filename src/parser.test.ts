import { describe, expect, it } from "vitest";
import { parseCardLine, parseCards, parseCsv, toCsv } from "./parser";

describe("parseCards", () => {
  it("splits on a tab, a comma, or a spaced hyphen", () => {
    const text = "France\tParis\nSpain, Madrid\nNorway - Oslo\n";
    expect(parseCards(text)).toEqual({
      cards: [
        { front: "France", back: "Paris" },
        { front: "Spain", back: "Madrid" },
        { front: "Norway", back: "Oslo" },
      ],
      skipped: 0,
    });
  });

  it("prefers a spaced hyphen over a comma, and a tab over both", () => {
    expect(parseCardLine("Washington, D.C. - United States")).toEqual({
      front: "Washington, D.C.",
      back: "United States",
    });
    expect(parseCardLine("a, b\tc")).toEqual({ front: "a, b", back: "c" });
  });

  it("keeps extra separators on the back of the card", () => {
    expect(parseCardLine("A - B - C")).toEqual({ front: "A", back: "B - C" });
  });

  it("skips blank lines quietly and counts lines that are not cards", () => {
    const result = parseCards("\nFrance - Paris\njust one side\n  \n,\n");
    expect(result.cards).toEqual([{ front: "France", back: "Paris" }]);
    expect(result.skipped).toBe(2);
  });
});

describe("csv", () => {
  it("skips a front/back header and ignores a byte order mark", () => {
    expect(parseCsv("\uFEFFFront,Back\nFrance,Paris\n")).toEqual([
      { front: "France", back: "Paris" },
    ]);
  });

  it("reads rows that were not given a header", () => {
    expect(parseCsv("France,Paris\r\nSpain,Madrid\r\n")).toEqual([
      { front: "France", back: "Paris" },
      { front: "Spain", back: "Madrid" },
    ]);
  });

  it("round-trips quotes, commas, and line breaks", () => {
    const cards = [
      { front: "Washington, D.C.", back: "United States" },
      { front: 'Say "hello"', back: "line\nbreak" },
    ];
    expect(parseCsv(toCsv(cards))).toEqual(cards);
  });

  it("drops rows that are missing a side", () => {
    expect(parseCsv("front,back\nOnly front,\n,Only back\nA,B\n")).toEqual([
      { front: "A", back: "B" },
    ]);
  });
});
