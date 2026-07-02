/** Open an external URL in a new tab, safely (no window.opener access). */
export function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
