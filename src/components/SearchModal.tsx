import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import { getMovieDetails, searchMovies, tmdbImage } from "../lib/tmdb";
import { STATUS_LABELS, type WatchStatus } from "../types";
import {
  BookmarkIcon,
  CheckIcon,
  CloseIcon,
  EyeIcon,
  FilmIcon,
  SearchIcon,
} from "./Icons";

// Statuses you can add a brand-new movie into (excludes "dropped").
const ADD_STATUSES: WatchStatus[] = ["to_watch", "watching", "watched"];

const STATUS_BTN: Record<string, typeof BookmarkIcon> = {
  to_watch: BookmarkIcon,
  watching: EyeIcon,
  watched: CheckIcon,
};

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SearchModal() {
  const open = useAppStore((s) => s.searchOpen);
  const close = useAppStore((s) => s.closeSearch);
  const apiKey = useAppStore((s) => s.apiKey);
  const openSettings = useAppStore((s) => s.openSettings);
  const addMovie = useAppStore((s) => s.addMovie);
  const movies = useAppStore((s) => s.movies);

  const savedIds = useMemo(() => new Set(movies.map((m) => m.tmdb_id)), [movies]);

  const [query, setQuery] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);
  const debouncedQuery = useDebounced(query, 350);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setAddingId(null);
    }
  }, [open]);

  const { data: results = [], isFetching, error } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchMovies(debouncedQuery, apiKey!),
    enabled: open && Boolean(apiKey) && debouncedQuery.trim().length > 0,
    staleTime: 60_000,
  });

  if (!open) return null;

  async function handleAdd(id: number, status: WatchStatus) {
    if (!apiKey) return;
    setAddingId(id);
    try {
      const details = await getMovieDetails(id, apiKey);
      await addMovie(details, status);
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-40 flex items-start justify-center bg-black/60 p-4 pt-[8vh] backdrop-blur-sm"
      onMouseDown={close}
    >
      <div
        className="animate-fade-in flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-white/10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <SearchIcon width={20} height={20} className="text-ink-600" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a movie…"
            className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-ink-600"
          />
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-ink-600 transition hover:bg-white/5 hover:text-white"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!apiKey ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-ink-600">
                Add your free TMDB API key to search for movies.
              </p>
              <button
                onClick={openSettings}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
              >
                Open Settings
              </button>
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center text-sm text-red-400">
              {error instanceof Error ? error.message : "Search failed."}
            </div>
          ) : debouncedQuery.trim().length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-ink-600">
              Start typing to search TMDB.
            </div>
          ) : isFetching && results.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-ink-600">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-ink-600">
              No results for “{debouncedQuery}”.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {results.map((r) => {
                const poster = tmdbImage(r.poster_path, "w185");
                const saved = savedIds.has(r.id);
                const busy = addingId === r.id;
                return (
                  <li key={r.id} className="flex gap-3 px-4 py-3">
                    <div className="h-[84px] w-14 shrink-0 overflow-hidden rounded-md bg-ink-800">
                      {poster ? (
                        <img src={poster} alt={r.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-600">
                          <FilmIcon width={20} height={20} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-medium text-white/90">
                          {r.title}
                        </span>
                        <span className="text-xs text-ink-600">
                          {r.release_date ? r.release_date.slice(0, 4) : ""}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-600">
                        {r.overview || "No description available."}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5">
                        {saved ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-400">
                            <CheckIcon width={12} height={12} /> In library
                          </span>
                        ) : (
                          ADD_STATUSES.map((status) => {
                            const Icon = STATUS_BTN[status];
                            return (
                              <button
                                key={status}
                                disabled={busy}
                                onClick={() => handleAdd(r.id, status)}
                                className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-ink-600 transition hover:bg-brand/20 hover:text-white disabled:opacity-50"
                              >
                                <Icon width={12} height={12} />
                                {STATUS_LABELS[status]}
                              </button>
                            );
                          })
                        )}
                        {busy && <span className="text-[11px] text-ink-600">Adding…</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
