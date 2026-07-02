import { useEffect, useMemo, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppStore } from "../store/useAppStore";
import {
  tmdbImage,
  posterSrc,
  getMovieExtras,
  getMovieDetails,
  type MovieExtras,
} from "../lib/tmdb";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type MovieView,
  type TmdbMovieDetails,
  type WatchStatus,
} from "../types";
import { StarRating } from "./StarRating";
import {
  CheckIcon,
  ChevronLeftIcon,
  CloseIcon,
  FilmIcon,
  HeartIcon,
  PlayIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from "./Icons";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function todayIso(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

function runtimeLabel(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  );
}

const fieldLabel = "field-label";

/** Small back button shown when there's nested navigation history to pop. */
function BackButton() {
  const canBack = useAppStore((s) => s.navStack.length > 1);
  const navBack = useAppStore((s) => s.navBack);
  if (!canBack) return null;
  return (
    <button onClick={navBack} title="Back" aria-label="Back" className="icon-btn-glass">
      <ChevronLeftIcon width={18} height={18} />
    </button>
  );
}

/** Top-level: route to the library editor or a read-only preview. */
export function MovieDetail() {
  const selectedId = useAppStore((s) => s.selectedId);
  const movies = useAppStore((s) => s.movies);
  const libMovie = useMemo(
    () => movies.find((m) => m.tmdb_id === selectedId) ?? null,
    [movies, selectedId],
  );

  if (selectedId == null) return null;
  if (libMovie) return <LibraryDetail movie={libMovie} />;
  return <PreviewDetail id={selectedId} />;
}

/** Full editor for a movie that lives in the library. */
function LibraryDetail({ movie }: { movie: MovieView }) {
  const clearSelection = useAppStore((s) => s.clearSelection);
  const setStatus = useAppStore((s) => s.setStatus);
  const setRating = useAppStore((s) => s.setRating);
  const setNotes = useAppStore((s) => s.setNotes);
  const setRewatchCount = useAppStore((s) => s.setRewatchCount);
  const setPlatform = useAppStore((s) => s.setPlatform);
  const setTags = useAppStore((s) => s.setTags);
  const setFavorite = useAppStore((s) => s.setFavorite);
  const openPerson = useAppStore((s) => s.openPerson);
  const setWatchDates = useAppStore((s) => s.setWatchDates);
  const setReview = useAppStore((s) => s.setReview);
  const setSpoiler = useAppStore((s) => s.setSpoiler);
  const removeMovie = useAppStore((s) => s.removeMovie);
  const apiKey = useAppStore((s) => s.apiKey);

  // Local buffers for text fields; persisted on blur so typing stays smooth.
  const [notesDraft, setNotesDraft] = useState("");
  const [reviewDraft, setReviewDraft] = useState("");
  const [platformDraft, setPlatformDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [newDate, setNewDate] = useState(todayIso());
  const [extras, setExtras] = useState<MovieExtras | null>(null);

  useEffect(() => {
    setNotesDraft(movie.notes ?? "");
    setReviewDraft(movie.review ?? "");
    setPlatformDraft(movie.platform ?? "");
    setTagsDraft(movie.tags.join(", "));
    setNewDate(todayIso());
  }, [movie.tmdb_id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setExtras(null);
    if (!apiKey) return;
    let cancelled = false;
    getMovieExtras(movie.tmdb_id, apiKey)
      .then((e) => {
        if (!cancelled) setExtras(e);
      })
      .catch(() => {
        /* extras are best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [movie.tmdb_id, apiKey]);

  const poster = posterSrc(movie, "w342");
  const backdrop = tmdbImage(movie.backdrop_path, "w780");
  const runtime = runtimeLabel(movie.runtime);
  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const isWatched = movie.status === "watched";
  const watchDates = [...movie.watch_dates].sort().reverse();
  const dateUnknown = isWatched && watchDates.length === 0;

  async function handleStatus(status: WatchStatus) {
    await setStatus(movie.tmdb_id, status);
    if (status === "watched" && movie.watch_dates.length === 0) {
      await setWatchDates(movie.tmdb_id, [todayIso()]);
    }
  }

  function addWatchDate(date: string) {
    if (!date) return;
    void setWatchDates(movie.tmdb_id, [...movie.watch_dates, date]);
  }

  function removeWatchDate(date: string) {
    void setWatchDates(
      movie.tmdb_id,
      movie.watch_dates.filter((d) => d !== date),
    );
  }

  return (
    <div className="overlay items-start justify-center overflow-y-auto" onMouseDown={clearSelection}>
      <div className="modal my-[4vh] max-w-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="relative h-44 w-full bg-ink-800">
          {backdrop && (
            <img src={backdrop} alt="" className="h-full w-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-ink-850/40 to-transparent" />
          <div className="absolute left-3 top-3">
            <BackButton />
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <button
              onClick={() => setFavorite(movie.tmdb_id, !movie.favorite)}
              title={movie.favorite ? "Remove from favorites" : "Add to favorites"}
              aria-label="Toggle favorite"
              className={`icon-btn-glass ${movie.favorite ? "text-rose-500 hover:text-rose-400" : ""}`}
            >
              <HeartIcon
                width={18}
                height={18}
                fill={movie.favorite ? "currentColor" : "none"}
              />
            </button>
            <button onClick={clearSelection} className="icon-btn-glass">
              <CloseIcon width={18} height={18} />
            </button>
          </div>
        </div>

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-20 flex gap-4">
            <div className="h-[10.5rem] w-28 shrink-0 overflow-hidden rounded-lg bg-ink-800 shadow-lg shadow-black/50 ring-1 ring-white/10 sm:h-48 sm:w-32">
              {poster ? (
                <img src={poster} alt={movie.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-600">
                  <FilmIcon width={30} height={30} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-20">
              <h2 className="text-lg font-semibold leading-tight text-white sm:text-xl">{movie.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-600">
                {releaseYear && <span>{releaseYear}</span>}
                {runtime && (
                  <>
                    <span>·</span>
                    <span>{runtime}</span>
                  </>
                )}
                {movie.director && (
                  <>
                    <span>·</span>
                    <span>
                      Dir.{" "}
                      <button
                        onClick={() => openPerson(movie.director!, "director")}
                        className="text-brand underline-offset-2 transition hover:text-white hover:underline"
                      >
                        {movie.director}
                      </button>
                    </span>
                  </>
                )}
              </div>
              {movie.genres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {movie.genres.map((g) => (
                    <span key={g} className="tag">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {movie.overview && (
            <p className="mt-4 text-sm leading-relaxed text-white/70">{movie.overview}</p>
          )}

          {movie.cast_members.length > 0 && (
            <p className="mt-3 text-xs text-ink-600">
              <span className="text-white/60">Cast: </span>
              {movie.cast_members.map((name, i) => (
                <span key={name}>
                  {i > 0 && ", "}
                  <button
                    onClick={() => openPerson(name, "cast")}
                    className="text-brand underline-offset-2 transition hover:text-white hover:underline"
                  >
                    {name}
                  </button>
                </span>
              ))}
            </p>
          )}

          {extras && (extras.trailerUrl || extras.voteAverage || extras.providers.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {extras.trailerUrl && (
                <button
                  onClick={() => void openUrl(extras.trailerUrl!)}
                  className="btn btn-secondary btn-sm"
                >
                  <PlayIcon width={13} height={13} />
                  Trailer
                </button>
              )}
              {extras.voteAverage != null && extras.voteAverage > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[12px] text-white/80">
                  <StarIcon width={12} height={12} className="text-accent" />
                  {extras.voteAverage.toFixed(1)}
                  <span className="text-ink-600">TMDB</span>
                </span>
              )}
              {extras.providers.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-600">
                  <span className="text-white/60">Streaming:</span>
                  {extras.providers.slice(0, 4).join(" · ")}
                </span>
              )}
            </div>
          )}

          <div className="inset-panel mt-5 space-y-4 p-4">
            <div>
              <div className={fieldLabel}>Status</div>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((status) => {
                  const active = movie.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatus(status)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition ${
                        active
                          ? "bg-brand text-white"
                          : "bg-white/5 text-ink-600 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className={fieldLabel}>Your rating</div>
                <div className="flex items-center gap-3">
                  <StarRating value={movie.rating} onChange={(v) => setRating(movie.tmdb_id, v)} />
                  <span className="text-sm text-ink-600">
                    {movie.rating != null ? `${(movie.rating / 2).toFixed(1)} / 5` : "Not rated"}
                  </span>
                </div>
              </div>

              <div>
                <div className={fieldLabel}>Rewatches</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRewatchCount(movie.tmdb_id, movie.rewatch_count - 1)}
                    disabled={movie.rewatch_count <= 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-lg text-white/80 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold text-white">
                    {movie.rewatch_count}×
                  </span>
                  <button
                    onClick={() => setRewatchCount(movie.tmdb_id, movie.rewatch_count + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-lg text-white/80 transition hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className={fieldLabel}>
                Watch history
                {watchDates.length > 0 && (
                  <span className="ml-1.5 text-ink-500">· {watchDates.length} logged</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={newDate}
                  max={todayIso()}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="rounded-lg bg-ink-950 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-brand [color-scheme:dark]"
                />
                <button
                  onClick={() => addWatchDate(newDate)}
                  className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
                >
                  Add date
                </button>
                <button
                  onClick={() => addWatchDate(todayIso())}
                  className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
                >
                  Log today
                </button>
                {dateUnknown && (
                  <span className="text-xs text-ink-600">Watched · date unknown</span>
                )}
              </div>
              {watchDates.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {watchDates.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/80"
                    >
                      {formatDate(d)}
                      <button
                        onClick={() => removeWatchDate(d)}
                        aria-label={`Remove ${d}`}
                        className="text-ink-600 transition hover:text-red-400"
                      >
                        <CloseIcon width={11} height={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className={fieldLabel}>Where you watched it</div>
              <input
                value={platformDraft}
                onChange={(e) => setPlatformDraft(e.target.value)}
                onBlur={() =>
                  setPlatform(movie.tmdb_id, platformDraft.trim() || null)
                }
                placeholder="e.g. Netflix, Blu-ray, Theatre"
                className="field"
              />
            </div>

            <div>
              <div className={fieldLabel}>Tags</div>
              <input
                value={tagsDraft}
                onChange={(e) => setTagsDraft(e.target.value)}
                onBlur={() => setTags(movie.tmdb_id, parseTags(tagsDraft))}
                placeholder="Comma-separated, e.g. Comfort, Halloween, Rainy day"
                className="field"
              />
              {movie.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {movie.tags.map((t) => (
                    <span key={t} className="tag-brand">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className={`${fieldLabel} mb-0`}>Review</span>
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-ink-600">
                  <input
                    type="checkbox"
                    checked={movie.spoiler === 1}
                    onChange={(e) => setSpoiler(movie.tmdb_id, e.target.checked)}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  Contains spoilers
                </label>
              </div>
              {movie.spoiler === 1 && (
                <div className="mb-2 inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                  Spoiler-tagged
                </div>
              )}
              <input
                value={reviewDraft}
                onChange={(e) => setReviewDraft(e.target.value)}
                onBlur={() => setReview(movie.tmdb_id, reviewDraft.trim() || null)}
                placeholder="One-line verdict…"
                className="field mb-2"
              />
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={() => setNotes(movie.tmdb_id, notesDraft.trim() || null)}
                rows={4}
                placeholder="Long review — thoughts, favorite quotes, memorable scenes…"
                className="field resize-y leading-relaxed"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={() => removeMovie(movie.tmdb_id)} className="btn btn-danger btn-md">
              <TrashIcon width={16} height={16} />
              Remove from library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Read-only preview for a movie that isn't in the library yet (reached by
 *  drilling through a person's filmography). Adding it flips to the editor. */
function PreviewDetail({ id }: { id: number }) {
  const apiKey = useAppStore((s) => s.apiKey);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const openPerson = useAppStore((s) => s.openPerson);
  const addMovie = useAppStore((s) => s.addMovie);

  const [details, setDetails] = useState<TmdbMovieDetails | null>(null);
  const [extras, setExtras] = useState<MovieExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetails(null);
    setExtras(null);
    setError(null);
    setLoading(true);
    if (!apiKey) {
      setLoading(false);
      return;
    }
    getMovieDetails(id, apiKey)
      .then((d) => {
        if (!cancelled) setDetails(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load this movie.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    getMovieExtras(id, apiKey)
      .then((e) => {
        if (!cancelled) setExtras(e);
      })
      .catch(() => {
        /* best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [id, apiKey]);

  const poster = tmdbImage(details?.poster_path, "w342");
  const backdrop = tmdbImage(details?.backdrop_path, "w780");
  const runtime = runtimeLabel(details?.runtime ?? null);
  const releaseYear = details?.release_date ? details.release_date.slice(0, 4) : null;

  async function handleAdd(status: WatchStatus) {
    if (!details) return;
    setAdding(true);
    try {
      // Once added, the top-level MovieDetail re-renders into the editor.
      await addMovie(details, status);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="overlay items-start justify-center overflow-y-auto" onMouseDown={clearSelection}>
      <div className="modal my-[4vh] max-w-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="relative h-44 w-full bg-ink-800">
          {backdrop && (
            <img src={backdrop} alt="" className="h-full w-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-ink-850/40 to-transparent" />
          <div className="absolute left-3 top-3">
            <BackButton />
          </div>
          <div className="absolute right-3 top-3">
            <button onClick={clearSelection} className="icon-btn-glass">
              <CloseIcon width={18} height={18} />
            </button>
          </div>
        </div>

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          {loading ? (
            <p className="pt-8 text-[13px] text-ink-600">Loading movie…</p>
          ) : error ? (
            <p className="pt-8 text-[13px] text-red-400">{error}</p>
          ) : !details ? (
            <p className="pt-8 text-[13px] text-ink-600">
              {apiKey ? "No details found." : "Add your TMDB API key in Settings to view details."}
            </p>
          ) : (
            <>
              <div className="-mt-20 flex gap-4">
                <div className="h-[10.5rem] w-28 shrink-0 overflow-hidden rounded-lg bg-ink-800 shadow-lg shadow-black/50 ring-1 ring-white/10 sm:h-48 sm:w-32">
                  {poster ? (
                    <img src={poster} alt={details.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-600">
                      <FilmIcon width={30} height={30} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-20">
                  <h2 className="text-lg font-semibold leading-tight text-white sm:text-xl">{details.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-600">
                    {releaseYear && <span>{releaseYear}</span>}
                    {runtime && (
                      <>
                        <span>·</span>
                        <span>{runtime}</span>
                      </>
                    )}
                    {details.director && (
                      <>
                        <span>·</span>
                        <span>
                          Dir.{" "}
                          <button
                            onClick={() => openPerson(details.director!, "director")}
                            className="text-brand underline-offset-2 transition hover:text-white hover:underline"
                          >
                            {details.director}
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                  {details.genres.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {details.genres.map((g) => (
                        <span key={g} className="tag">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {details.overview && (
                <p className="mt-4 text-sm leading-relaxed text-white/70">{details.overview}</p>
              )}

              {details.cast_members.length > 0 && (
                <p className="mt-3 text-xs text-ink-600">
                  <span className="text-white/60">Cast: </span>
                  {details.cast_members.map((name, i) => (
                    <span key={name}>
                      {i > 0 && ", "}
                      <button
                        onClick={() => openPerson(name, "cast")}
                        className="text-brand underline-offset-2 transition hover:text-white hover:underline"
                      >
                        {name}
                      </button>
                    </span>
                  ))}
                </p>
              )}

              {extras && (extras.trailerUrl || extras.voteAverage || extras.providers.length > 0) && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {extras.trailerUrl && (
                    <button
                      onClick={() => void openUrl(extras.trailerUrl!)}
                      className="btn btn-secondary btn-sm"
                    >
                      <PlayIcon width={13} height={13} />
                      Trailer
                    </button>
                  )}
                  {extras.voteAverage != null && extras.voteAverage > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[12px] text-white/80">
                      <StarIcon width={12} height={12} className="text-accent" />
                      {extras.voteAverage.toFixed(1)}
                      <span className="text-ink-600">TMDB</span>
                    </span>
                  )}
                  {extras.providers.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-600">
                      <span className="text-white/60">Streaming:</span>
                      {extras.providers.slice(0, 4).join(" · ")}
                    </span>
                  )}
                </div>
              )}

              <div className="inset-panel mt-5 flex flex-wrap items-center gap-2 p-4">
                <span className="mr-1 text-[13px] text-ink-600">Not in your library yet.</span>
                <button
                  onClick={() => handleAdd("to_watch")}
                  disabled={adding}
                  className="btn btn-primary btn-md"
                >
                  <PlusIcon width={15} height={15} strokeWidth={2.5} />
                  Add to watchlist
                </button>
                <button
                  onClick={() => handleAdd("watched")}
                  disabled={adding}
                  className="btn btn-positive btn-md"
                >
                  <CheckIcon width={15} height={15} strokeWidth={2.5} />
                  Mark as watched
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
