import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import {
  discoverSearch,
  getMovieDetails,
  TMDB_GENRES,
  TMDB_LANGUAGES,
  type AdvancedQuery,
  type SortBy,
} from "../lib/tmdb";
import { CloseIcon, SearchIcon } from "./Icons";
import { PosterAddCard } from "./PosterAddCard";

const SORTS: { value: SortBy; label: string }[] = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "revenue.desc", label: "Highest grossing" },
];

const CURRENT_YEAR = new Date().getFullYear();

const field = "field";
const labelCls = "mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-600";

export function AdvancedSearchModal() {
  const apiKey = useAppStore((s) => s.apiKey);
  const movies = useAppStore((s) => s.movies);
  const addMovie = useAppStore((s) => s.addMovie);
  const selectMovie = useAppStore((s) => s.selectMovie);
  const onClose = useAppStore((s) => s.closeAdvanced);
  const presetGenreId = useAppStore((s) => s.advancedGenreId);

  const [name, setName] = useState<string>("");
  const [person, setPerson] = useState<string>("");
  const [genreId, setGenreId] = useState<number | null>(presetGenreId);
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [minRating, setMinRating] = useState<number>(0);
  const [maxRuntime, setMaxRuntime] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("popularity.desc");

  const [query, setQuery] = useState<AdvancedQuery | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const savedIds = useMemo(() => new Set(movies.map((m) => m.tmdb_id)), [movies]);

  // When opened from a genre chip elsewhere, run that genre browse immediately.
  useEffect(() => {
    if (presetGenreId != null) {
      setQuery({
        name: null,
        person: null,
        genreId: presetGenreId,
        yearFrom: null,
        yearTo: null,
        minRating: null,
        maxRuntime: null,
        language: null,
        sortBy: "popularity.desc",
      });
    }
  }, [presetGenreId]);

  const { data, isLoading, isError, error, isFetched } = useQuery({
    queryKey: ["advanced", query],
    queryFn: () => discoverSearch(query!, apiKey!),
    enabled: Boolean(query && apiKey),
    staleTime: 5 * 60_000,
  });

  function runSearch() {
    setQuery({
      name: name.trim() || null,
      person: person.trim() || null,
      genreId,
      yearFrom: yearFrom ? Number(yearFrom) : null,
      yearTo: yearTo ? Number(yearTo) : null,
      minRating: minRating > 0 ? minRating : null,
      maxRuntime: maxRuntime ? Number(maxRuntime) : null,
      language: language || null,
      sortBy,
    });
  }

  function reset() {
    setName("");
    setPerson("");
    setGenreId(null);
    setYearFrom("");
    setYearTo("");
    setMinRating(0);
    setMaxRuntime("");
    setLanguage("");
    setSortBy("popularity.desc");
    setQuery(null);
  }

  async function handleAdd(id: number, status: "to_watch" | "watched") {
    if (!apiKey) return;
    setBusyId(id);
    try {
      const details = await getMovieDetails(id, apiKey);
      await addMovie(details, status);
      setToast(
        status === "watched"
          ? `Marked “${details.title}” as watched`
          : `Added “${details.title}” to your watchlist`,
      );
      window.setTimeout(() => setToast(""), 2200);
    } finally {
      setBusyId(null);
    }
  }

  function handleOpen(id: number) {
    selectMovie(id);
    onClose();
  }

  return (
    <div className="overlay items-start justify-center overflow-y-auto" onMouseDown={onClose}>
      <div className="modal my-[4vh] max-w-3xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-white">Advanced search</h2>
            <p className="text-[12px] text-ink-600">
              Find films by title, cast or director, genre, era, rating and more.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary h-8 w-8 shrink-0 p-0">
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {!apiKey ? (
            <p className="text-[13px] text-ink-600">Add your TMDB API key in Settings to search.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Movie title</label>
                  <div className="relative">
                    <SearchIcon
                      width={14}
                      height={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600"
                    />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") runSearch();
                      }}
                      placeholder="e.g. Blade Runner"
                      className={`${field} pl-9 placeholder:text-ink-600`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Cast or director</label>
                  <div className="relative">
                    <SearchIcon
                      width={14}
                      height={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600"
                    />
                    <input
                      value={person}
                      onChange={(e) => setPerson(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") runSearch();
                      }}
                      placeholder="e.g. Christopher Nolan"
                      className={`${field} pl-9 placeholder:text-ink-600`}
                    />
                  </div>
                </div>
              </div>
              {name.trim() && person.trim() && (
                <p className="-mt-1 text-[11px] text-ink-600">
                  Tip: title search takes priority. Clear the title to search by cast or director
                  (and combine it with the filters below).
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Genre</label>
                  <select
                    value={genreId ?? ""}
                    onChange={(e) => setGenreId(e.target.value ? Number(e.target.value) : null)}
                    className={field}
                  >
                    <option value="">Any genre</option>
                    {TMDB_GENRES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={field}
                  >
                    <option value="">Any language</option>
                    {TMDB_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className={field}
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Year from</label>
                  <input
                    type="number"
                    min={1900}
                    max={CURRENT_YEAR}
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="e.g. 1990"
                    className={`${field} placeholder:text-ink-600`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Year to</label>
                  <input
                    type="number"
                    min={1900}
                    max={CURRENT_YEAR}
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder={`e.g. ${CURRENT_YEAR}`}
                    className={`${field} placeholder:text-ink-600`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max runtime (min)</label>
                  <input
                    type="number"
                    min={40}
                    max={360}
                    value={maxRuntime}
                    onChange={(e) => setMaxRuntime(e.target.value)}
                    placeholder="e.g. 120"
                    className={`${field} placeholder:text-ink-600`}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Minimum rating {minRating > 0 && <span className="text-brand">· {minRating}+</span>}
                </label>
                <input
                  type="range"
                  min={0}
                  max={9}
                  step={1}
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full accent-brand"
                />
                <div className="flex justify-between text-[10px] text-ink-600">
                  <span>Any</span>
                  <span>9+</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={runSearch} className="btn btn-primary btn-md">
                  <SearchIcon width={14} height={14} />
                  Search
                </button>
                <button onClick={reset} className="btn btn-secondary btn-md">
                  Reset
                </button>
              </div>

              {query && (
                <div className="border-t border-white/[0.06] pt-4">
                  {isLoading ? (
                    <p className="text-[13px] text-ink-600">Searching…</p>
                  ) : isError ? (
                    <p className="text-[13px] text-red-400">
                      {error instanceof Error ? error.message : "Search failed."}
                    </p>
                  ) : (data?.length ?? 0) === 0 && isFetched ? (
                    <p className="text-[13px] text-ink-600">
                      No films match. Double-check the spelling of a cast/director name, or loosen
                      the filters.
                    </p>
                  ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3">
                      {(data ?? []).map((m) => (
                        <PosterAddCard
                          key={m.id}
                          movie={m}
                          saved={savedIds.has(m.id)}
                          busy={busyId === m.id}
                          onAdd={() => handleAdd(m.id, "to_watch")}
                          onMarkWatched={() => handleAdd(m.id, "watched")}
                          onOpen={() => handleOpen(m.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-ink-700 px-4 py-2 text-[13px] text-white shadow-lg ring-1 ring-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}
