import type { MovieView } from "../types";

export type StatsRange = "all" | "year" | "month";

export interface Count {
  label: string;
  count: number;
}

export interface MonthStat {
  key: string; // YYYY-MM
  label: string; // e.g. "Mar 2026"
  count: number;
  avgRating: number | null; // 0-5
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface Insights {
  totalTracked: number;
  watchedCount: number;
  watchingCount: number;
  toWatchCount: number;
  totalMinutes: number;
  ratedCount: number;
  avgRating: number | null; // 0-5
  topGenres: Count[];
  topDirectors: Count[];
  topActors: Count[];
  topPlatforms: Count[];
  favoriteActor: string | null;
  favoriteDirector: string | null;
  favoriteDecade: string | null;
  longestMovie: MovieView | null;
  avgRuntime: number | null; // minutes
  distinctDirectors: number;
  distinctActors: number;
  busiestDay: HeatmapDay | null;
  currentStreakWeeks: number; // consecutive weeks (incl. this) with ≥1 watch
  ratingDistribution: number[]; // 10 buckets, index 0 => 0.5 stars ... index 9 => 5 stars
  runtimeDistribution: Count[];
  byDecade: Count[];
  topRated: MovieView[];
  mostRewatched: MovieView[];
  months: MonthStat[]; // chronological, last up to 12 with activity
  bestMonth: MonthStat | null; // highest average rating
  heatmap: HeatmapDay[]; // one entry per day, Sunday-aligned, ending today
  heatmapTotal: number;
  heatmapMax: number;
}

function tally(values: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return map;
}

function topN(map: Map<string, number>, n: number): Count[] {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, n);
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function isoToday(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

function inRange(dateIso: string, range: StatsRange): boolean {
  if (range === "all") return true;
  const today = isoToday();
  if (range === "year") return dateIso.slice(0, 4) === today.slice(0, 4);
  return dateIso.slice(0, 7) === today.slice(0, 7); // month
}

export function computeInsights(movies: MovieView[], range: StatsRange = "all"): Insights {
  // Movies in scope: watched, and (for year/month) with at least one watch date in range.
  const scope = movies.filter((m) => {
    if (m.status !== "watched") return false;
    if (range === "all") return true;
    return m.watch_dates.some((d) => inRange(d, range));
  });

  // Viewings counted within the range for time-based totals.
  const viewings = (m: MovieView): number => {
    if (range === "all") return Math.max(m.watch_dates.length, 1);
    return m.watch_dates.filter((d) => inRange(d, range)).length;
  };

  const rated = scope.filter((m) => m.rating != null);
  const totalMinutes = scope.reduce((sum, m) => sum + (m.runtime ?? 0) * viewings(m), 0);

  const avgRating =
    rated.length > 0
      ? rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length / 2
      : null;

  const topGenres = topN(tally(scope.flatMap((m) => m.genres)), 8);
  const topDirectors = topN(
    tally(scope.map((m) => m.director).filter((d): d is string => Boolean(d))),
    6,
  );
  const topActors = topN(tally(scope.flatMap((m) => m.cast_members)), 8);
  const topPlatforms = topN(
    tally(scope.map((m) => m.platform).filter((p): p is string => Boolean(p))),
    6,
  );

  const favoriteActor = topActors[0]?.label ?? null;
  const favoriteDirector = topDirectors[0]?.label ?? null;
  const withRuntime = scope.filter((m) => m.runtime);
  const longestMovie =
    [...withRuntime].sort((a, b) => (b.runtime ?? 0) - (a.runtime ?? 0))[0] ?? null;
  const avgRuntime =
    withRuntime.length > 0
      ? Math.round(
          withRuntime.reduce((s, m) => s + (m.runtime ?? 0), 0) / withRuntime.length,
        )
      : null;
  const distinctDirectors = new Set(
    scope.map((m) => m.director).filter((d): d is string => Boolean(d)),
  ).size;
  const distinctActors = new Set(scope.flatMap((m) => m.cast_members)).size;

  const ratingDistribution = new Array(10).fill(0) as number[];
  for (const m of rated) {
    const idx = (m.rating as number) - 1; // rating 1..10 => index 0..9
    if (idx >= 0 && idx < 10) ratingDistribution[idx] += 1;
  }

  const runtimeBuckets = [
    { label: "< 90m", test: (r: number) => r < 90 },
    { label: "90–120m", test: (r: number) => r >= 90 && r < 120 },
    { label: "120–150m", test: (r: number) => r >= 120 && r < 150 },
    { label: "150m+", test: (r: number) => r >= 150 },
  ];
  const runtimeDistribution: Count[] = runtimeBuckets.map((b) => ({
    label: b.label,
    count: scope.filter((m) => m.runtime && b.test(m.runtime)).length,
  }));

  const decadeMap = new Map<string, number>();
  for (const m of scope) {
    if (!m.release_date) continue;
    const year = Number(m.release_date.slice(0, 4));
    if (!Number.isFinite(year)) continue;
    const decade = `${Math.floor(year / 10) * 10}s`;
    decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + 1);
  }
  const byDecade = [...decadeMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label));

