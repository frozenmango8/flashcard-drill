import { download, el } from "../dom";
import type { Screen, View } from "../screen";
import { seedState, STORAGE_KEY } from "../storage";

export function renderRecovery(screen: Screen): View {
  const downloadRaw = el("button", { type: "button" }, "Download saved data");
  downloadRaw.onclick = () => {
    let raw: string;
    try {
      raw = localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      raw = "";
    }
    download("flashcard-drill-unreadable.txt", raw, "text/plain");
  };

  const replace = el("button", { type: "button", class: "primary" }, "Replace with the sample deck");
  replace.onclick = () => {
    const ok = confirm("Replace the unreadable save with the sample deck?");
    if (!ok) return;
    screen.replaceState(seedState());
  };

  return {
    title: "Saved decks could not be read · Flashcard Drill",
    node: el(
      "div",
      null,
      el("h1", null, "Saved decks could not be read"),
      el(
        "p",
        null,
        "The data is still in this browser. You can download it, or replace it with the sample deck.",
      ),
      el("div", { class: "row" }, downloadRaw, replace),
    ),
  };
}
