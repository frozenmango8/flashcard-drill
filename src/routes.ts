export type Route =
  | { name: "home" }
  | { name: "new" }
  | { name: "deck"; id: string }
  | { name: "study"; id: string };

export function parseRoute(hash: string): Route {
  const parts = hash
    .replace(/^#/, "")
    .split("/")
    .filter(Boolean)
    .map(decodePart);

  if (parts[0] === "new") return { name: "new" };
  if (parts[0] === "deck" && parts[1]) return { name: "deck", id: parts[1] };
  if (parts[0] === "study" && parts[1]) return { name: "study", id: parts[1] };
  return { name: "home" };
}

export function deckHref(id: string): string {
  return `#/deck/${encodeURIComponent(id)}`;
}

export function studyHref(id: string): string {
  return `#/study/${encodeURIComponent(id)}`;
}

function decodePart(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}
