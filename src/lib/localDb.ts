import type { MovieView, TmdbMovieDetails, WatchStatus } from "../types";

/**
 * Guest data layer (web) — same surface as lib/db.ts but backed by the
 * browser's localStorage. Lets people use the app with no account; their
 * library persists on this device only (no sync).
 */

const KEY = "movietracker.guest.movies";

function load(): MovieView[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as MovieView[]) : [];
  } catch {
    return [];
  }
}

function save(rows: MovieView[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

const now = () => new Date().toISOString();

function patch(tmdbId: number, fields: Partial<MovieView>): void {
  const rows = load();
  const m = rows.find((r) => r.tmdb_id === tmdbId);
  if (!m) return;
  Object.assign(m, fields, { updated_at: now() });
  save(rows);
}

export async function listMovies(status?: WatchStatus): Promise<MovieView[]> {
  const rows = load().sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
  return status ? rows.filter((m) => m.status === status) : rows;
}

export async function getMovie(tmdbId: number): Promise<MovieView | null> {
  return load().find((m) => m.tmdb_id === tmdbId) ?? null;
}

export async function getSavedIds(): Promise<Set<number>> {
  return new Set(load().map((m) => m.tmdb_id));
}

export async function addMovie(details: TmdbMovieDetails, status: WatchStatus): Promise<void> {
  const rows = load();
  const existing = rows.find((m) => m.tmdb_id === details.id);
  if (existing) {
    Object.assign(existing, {
      status,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      overview: details.overview,
      runtime: details.runtime,
      genres: details.genres,
      cast_members: details.cast_members,
      director: details.director,
      updated_at: now(),
    });
  } else {
    rows.push({
      tmdb_id: details.id,
      title: details.title,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      release_date: details.release_date,
      overview: details.overview,
      runtime: details.runtime,
      genres: details.genres,
      cast_members: details.cast_members,
      director: details.director,
      status,
      rating: null,
      watch_date: null,
      watch_dates: [],
      notes: null,
      review: null,
      spoiler: 0,
      rewatch_count: 0,
      platform: null,
      tags: [],
      favorite: 0,
      poster_cache: null,
      created_at: now(),
      updated_at: now(),
    });
  }
  save(rows);
}

export async function updateStatus(tmdbId: number, status: WatchStatus): Promise<void> {
  patch(tmdbId, { status });
}

export async function updateRating(tmdbId: number, rating: number | null): Promise<void> {
  patch(tmdbId, { rating });
}

export async function updateWatchDate(tmdbId: number, watchDate: string | null): Promise<void> {
  patch(tmdbId, { watch_date: watchDate });
}

export async function updateNotes(tmdbId: number, notes: string | null): Promise<void> {
  patch(tmdbId, { notes });
}

export async function updateRewatchCount(tmdbId: number, count: number): Promise<void> {
  patch(tmdbId, { rewatch_count: Math.max(0, count) });
}

export async function updatePlatform(tmdbId: number, platform: string | null): Promise<void> {
  patch(tmdbId, { platform });
}

export async function updateTags(tmdbId: number, tags: string[]): Promise<void> {
  patch(tmdbId, { tags });
}

export async function updateFavorite(tmdbId: number, favorite: boolean): Promise<void> {
  patch(tmdbId, { favorite: favorite ? 1 : 0 });
}

export async function updateWatchDates(tmdbId: number, dates: string[]): Promise<void> {
  const sorted = [...new Set(dates)].sort();
  patch(tmdbId, { watch_dates: sorted, watch_date: sorted.length ? sorted[sorted.length - 1] : null });
}

export async function updateReview(tmdbId: number, review: string | null): Promise<void> {
  patch(tmdbId, { review });
}

export async function updateSpoiler(tmdbId: number, spoiler: boolean): Promise<void> {
  patch(tmdbId, { spoiler: spoiler ? 1 : 0 });
}

// Poster caching is a desktop-only offline feature; no-ops for guests.
export async function updatePosterCache(_tmdbId: number, _dataUri: string): Promise<void> {}

export async function moviesNeedingPosterCache(): Promise<
  { tmdb_id: number; poster_path: string }[]
> {
  return [];
}

export async function deleteMovie(tmdbId: number): Promise<void> {
  save(load().filter((m) => m.tmdb_id !== tmdbId));
}
