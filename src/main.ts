import "./style.css";
import { todayISO } from "./dates";
import { el } from "./dom";
import { parseRoute, type Route } from "./routes";
import type { Screen, View } from "./screen";
import {
  loadState,
  loadTheme,
  saveState,
  saveTheme,
  type ThemeChoice,
} from "./storage";
import { renderDeck } from "./views/deck";
import { renderHome } from "./views/home";
import { renderNewDeck } from "./views/new-deck";
import { renderRecovery } from "./views/recovery";
import { beginSession, clearSession, renderStudy } from "./views/study";

const root = document.querySelector("#app") ?? missingApp();

function missingApp(): HTMLElement {
  throw new Error("Missing #app");
}

const loaded = loadState();
let theme: ThemeChoice = loadTheme();
let saveError = false;
let cleanup: (() => void) | undefined;
let lastKey = "";

const screen: Screen = {
  state: loaded.state,
  today: todayISO(),
  corrupt: loaded.corrupt,
  rerender() {
    draw();
  },
  replaceState(next) {
    this.state = next;
    this.corrupt = false;
    if (location.hash === "" || location.hash === "#/") draw();
    else location.hash = "#/";
  },
  setTheme(next) {
    theme = next;
    saveTheme(next);
    applyTheme(next);
    const button = document.querySelector("#theme");
    if (button) button.textContent = themeLabel();
  },
  theme() {
    return theme;
  },
};

applyTheme(theme);

window.addEventListener("hashchange", draw);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (theme !== "system") return;
  applyTheme("system");
  const button = document.querySelector("#theme");
  if (button) button.textContent = themeLabel();
});

draw();

function draw(): void {
  cleanup?.();
  cleanup = undefined;
  screen.today = todayISO();
  if (!screen.corrupt) saveError = !saveState(screen.state);

  const route = parseRoute(location.hash);
  const key = screen.corrupt ? "corrupt" : routeKey(route);
  const routeChanged = key !== lastKey;
  lastKey = key;

  if (routeChanged) {
    if (!screen.corrupt && route.name === "study") {
      const deck = screen.state.decks.find((item) => item.id === route.id);
      if (deck) beginSession(deck, screen.today);
      else clearSession();
    } else {
      clearSession();
    }
  }

  const view = screen.corrupt ? renderRecovery(screen) : renderRoute(route);
  root.replaceChildren(shell(view.node));
  cleanup = view.cleanup;
  document.title = view.title;
  if (routeChanged) document.getElementById("main")?.focus();
  view.focus?.();
}

function renderRoute(route: Route): View {
  if (route.name === "home") return renderHome(screen);
  if (route.name === "new") return renderNewDeck(screen);
  const deck = screen.state.decks.find((item) => item.id === route.id);
  if (!deck) {
    return {
      title: "Deck not found · Flashcard Drill",
      node: el(
        "div",
        null,
        el("h1", null, "Deck not found"),
        el("p", null, el("a", { href: "#/" }, "Back to decks")),
      ),
    };
  }
  return route.name === "deck" ? renderDeck(screen, deck) : renderStudy(screen, deck);
}

function routeKey(route: Route): string {
  if (route.name === "deck" || route.name === "study") return `${route.name}:${route.id}`;
  return route.name;
}

function shell(content: HTMLElement): HTMLElement {
  const themeButton = el("button", { type: "button", id: "theme" }, themeLabel());
  themeButton.onclick = () => {
    screen.setTheme(resolvedTheme() === "dark" ? "light" : "dark");
  };

  const page = el(
    "div",
    null,
    el("a", { class: "skip", href: "#main" }, "Skip to content"),
    el(
      "header",
      { class: "top" },
      el("a", { class: "brand", href: "#/" }, "Flashcard Drill"),
      themeButton,
    ),
  );
  if (saveError) {
    page.append(
      el(
        "p",
        { class: "banner", role: "alert" },
        "Could not save. This browser may be out of storage for the site.",
      ),
    );
  }
  const main = el("main", { id: "main", tabindex: "-1" });
  main.append(content);
  page.append(main);
  return page;
}

function themeLabel(): string {
  return resolvedTheme() === "dark" ? "Light mode" : "Dark mode";
}

function resolvedTheme(): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(choice: ThemeChoice): void {
  document.documentElement.dataset.theme = choice === "system" ? resolvedTheme() : choice;
}
