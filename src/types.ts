export type WatchStatus = "to_watch" | "watching" | "watched" | "dropped";

export const STATUS_LABELS: Record<WatchStatus, string> = {
  to_watch: "To Watch",
  watching: "Watching",
  watched: "Watched",
  dropped: "Dropped",
};

export const STATUS_ORDER: WatchStatus[] = ["to_watch", "watching", "watched", "dropped"];

/** A library section is a watch status or the cross-cutting Favorites view. */
export type LibraryTab = WatchStatus | "favorites";

export function tabLabel(tab: LibraryTab): string {
  return tab === "favorites" ? "Favorites" : STATUS_LABELS[tab];
}

/** How the library grid/list is rendered. */
export type LibraryLayout = "grid" | "list";
/** Poster tile density for the grid layout. */
export type GridSize = "small" | "medium" | "large";

/** A movie as stored locally in SQLite. */
export interface Movie {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  overview: string | null;
  runtime: number | null;
  /** JSON-encoded string[] of genre names. */
  genres: string | null;
  /** JSON-encoded string[] of top cast names. */
  cast_members: string | null;
  director: string | null;
  status: WatchStatus;
  /** 0-10 integer (half-star precision), or null if unrated. */
  rating: number | null;
  /** ISO date (YYYY-MM-DD) of the most recent logged viewing, or null. */
  watch_date: string | null;
  /** JSON-encoded string[] of all logged watch dates (the diary). */
  watch_dates: string | null;
  /** Long-form personal review / notes. */
  notes: string | null;
  /** Short one-line review. */
  review: string | null;
  /** 1 if the review/notes contain spoilers. */
  spoiler: number;
  /** Number of times rewatched (0 = watched once, not counting first view). */
  rewatch_count: number;
  /** Where you watched it or where it streams (e.g. Netflix, Blu-ray). */
  platform: string | null;
  /** JSON-encoded string[] of custom mood/theme tags. */
  tags: string | null;
  /** 1 if marked as a favorite, else 0. */
  favorite: number;
  /** Cached poster as a base64 data URI for offline display, or null. */
  poster_cache: string | null;
  created_at: string;
  updated_at: string;
}

/** Parsed convenience view of a Movie with decoded JSON fields. */
export interface MovieView
  extends Omit<Movie, "genres" | "cast_members" | "tags" | "watch_dates"> {
  genres: string[];
  cast_members: string[];
  tags: string[];
  watch_dates: string[];
}

/** A TMDB search result row. */
export interface TmdbSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  overview: string | null;
  vote_average: number | null;
}

/** Full TMDB movie details used when adding to the library. */
export interface TmdbMovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  overview: string | null;
  runtime: number | null;
  genres: string[];
  cast_members: string[];
  director: string | null;
}
