import { el } from "../dom";
import { describeParse } from "../format";
import { makeDeck } from "../model";
import { parseCards } from "../parser";
import { deckHref } from "../routes";
import type { Screen, View } from "../screen";

export function renderNewDeck(screen: Screen): View {
  const name = el("input", {
    type: "text",
    required: "",
    maxlength: "120",
    autocomplete: "off",
  });
  const cards = el("textarea", {
    spellcheck: "true",
    "aria-describedby": "card-help card-count",
  });
  cards.placeholder = "France - Paris\nSpain, Madrid";
  const count = el("p", { id: "card-count", class: "hint" }, "0 cards");
  const error = el("p", { class: "alert", role: "alert" });
  error.hidden = true;

  const refreshCount = () => {
    count.textContent = describeParse(parseCards(cards.value));
  };
  cards.addEventListener("input", refreshCount);

  const form = el(
    "form",
    null,
    el("label", { class: "field" }, el("span", null, "Name"), name),
    el("label", { class: "field" }, el("span", null, "Cards"), cards),
    el(
      "p",
      { id: "card-help", class: "hint" },
      "One card per line. Separate the front and back with a tab, a comma, or \" - \".",
    ),
    count,
    error,
    el(
      "div",
      { class: "row" },
      el("button", { type: "submit", class: "primary" }, "Create deck"),
      el("a", { class: "button", href: "#/" }, "Cancel"),
    ),
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = name.value.trim();
    if (!title) {
      showError(error, "Name the deck.");
      name.focus();
      return;
    }
    const parsed = parseCards(cards.value);
    if (cards.value.trim() && parsed.cards.length === 0) {
      showError(error, "None of those lines could be read as cards.");
      cards.focus();
      return;
    }
    const deck = makeDeck(title, parsed.cards);
    screen.state.decks.push(deck);
    location.hash = deckHref(deck.id);
  });

  return {
    title: "New deck · Flashcard Drill",
    node: el(
      "div",
      null,
      el("p", { class: "crumb" }, el("a", { href: "#/" }, "Decks")),
      el("h1", null, "New deck"),
      form,
    ),
    focus: () => name.focus(),
  };
}

function showError(error: HTMLParagraphElement, message: string): void {
  error.hidden = false;
  error.textContent = message;
}
