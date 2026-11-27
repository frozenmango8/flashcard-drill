import type { Grade } from "./types";

export interface Schedule {
  ease: number;
  interval: number;
  repetitions: number;
}

const QUALITY: Record<Grade, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export const STARTING_EASE = 2.5;

export function freshSchedule(): Schedule {
  return { ease: STARTING_EASE, interval: 0, repetitions: 0 };
}

/**
 * SM-2, with Hard and Easy pulled off the Good path so the four grades
 * are not the same button.
 *
 * Ease uses the SuperMemo formula. Again, Hard, Good, and Easy are
 * qualities 0, 3, 4, and 5, and ease never drops below 1.3. The interval
 * is chosen from the ease before this review.
 *
 * A passing grade advances the repetition count. Again resets it and
 * sets the interval to 1 day. Good follows SM-2: 1 day, then 6, then
 * interval * ease. The first Easy review is 4 days. After that, Hard
 * grows by 1.2 and Easy by ease * 1.3. The second review is fixed:
 * 4 days for Hard, 6 for Good, 8 for Easy.
 */
export function schedule(current: Schedule, grade: Grade): Schedule {
  const quality = QUALITY[grade];
  let ease =
    current.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  if (grade === "again") {
    return { ease, interval: 1, repetitions: 0 };
  }

  return {
    ease,
    interval: nextInterval(current, grade),
    repetitions: current.repetitions + 1,
  };
}

function nextInterval(current: Schedule, grade: Exclude<Grade, "again">): number {
  if (current.repetitions <= 0) {
    return grade === "easy" ? 4 : 1;
  }

  if (current.repetitions === 1) {
    if (grade === "hard") return 4;
    if (grade === "easy") return 8;
    return 6;
  }

  if (grade === "hard") {
    return Math.max(current.interval + 1, Math.round(current.interval * 1.2));
  }

  const factor = grade === "easy" ? current.ease * 1.3 : current.ease;
  return Math.max(1, Math.round(current.interval * factor));
}
