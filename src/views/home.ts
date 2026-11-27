import { download, el } from "../dom";
import { plural } from "../format";
import { dueCards, newCardAllowance, waitingNewCards } from "../queue";
import { deckHref } from "../routes";
import { sampleDeck } from "../sample";
import type { Screen, View } from "../screen";
import { parseBackup, serializeBackup } from "../storage";
import type { Deck } from "../types";

let notice: string | null = null;

export function renderHome(screen: Screen): View {
  const message = notice;
  notice = null;

  const create = el("a", { class: "button primary", href: "#/new" }, "New deck");
  const head = el("div", { class: "page-head" }, el("h1", null, "Decks"), create);

  const node = el("div", null, head);
  if (message) node.append(el("p", { class: "alert", role: "alert" }, message));

  if (screen.state.decks.length === 0) {
    const sample = el("button", { type: "button" }, "Add the sample deck");
    sample.onclick = () => {
      screen.state.decks.push(sampleDeck());
      screen.rerender();
    };
    node.append(
      el("p", null, "No decks yet."),
      el("div", { class: "row" }, sample),
    );
  } else {
    const list = el("ul", { class: "decks" });
    for (const deck of screen.state.decks) {
      list.append(el("li", null, deckLink(deck, screen.today)));
    }
    node.append(list);
  }

  node.append(backupSection(screen));

  return { title: "Flashcard Drill", node };
}

function deckLink(deck: Deck, today: string): HTMLAnchorElement {
  return el(
    "a",
    { class: "deck-link", href: deckHref(deck.id) },
    el("span", { class: "deck-name" }, deck.name),
    el("span", { class: "deck-meta" }, summary(deck, today)),
  );
}

function summary(deck: Deck, today: string): string {
  const due = dueCards(deck, today).length;
  const fresh = Math.min(waitingNewCards(deck), newCardAllowance(deck, today));
  const parts: string[] = [];
  if (due > 0) parts.push(`${due} due`);
  if (fresh > 0) parts.push(`${fresh} new`);
  if (parts.length === 0) parts.push("Up to date");
  parts.push(plural(deck.cards.length, "card"));
  return parts.join(" · ");
}

function backupSection(screen: Screen): HTMLElement {
  const save = el("button", { type: "button" }, "Download backup");
  save.onclick = () => {
    download(
      `flashcard-drill-${screen.today}.json`,
      serializeBackup(screen.state),
      "application/json",
    );
  };

  const input = el("input", { type: "file", accept: "application/json,.json" });
  input.onchange = () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    void file.text().then(
      (text) => importBackup(screen, text),
      () => {
        notice = "Could not read that file.";
        screen.rerender();
      },
    );
  };

  return el(
    "section",
    null,
    el("h2", null, "Backup"),
    el(
      "p",
      { class: "hint" },
      "Download a JSON file of every deck, or replace them from a file you saved earlier.",
    ),
    el(
      "div",
      { class: "row" },
      save,
      el("label", { class: "file" }, "Import backup", input),
    ),
  );
}

function importBackup(screen: Screen, text: string): void {
  const next = parseBackup(text);
  if (!next) {
    notice = "That file is not a flashcard backup.";
    screen.rerender();
    return;
  }
  const ok = confirm(`Replace every deck with this backup (${plural(next.decks.length, "deck")})?`);
  if (!ok) return;
  screen.replaceState(next);
}
