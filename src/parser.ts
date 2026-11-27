export interface ParsedCard {
  front: string;
  back: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  skipped: number;
}

/** Tab wins, then " - ", then the first comma. Blank lines are ignored. */
export function parseCardLine(line: string): ParsedCard | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = splitFrontBack(trimmed);
  if (!parts) return null;

  const front = parts[0].trim();
  const back = parts[1].trim();
  if (!front || !back) return null;
  return { front, back };
}

export function parseCards(text: string): ParseResult {
  const cards: ParsedCard[] = [];
  let skipped = 0;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const card = parseCardLine(line);
    if (card) cards.push(card);
    else skipped += 1;
  }

  return { cards, skipped };
}

function splitFrontBack(line: string): [string, string] | null {
  const tab = line.indexOf("\t");
  if (tab !== -1) return [line.slice(0, tab), line.slice(tab + 1)];

  const dash = line.indexOf(" - ");
  if (dash !== -1) return [line.slice(0, dash), line.slice(dash + 3)];

  const comma = line.indexOf(",");
  if (comma !== -1) return [line.slice(0, comma), line.slice(comma + 1)];

  return null;
}

export function parseCsv(text: string): ParsedCard[] {
  const rows = parseRows(text.replace(/^\uFEFF/, ""));
  if (rows.length === 0) return [];

  let start = 0;
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  if (header[0] === "front" && header[1] === "back") start = 1;

  const cards: ParsedCard[] = [];
  for (const row of rows.slice(start)) {
    const front = (row[0] ?? "").trim();
    const back = (row[1] ?? "").trim();
    if (!front || !back) continue;
    cards.push({ front, back });
  }
  return cards;
}

export function toCsv(cards: ParsedCard[]): string {
  const lines = ["front,back", ...cards.map((card) => `${cell(card.front)},${cell(card.back)}`)];
  return `${lines.join("\n")}\n`;
}

function cell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}
