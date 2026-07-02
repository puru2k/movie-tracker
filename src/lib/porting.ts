import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { parseCsv, toCsv } from "./csv";
import { getMovieDetails, searchMovies } from "./tmdb";
import * as db from "./db";
import type { MovieView, WatchStatus } from "../types";

const EXPORT_HEADERS = [
  "Title",
  "Year",
  "Status",
  "Rating",
  "Watched Date",
  "Rewatches",
  "Platform",
  "Tags",
  "Notes",
  "TMDB ID",
];

function statusLabel(status: WatchStatus): string {
  return status === "to_watch" ? "To Watch" : status === "watching" ? "Watching" : "Watched";
}

/** Export the whole library to a CSV file. Returns number of rows, or null if cancelled. */
export async function exportLibrary(movies: MovieView[]): Promise<number | null> {
  const rows = movies.map((m) => ({
    Title: m.title,
    Year: m.release_date ? m.release_date.slice(0, 4) : "",
    Status: statusLabel(m.status),
    Rating: m.rating != null ? (m.rating / 2).toString() : "",
    "Watched Date": m.watch_date ?? "",
    Rewatches: m.rewatch_count,
    Platform: m.platform ?? "",
    Tags: m.tags.join(", "),
    Notes: m.notes ?? "",
    "TMDB ID": m.tmdb_id,
  }));

  const csv = toCsv(EXPORT_HEADERS, rows);
  const path = await save({
    defaultPath: "movie-tracker-export.csv",
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path) return null;
  await invoke("write_text_file", { path, contents: csv });
  return rows.length;
}

export interface ImportProgress {
  done: number;
  total: number;
  current: string;
}

export interface ImportSummary {
  imported: number;
  skipped: number;
  failed: number;
  cancelled?: boolean;
}

function pick(record: Record<string, string>, names: string[]): string {
  const lowered: Record<string, string> = {};
  for (const [k, v] of Object.entries(record)) lowered[k.toLowerCase()] = v;
  for (const n of names) {
    const v = lowered[n.toLowerCase()];
    if (v != null && v !== "") return v;
  }
  return "";
}

function normalizeStatus(raw: string): WatchStatus {
  const s = raw.toLowerCase().replace(/[\s_-]/g, "");
  if (s === "towatch" || s === "watchlist" || s === "planned") return "to_watch";
  if (s === "watching" || s === "inprogress") return "watching";
  return "watched";
}

function normalizeRating(raw: string): number | null {
  if (!raw) return null;
  const num = parseFloat(raw);
  if (!Number.isFinite(num) || num <= 0) return null;
  // Letterboxd and our export both use a 0-5 scale; store as 0-10 half-steps.
  return Math.max(1, Math.min(10, Math.round(num * 2)));
}

/**
 * Import a CSV (our own export format or a Letterboxd export). For each row we
 * resolve the film on TMDB (by id if present, else by title/year search),
 * fetch full metadata, and add it to the library.
 */
export async function importLibrary(
  apiKey: string,
  onProgress: (p: ImportProgress) => void,
): Promise<ImportSummary> {
  const path = await open({
    multiple: false,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path || typeof path !== "string") {
    return { imported: 0, skipped: 0, failed: 0, cancelled: true };
  }

  const text = await invoke<string>("read_text_file", { path });
  const records = parseCsv(text);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const title = pick(rec, ["Title", "Name"]);
    onProgress({ done: i, total: records.length, current: title || "(untitled)" });

    if (!title) {
      skipped++;
      continue;
    }

    const year = pick(rec, ["Year"]);
    const idRaw = pick(rec, ["TMDB ID", "tmdb_id", "tmdbId"]);
    const status = normalizeStatus(pick(rec, ["Status"]));
    const rating = normalizeRating(pick(rec, ["Rating"]));
    const watchDate = pick(rec, ["Watched Date", "Date"]) || null;
    const rewatchRaw = pick(rec, ["Rewatches", "Rewatch"]);
    const rewatch = /^\d+$/.test(rewatchRaw)
      ? parseInt(rewatchRaw, 10)
      : /yes|true/i.test(rewatchRaw)
        ? 1
        : 0;
    const platform = pick(rec, ["Platform"]) || null;
    const tagsRaw = pick(rec, ["Tags"]);
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const notes = pick(rec, ["Notes", "Review"]) || null;

    try {
      let tmdbId: number | null = idRaw && /^\d+$/.test(idRaw) ? parseInt(idRaw, 10) : null;

      if (tmdbId == null) {
        const results = await searchMovies(title, apiKey);
        if (results.length === 0) {
          failed++;
          continue;
        }
        const yearMatch = year
          ? results.find((r) => r.release_date?.slice(0, 4) === year)
          : undefined;
        tmdbId = (yearMatch ?? results[0]).id;
      }

      const details = await getMovieDetails(tmdbId, apiKey);
      await db.addMovie(details, status);
      if (rating != null) await db.updateRating(tmdbId, rating);
      if (watchDate) await db.updateWatchDate(tmdbId, watchDate);
      if (rewatch > 0) await db.updateRewatchCount(tmdbId, rewatch);
      if (platform) await db.updatePlatform(tmdbId, platform);
      if (tags.length) await db.updateTags(tmdbId, tags);
      if (notes) await db.updateNotes(tmdbId, notes);
      imported++;
    } catch {
      failed++;
    }
  }

  onProgress({ done: records.length, total: records.length, current: "" });
  return { imported, skipped, failed };
}