  const favoriteDecade =
    [...decadeMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const topRated = [...rated]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 6);

  const mostRewatched = scope
    .filter((m) => m.rewatch_count > 0 || m.watch_dates.length > 1)
    .sort(
      (a, b) =>
        Math.max(b.rewatch_count, b.watch_dates.length) -
        Math.max(a.rewatch_count, a.watch_dates.length),
    )
    .slice(0, 6);

  // Monthly activity from all logged watch dates (independent of range).
  const monthMap = new Map<string, { count: number; ratingSum: number; ratingN: number }>();
  for (const m of movies) {
    for (const d of m.watch_dates) {
      const key = d.slice(0, 7); // YYYY-MM
      const entry = monthMap.get(key) ?? { count: 0, ratingSum: 0, ratingN: 0 };
      entry.count += 1;
      if (m.rating != null) {
        entry.ratingSum += m.rating;
        entry.ratingN += 1;
      }
      monthMap.set(key, entry);
    }
  }
  const months: MonthStat[] = [...monthMap.entries()]
    .map(([key, v]) => {
      const [y, mo] = key.split("-");
      return {
        key,
        label: `${MONTH_NAMES[Number(mo) - 1]} ${y}`,
        count: v.count,
        avgRating: v.ratingN > 0 ? v.ratingSum / v.ratingN / 2 : null,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12);

  const bestMonth =
    months
      .filter((m) => m.avgRating != null)
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))[0] ?? null;

  // GitHub-style heatmap: counts per day across all watch dates, for the last ~53 weeks.
  const dayCounts = new Map<string, number>();
  for (const m of movies) {
    for (const d of m.watch_dates) dayCounts.set(d, (dayCounts.get(d) ?? 0) + 1);
  }
  const busiestDay =
    [...dayCounts.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count || b.date.localeCompare(a.date))[0] ?? null;

  // Consecutive weeks (including the current one) that have at least one watch.
  const watchedWeeks = new Set<string>();
  const weekKey = (iso: string): string => {
    const dt = new Date(`${iso}T00:00:00`);
    dt.setDate(dt.getDate() - dt.getDay()); // back to Sunday
    const off = dt.getTimezoneOffset();
    return new Date(dt.getTime() - off * 60_000).toISOString().slice(0, 10);
  };
  for (const d of dayCounts.keys()) watchedWeeks.add(weekKey(d));
  let currentStreakWeeks = 0;
  {
    const cursor = new Date(`${isoToday()}T00:00:00`);
    cursor.setDate(cursor.getDate() - cursor.getDay());
    // Allow the streak to count even if this exact week is still empty but last week had one.
    for (let i = 0; i < 520; i++) {
      const off = cursor.getTimezoneOffset();
      const key = new Date(cursor.getTime() - off * 60_000).toISOString().slice(0, 10);
      if (watchedWeeks.has(key)) {
        currentStreakWeeks += 1;
      } else if (i > 0) {
        break;
      }
      cursor.setDate(cursor.getDate() - 7);
    }
  }

  const end = new Date(`${isoToday()}T00:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - 7 * 52);
  start.setDate(start.getDate() - start.getDay()); // back up to Sunday
  const heatmap: HeatmapDay[] = [];
  let heatmapTotal = 0;
  let heatmapMax = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const off = d.getTimezoneOffset();
    const iso = new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
    const count = dayCounts.get(iso) ?? 0;
    heatmap.push({ date: iso, count });
    heatmapTotal += count;
    if (count > heatmapMax) heatmapMax = count;
  }

  return {
    totalTracked: movies.length,
    watchedCount: scope.length,
    watchingCount: movies.filter((m) => m.status === "watching").length,
    toWatchCount: movies.filter((m) => m.status === "to_watch").length,
    totalMinutes,
    ratedCount: rated.length,
    avgRating,
    topGenres,
    topDirectors,
    topActors,
    topPlatforms,
    favoriteActor,
    favoriteDirector,
    favoriteDecade,
    longestMovie,
    avgRuntime,
    distinctDirectors,
    distinctActors,
    busiestDay,
    currentStreakWeeks,
    ratingDistribution,
    runtimeDistribution,
    byDecade,
    topRated,
    mostRewatched,
    months,
    bestMonth,
    heatmap,
    heatmapTotal,
    heatmapMax,
  };
}

export function formatWatchTime(minutes: number): string {
  if (minutes <= 0) return "0m";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
