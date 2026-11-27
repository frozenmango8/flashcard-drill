import { download, el } from "../dom";
import { describeParse, fileSlug, formatPercent, plural } from "../format";
import { clampNewPerDay, makeCard, MAX_NEW_PER_DAY } from "../model";
import { parseCards, parseCsv, toCsv } from "../parser";
import { cardStatus, dueCards, studyQueue } from "../queue";
import { studyHref } from "../routes";
import type { Screen, View } from "../screen";
import { retention, reviewHistory } from "../stats";
import type { Card, Deck } from "../types";
import { renderHistory } from "./chart";

let editingDeck = "";
let editingId: string | null = null;
let focusEdit = false;
let focusAdd = false;
let notice: { text: string; role: "alert" | "status" } | null = null;

export function renderDeck(screen: Screen, deck: Deck): View {
  if (editingDeck !== deck.id) {
    editingDeck = deck.id;
    editingId = null;
    focusEdit = false;
    focusAdd = false;
    notice = null;
  }

  const message = notice;
  notice = null;
  const shouldFocusEdit = focusEdit;
  const shouldFocusAdd = focusAdd;
  focusEdit = false;
  focusAdd = false;

  const queued = studyQueue(deck, screen.today).length;
  const study = el(
    "a",
    { class: "button primary", href: studyHref(deck.id) },
    queued > 0 ? `Study ${queued}` : "Study",
  );

  const node = el(
    "div",
    null,
    el("p", { class: "crumb" }, el("a", { href: "#/" }, "Decks")),
    nameField(screen, deck),
    el("p", { class: "sub" }, plural(deck.cards.length, "card")),
    el("div", { class: "row" }, study),
    statsRow(screen, deck),
    renderHistory(reviewHistory(deck, screen.today)),
    el("h2", null, "Cards"),
    cardList(screen, deck),
    addForm(screen, deck),
    pasteBox(screen, deck),
    csvBox(screen, deck),
    deleteDeck(screen, deck),
  );

  if (message) {
    const alert = el("p", { class: "alert", role: message.role }, message.text);
    node.insertBefore(alert, node.children[2] ?? null);
  }

  return {
    title: `${deck.name} · Flashcard Drill`,
    node,
    focus: shouldFocusEdit
      ? () => document.getElementById("edit-front")?.focus()
      : shouldFocusAdd
        ? () => document.getElementById("add-front")?.focus()
        : undefined,
  };
}

function nameField(screen: Screen, deck: Deck): HTMLHeadingElement {
  const input = el("input", {
    class: "name",
    type: "text",
    value: deck.name,
    maxlength: "120",
    "aria-label": "Deck name",
    autocomplete: "off",
  });
  input.addEventListener("change", () => {
    const next = input.value.trim();
    if (!next || next === deck.name) {
      input.value = deck.name;
      return;
    }
    deck.name = next;
    screen.rerender();
  });
  return el("h1", null, input);
}

function statsRow(screen: Screen, deck: Deck): HTMLElement {
  const due = dueCards(deck, screen.today).length;
  const rate = retention(deck, screen.today);
  const limit = el("input", {
    type: "number",
    min: "0",
    max: String(MAX_NEW_PER_DAY),
    step: "1",
    value: String(deck.newPerDay),
    "aria-label": "New cards per day",
  });
  limit.addEventListener("change", () => {
    if (limit.value.trim() === "") {
      limit.value = String(deck.newPerDay);
      return;
    }
    const next = clampNewPerDay(Number(limit.value));
    limit.value = String(next);
    if (next === deck.newPerDay) return;
    deck.newPerDay = next;
    screen.rerender();
  });
  limit.addEventListener(
    "wheel",
    (event) => {
      if (document.activeElement === limit) event.preventDefault();
    },
    { passive: false },
  );

  return el(
    "div",
    { class: "stats" },
    stat(String(due), "due today"),
    stat(rate === null ? "None" : formatPercent(rate), "retention, 30 days", rate === null),
    el(
      "div",
      { class: "stat" },
      el("p", { class: "stat-value" }, limit),
      el("p", { class: "stat-label" }, "new per day"),
    ),
  );
}

function stat(value: string, label: string, quiet = false): HTMLElement {
  return el(
    "div",
    { class: "stat" },
    el("p", { class: quiet ? "stat-value quiet" : "stat-value" }, value),
    el("p", { class: "stat-label" }, label),
  );
}

function cardList(screen: Screen, deck: Deck): HTMLElement {
  if (deck.cards.length === 0) return el("p", { class: "hint" }, "No cards yet.");

  const list = el("ul", { class: "cards" });
  for (const card of deck.cards) {
    list.append(el("li", editingId === card.id ? { class: "editing" } : null, cardRow(screen, deck, card)));
  }
  return list;
}

