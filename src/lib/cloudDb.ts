import { supabase, currentUserId } from "./supabase";
import type { MovieView, TmdbMovieDetails, WatchStatus } from "../types";

/**
 * Cloud data layer (web) — same surface as lib/db.ts but backed by Supabase
 * Postgres with Row-Level Security so each account only sees its own rows.
 */

const TABLE = "movies";

interface CloudRow {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  overview: string | null;
  runtime: number | null;
  genres: string[] | null;
  cast_members: string[] | null;
  director: string | null;
  status: WatchStatus;
  rating: number | null;
  watch_date: string | null;
  watch_dates: string[] | null;
  notes: string | null;
  review: string | null;
  spoiler: number | null;
  rewatch_count: number | null;
  platform: string | null;
  tags: string[] | null;
  favorite: number | null;
  poster_cache: string | null;
  created_at: string;
  updated_at: string;
}

function toView(row: CloudRow): MovieView {
  return {
    tmdb_id: row.tmdb_id,
    title: row.title,
    poster_path: row.poster_path,
    backdrop_path: row.backdrop_path,
    release_date: row.release_date,
    overview: row.overview,
    runtime: row.runtime,
    genres: row.genres ?? [],
    cast_members: row.cast_members ?? [],
    director: row.director,
    status: row.status,
    rating: row.rating,
    watch_date: row.watch_date,
    watch_dates: row.watch_dates ?? [],
    notes: row.notes,
    review: row.review,
    spoiler: row.spoiler ?? 0,
    rewatch_count: row.rewatch_count ?? 0,
    platform: row.platform,
    tags: row.tags ?? [],
    favorite: row.favorite ?? 0,
    poster_cache: row.poster_cache,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function requireClient() {
  if (!supabase) throw new Error("Cloud backend is not configured.");
  return supabase;
}

async function patch(tmdbId: number, fields: Record<string, unknown>): Promise<void> {
  const db = requireClient();
  const { error } = await db
    .from(TABLE)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("tmdb_id", tmdbId);
  if (error) throw new Error(error.message);
}

export async function listMovies(status?: WatchStatus): Promise<MovieView[]> {
  if (!supabase) return [];
  let query = supabase.from(TABLE).select("*").order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as CloudRow[]).map(toView);
}

export async function getMovie(tmdbId: number): Promise<MovieView | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select("*").eq("tmdb_id", tmdbId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toView(data as CloudRow) : null;
}

export async function getSavedIds(): Promise<Set<number>> {
  if (!supabase) return new Set();
  const { data, error } = await supabase.from(TABLE).select("tmdb_id");
  if (error) throw new Error(error.message);
  return new Set((data as { tmdb_id: number }[]).map((r) => r.tmdb_id));
}

export async function addMovie(details: TmdbMovieDetails, status: WatchStatus): Promise<void> {
  const db = requireClient();
  const userId = await currentUserId();
  if (!userId) throw new Error("You must be signed in.");
  const { error } = await db.from(TABLE).upsert(
    {
      user_id: userId,
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
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,tmdb_id", ignoreDuplicates: false },
  );
  if (error) throw new Error(error.message);
}

export async function updateStatus(tmdbId: number, status: WatchStatus): Promise<void> {
  await patch(tmdbId, { status });
}

export async function updateRating(tmdbId: number, rating: number | null): Promise<void> {
  await patch(tmdbId, { rating });
}

export async function updateWatchDate(tmdbId: number, watchDate: string | null): Promise<void> {
  await patch(tmdbId, { watch_date: watchDate });
}

export async function updateNotes(tmdbId: number, notes: string | null): Promise<void> {
  await patch(tmdbId, { notes });
}

export async function updateRewatchCount(tmdbId: number, count: number): Promise<void> {
  await patch(tmdbId, { rewatch_count: Math.max(0, count) });
}

export async function updatePlatform(tmdbId: number, platform: string | null): Promise<void> {
  await patch(tmdbId, { platform });
}

export async function updateTags(tmdbId: number, tags: string[]): Promise<void> {
  await patch(tmdbId, { tags });
}

export async function updateFavorite(tmdbId: number, favorite: boolean): Promise<void> {
  await patch(tmdbId, { favorite: favorite ? 1 : 0 });
}

export async function updateWatchDates(tmdbId: number, dates: string[]): Promise<void> {
  const sorted = [...new Set(dates)].sort();
  const latest = sorted.length ? sorted[sorted.length - 1] : null;
  await patch(tmdbId, { watch_dates: sorted, watch_date: latest });
}

export async function updateReview(tmdbId: number, review: string | null): Promise<void> {
  await patch(tmdbId, { review });
}

export async function updateSpoiler(tmdbId: number, spoiler: boolean): Promise<void> {
  await patch(tmdbId, { spoiler: spoiler ? 1 : 0 });
}

// Poster caching is a desktop-only offline feature; no-ops on the web.
export async function updatePosterCache(_tmdbId: number, _dataUri: string): Promise<void> {}

export async function moviesNeedingPosterCache(): Promise<
  { tmdb_id: number; poster_path: string }[]
> {
  return [];
}

export async function deleteMovie(tmdbId: number): Promise<void> {
  const db = requireClient();
  const { error } = await db.from(TABLE).delete().eq("tmdb_id", tmdbId);
  if (error) throw new Error(error.message);
}
