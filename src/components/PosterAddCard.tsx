import { tmdbImage } from "../lib/tmdb";
import type { TmdbSearchResult } from "../types";
import { CheckIcon, FilmIcon, PlusIcon, StarIcon } from "./Icons";

/** A poster tile with hover quick-add (✓ watched / + watchlist) and an in-library state. */
export function PosterAddCard({
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
      <button onClick={onOpen} className="poster cursor-pointer">
        {poster ? (
          <img src={poster} alt={movie.title} loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-600">
            <FilmIcon width={22} height={22} />
          </div>
        )}

        {movie.vote_average != null && movie.vote_average > 0 && (
          <div className="badge-glass absolute right-1.5 top-1.5 text-[10px] text-accent">
            <StarIcon width={9} height={9} />
            {movie.vote_average.toFixed(1)}
          </div>
        )}

        {saved ? (
          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-positive/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            <CheckIcon width={10} height={10} /> In library
          </div>
        ) : (
          <div className="hover-actions absolute bottom-1.5 right-1.5 flex flex-col gap-1.5">
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
      <div className="mt-1.5 line-clamp-1 text-[12px] font-medium text-white/85">{movie.title}</div>
      <div className="text-[11px] text-ink-600">
        {movie.release_date ? movie.release_date.slice(0, 4) : "—"}
      </div>
    </div>
  );
}
