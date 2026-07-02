import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import * as db from "./db";
import { tmdbImage } from "./tmdb";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

let running = false;

/**
 * Download and cache posters (as base64 data URIs in SQLite) so they display
 * offline. Best-effort: any failure is swallowed and the app keeps using the
 * remote URL. Returns true if at least one poster was newly cached.
 */
export async function runPosterCache(): Promise<boolean> {
  if (running || !isTauri()) return false;
  running = true;
  let cachedAny = false;
  try {
    const pending = await db.moviesNeedingPosterCache();
    for (const { tmdb_id, poster_path } of pending) {
      const url = tmdbImage(poster_path, "w342");
      if (!url) continue;
      try {
        const res = await tauriFetch(url, { method: "GET" });
        if (!res.ok) continue;
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.length === 0) continue;
        const dataUri = `data:image/jpeg;base64,${toBase64(buf)}`;
        await db.updatePosterCache(tmdb_id, dataUri);
        cachedAny = true;
      } catch {
        /* skip this poster, try the rest */
      }
    }
  } catch {
    /* caching is optional */
  } finally {
    running = false;
  }
  return cachedAny;
}
