import Database from "@tauri-apps/plugin-sql";
import type { Movie, MovieView, TmdbMovieDetails, WatchStatus } from "../types";

let dbPromise: Promise<Database> | null = null;

function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:movietracker.db");
  }
  return dbPromise;
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toView(row: Movie): MovieView {
  return {
    ...row,
    genres: parseJsonArray(row.genres),
    cast_members: parseJsonArray(row.cast_members),
    tags: parseJsonArray(row.tags),
    watch_dates: parseJsonArray(row.watch_dates),
  };
}

export async function listMovies(status?: WatchStatus): Promise<MovieView[]> {
  const db = await getDb();
  const rows = status
    ? await db.select<Movie[]>(
        "SELECT * FROM movies WHERE status = $1 ORDER BY updated_at DESC",
        [status],
      )
    : await db.select<Movie[]>("SELECT * FROM movies ORDER BY updated_at DESC");
  return rows.map(toView);
}

export async function getMovie(tmdbId: number): Promise<MovieView | null> {
  const db = await getDb();
  const rows = await db.select<Movie[]>("SELECT * FROM movies WHERE tmdb_id = $1", [tmdbId]);
  return rows.length ? toView(rows[0]) : null;
}

/** Return the set of tmdb_ids already saved locally (for search result badges). */
export async function getSavedIds(): Promise<Set<number>> {
  const db = await getDb();
  const rows = await db.select<{ tmdb_id: number }[]>("SELECT tmdb_id FROM movies");
  return new Set(rows.map((r) => r.tmdb_id));
}

/** Insert a movie (or refresh its metadata + status if it already exists). */
export async function addMovie(details: TmdbMovieDetails, status: WatchStatus): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO movies (
        tmdb_id, title, poster_path, backdrop_path, release_date, overview,
        runtime, genres, cast_members, director, status, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, datetime('now'))
     ON CONFLICT(tmdb_id) DO UPDATE SET
        status = excluded.status,
        poster_path = excluded.poster_path,
        backdrop_path = excluded.backdrop_path,
        overview = excluded.overview,
        runtime = excluded.runtime,
        genres = excluded.genres,
        cast_members = excluded.cast_members,
        director = excluded.director,
        updated_at = datetime('now')`,
    [
      details.id,
      details.title,
      details.poster_path,
      details.backdrop_path,
      details.release_date,
      details.overview,
      details.runtime,
      JSON.stringify(details.genres),
      JSON.stringify(details.cast_members),
      details.director,
      status,
    ],
  );
}

export async function updateStatus(tmdbId: number, status: WatchStatus): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET status = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [status, tmdbId],
  );
}

export async function updateRating(tmdbId: number, rating: number | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET rating = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [rating, tmdbId],
  );
}

export async function updateWatchDate(tmdbId: number, watchDate: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET watch_date = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [watchDate, tmdbId],
  );
}

export async function updateNotes(tmdbId: number, notes: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET notes = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [notes, tmdbId],
  );
}

export async function updateRewatchCount(tmdbId: number, count: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET rewatch_count = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [Math.max(0, count), tmdbId],
  );
}

export async function updatePlatform(tmdbId: number, platform: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET platform = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [platform, tmdbId],
  );
}

export async function updateTags(tmdbId: number, tags: string[]): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET tags = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [JSON.stringify(tags), tmdbId],
  );
}

export async function updateFavorite(tmdbId: number, favorite: boolean): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET favorite = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [favorite ? 1 : 0, tmdbId],
  );
}

/** Replace the full list of logged watch dates; keeps watch_date = most recent. */
export async function updateWatchDates(tmdbId: number, dates: string[]): Promise<void> {
  const db = await getDb();
  const sorted = [...new Set(dates)].sort();
  const latest = sorted.length ? sorted[sorted.length - 1] : null;
  await db.execute(
    "UPDATE movies SET watch_dates = $1, watch_date = $2, updated_at = datetime('now') WHERE tmdb_id = $3",
    [JSON.stringify(sorted), latest, tmdbId],
  );
}

export async function updateReview(tmdbId: number, review: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET review = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [review, tmdbId],
  );
}

export async function updateSpoiler(tmdbId: number, spoiler: boolean): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE movies SET spoiler = $1, updated_at = datetime('now') WHERE tmdb_id = $2",
    [spoiler ? 1 : 0, tmdbId],
  );
}

export async function updatePosterCache(tmdbId: number, dataUri: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE movies SET poster_cache = $1 WHERE tmdb_id = $2", [dataUri, tmdbId]);
}

/** Movies that still need their poster cached for offline use. */
export async function moviesNeedingPosterCache(): Promise<
  { tmdb_id: number; poster_path: string }[]
> {
  const db = await getDb();
  return db.select<{ tmdb_id: number; poster_path: string }[]>(
    "SELECT tmdb_id, poster_path FROM movies WHERE poster_path IS NOT NULL AND poster_cache IS NULL",
  );
}

export async function deleteMovie(tmdbId: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM movies WHERE tmdb_id = $1", [tmdbId]);
}
