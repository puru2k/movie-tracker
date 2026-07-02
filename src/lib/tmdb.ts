import type { TmdbMovieDetails, TmdbSearchResult } from "../types";

const API_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

/** Build a full poster/backdrop URL from a TMDB relative path. */
export function tmdbImage(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" | "w780" | "original" = "w342",
): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

/** Prefer the offline-cached poster (base64 data URI) when available. */
export function posterSrc(
  movie: { poster_cache?: string | null; poster_path: string | null },
  size: "w185" | "w342" | "w500" | "w780" | "original" = "w342",
): string | null {
  return movie.poster_cache ?? tmdbImage(movie.poster_path, size);
}

interface TmdbError {
  status_message?: string;
  status_code?: number;
}

async function request<T>(path: string, apiKey: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    let message = `TMDB request failed (${res.status})`;
    try {
      const body = (await res.json()) as TmdbError;
      if (body.status_message) message = body.status_message;
    } catch {
      /* ignore parse errors */
    }
    if (res.status === 401) {
      message = "Invalid TMDB API key. Check it in Settings.";
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

/** Validate an API key by hitting a lightweight authenticated endpoint. */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await request<unknown>("/configuration", apiKey);
    return true;
  } catch {
    return false;
  }
}

interface RawSearchResponse {
  results: Array<{
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string | null;
    overview: string | null;
    vote_average: number | null;
  }>;
}

export async function searchMovies(query: string, apiKey: string): Promise<TmdbSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const data = await request<RawSearchResponse>("/search/movie", apiKey, {
    query: trimmed,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });
  return data.results.map((r) => ({
    id: r.id,
    title: r.title,
    poster_path: r.poster_path,
    backdrop_path: r.backdrop_path,
    release_date: r.release_date || null,
    overview: r.overview,
    vote_average: r.vote_average,
  }));
}

export type DiscoverCategory =
  | "trending"
  | "popular"
  | "top_rated"
  | "upcoming"
  | "now_playing";

const CATEGORY_PATHS: Record<DiscoverCategory, string> = {
  trending: "/trending/movie/week",
  popular: "/movie/popular",
  top_rated: "/movie/top_rated",
  upcoming: "/movie/upcoming",
  now_playing: "/movie/now_playing",
};

export async function getDiscoverList(
  category: DiscoverCategory,
  apiKey: string,
  pages = 2,
): Promise<TmdbSearchResult[]> {
  const responses = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      request<RawSearchResponse>(CATEGORY_PATHS[category], apiKey, {
        language: "en-US",
        page: String(i + 1),
      }),
    ),
  );
  const seen = new Set<number>();
  const out: TmdbSearchResult[] = [];
  for (const r of responses.flatMap((d) => d.results)) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push({
      id: r.id,
      title: r.title,
      poster_path: r.poster_path,
      backdrop_path: r.backdrop_path,
      release_date: r.release_date || null,
      overview: r.overview,
      vote_average: r.vote_average,
    });
  }
  return out;
}

export const TMDB_GENRES: { id: number; name: string }[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export const TMDB_LANGUAGES: { code: string; name: string }[] = [
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "hi", name: "Hindi" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "zh", name: "Chinese" },
  { code: "sv", name: "Swedish" },
];

export type SortBy =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc"
  | "revenue.desc";

export interface AdvancedQuery {
  name?: string | null;
  /** Cast or director name — resolved to a TMDB person and matched via with_people. */
  person?: string | null;
  genreId?: number | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  minRating?: number | null;
  maxRuntime?: number | null;
  language?: string | null;
  sortBy: SortBy;
}

/** Resolve a person's name to their most relevant TMDB id (cast or crew). */
export async function findPersonId(name: string, apiKey: string): Promise<number | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const search = await request<RawPersonSearch>("/search/person", apiKey, {
    query: trimmed,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });
  return search.results[0]?.id ?? null;
}

interface RawSearchItemFull {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  overview: string | null;
  vote_average: number | null;
  popularity?: number;
  genre_ids?: number[];
  original_language?: string;
}

/**
 * Advanced search. When a title is given, use /search/movie and apply the other
 * filters client-side; otherwise use /discover/movie with server-side filters.
 */