function cardRow(screen: Screen, deck: Deck, card: Card): HTMLElement {
  if (editingId === card.id) return editForm(screen, card);

  const edit = el("button", { type: "button", "aria-label": `Edit ${card.front}` }, "Edit");
  edit.onclick = () => {
    editingId = card.id;
    focusEdit = true;
    screen.rerender();
  };
  const remove = el("button", { type: "button", class: "danger", "aria-label": `Delete ${card.front}` }, "Delete");
  remove.onclick = () => {
    if (!confirm("Delete this card?")) return;
    deck.cards = deck.cards.filter((item) => item.id !== card.id);
    if (editingId === card.id) editingId = null;
    screen.rerender();
  };

  return el(
    "div",
    { class: "card-row" },
    el(
      "div",
      { class: "card-body" },
      el("p", { class: "card-front" }, card.front),
      el("p", { class: "card-back" }, card.back),
    ),
    el("span", { class: "status" }, cardStatus(card, screen.today)),
    edit,
    remove,
  );
}

function editForm(screen: Screen, card: Card): HTMLFormElement {
  const front = el("input", {
    id: "edit-front",
    type: "text",
    value: card.front,
    required: "",
    autocomplete: "off",
    "aria-label": "Front",
  });
  const back = el("input", {
    type: "text",
    value: card.back,
    required: "",
    autocomplete: "off",
    "aria-label": "Back",
  });
  const cancel = el("button", { type: "button" }, "Cancel");
  cancel.onclick = () => {
    editingId = null;
    screen.rerender();
  };

  const form = el(
    "form",
    { class: "edit-card" },
    front,
    back,
    el("div", { class: "row" }, el("button", { type: "submit", class: "primary" }, "Save"), cancel),
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextFront = front.value.trim();
    const nextBack = back.value.trim();
    if (!nextFront || !nextBack) return;
    card.front = nextFront;
    card.back = nextBack;
    editingId = null;
    screen.rerender();
  });
  return form;
}

function addForm(screen: Screen, deck: Deck): HTMLFormElement {
  const front = el("input", {
    id: "add-front",
    type: "text",
    required: "",
    autocomplete: "off",
  });
  const back = el("input", { type: "text", required: "", autocomplete: "off" });
  const form = el(
    "form",
    null,
    el("h2", null, "Add a card"),
    el("label", { class: "field" }, el("span", null, "Front"), front),
    el("label", { class: "field" }, el("span", null, "Back"), back),
    el("button", { type: "submit", class: "primary" }, "Add card"),
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextFront = front.value.trim();
    const nextBack = back.value.trim();
    if (!nextFront || !nextBack) return;
    deck.cards.push(makeCard(nextFront, nextBack));
    notice = { text: "Added 1 card.", role: "status" };
    focusAdd = true;
    screen.rerender();
  });
  return form;
}

function pasteBox(screen: Screen, deck: Deck): HTMLElement {
  const area = el("textarea", { "aria-label": "Cards to add" });
  area.placeholder = "France - Paris";
  const count = el("p", { class: "hint" }, "0 cards");
  area.addEventListener("input", () => {
    count.textContent = describeParse(parseCards(area.value));
  });
  const button = el("button", { type: "button" }, "Add cards");
  button.onclick = () => {
    const parsed = parseCards(area.value);
    if (parsed.cards.length === 0) {
      notice = { text: "None of those lines could be read as cards.", role: "alert" };
      screen.rerender();
      return;
    }
    for (const pair of parsed.cards) deck.cards.push(makeCard(pair.front, pair.back));
    const skipped =
      parsed.skipped > 0 ? ` Skipped ${plural(parsed.skipped, "line")}.` : "";
    notice = { text: `Added ${plural(parsed.cards.length, "card")}.${skipped}`, role: "status" };
    screen.rerender();
  };

  return el(
    "details",
    { class: "paste" },
    el("summary", null, "Paste cards"),
    el(
      "p",
      { class: "hint" },
      "One card per line. Separate the front and back with a tab, a comma, or \" - \".",
    ),
    area,
    count,
    button,
  );
}

function csvBox(screen: Screen, deck: Deck): HTMLElement {
  const exportCsv = el("button", { type: "button" }, "Export CSV");
  exportCsv.onclick = () => {
    const cards = deck.cards.map((card) => ({ front: card.front, back: card.back }));
    download(`${fileSlug(deck.name)}.csv`, toCsv(cards), "text/csv");
  };

  const input = el("input", { type: "file", accept: ".csv,text/csv" });
  input.onchange = () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    void file.text().then(
      (text) => {
        const cards = parseCsv(text);
        if (cards.length === 0) {
          notice = { text: "That CSV has no cards.", role: "alert" };
          screen.rerender();
          return;
        }
        for (const pair of cards) deck.cards.push(makeCard(pair.front, pair.back));
        notice = { text: `Imported ${plural(cards.length, "card")}.`, role: "status" };
        screen.rerender();
      },
      () => {
        notice = { text: "Could not read that file.", role: "alert" };
        screen.rerender();
      },
    );
  };

  return el(
    "section",
    null,
    el("h2", null, "CSV"),
    el(
      "div",
      { class: "stack" },
      el("div", { class: "row" }, exportCsv),
      el("label", { class: "file" }, "Import CSV", input),
    ),
  );
}

function deleteDeck(screen: Screen, deck: Deck): HTMLElement {
  const button = el("button", { type: "button", class: "danger" }, "Delete deck");
  button.onclick = () => {
    if (!confirm(`Delete ${deck.name}? This cannot be undone.`)) return;
    screen.state.decks = screen.state.decks.filter((item) => item.id !== deck.id);
    location.hash = "#/";
  };
  return el("div", { class: "danger-zone" }, button);
}
