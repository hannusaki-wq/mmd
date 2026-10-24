export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function parseTelegramLink(link) {
  try {
    const clean = String(link)
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^t\.me\//, "");
    const parts = clean.split("/");
    if (parts.length < 2) return [null, null];
    const msgId = parseInt(parts[parts.length - 1]);
    if (isNaN(msgId)) return [null, null];
    if (parts[0] === "c") {
      return [parseInt(`-100${parts[1]}`), msgId];
    }
    return [`@${parts[0]}`, msgId];
  } catch {
    return [null, null];
  }
}

export function splitText(text, size = 3400) {
  if (!text) return [""];
  const pages = [];
  while (text.length > size) {
    let cut = text.lastIndexOf("\n\n", size);
    if (cut < size / 2) cut = text.lastIndexOf("\n", size);
    if (cut < size / 2) cut = text.lastIndexOf(" ", size);
    if (cut < size / 2) cut = size;
    pages.push(text.slice(0, cut).trimEnd());
    text = text.slice(cut).trimStart();
  }
  if (text) pages.push(text);
  return pages;
}

export function genClipboardId() {
  return String(Math.floor(10000000 + Math.random() * 89999999));
}

export function encodeGroupIdForCallback(id) {
  return String(id).replace(/-/g, "m");
}

export function decodeGroupIdFromCallback(raw) {
  return parseInt(String(raw).replace(/m/g, "-"), 10);
}
