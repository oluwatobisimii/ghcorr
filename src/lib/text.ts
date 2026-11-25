const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ESC[c]);
/** Plain text where *words in stars* become highlighted <em>. Safe to use with set:html. */
export const highlightStars = (s: string) => escapeHtml(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');
