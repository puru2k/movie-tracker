import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import { getMovieDetails, getRecommendations } from "../lib/tmdb";
import type { WatchStatus } from "../types";
import { PosterAddCard } from "./PosterAddCard";
import { HeartIcon, SparkIcon } from "./Icons";

export function RecommendationsView() {
  const apiKey = useAppStore((s) => s.apiKey);
  const movies = useAppStore((s) => s.movies);
  const addMovie = useAppStore((s) => s.addMovie);
  const selectMovie = useAppStore((s) => s.selectMovie);
  const openSettings = useAppStore((s) => s.openSettings);

  const [addingId, setAddingId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const savedIds = useMemo(() => new Set(movies.map((m) => m.tmdb_id)), [movies]);

  // Seed on films you engaged with: watched or favorited, weighted by rating.
  const { seeds, seedTitles } = useMemo(() => {
    const candidates = movies
      .filter((m) => m.status === "watched" || m.favorite === 1)
      .map((m) => {
        let weight = m.rating != null ? m.rating / 2 : 3; // 0.5–5, default 3
        if (m.favorite === 1) weight += 1.5;
        weight += Math.min(m.watch_dates.length, 3) * 0.25; // rewatches nudge it up
        return { id: m.tmdb_id, title: m.title, weight };
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);
    return {
      seeds: candidates.map(({ id, weight }) => ({ id, weight })),
      seedTitles: candidates.slice(0, 3).map((c) => c.title),
    };
  }, [movies]);

  const seedKey = seeds.map((s) => s.id).join(",");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["recommendations", seedKey],
    queryFn: () => getRecommendations(seeds, apiKey!, savedIds),
    enabled: Boolean(apiKey) && seeds.length > 0,
    staleTime: 15 * 60_000,
  });

  async function handleAdd(id: number, status: WatchStatus) {
    if (!apiKey) return;
    setAddingId(id);
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
      setAddingId(null);
    }
  }

  if (!apiKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-[13px] text-ink-600">Add your TMDB API key to get recommendations.</p>
        <button
          onClick={openSettings}
          className="rounded-md bg-brand px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-brand-strong"
        >
          Open Settings
        </button>
      </div>
    );
  }

  if (seeds.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-ink-600">
          <HeartIcon width={26} height={26} />
        </span>
        <p className="text-[13px] font-medium text-white/85">No recommendations yet</p>
        <p className="max-w-sm text-[12px] text-ink-600">
          Mark a few films as watched, rate them, or add favorites — we'll suggest films tailored
          to your taste.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-brand/15 to-transparent p-4 ring-1 ring-white/[0.06]">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-brand">
          <SparkIcon width={18} height={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-white">Picked for you</h2>
          <p className="text-[12px] text-ink-600">
            {seedTitles.length > 0
              ? `Because you enjoyed ${seedTitles.join(", ")} and more.`
              : "Based on the films in your library."}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-[13px] text-ink-600">Finding films you'll love…</p>
      ) : isError ? (
        <p className="text-[13px] text-red-400">
          {error instanceof Error ? error.message : "Couldn't load recommendations."}
        </p>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="text-[13px] text-ink-600">
          No fresh suggestions right now — try watching and rating a few more films.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
          {(data ?? []).map((m) => (
            <PosterAddCard
              key={m.id}
              movie={m}
              saved={savedIds.has(m.id)}
              busy={addingId === m.id}
              onAdd={() => handleAdd(m.id, "to_watch")}
              onMarkWatched={() => handleAdd(m.id, "watched")}
              onOpen={() => selectMovie(m.id)}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink-700 px-4 py-2 text-[13px] text-white shadow-lg ring-1 ring-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}
