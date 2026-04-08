/** Minimal markdown: escape HTML, then **bold** and *italic*. */
export function parseMarkdown(text: string | undefined | null): string {
  if (!text) return "";
  let s = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Keep absolute-value expressions like |-5| on a single line.
  s = s.replace(/\|([^|\s][^|]*?)\|/g, '<span style="white-space:nowrap">|$1|</span>');
  return s;
}
