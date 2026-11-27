import type { ParseResult } from "./parser";

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function formatInterval(days: number): string {
  return plural(days, "day");
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function describeParse(result: ParseResult): string {
  const cards = plural(result.cards.length, "card");
  if (result.skipped === 0) return cards;
  return `${cards}, ${plural(result.skipped, "line")} skipped`;
}

export function fileSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "deck";
}
