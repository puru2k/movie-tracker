import { useMemo } from "react";
import type { HeatmapDay } from "../lib/stats";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function level(count: number, max: number): number {
  if (count <= 0) return 0;
  if (max <= 1) return 4;
  const r = count / max;
  if (r > 0.75) return 4;
  if (r > 0.5) return 3;
  if (r > 0.25) return 2;
  return 1;
}

const LEVEL_BG = [
  "bg-white/[0.05]",
  "bg-brand/30",
  "bg-brand/50",
  "bg-brand/75",
  "bg-brand",
];

export function WatchHeatmap({
  days,
  max,
  total,
}: {
  days: HeatmapDay[];
  max: number;
  total: number;
}) {
  const weeks = useMemo(() => {
    const cols: HeatmapDay[][] = [];
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));
    return cols;
  }, [days]);

  // Month labels: show a label above the first week whose month differs from the previous.
  const monthLabels = useMemo(() => {
    let prev = -1;
    return weeks.map((w) => {
      const first = w[0];
      if (!first) return "";
      const m = new Date(`${first.date}T00:00:00`).getMonth();
      if (m !== prev) {
        prev = m;
        return MONTHS[m];
      }
      return "";
    });
  }, [weeks]);

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-[3px] pl-0.5">
            {monthLabels.map((label, i) => (
              <div key={i} className="w-[11px] text-[8px] leading-none text-ink-600">
                {label}
              </div>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} ${day.count === 1 ? "watch" : "watches"}`}
                    className={`h-[11px] w-[11px] rounded-[2px] ${LEVEL_BG[level(day.count, max)]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-600">
        <span>{total} viewings logged in the last year</span>
        <div className="flex items-center gap-1">
          <span className="mr-1">Less</span>
          {LEVEL_BG.map((bg, i) => (
            <span key={i} className={`h-[11px] w-[11px] rounded-[2px] ${bg}`} />
          ))}
          <span className="ml-1">More</span>
        </div>
      </div>
    </div>
  );
}
