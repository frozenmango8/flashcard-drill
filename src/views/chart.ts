import { formatDay } from "../dates";
import { el } from "../dom";
import { plural } from "../format";
import type { DayCount } from "../stats";

export function renderHistory(days: DayCount[]): HTMLElement {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const caption =
    total === 0
      ? "No reviews in the last 30 days"
      : `${plural(total, "review")} in the last 30 days`;

  return el(
    "figure",
    { class: "history" },
    el("figcaption", null, caption),
    bars(days),
    el(
      "div",
      { class: "axis" },
      el("span", null, formatDay(days[0]?.date ?? "")),
      el("span", null, "Today"),
    ),
    historyTable(days),
  );
}

function bars(days: DayCount[]): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 300 64");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("class", "chart");
  svg.setAttribute("aria-hidden", "true");

  const max = Math.max(1, ...days.map((day) => day.count));
  const slot = days.length === 0 ? 300 : 300 / days.length;
  const baseline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  baseline.setAttribute("x", "0");
  baseline.setAttribute("y", "63");
  baseline.setAttribute("width", "300");
  baseline.setAttribute("height", "1");
  baseline.setAttribute("fill", "var(--line)");
  svg.append(baseline);

  days.forEach((day, index) => {
    if (day.count === 0) return;
    const height = Math.max(3, Math.round((day.count / max) * 60));
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", (index * slot + 0.4).toFixed(2));
    rect.setAttribute("y", String(63 - height));
    rect.setAttribute("width", Math.max(1, slot - 0.8).toFixed(2));
    rect.setAttribute("height", String(height));
    rect.setAttribute("fill", "currentColor");
    svg.append(rect);
  });

  return svg;
}

function historyTable(days: DayCount[]): HTMLTableElement {
  const table = el(
    "table",
    { class: "sr-only" },
    el("caption", null, "Reviews per day"),
    el(
      "thead",
      null,
      el(
        "tr",
        null,
        el("th", { scope: "col" }, "Date"),
        el("th", { scope: "col" }, "Reviews"),
      ),
    ),
  );
  const body = el("tbody");
  for (const day of days) {
    body.append(
      el(
        "tr",
        null,
        el("td", null, formatDay(day.date)),
        el("td", null, String(day.count)),
      ),
    );
  }
  table.append(body);
  return table;
}