export async function discoverSearch(
  q: AdvancedQuery,
  apiKey: string,
): Promise<TmdbSearchResult[]> {
  const map = (r: RawSearchItemFull): TmdbSearchResult => ({
    id: r.id,
    title: r.title,
    poster_path: r.poster_path,
    backdrop_path: r.backdrop_path,
    release_date: r.release_date || null,
    overview: r.overview,
    vote_average: r.vote_average,
  });

  const name = q.name?.trim();

  if (name) {
    const data = await request<{ results: RawSearchItemFull[] }>("/search/movie", apiKey, {
      query: name,
      include_adult: "false",
      language: "en-US",
      page: "1",
    });
    let items = data.results;
    if (q.genreId) items = items.filter((i) => (i.genre_ids ?? []).includes(q.genreId!));
    if (q.yearFrom)
      items = items.filter((i) => i.release_date && i.release_date.slice(0, 4) >= String(q.yearFrom));
    if (q.yearTo)
      items = items.filter((i) => i.release_date && i.release_date.slice(0, 4) <= String(q.yearTo));
    if (q.minRating) items = items.filter((i) => (i.vote_average ?? 0) >= q.minRating!);
    if (q.language) items = items.filter((i) => i.original_language === q.language);

    if (q.sortBy === "vote_average.desc") {
      items = [...items].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    } else if (q.sortBy === "primary_release_date.desc") {
      items = [...items].sort((a, b) =>
        (b.release_date ?? "").localeCompare(a.release_date ?? ""),
      );
    }
    return items.map(map);
  }

  const params: Record<string, string> = {
    include_adult: "false",
    language: "en-US",
    page: "1",
    sort_by: q.sortBy,
  };
  // Cast/director filter: resolve the name to a person id, then match films
  // where they appear as cast or crew. If the name doesn't resolve, no results.
  const person = q.person?.trim();
  if (person) {
    const personId = await findPersonId(person, apiKey);
    if (!personId) return [];
    params.with_people = String(personId);
  }
  if (q.genreId) params.with_genres = String(q.genreId);
  if (q.yearFrom) params["primary_release_date.gte"] = `${q.yearFrom}-01-01`;
  if (q.yearTo) params["primary_release_date.lte"] = `${q.yearTo}-12-31`;
  if (q.minRating) {
    params["vote_average.gte"] = String(q.minRating);
    params["vote_count.gte"] = "50"; // avoid obscure titles with a single high vote
  }
  if (q.maxRuntime) params["with_runtime.lte"] = String(q.maxRuntime);
  if (q.language) params.with_original_language = q.language;

  const data = await request<{ results: RawSearchItemFull[] }>("/discover/movie", apiKey, params);
  return data.results.map(map);
}

interface RawDetailsResponse {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  overview: string | null;
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
  credits?: {
    cast?: Array<{ name: string; order: number }>;
    crew?: Array<{ name: string; job: string }>;
  };
}

export interface MovieExtras {
  trailerUrl: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  /** Streaming provider names (flatrate) for the chosen region. */
  providers: string[];
  providerRegion: string | null;
}

interface RawExtrasResponse {
  vote_average: number | null;
  vote_count: number | null;
  videos?: { results?: Array<{ site: string; type: string; key: string; official?: boolean }> };
  "watch/providers"?: {
    results?: Record<string, { flatrate?: Array<{ provider_name: string }> }>;
  };
}

/** Fetch live extras (trailer, public rating, streaming providers). Not persisted. */
export async function getMovieExtras(
  tmdbId: number,
  apiKey: string,
  region = "US",
): Promise<MovieExtras> {
  const data = await request<RawExtrasResponse>(`/movie/${tmdbId}`, apiKey, {
    append_to_response: "videos,watch/providers",
    language: "en-US",
  });

  const videos = data.videos?.results ?? [];
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    videos.find((v) => v.site === "YouTube");

  const provResults = data["watch/providers"]?.results ?? {};
  const regionKey = provResults[region] ? region : Object.keys(provResults)[0];
  const flatrate = regionKey ? (provResults[regionKey]?.flatrate ?? []) : [];

  return {
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    voteAverage: data.vote_average ?? null,
    voteCount: data.vote_count ?? null,
    providers: flatrate.map((p) => p.provider_name),
    providerRegion: regionKey ?? null,
  };
}

interface RawPersonSearch {
  results: Array<{
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department?: string;
    popularity?: number;
  }>;
}

interface RawPersonCredits {
  cast?: Array<{
    id: number;
    title?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string | null;
    overview?: string | null;
    vote_average?: number | null;
    character?: string;
  }>;
  crew?: Array<{
    id: number;
    title?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string | null;
    overview?: string | null;
    vote_average?: number | null;
    job?: string;
  }>;
}

