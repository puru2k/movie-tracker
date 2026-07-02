import type { MovieView } from "../types";
import { STATUS_LABELS } from "../types";
import { posterSrc } from "../lib/tmdb";
import { FilmIcon, StarIcon, HeartIcon } from "./Icons";

function year(date: string | null): string {
  return date ? date.slice(0, 4) : "—";
}

function runtimeLabel(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** A compact horizontal library row for the list layout. */
export function MovieListItem({ movie, onClick }: { movie: MovieView; onClick: () => void }) {
  const poster = posterSrc(movie, "w185");
  const runtime = runtimeLabel(movie.runtime);
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 rounded-xl bg-ink-850/50 p-2 text-left ring-1 ring-white/[0.05] transition hover:bg-ink-850 hover:ring-white/[0.12]"
    >
      <div className="h-[66px] w-11 shrink-0 overflow-hidden rounded-md bg-ink-800">
        {poster ? (
          <img src={poster} alt={movie.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-600">
            <FilmIcon width={18} height={18} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-medium text-white/90">{movie.title}</span>
          {movie.favorite === 1 && (
            <HeartIcon width={12} height={12} className="shrink-0 text-rose-500" fill="currentColor" />
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-600">
          <span>{year(movie.release_date)}</span>
          {runtime && (
            <>
              <span>·</span>
              <span>{runtime}</span>
            </>
          )}
          {movie.director && (
            <>
              <span>·</span>
              <span className="truncate">Dir. {movie.director}</span>
            </>
          )}
          {movie.platform && (
            <>
              <span>·</span>
              <span className="truncate">{movie.platform}</span>
            </>
          )}
        </div>
        {movie.genres.length > 0 && (
          <div className="mt-1 truncate text-[11px] text-ink-600">
            {movie.genres.slice(0, 3).join(" · ")}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 pr-1">
        {movie.rating != null ? (
          <span className="flex items-center gap-1 text-[12px] font-semibold text-accent">
            <StarIcon width={12} height={12} />
            {(movie.rating / 2).toFixed(1)}
          </span>
        ) : (
          <span className="text-[11px] text-ink-600">Not rated</span>
        )}
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/60">
          {STATUS_LABELS[movie.status]}
        </span>
      </div>
    </button>
  );
}
