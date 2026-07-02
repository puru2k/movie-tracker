import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import {
  discoverSearch,
  getDiscoverList,
  getMovieDetails,
  tmdbImage,
  TMDB_GENRES,
  type DiscoverCategory,
} from "../lib/tmdb";
import type { TmdbSearchResult } from "../types";
import { CheckIcon, FilmIcon, PlusIcon, SearchIcon, StarIcon } from "./Icons";

const CATEGORIES: { key: DiscoverCategory; label: string }[] = [
  { key: "trending", label: "Trending this week" },
  { key: "popular", label: "Popular" },
  { key: "now_playing", label: "Now playing" },
  { key: "top_rated", label: "Top rated" },
  { key: "upcoming", label: "Upcoming" },
];

// A rotating selection of genres to browse, Netflix-style rows.
const GENRE_ROWS = [
  "Action", "Comedy", "Drama", "Science Fiction",
  "Horror", "Animation", "Thriller", "Romance", "Adventure",
]
  .map((name) => TMDB_GENRES.find((g) => g.name === name))
  .filter((g): g is { id: number; name: string } => Boolean(g));

function DiscoverCard({
  movie,
  saved,
  busy,
  onAdd,
  onMarkWatched,
  onOpen,
}: {
  movie: TmdbSearchResult;
  saved: boolean;
  busy: boolean;
  onAdd: () => void;
  onMarkWatched: () => void;
  onOpen: () => void;
}) {
  const poster = tmdbImage(movie.poster_path, "w342");
  return (
    <div className="group w-[128px] shrink-0">
      <button onClick={onOpen} className="poster cursor-pointer">
        {poster ? (
          <img src={poster} alt={movie.title} loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-600">
            <FilmIcon width={26} height={26} />
          </div>
        )}

        {movie.vote_average != null && movie.vote_average > 0 && (
          <div className="badge-glass absolute right-1.5 top-1.5 text-accent">
            <StarIcon width={10} height={10} />
            {movie.vote_average.toFixed(1)}
          </div>
        )}

        {saved ? (
          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-positive/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <CheckIcon width={11} height={11} /> In library
          </div>
        ) : (
          <div className="absolute bottom-1.5 right-1.5 flex flex-col gap-1.5 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkWatched();
              }}
              disabled={busy}
              title="Mark as watched"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-positive text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-70"
            >
              <CheckIcon width={15} height={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              disabled={busy}
              title="Add to watchlist"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-md transition hover:bg-brand-strong active:scale-95 disabled:opacity-70"
            >
              <PlusIcon width={16} height={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </button>
      <div className="mt-1.5 line-clamp-1 text-[12px] font-medium text-white/85">
        {movie.title}
      </div>
      <div className="text-[11px] text-ink-600">
        {movie.release_date ? movie.release_date.slice(0, 4) : "—"}
      </div>
    </div>
  );
}

export function DiscoverView() {
  const apiKey = useAppStore((s) => s.apiKey);
  const movies = useAppStore((s) => s.movies);
  const addMovie = useAppStore((s) => s.addMovie);
  const selectMovie = useAppStore((s) => s.selectMovie);
  const openSettings = useAppStore((s) => s.openSettings);
  const openAdvanced = useAppStore((s) => s.openAdvanced);

  const [addingId, setAddingId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const savedIds = useMemo(() => new Set(movies.map((m) => m.tmdb_id)), [movies]);

  const results = useQueries({
    queries: CATEGORIES.map((c) => ({
      queryKey: ["discover", c.key],
      queryFn: () => getDiscoverList(c.key, apiKey!),
      enabled: Boolean(apiKey),
      staleTime: 10 * 60_000,
    })),
  });

  const genreResults = useQueries({
    queries: GENRE_ROWS.map((g) => ({
      queryKey: ["discover-genre", g.id],
      queryFn: () =>
        discoverSearch({ genreId: g.id, sortBy: "popularity.desc" }, apiKey!),
      enabled: Boolean(apiKey),
      staleTime: 10 * 60_000,
    })),
  });

  async function handleAdd(id: number, status: "to_watch" | "watched" = "to_watch") {
    if (!apiKey) return;
    setAddingId(id);
    try {
      const details = await getMovieDetails(id, apiKey);
      // "watched" here logs no watch date by default — it can be added later.
      await addMovie(details, status);
      setToast(
        status === "watched"
          ? `Marked “${details.title}” as watched`
          : `Added “${details.title}” to your watchlist`,
      );
      window.setTimeout(() => setToast(""), 2500);
    } finally {
      setAddingId(null);
    }
  }

  if (!apiKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-[13px] text-ink-600">Add your TMDB API key to browse movies.</p>
        <button onClick={openSettings} className="btn btn-primary btn-sm">
          Open Settings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {GENRE_ROWS.map((g) => (
            <button key={g.id} onClick={() => openAdvanced(g.id)} className="chip">
              {g.name}
            </button>
          ))}
        </div>
        <button onClick={() => openAdvanced()} className="btn btn-secondary btn-sm shrink-0">
          <SearchIcon width={14} height={14} />
          Advanced search
        </button>
      </div>

      {CATEGORIES.map((c, i) => {
        const q = results[i];
        return (
          <MovieRow
            key={c.key}
            label={c.label}
            isLoading={q.isLoading}
            error={q.isError ? (q.error instanceof Error ? q.error.message : "Failed to load.") : null}
            movies={q.data ?? []}
            savedIds={savedIds}
            addingId={addingId}
            onAdd={(id) => handleAdd(id)}
            onMarkWatched={(id) => handleAdd(id, "watched")}
            onOpen={selectMovie}
          />
        );
      })}

      <div className="pt-1">
        <h2 className="mb-1 text-[14px] font-semibold text-white/95">Browse by genre</h2>
      </div>

      {GENRE_ROWS.map((g, i) => {
        const q = genreResults[i];
        return (
          <MovieRow
            key={g.id}
            label={g.name}
            onLabelClick={() => openAdvanced(g.id)}
            isLoading={q.isLoading}
            error={q.isError ? (q.error instanceof Error ? q.error.message : "Failed to load.") : null}
            movies={q.data ?? []}
            savedIds={savedIds}
            addingId={addingId}
            onAdd={(id) => handleAdd(id)}
            onMarkWatched={(id) => handleAdd(id, "watched")}
            onOpen={selectMovie}
          />
        );
      })}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink-700 px-4 py-2 text-[13px] text-white shadow-lg ring-1 ring-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}

function MovieRow({
  label,
  onLabelClick,
  isLoading,
  error,
  movies,
  savedIds,
  addingId,
  onAdd,
  onMarkWatched,
  onOpen,
}: {
  label: string;
  onLabelClick?: () => void;
  isLoading: boolean;
  error: string | null;
  movies: TmdbSearchResult[];
  savedIds: Set<number>;
  addingId: number | null;
  onAdd: (id: number) => void;
  onMarkWatched: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  return (
    <section>
      {onLabelClick ? (
        <button
          onClick={onLabelClick}
          className="mb-2.5 text-[13px] font-semibold text-white/90 underline-offset-2 transition hover:text-brand hover:underline"
        >
          {label} →
        </button>
      ) : (
        <h3 className="mb-2.5 text-[13px] font-semibold text-white/90">{label}</h3>
      )}
      {isLoading ? (
        <div className="text-[12px] text-ink-600">Loading…</div>
      ) : error ? (
        <div className="text-[12px] text-red-400">{error}</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {movies.map((m) => (
            <DiscoverCard
              key={m.id}
              movie={m}
              saved={savedIds.has(m.id)}
              busy={addingId === m.id}
              onAdd={() => onAdd(m.id)}
              onMarkWatched={() => onMarkWatched(m.id)}
              onOpen={() => onOpen(m.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
