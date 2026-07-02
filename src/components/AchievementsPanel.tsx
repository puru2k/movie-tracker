import { useMemo } from "react";
import type { MovieView } from "../types";
import { computeAchievements, computeChallenges } from "../lib/achievements";

export function AchievementsPanel({ movies }: { movies: MovieView[] }) {
  const achievements = useMemo(() => computeAchievements(movies), [movies]);
  const challenges = useMemo(() => computeChallenges(movies), [movies]);
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-xl bg-ink-850/70 p-4 ring-1 ring-white/[0.06]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-ink-600">
            Achievements
          </h3>
          <span className="text-[11px] text-ink-600">
            {earnedCount} / {achievements.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-lg p-2.5 ring-1 transition ${
                a.earned
                  ? "bg-brand/10 ring-brand/30"
                  : "bg-white/[0.02] ring-white/[0.06]"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  a.earned ? "bg-brand text-white" : "bg-white/[0.06] text-ink-600"
                }`}
              >
                {a.earned ? "✓" : Math.round((a.current / a.target) * 100) + "%"}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-[13px] font-medium ${
                    a.earned ? "text-white" : "text-white/70"
                  }`}
                >
                  {a.name}
                </div>
                <div className="truncate text-[11px] text-ink-600">
                  {a.earned ? a.description : `${a.description} · ${a.current}/${a.target}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-ink-850/70 p-4 ring-1 ring-white/[0.06]">
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-600">
          Challenges
        </h3>
        <div className="flex flex-col gap-4">
          {challenges.map((c) => {
            const pct = Math.round((c.current / c.target) * 100);
            const done = c.current >= c.target;
            return (
              <div key={c.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[13px] font-medium text-white">{c.name}</span>
                    <span className="ml-2 text-[11px] text-ink-600">{c.period}</span>
                  </div>
                  <span
                    className={`shrink-0 text-[12px] font-semibold tabular-nums ${
                      done ? "text-accent" : "text-white/80"
                    }`}
                  >
                    {c.current} / {c.target}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full ${done ? "bg-accent" : "bg-brand"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-ink-600">{c.description}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
