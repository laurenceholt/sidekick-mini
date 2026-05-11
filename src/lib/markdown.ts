/** Minimal markdown: escape HTML, then **bold** and *italic*. */
export function parseMarkdown(text: string | undefined | null): string {
  if (!text) return "";
  let s = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Keep absolute-value expressions like |-5| on a single line.
  s = s.replace(/\|([^|\s][^|]*?)\|/g, '<span style="white-space:nowrap">|$1|</span>');
  // Phonetic-slug parentheses with multiple hyphens (e.g. "(HIST-o-gram)",
  // "(dih-struh-BYOO-shun)", "(MEE-dee-un)") — replace internal hyphens
  // with U+2011 (non-breaking hyphen) so they never wrap.
  s = s.replace(/\(([^()]*-[^()]*-[^()]*)\)/g, (_, inner) =>
    `(${inner.replace(/-/g, "‑")})`,
  );
  // Comma-separated number lists (e.g. "120, 124, and 122" or "5, 30, 10,
  // 20, 10, 15") shouldn't break across a line — kids need to read the
  // whole list to add or sort.
  s = s.replace(
    /-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)+(?:\s*,?\s*and\s+-?\d+(?:\.\d+)?)?/g,
    (m) => `<span style="white-space:nowrap">${m}</span>`,
  );
  return s;
}
