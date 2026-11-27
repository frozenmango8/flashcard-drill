import { makeCard } from "./model";
import type { Deck } from "./types";

const CAPITALS: [string, string][] = [
  ["Argentina", "Buenos Aires"],
  ["Australia", "Canberra"],
  ["Austria", "Vienna"],
  ["Belgium", "Brussels"],
  ["Brazil", "Brasília"],
  ["Canada", "Ottawa"],
  ["Chile", "Santiago"],
  ["China", "Beijing"],
  ["Czechia", "Prague"],
  ["Denmark", "Copenhagen"],
  ["Egypt", "Cairo"],
  ["Finland", "Helsinki"],
  ["France", "Paris"],
  ["Germany", "Berlin"],
  ["Greece", "Athens"],
  ["Hungary", "Budapest"],
  ["Iceland", "Reykjavik"],
  ["Ireland", "Dublin"],
  ["Italy", "Rome"],
  ["Japan", "Tokyo"],
  ["Kenya", "Nairobi"],
  ["Mexico", "Mexico City"],
  ["Morocco", "Rabat"],
  ["Netherlands", "Amsterdam"],
  ["New Zealand", "Wellington"],
  ["Norway", "Oslo"],
  ["Poland", "Warsaw"],
  ["Portugal", "Lisbon"],
  ["South Korea", "Seoul"],
  ["Spain", "Madrid"],
  ["Sweden", "Stockholm"],
  ["Switzerland", "Bern"],
  ["Thailand", "Bangkok"],
  ["United Kingdom", "London"],
];

export function sampleDeck(): Deck {
  return {
    id: crypto.randomUUID(),
    name: "World capitals",
    newPerDay: 20,
    reviews: [],
    cards: CAPITALS.map(([front, back]) => makeCard(front, back)),
  };
}
