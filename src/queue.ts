import { addDays, daysBetween } from "./dates";
import { schedule } from "./scheduler";
import type { Card, Deck, Grade } from "./types";

export function isNew(card: Card): boolean {
  return card.repetitions === 0 && card.interval === 0;
}

export function dueCards(deck: Deck, today: string): Card[] {
  return deck.cards
    .filter((card) => !isNew(card) && card.due !== "" && card.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
}

export function newCardAllowance(deck: Deck, today: string): number {
  const introduced = deck.cards.filter((card) => card.introduced === today).length;
  return Math.max(0, deck.newPerDay - introduced);
}

export function studyQueue(deck: Deck, today: string): Card[] {
  const fresh = deck.cards.filter(isNew).slice(0, newCardAllowance(deck, today));
  return [...dueCards(deck, today), ...fresh];
}

export function applyGrade(card: Card, grade: Grade, today: string): Card {
  const learning = isNew(card);
  const next = schedule(card, grade);
  return {
    ...card,
    ease: next.ease,
    interval: next.interval,
    repetitions: next.repetitions,
    // A lapse stays due today so Again means "now", not "come back tomorrow".
    due: grade === "again" ? today : addDays(today, next.interval),
    introduced: learning ? today : card.introduced,
  };
}

export function nextDueDate(deck: Deck, today: string): string | null {
  const upcoming = deck.cards
    .filter((card) => !isNew(card) && card.due > today)
    .map((card) => card.due)
    .sort();
  return upcoming[0] ?? null;
}

export function waitingNewCards(deck: Deck): number {
  return deck.cards.filter(isNew).length;
}

export function cardStatus(card: Card, today: string): string {
  if (isNew(card) || card.due === "") return "new";
  if (card.due <= today) {
    const late = daysBetween(card.due, today);
    if (late <= 0) return "due";
    return late === 1 ? "1 day overdue" : `${late} days overdue`;
  }
  const ahead = daysBetween(today, card.due);
  return ahead === 1 ? "in 1 day" : `in ${ahead} days`;
}
