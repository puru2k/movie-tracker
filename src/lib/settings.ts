import { load, type Store } from "@tauri-apps/plugin-store";
import type { GridSize, LibraryLayout } from "../types";

const STORE_FILE = "settings.json";
const KEY_TMDB = "tmdb_api_key";
const KEY_LAYOUT = "library_layout";
const KEY_GRID = "grid_size";

export interface DisplayPrefs {
  layout: LibraryLayout;
  gridSize: GridSize;
}

const DEFAULT_PREFS: DisplayPrefs = { layout: "grid", gridSize: "medium" };

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load(STORE_FILE, { defaults: {}, autoSave: true });
  }
  return storePromise;
}

export async function getApiKey(): Promise<string | null> {
  const store = await getStore();
  const value = await store.get<string>(KEY_TMDB);
  return value ?? null;
}

export async function setApiKey(key: string): Promise<void> {
  const store = await getStore();
  await store.set(KEY_TMDB, key.trim());
  await store.save();
}

export async function clearApiKey(): Promise<void> {
  const store = await getStore();
  await store.delete(KEY_TMDB);
  await store.save();
}

/** Display preferences (layout + grid density). Falls back to defaults. */
export async function getDisplayPrefs(): Promise<DisplayPrefs> {
  try {
    const store = await getStore();
    const layout = (await store.get<LibraryLayout>(KEY_LAYOUT)) ?? DEFAULT_PREFS.layout;
    const gridSize = (await store.get<GridSize>(KEY_GRID)) ?? DEFAULT_PREFS.gridSize;
    return { layout, gridSize };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function setDisplayPrefs(prefs: Partial<DisplayPrefs>): Promise<void> {
  try {
    const store = await getStore();
    if (prefs.layout) await store.set(KEY_LAYOUT, prefs.layout);
    if (prefs.gridSize) await store.set(KEY_GRID, prefs.gridSize);
    await store.save();
  } catch {
    /* best-effort; prefs stay in-memory in the browser preview */
  }
}