export interface PersonFilmography {
  personId: number;
  name: string;
  profile_path: string | null;
  directed: TmdbSearchResult[];
  acted: TmdbSearchResult[];
}

function dedupeByReleaseDesc(
  movies: Array<TmdbSearchResult & { release_date: string | null }>,
): TmdbSearchResult[] {
  const seen = new Set<number>();
  const unique: TmdbSearchResult[] = [];
  for (const m of movies) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    unique.push(m);
  }
  return unique.sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""));
}

/** Look up a person by name and return the films they directed and acted in. */
export async function getPersonFilmography(
  name: string,
  apiKey: string,
): Promise<PersonFilmography | null> {
  const search = await request<RawPersonSearch>("/search/person", apiKey, {
    query: name,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });
  const person = search.results[0];
  if (!person) return null;

  const credits = await request<RawPersonCredits>(`/person/${person.id}/movie_credits`, apiKey, {
    language: "en-US",
  });

  const toResult = (m: {
    id: number;
    title?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string | null;
    overview?: string | null;
    vote_average?: number | null;
  }): TmdbSearchResult & { release_date: string | null } => ({
    id: m.id,
    title: m.title ?? "Untitled",
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    release_date: m.release_date || null,
    overview: m.overview ?? null,
    vote_average: m.vote_average ?? null,
  });

  const directed = dedupeByReleaseDesc(
    (credits.crew ?? []).filter((c) => c.job === "Director").map(toResult),
  );
  const acted = dedupeByReleaseDesc((credits.cast ?? []).filter((c) => c.title).map(toResult));

  return {
    personId: person.id,
    name: person.name,
    profile_path: person.profile_path,
    directed,
    acted,
  };
}

export interface Recommendation extends TmdbSearchResult {
  /** How strongly this was recommended (sum of seed weights). */
  score: number;
}

/**
 * Build "for you" picks from a set of seed movies (things you liked/watched).
 * Pulls TMDB recommendations for each seed, then ranks by how often a title
 * surfaces across seeds (weighted by each seed's rating), excluding anything
 * already in your library.
 */
export async function getRecommendations(
  seeds: { id: number; weight: number }[],
  apiKey: string,
  excludeIds: Set<number>,
): Promise<Recommendation[]> {
  if (seeds.length === 0) return [];

  const responses = await Promise.all(
    seeds.map((seed) =>
      request<RawSearchResponse>(`/movie/${seed.id}/recommendations`, apiKey, {
        language: "en-US",
        page: "1",
      })
        .then((d) => ({ seed, results: d.results }))
        .catch(() => ({ seed, results: [] as RawSearchResponse["results"] })),
    ),
  );

  const scored = new Map<number, Recommendation>();
  for (const { seed, results } of responses) {
    for (const r of results) {
      if (excludeIds.has(r.id)) continue;
      const existing = scored.get(r.id);
      if (existing) {
        existing.score += seed.weight;
      } else {
        scored.set(r.id, {
          id: r.id,
          title: r.title,
          poster_path: r.poster_path,
          backdrop_path: r.backdrop_path,
          release_date: r.release_date || null,
          overview: r.overview,
          vote_average: r.vote_average,
          score: seed.weight,
        });
      }
    }
  }

  return [...scored.values()]
    .filter((r) => r.poster_path) // keep the wall of posters tidy
    .sort(
      (a, b) => b.score - a.score || (b.vote_average ?? 0) - (a.vote_average ?? 0),
    )
    .slice(0, 40);
}

export async function getMovieDetails(tmdbId: number, apiKey: string): Promise<TmdbMovieDetails> {
  const data = await request<RawDetailsResponse>(`/movie/${tmdbId}`, apiKey, {
    append_to_response: "credits",
    language: "en-US",
  });

  const cast = (data.credits?.cast ?? [])
    .sort((a, b) => a.order - b.order)
    .slice(0, 8)
    .map((c) => c.name);

  const director = (data.credits?.crew ?? []).find((c) => c.job === "Director")?.name ?? null;

  return {
    id: data.id,
    title: data.title,
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
    release_date: data.release_date || null,
    overview: data.overview,
    runtime: data.runtime,
    genres: data.genres.map((g) => g.name),
    cast_members: cast,
    director,
  };
}
