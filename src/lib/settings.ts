import type { GridSize, LibraryLayout } from "../types";

/**
 * Local, per-device settings persisted in the browser's localStorage:
 * an optional TMDB API key override and display preferences.
 */

const KEY_TMDB = "movietracker.tmdb_api_key";
const KEY_LAYOUT = "movietracker.library_layout";
const KEY_GRID = "movietracker.grid_size";

export interface DisplayPrefs {
  layout: LibraryLayout;
  gridSize: GridSize;
}

const DEFAULT_PREFS: DisplayPrefs = { layout: "grid", gridSize: "medium" };

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — settings stay in memory for this session */
  }
}

/** Optional user-provided TMDB key. Falls back to the build-time env key. */
export async function getApiKey(): Promise<string | null> {
  return read(KEY_TMDB);
}

export async function setApiKey(key: string): Promise<void> {
  write(KEY_TMDB, key.trim());
}

export async function clearApiKey(): Promise<void> {
  try {
    localStorage.removeItem(KEY_TMDB);
  } catch {
    /* ignore */
  }
}

/** Display preferences (layout + grid density). Falls back to defaults. */
export async function getDisplayPrefs(): Promise<DisplayPrefs> {
  const layout = (read(KEY_LAYOUT) as LibraryLayout | null) ?? DEFAULT_PREFS.layout;
  const gridSize = (read(KEY_GRID) as GridSize | null) ?? DEFAULT_PREFS.gridSize;
  return { layout, gridSize };
}

export async function setDisplayPrefs(prefs: Partial<DisplayPrefs>): Promise<void> {
  if (prefs.layout) write(KEY_LAYOUT, prefs.layout);
  if (prefs.gridSize) write(KEY_GRID, prefs.gridSize);
}
