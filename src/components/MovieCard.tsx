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
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/[0.06] transition duration-200 group-hover:ring-white/20 group-hover:shadow-lg group-hover:shadow-black/50 group-focus-visible:ring-2 group-focus-visible:ring-brand">
        {poster ? (
          <img
            src={poster}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-ink-600">
            <FilmIcon width={30} height={30} />
            <span className="text-center text-[11px] text-ink-600">No poster</span>
          </div>
        )}

        {movie.rating != null && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-accent backdrop-blur-sm">
            <StarIcon width={11} height={11} />
            {(movie.rating / 2).toFixed(1)}
          </div>
        )}

        <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
          {movie.favorite === 1 && (
            <div className="rounded-md bg-black/65 p-1 text-rose-500 backdrop-blur-sm">
              <HeartIcon width={11} height={11} fill="currentColor" />
            </div>
          )}
          {movie.rewatch_count > 0 && (
            <div className="rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
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
