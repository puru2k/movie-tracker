import { useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { computeInsights, type Count, type StatsRange } from "../lib/stats";
import { posterSrc, TMDB_GENRES } from "../lib/tmdb";
import type { MovieView } from "../types";
import { ChartIcon, ClockIcon, FilmIcon, HeartIcon, StarIcon } from "./Icons";
import { AchievementsPanel } from "./AchievementsPanel";
import { WatchHeatmap } from "./WatchHeatmap";

const PIE_COLORS = [
  "#f59e0b", "#60a5fa", "#34d399", "#f472b6",
  "#a78bfa", "#f87171", "#22d3ee", "#facc15",
];

const RANGE_LABELS: Record<StatsRange, string> = {
  all: "All time",
  year: "This year",
  month: "This month",
};

function formatWatchTime(minutes: number): { value: string; sub: string } {
  if (minutes <= 0) return { value: "0h", sub: "nothing logged yet" };
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const days = (minutes / 60 / 24).toFixed(1);
  return {
    value: hours >= 1 ? `${hours}h ${mins}m` : `${mins}m`,
    sub: hours >= 24 ? `about ${days} days` : "of screen time",
  };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-ink-850/70 p-4 ring-1 ring-white/[0.06]">
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-600">
        {title}
      </h3>
      {children}
    </section>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      className={`rounded-xl bg-ink-850/70 p-4 text-left ring-1 ring-white/[0.06] ${
        clickable ? "cursor-pointer transition hover:ring-brand/40" : ""
      }`}
    >
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand">
        {icon}
      </div>
      <div
        className={`truncate text-2xl font-semibold tracking-tight ${
          clickable && value !== "—" ? "text-brand" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="text-[12px] text-white/70">{label}</div>
      {sub && <div className="truncate text-[11px] text-ink-600">{sub}</div>}
    </div>
  );
}

function HBars({
  data,
  accentTop = false,
  onLabel,
}: {
  data: Count[];
  accentTop?: boolean;
  onLabel?: (label: string) => void;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          {onLabel ? (
            <button
              onClick={() => onLabel(d.label)}
              title={`See ${d.label}'s films`}
              className="w-28 shrink-0 truncate text-left text-[12px] text-white/75 underline-offset-2 transition hover:text-brand hover:underline"
            >
              {d.label}
            </button>
          ) : (
            <span className="w-28 shrink-0 truncate text-[12px] text-white/75" title={d.label}>
              {d.label}
            </span>
          )}
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full ${accentTop && i === 0 ? "bg-accent" : "bg-brand"}`}
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-ink-600">
            {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function GenrePie({ data, onGenre }: { data: Count[]; onGenre?: (label: string) => void }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;
  let acc = 0;
  const stops = data.map((d, i) => {
    const start = (acc / total) * 360;
    acc += d.count;
    const end = (acc / total) * 360;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}deg ${end}deg`;
  });
  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-ink-850 text-center">
          <span className="text-lg font-semibold text-white">{total}</span>
          <span className="text-[9px] text-ink-600">genre tags</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {data.map((d, i) => {
          const browsable = onGenre && TMDB_GENRES.some((g) => g.name === d.label);
          return (
            <div key={d.label} className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              {browsable ? (
                <button
                  onClick={() => onGenre!(d.label)}
                  title={`Browse ${d.label} films`}
                  className="min-w-0 flex-1 truncate text-left text-white/75 underline-offset-2 transition hover:text-brand hover:underline"
                >
                  {d.label}
                </button>
              ) : (
                <span className="min-w-0 flex-1 truncate text-white/75">{d.label}</span>
              )}
              <span className="tabular-nums text-ink-600">
                {Math.round((d.count / total) * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PosterRow({ movies }: { movies: MovieView[] }) {
  const select = useAppStore((s) => s.selectMovie);
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {movies.map((m) => {
        const poster = posterSrc(m, "w185");
        return (
          <button
            key={m.tmdb_id}
            onClick={() => select(m.tmdb_id)}
            className="group w-[72px] shrink-0 text-left"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-ink-800 ring-1 ring-white/[0.06] transition group-hover:ring-white/20">
              {poster ? (
                <img src={poster} alt={m.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-600">
                  <FilmIcon width={18} height={18} />
                </div>
              )}
              {m.rating != null && (
                <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded bg-black/70 px-1 text-[10px] font-semibold text-accent">
                  <StarIcon width={9} height={9} />
                  {(m.rating / 2).toFixed(1)}
                </div>
              )}
              {Math.max(m.rewatch_count, m.watch_dates.length) > 1 && (
                <div className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[9px] font-semibold text-white/90">
                  {Math.max(m.rewatch_count + 1, m.watch_dates.length)}×
                </div>
              )}
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] leading-tight text-white/70">
              {m.title}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function StatsView() {
  const movies = useAppStore((s) => s.movies);
  const openPerson = useAppStore((s) => s.openPerson);
  const openAdvanced = useAppStore((s) => s.openAdvanced);
  const [range, setRange] = useState<StatsRange>("all");

  const browseGenre = (label: string) => {
    const g = TMDB_GENRES.find((x) => x.name === label);
    if (g) openAdvanced(g.id);
  };
  const s = useMemo(() => computeInsights(movies, range), [movies, range]);

  if (movies.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-ink-600">
          <ChartIcon width={26} height={26} />
        </span>
        <p className="text-[13px] font-medium text-white/85">No insights yet</p>
        <p className="text-[12px] text-ink-600">
          Add and rate some movies to see your viewing stats here.
        </p>
      </div>
    );
  }

  const time = formatWatchTime(s.totalMinutes);
  const monthMax = Math.max(1, ...s.months.map((m) => m.count));
  const ratingMax = Math.max(1, ...s.ratingDistribution);
  const longest = s.longestMovie;
  const avgRuntimeLabel =
    s.avgRuntime != null
      ? `${Math.floor(s.avgRuntime / 60)}h ${s.avgRuntime % 60}m`
      : "—";
  const busiestLabel = s.busiestDay
    ? new Date(`${s.busiestDay.date}T00:00:00`).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-4">
      {/* Range toggle */}
      <div className="flex items-center justify-end">
        <div className="inline-flex rounded-lg bg-ink-850/70 p-0.5 ring-1 ring-white/[0.06]">
          {(Object.keys(RANGE_LABELS) as StatsRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-[12px] font-medium transition ${
                range === r ? "bg-brand text-white" : "text-ink-600 hover:text-white"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<ChartIcon width={17} height={17} />}
          value={String(s.watchedCount)}
          label={range === "all" ? "Watched" : `Watched ${RANGE_LABELS[range].toLowerCase()}`}
          sub={`${s.ratedCount} rated${range === "all" ? ` · ${s.toWatchCount} to watch` : ""}`}
        />
        <StatCard
          icon={<ClockIcon width={17} height={17} />}
          value={time.value}
          label="Time watched"
          sub={time.sub}
        />
        <StatCard
          icon={<StarIcon width={16} height={16} />}
          value={s.avgRating != null ? `${s.avgRating.toFixed(1)}` : "—"}
          label="Average rating"
          sub={s.avgRating != null ? "out of 5 stars" : "rate a movie to start"}
        />
        <StatCard
          icon={<FilmIcon width={17} height={17} />}
          value={String(s.totalTracked)}
          label="In your library"
          sub={s.topGenres[0] ? `top genre: ${s.topGenres[0].label}` : "across all lists"}
        />
      </div>

      {/* People highlights */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={<FilmIcon width={17} height={17} />}
          value={s.favoriteActor ?? "—"}
          label="Favorite actor"
          sub={s.favoriteActor ? "most seen on screen" : "no cast data yet"}
          onClick={s.favoriteActor ? () => openPerson(s.favoriteActor!, "cast") : undefined}
        />
        <StatCard
          icon={<FilmIcon width={17} height={17} />}
          value={s.favoriteDirector ?? "—"}
          label="Most-seen director"
          sub={s.favoriteDirector ? "directed the most of your films" : "no director data yet"}
          onClick={
            s.favoriteDirector ? () => openPerson(s.favoriteDirector!, "director") : undefined
          }
        />
      </div>

      {/* More highlights */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<ClockIcon width={16} height={16} />}
          value={s.favoriteDecade ?? "—"}
          label="Favorite decade"
          sub={s.favoriteDecade ? "you watch most from here" : "no release data yet"}
        />
        <StatCard
          icon={<ClockIcon width={16} height={16} />}
          value={avgRuntimeLabel}
          label="Average runtime"
          sub={s.avgRuntime != null ? "per film watched" : "no runtime data"}
        />
        <StatCard
          icon={<ChartIcon width={16} height={16} />}
          value={s.currentStreakWeeks > 0 ? `${s.currentStreakWeeks} wk` : "—"}
          label="Current streak"
          sub={s.currentStreakWeeks > 0 ? "weeks in a row" : "watch something this week"}
        />
        <StatCard
          icon={<HeartIcon width={16} height={16} />}
          value={s.busiestDay ? `${s.busiestDay.count} films` : "—"}
          label="Busiest day"
          sub={s.busiestDay ? busiestLabel : "no viewings logged"}
        />
      </div>

      {(s.distinctDirectors > 0 || s.distinctActors > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<FilmIcon width={16} height={16} />}
            value={String(s.distinctDirectors)}
            label="Directors explored"
            sub="unique directors watched"
          />
          <StatCard
            icon={<FilmIcon width={16} height={16} />}
            value={String(s.distinctActors)}
            label="Actors seen"
            sub="unique performers on screen"
          />
        </div>
      )}

      {longest && (
        <div className="rounded-xl bg-ink-850/70 p-4 ring-1 ring-white/[0.06]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-600">
                Longest movie watched
              </div>
              <div className="mt-1 truncate text-[15px] font-medium text-white">
                {longest.title}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xl font-semibold text-white">
                {Math.floor((longest.runtime ?? 0) / 60)}h {(longest.runtime ?? 0) % 60}m
              </div>
              <div className="text-[11px] text-ink-600">runtime</div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <Panel title="Watch heatmap">
        <WatchHeatmap days={s.heatmap} max={s.heatmapMax} total={s.heatmapTotal} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {s.topGenres.length > 0 && (
          <Panel title="Genre breakdown">
            <GenrePie data={s.topGenres} onGenre={browseGenre} />
          </Panel>
        )}

        {s.topActors.length > 0 && (
          <Panel title="Most-seen actors">
            <HBars data={s.topActors} accentTop onLabel={(name) => openPerson(name, "cast")} />
          </Panel>
        )}

        <Panel title="Ratings distribution">
          <div className="flex h-32 items-end gap-1.5">
            {s.ratingDistribution.map((count, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-accent/80"
                    style={{ height: `${(count / ratingMax) * 100}%` }}
                    title={`${(i + 1) / 2} stars: ${count}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-ink-600">
            <span>½</span>
            <span>★</span>
            <span>★★</span>
            <span>★★★</span>
            <span>★★★★</span>
            <span>★★★★★</span>
          </div>
        </Panel>

        {s.runtimeDistribution.some((d) => d.count > 0) && (
          <Panel title="Runtime distribution">
            <HBars data={s.runtimeDistribution} />
          </Panel>
        )}

        {s.byDecade.length > 0 && (
          <Panel title="Films by decade">
            <HBars data={s.byDecade} />
          </Panel>
        )}

        {s.topDirectors.length > 0 && (
          <Panel title="Most-seen directors">
            <HBars
              data={s.topDirectors}
              accentTop
              onLabel={(name) => openPerson(name, "director")}
            />
          </Panel>
        )}

        {s.months.length > 0 && (
          <Panel title="Watch activity">
            <div className="flex h-28 items-end gap-1.5">
              {s.months.map((m) => (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t ${
                        s.bestMonth?.key === m.key ? "bg-accent" : "bg-brand"
                      }`}
                      style={{ height: `${(m.count / monthMax) * 100}%` }}
                      title={`${m.label}: ${m.count} watched${
                        m.avgRating != null ? ` · avg ${m.avgRating.toFixed(1)}★` : ""
                      }`}
                    />
                  </div>
                  <span className="w-full truncate text-center text-[9px] text-ink-600">
                    {m.label.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
            {s.bestMonth && (
              <p className="mt-2 text-[11px] text-ink-600">
                Best month:{" "}
                <span className="text-accent">{s.bestMonth.label}</span> (avg{" "}
                {s.bestMonth.avgRating?.toFixed(1)}★)
              </p>
            )}
          </Panel>
        )}

        {s.topPlatforms.length > 0 && (
          <Panel title="Where you watch">
            <HBars data={s.topPlatforms} accentTop />
          </Panel>
        )}
      </div>

      {s.topRated.length > 0 && (
        <Panel title="Your highest rated">
          <PosterRow movies={s.topRated} />
        </Panel>
      )}

      {s.mostRewatched.length > 0 && (
        <Panel title="Most rewatched">
          <PosterRow movies={s.mostRewatched} />
        </Panel>
      )}

      <AchievementsPanel movies={movies} />
    </div>
  );
}
