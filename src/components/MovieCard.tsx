import type { MovieView } from "../types";
import { posterSrc } from "../lib/tmdb";
import { FilmIcon, StarIcon, HeartIcon } from "./Icons";

interface MovieCardProps {
  movie: MovieView;
  onClick: () => void;
}

function year(date: string | null): string {
  return date ? date.slice(0, 4) : "";
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const poster = posterSrc(movie, "w342");

  return (
    <button
      onClick={onClick}
      className="group flex flex-col text-left focus:outline-none"
    >
      <div className="poster group-focus-visible:ring-2 group-focus-visible:ring-brand">
        {poster ? (
          <img src={poster} alt={movie.title} loading="lazy" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-ink-600">
            <FilmIcon width={30} height={30} />
            <span className="text-center text-[11px] text-ink-600">No poster</span>
          </div>
        )}

        {movie.rating != null && (
          <div className="badge-glass absolute right-1.5 top-1.5 text-accent">
            <StarIcon width={11} height={11} />
            {(movie.rating / 2).toFixed(1)}
          </div>
        )}

        <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
          {movie.favorite === 1 && (
            <div className="badge-glass p-1 text-rose-500">
              <HeartIcon width={11} height={11} fill="currentColor" />
            </div>
          )}
          {movie.rewatch_count > 0 && (
            <div className="badge-glass text-[10px] text-white/90">
              {movie.rewatch_count + 1}× seen
            </div>
          )}
        </div>

        {movie.platform && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-2 pb-1.5 pt-8">
            <span className="line-clamp-1 text-[11px] font-medium text-white/90">
              {movie.platform}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 px-0.5 pt-2">
        <span className="line-clamp-1 text-[13px] font-medium text-white/90">{movie.title}</span>
        <span className="text-[11px] text-ink-600">{year(movie.release_date) || "—"}</span>
      </div>
    </button>
  );
}
