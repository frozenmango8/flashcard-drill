import { formatDay } from "../dates";
import { el } from "../dom";
import { formatInterval, plural } from "../format";
import { reviewCard } from "../model";
import { isNew, nextDueDate, studyQueue, waitingNewCards } from "../queue";
import { deckHref } from "../routes";
import { schedule } from "../scheduler";
import type { Screen, View } from "../screen";
import type { Card, Deck, Grade } from "../types";

interface Session {
  deckId: string;
  ids: string[];
  reviewed: number;
}

let session: Session | null = null;

const GRADES: { grade: Grade; label: string; key: string }[] = [
  { grade: "again", label: "Again", key: "1" },
  { grade: "hard", label: "Hard", key: "2" },
  { grade: "good", label: "Good", key: "3" },
  { grade: "easy", label: "Easy", key: "4" },
];

export function beginSession(deck: Deck, today: string): void {
  session = {
    deckId: deck.id,
    ids: studyQueue(deck, today).map((card) => card.id),
    reviewed: 0,
  };
}

export function clearSession(): void {
  session = null;
}

function activeSession(deck: Deck, today: string): Session {
  if (!session || session.deckId !== deck.id) beginSession(deck, today);
  const current = session ?? { deckId: deck.id, ids: [], reviewed: 0 };
  current.ids = current.ids.filter((id) => deck.cards.some((card) => card.id === id));
  session = current;
  return current;
}

export function renderStudy(screen: Screen, deck: Deck): View {
  const current = activeSession(deck, screen.today);
  const card = deck.cards.find((item) => item.id === current.ids[0]);
  if (!card) return finished(deck, screen.today, current.reviewed);

  let flipped = false;
  const prompt = el("button", { type: "button", class: "prompt", id: "prompt" });
  const kicker = el("span", { class: "kicker" }, "Front");
  const face = el("span", { class: "face in" }, card.front);
  prompt.append(kicker, face);

  const hint = el("p", { class: "hint", id: "flip-hint" }, "Space or click to flip.");
  const live = el("p", { class: "sr-only", "aria-live": "polite" });
  const grades = gradeButtons(card);
  grades.hidden = true;

  // Again comes back after a couple of cards, and stays due today if you leave.
  let settled = false;
  const commit = (grade: Grade) => {
    if (settled) return;
    settled = true;
    reviewCard(deck, card.id, grade, screen.today);
    current.ids.shift();
    if (grade === "again") {
      const at = Math.min(2, current.ids.length);
      current.ids.splice(at, 0, card.id);
    }
    current.reviewed += 1;
    screen.rerender();
  };

  const reveal = () => {
    if (flipped) return;
    flipped = true;
    kicker.textContent = "Back";
    face.textContent = card.back;
    face.classList.remove("in");
    void face.offsetWidth;
    face.classList.add("in");
    hint.hidden = true;
    grades.hidden = false;
    prompt.classList.add("revealed");
    live.textContent = `Back. ${card.back}`;
  };

  prompt.onclick = () => reveal();

  const onKey = (event: KeyboardEvent) => {
    if (event.repeat || typing(event.target)) return;
    if (event.key === "Escape") {
      event.preventDefault();
      location.hash = deckHref(deck.id);
      return;
    }

    const selected = GRADES.find((item) => item.key === event.key);
    if (selected) {
      if (!flipped) return;
      event.preventDefault();
      commit(selected.grade);
      return;
    }

    if (event.key !== " " && event.key !== "Enter") return;
    const target = event.target;
    const onCard = target === prompt;
    const onPage = target === document.body || target === document.getElementById("main");
    if (!onCard && !onPage) return;
    if (!flipped) {
      event.preventDefault();
      reveal();
    } else if (event.key === " ") {
      event.preventDefault();
    }
  };

  document.addEventListener("keydown", onKey);
  for (const button of grades.querySelectorAll("button")) {
    const grade = button.dataset.grade as Grade | undefined;
    if (!grade) continue;
    button.addEventListener("click", () => commit(grade));
  }

  const node = el(
    "div",
    null,
    el("p", { class: "crumb" }, el("a", { href: deckHref(deck.id) }, "Back to the deck")),
    el("h1", null, deck.name),
    el(
      "p",
      { class: "progress" },
      el("span", null, `${current.ids.length} left`),
      el("span", null, isNew(card) ? "New" : "Review"),
    ),
    prompt,
    hint,
    grades,
    live,
  );

  return {
    title: `${deck.name} · Flashcard Drill`,
    node,
    cleanup: () => document.removeEventListener("keydown", onKey),
    focus: () => prompt.focus(),
  };
}

function gradeButtons(card: Card): HTMLElement {
  const row = el("div", { class: "grade-row" });
  for (const item of GRADES) {
    const when = item.grade === "again" ? "now" : formatInterval(schedule(card, item.grade).interval);
    const button = el(
      "button",
      {
        type: "button",
        class: `grade grade-${item.grade}`,
        "aria-keyshortcuts": item.key,
        "data-grade": item.grade,
      },
      el("span", { class: "grade-name" }, item.label),
      el("span", { class: "grade-when" }, when),
    );
    row.append(button);
  }
  return el(
    "div",
    { class: "grades", role: "group", "aria-label": "Grade" },
    row,
    el("p", { class: "hint" }, "Keys 1-4. Escape leaves the session."),
  );
}

function finished(deck: Deck, today: string, reviewed: number): View {
  const lines: HTMLElement[] = [];
  if (deck.cards.length === 0) {
    lines.push(el("p", { class: "lead" }, "This deck has no cards yet."));
  } else if (reviewed > 0) {
    lines.push(el("p", { class: "lead" }, `Session complete. ${plural(reviewed, "review")}.`));
  } else {
    lines.push(el("p", { class: "lead" }, "Nothing is due today."));
  }

  const fresh = waitingNewCards(deck);
  if (fresh > 0) {
    lines.push(
      el(
        "p",
        null,
        `${plural(fresh, "new card")} still in the deck. The daily limit is ${deck.newPerDay}.`,
      ),
    );
  }
  const upcoming = nextDueDate(deck, today);
  if (upcoming) lines.push(el("p", null, `Next review is ${formatDay(upcoming)}.`));

  const back = el("a", { class: "button", href: deckHref(deck.id) }, "Back to the deck");
  return {
    title: `${deck.name} · Flashcard Drill`,
    node: el(
      "div",
      null,
      el("p", { class: "crumb" }, el("a", { href: deckHref(deck.id) }, "Back to the deck")),
      el("h1", null, deck.name),
      ...lines,
      el("div", { class: "row" }, back),
    ),
  };
}

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}
