import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import { getPersonFilmography, getMovieDetails, tmdbImage } from "../lib/tmdb";
import type { TmdbSearchResult } from "../types";
import { CheckIcon, ChevronLeftIcon, CloseIcon, FilmIcon, PlusIcon, StarIcon } from "./Icons";

function FilmCard({
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
    <div className="group w-full">
      <button
        onClick={onOpen}
        className="relative aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/[0.06]"
      >
        {poster ? (
          <img src={poster} alt={movie.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-600">
            <FilmIcon width={22} height={22} />
          </div>
        )}

        {movie.vote_average != null && movie.vote_average > 0 && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-accent backdrop-blur-sm">
            <StarIcon width={9} height={9} />
            {movie.vote_average.toFixed(1)}
          </div>
        )}

        {saved ? (
          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-emerald-500/85 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            <CheckIcon width={10} height={10} /> In library
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
              className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition hover:bg-emerald-400 disabled:opacity-70"
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
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-md transition hover:bg-brand-strong disabled:opacity-70"
            >
              <PlusIcon width={16} height={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </button>
      <div className="mt-1.5 line-clamp-1 text-[12px] font-medium text-white/85">{movie.title}</div>
      <div className="text-[11px] text-ink-600">
        {movie.release_date ? movie.release_date.slice(0, 4) : "—"}
      </div>
    </div>
  );
}

function FilmGrid({
  title,
  films,
  savedIds,
  busyId,
  onAdd,
  onMarkWatched,
  onOpen,
}: {
  title: string;
  films: TmdbSearchResult[];
  savedIds: Set<number>;
  busyId: number | null;
  onAdd: (id: number) => void;
  onMarkWatched: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  if (films.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2.5 text-[13px] font-semibold text-white/90">
        {title} <span className="text-ink-600">· {films.length}</span>
      </h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3">
        {films.map((m) => (
          <FilmCard
            key={m.id}
            movie={m}
            saved={savedIds.has(m.id)}
            busy={busyId === m.id}
            onAdd={() => onAdd(m.id)}
            onMarkWatched={() => onMarkWatched(m.id)}
            onOpen={() => onOpen(m.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function PersonModal() {
  const person = useAppStore((s) => s.person);
  const closePerson = useAppStore((s) => s.closePerson);
  const navBack = useAppStore((s) => s.navBack);
  const canBack = useAppStore((s) => s.navStack.length > 1);
  const apiKey = useAppStore((s) => s.apiKey);
  const movies = useAppStore((s) => s.movies);
  const addMovie = useAppStore((s) => s.addMovie);
  const selectMovie = useAppStore((s) => s.selectMovie);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const savedIds = useMemo(() => new Set(movies.map((m) => m.tmdb_id)), [movies]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["person", person?.name],
    queryFn: () => getPersonFilmography(person!.name, apiKey!),
    enabled: Boolean(person && apiKey),
    staleTime: 30 * 60_000,
  });

  if (!person) return null;

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
  }

  const roleLabel = person.role === "director" ? "Director" : "Actor";
  const directedFirst = person.role === "director";

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={closePerson}
    >
      <div
        className="animate-fade-in my-[4vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-white/10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
          {canBack && (
            <button
              onClick={navBack}
              title="Back"
              aria-label="Back"
              className="-ml-1 shrink-0 rounded-lg bg-white/[0.06] p-1.5 text-white/80 transition hover:bg-white/[0.12] hover:text-white"
            >
              <ChevronLeftIcon width={18} height={18} />
            </button>
          )}
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10">
            {data?.profile_path ? (
              <img
                src={tmdbImage(data.profile_path, "w185")!}
                alt={data.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink-600">
                <FilmIcon width={18} height={18} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-semibold text-white">
              {data?.name ?? person.name}
            </h2>
            <p className="text-[12px] text-ink-600">Filmography · {roleLabel}</p>
          </div>
          <button
            onClick={closePerson}
            className="rounded-lg bg-white/[0.06] p-1.5 text-white/80 transition hover:bg-white/[0.12] hover:text-white"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
          {!apiKey ? (
            <p className="text-[13px] text-ink-600">Add your TMDB API key in Settings to browse filmographies.</p>
          ) : isLoading ? (
            <p className="text-[13px] text-ink-600">Loading filmography…</p>
          ) : isError ? (
            <p className="text-[13px] text-red-400">
              {error instanceof Error ? error.message : "Couldn't load this person."}
            </p>
          ) : !data ? (
            <p className="text-[13px] text-ink-600">No TMDB match found for “{person.name}”.</p>
          ) : (
            <>
              {directedFirst ? (
                <>
                  <FilmGrid
                    title="Directed"
                    films={data.directed}
                    savedIds={savedIds}
                    busyId={busyId}
                    onAdd={(id) => handleAdd(id, "to_watch")}
                    onMarkWatched={(id) => handleAdd(id, "watched")}
                    onOpen={handleOpen}
                  />
                  <FilmGrid
                    title="Also appeared in"
                    films={data.acted}
                    savedIds={savedIds}
                    busyId={busyId}
                    onAdd={(id) => handleAdd(id, "to_watch")}
                    onMarkWatched={(id) => handleAdd(id, "watched")}
                    onOpen={handleOpen}
                  />
                </>
              ) : (
                <>
                  <FilmGrid
                    title="Acted in"
                    films={data.acted}
                    savedIds={savedIds}
                    busyId={busyId}
                    onAdd={(id) => handleAdd(id, "to_watch")}
                    onMarkWatched={(id) => handleAdd(id, "watched")}
                    onOpen={handleOpen}
                  />
                  <FilmGrid
                    title="Directed"
                    films={data.directed}
                    savedIds={savedIds}
                    busyId={busyId}
                    onAdd={(id) => handleAdd(id, "to_watch")}
                    onMarkWatched={(id) => handleAdd(id, "watched")}
                    onOpen={handleOpen}
                  />
                </>
              )}
              {data.directed.length === 0 && data.acted.length === 0 && (
                <p className="text-[13px] text-ink-600">No films found for this person.</p>
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
